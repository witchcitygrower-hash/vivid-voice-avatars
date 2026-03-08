import { useState, useRef, useCallback } from 'react';
import type { AudioData } from './useAudioAnalyzer';

export function useKokoroTTS() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true); // enabled by default
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null,
  });

  const ttsRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isSpeakingRef = useRef(false);
  const ttsEnabledRef = useRef(true); // match default
  const isLoadingRef = useRef(false);

  const initTTS = useCallback(async () => {
    if (ttsRef.current || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadProgress('Downloading Kokoro TTS model (~80MB)...');
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
      console.log('[TTS] Kokoro model loaded successfully!');
    } catch (e) {
      console.error('[TTS] Failed to load Kokoro:', e);
      setLoadProgress(`TTS Error: ${e instanceof Error ? e.message : 'Failed to load'}`);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const analyzeLoop = useCallback(() => {
    if (!analyzerRef.current) return;
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

    if (isSpeakingRef.current) {
      rafRef.current = requestAnimationFrame(analyzeLoop);
    }
  }, []);

  // Fallback: use browser built-in speech synthesis
  const speakFallback = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    console.log('[TTS] Using browser speechSynthesis fallback');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;

    // Simulate mouth movement with simple interval
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const mouthInterval = setInterval(() => {
      const vol = 0.3 + Math.random() * 0.5;
      setAudioData({
        volume: vol,
        bass: 0.2 + Math.random() * 0.3,
        mid: 0.3 + Math.random() * 0.4,
        treble: 0.1 + Math.random() * 0.3,
        frequencies: null,
        waveform: null,
      });
    }, 80);

    utterance.onend = () => {
      clearInterval(mouthInterval);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setAudioData({ volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null });
      console.log('[TTS] Fallback speech ended');
    };

    utterance.onerror = () => {
      clearInterval(mouthInterval);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setAudioData({ volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null });
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text: string) => {
    console.log('[TTS] speak() called. loaded:', !!ttsRef.current, 'speaking:', isSpeakingRef.current, 'enabled:', ttsEnabledRef.current);

    if (isSpeakingRef.current) {
      console.log('[TTS] Already speaking, skipping');
      return;
    }
    if (!ttsEnabledRef.current) {
      console.log('[TTS] TTS disabled, skipping');
      return;
    }

    // If Kokoro not loaded yet, use browser fallback
    if (!ttsRef.current) {
      console.log('[TTS] Kokoro not loaded, using fallback');
      speakFallback(text);
      return;
    }

    console.log('[TTS] Generating audio with Kokoro for:', text.substring(0, 60));
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    try {
      const rawAudio = await ttsRef.current.generate(text, { voice: 'af_heart' });
      console.log('[TTS] Audio generated. Object keys:', Object.keys(rawAudio));

      // Extract samples
      const samples: Float32Array = rawAudio.audio ?? rawAudio.waveform ?? rawAudio.data;
      const sampleRate: number = rawAudio.sampling_rate ?? rawAudio.sampleRate ?? 24000;

      console.log('[TTS] Samples length:', samples?.length, 'Rate:', sampleRate);

      if (!samples || samples.length === 0) {
        throw new Error('No audio data returned from TTS');
      }

      const ctx = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

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
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        cancelAnimationFrame(rafRef.current);
        setAudioData({ volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null });
        sourceRef.current = null;
        console.log('[TTS] Kokoro playback ended');
      };

      sourceRef.current = source;
      source.start();
      analyzeLoop();
      console.log('[TTS] Kokoro playback started!');
    } catch (e) {
      console.error('[TTS] Kokoro speak error:', e);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      // Fall back to browser speech
      speakFallback(text);
    }
  }, [analyzeLoop, speakFallback]);

  const stopSpeaking = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(rafRef.current);
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setAudioData({ volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null });
  }, []);

  const toggleTTS = useCallback(async () => {
    if (!ttsEnabledRef.current) {
      ttsEnabledRef.current = true;
      setTtsEnabled(true);
      if (!ttsRef.current && !isLoadingRef.current) {
        await initTTS();
      }
    } else {
      ttsEnabledRef.current = false;
      setTtsEnabled(false);
      stopSpeaking();
    }
  }, [initTTS, stopSpeaking]);

  return {
    isLoaded,
    isLoading,
    isSpeaking,
    ttsEnabled,
    loadProgress,
    audioData,
    initTTS,
    speak,
    stopSpeaking,
    toggleTTS,
  };
}
