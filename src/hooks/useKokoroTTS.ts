import { useState, useRef, useCallback } from 'react';
import type { AudioData } from './useAudioAnalyzer';

export function useKokoroTTS() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null,
  });

  const ttsRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isSpeakingRef = useRef(false);
  const ttsEnabledRef = useRef(false);
  const isLoadingRef = useRef(false);

  const initTTS = useCallback(async () => {
    if (ttsRef.current || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadProgress('Loading Kokoro TTS (82M)...');

    try {
      const { KokoroTTS } = await import('kokoro-js');
      const tts = await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        { dtype: 'q8' as any }
      );
      ttsRef.current = tts;
      setIsLoaded(true);
      setLoadProgress('');
      console.log('Kokoro TTS loaded successfully');
    } catch (e) {
      console.error('Failed to load Kokoro TTS:', e);
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

    rafRef.current = requestAnimationFrame(analyzeLoop);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!ttsRef.current || isSpeakingRef.current) return;
    if (!ttsEnabledRef.current) return;

    console.log('TTS speaking:', text.substring(0, 50) + '...');
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    try {
      const rawAudio = await ttsRef.current.generate(text, { voice: 'af_heart' });
      console.log('TTS audio generated, keys:', Object.keys(rawAudio));

      // Extract samples - handle different possible property names
      const samples: Float32Array = rawAudio.audio ?? rawAudio.waveform ?? rawAudio.data;
      const sampleRate: number = rawAudio.sampling_rate ?? rawAudio.sampleRate ?? 24000;

      console.log('TTS samples:', samples?.length, 'rate:', sampleRate);

      if (!samples || samples.length === 0) {
        throw new Error('No audio data returned from TTS');
      }

      const ctx = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = ctx;

      // Resume context if suspended (browser autoplay policy)
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
        console.log('TTS playback ended');
      };

      sourceRef.current = source;
      source.start();
      analyzeLoop();
      console.log('TTS playback started');
    } catch (e) {
      console.error('TTS speak error:', e);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  }, [analyzeLoop]);

  const stopSpeaking = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
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
