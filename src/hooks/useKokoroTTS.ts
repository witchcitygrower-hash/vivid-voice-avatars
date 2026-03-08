import { useState, useRef, useCallback } from 'react';
import type { AudioData } from './useAudioAnalyzer';

const EMPTY_AUDIO: AudioData = { volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null };

export function useKokoroTTS() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [audioData, setAudioData] = useState<AudioData>(EMPTY_AUDIO);

  const ttsRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isSpeakingRef = useRef(false);
  const ttsEnabledRef = useRef(true);
  const isLoadingRef = useRef(false);
  const queueRef = useRef<{ samples: Float32Array; sampleRate: number }[]>([]);
  const isPlayingQueueRef = useRef(false);

  const initTTS = useCallback(async () => {
    if (ttsRef.current || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadProgress('Downloading Kokoro TTS (~80MB)...');
    console.log('[TTS] Starting Kokoro model download...');

    try {
      const { KokoroTTS } = await import('kokoro-js');
      console.log('[TTS] kokoro-js imported, loading model...');
      const tts = await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        { dtype: 'q8' as any }
      );
      ttsRef.current = tts;
      setIsLoaded(true);
      setLoadProgress('');
      console.log('[TTS] Model loaded and ready!');

      // Background warm-up
      setTimeout(async () => {
        try {
          await tts.generate('Hi.', { voice: 'af_heart' });
          console.log('[TTS] Background warm-up complete');
        } catch (e) {
          console.warn('[TTS] Warm-up failed:', e);
        }
      }, 2000);
    } catch (e) {
      console.error('[TTS] Failed to load Kokoro:', e);
      setLoadProgress(`TTS Error: ${e instanceof Error ? e.message : 'Failed to load'}`);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const analyzeLoop = useCallback(() => {
    if (!analyzerRef.current || !isSpeakingRef.current) return;
    const analyzer = analyzerRef.current;
    const freqData = new Uint8Array(analyzer.frequencyBinCount);
    const timeData = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(freqData);
    analyzer.getByteTimeDomainData(timeData);

    const len = freqData.length;
    const bassEnd = Math.floor(len * 0.1);
    const midEnd = Math.floor(len * 0.5);

    let bassSum = 0, midSum = 0, trebleSum = 0, total = 0;
    for (let i = 0; i < len; i++) {
      const val = freqData[i];
      total += val;
      if (i < bassEnd) bassSum += val;
      else if (i < midEnd) midSum += val;
      else trebleSum += val;
    }

    setAudioData({
      volume: total / (len * 255),
      bass: bassSum / (bassEnd * 255),
      mid: midSum / ((midEnd - bassEnd) * 255),
      treble: trebleSum / ((len - midEnd) * 255),
      frequencies: freqData,
      waveform: timeData,
    });

    rafRef.current = requestAnimationFrame(analyzeLoop);
  }, []);

  const stopCurrent = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(rafRef.current);
    sourceRef.current = null;
    queueRef.current = [];
    isPlayingQueueRef.current = false;
  }, []);

  const resetState = useCallback(() => {
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setAudioData(EMPTY_AUDIO);
  }, []);

  const speakFallback = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    console.log('[TTS] Using browser speechSynthesis fallback');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const mouthInterval = setInterval(() => {
      if (!isSpeakingRef.current) { clearInterval(mouthInterval); return; }
      setAudioData({
        volume: 0.3 + Math.random() * 0.5,
        bass: 0.2 + Math.random() * 0.3,
        mid: 0.3 + Math.random() * 0.4,
        treble: 0.1 + Math.random() * 0.3,
        frequencies: null,
        waveform: null,
      });
    }, 80);

    const cleanup = () => {
      clearInterval(mouthInterval);
      resetState();
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;
    window.speechSynthesis.speak(utterance);
  }, [resetState]);

  // Play a single audio buffer, returns a promise that resolves when done
  const playAudioChunk = useCallback((samples: Float32Array, sampleRate: number): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') ctx.resume();

      const buffer = ctx.createBuffer(1, samples.length, sampleRate);
      buffer.getChannelData(0).set(samples);

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;

      source.connect(analyzer);
      analyzer.connect(ctx.destination);

      source.onended = () => {
        sourceRef.current = null;
        resolve();
      };

      sourceRef.current = source;
      source.start();

      if (!rafRef.current) {
        analyzeLoop();
      }
    });
  }, [analyzeLoop]);

  // Process queue of audio chunks sequentially
  const processQueue = useCallback(async () => {
    if (isPlayingQueueRef.current) return;
    isPlayingQueueRef.current = true;

    while (queueRef.current.length > 0 && isSpeakingRef.current) {
      const chunk = queueRef.current.shift()!;
      await playAudioChunk(chunk.samples, chunk.sampleRate);
    }

    isPlayingQueueRef.current = false;
    if (queueRef.current.length === 0) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      resetState();
      console.log('[TTS] All chunks finished');
    }
  }, [playAudioChunk, resetState]);

  const speak = useCallback(async (text: string) => {
    console.log('[TTS] speak() called. loaded:', !!ttsRef.current, 'speaking:', isSpeakingRef.current, 'enabled:', ttsEnabledRef.current);

    if (isSpeakingRef.current || !ttsEnabledRef.current) return;

    if (!ttsRef.current) {
      speakFallback(text);
      return;
    }

    isSpeakingRef.current = true;
    setIsSpeaking(true);
    queueRef.current = [];

    await new Promise(r => setTimeout(r, 8));

    try {
      // Truncate to keep generation fast
      const truncated = text.length > 400 ? text.substring(0, 400) + '...' : text;

      // Try streaming approach - split text into sentences for faster first-audio
      const sentences = truncated.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [truncated];
      
      console.log(`[TTS] Generating ${sentences.length} chunks via streaming`);

      let firstChunkPlayed = false;

      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed || !isSpeakingRef.current) break;

        const rawAudio = await ttsRef.current.generate(trimmed, { voice: 'af_heart' });
        const samples: Float32Array = rawAudio.audio ?? rawAudio.waveform ?? rawAudio.data;
        const sampleRate: number = rawAudio.sampling_rate ?? rawAudio.sampleRate ?? 24000;

        if (!samples || samples.length === 0) continue;

        queueRef.current.push({ samples, sampleRate });

        // Start playback as soon as first chunk is ready
        if (!firstChunkPlayed) {
          firstChunkPlayed = true;
          console.log('[TTS] First chunk ready, starting playback');
          processQueue(); // don't await - let it play while we generate more
        }
      }

      // If nothing was generated
      if (!firstChunkPlayed) {
        throw new Error('No audio generated');
      }
    } catch (e) {
      console.error('[TTS] Kokoro error, falling back:', e);
      queueRef.current = [];
      resetState();
      speakFallback(text);
    }
  }, [speakFallback, processQueue, resetState]);

  const stopSpeaking = useCallback(() => {
    stopCurrent();
    resetState();
  }, [stopCurrent, resetState]);

  const toggleTTS = useCallback(async () => {
    if (!ttsEnabledRef.current) {
      ttsEnabledRef.current = true;
      setTtsEnabled(true);
      if (!ttsRef.current && !isLoadingRef.current) await initTTS();
    } else {
      ttsEnabledRef.current = false;
      setTtsEnabled(false);
      stopSpeaking();
    }
  }, [initTTS, stopSpeaking]);

  return {
    isLoaded, isLoading, isSpeaking, ttsEnabled, loadProgress, audioData,
    initTTS, speak, stopSpeaking, toggleTTS,
  };
}
