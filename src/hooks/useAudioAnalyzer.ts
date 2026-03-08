import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  frequencies: Uint8Array | null;
  waveform: Uint8Array | null;
}

export function useAudioAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const analyze = useCallback(() => {
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

    rafRef.current = requestAnimationFrame(analyze);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.8;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      setIsListening(true);
      analyze();
    } catch (e) {
      console.error('Microphone access denied:', e);
    }
  }, [analyze]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    analyzerRef.current = null;
    setIsListening(false);
    setAudioData({ volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return { isListening, audioData, startListening, stopListening };
}
