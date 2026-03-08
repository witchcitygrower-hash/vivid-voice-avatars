import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function AudioVisualizer({ audioData, isListening }: Props) {
  if (!isListening) return null;
  
  const bars = 32;
  const freqData = audioData.frequencies;

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-end gap-[2px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const value = freqData ? freqData[Math.floor((i / bars) * freqData.length)] / 255 : 0;
        return (
          <div
            key={i}
            className="w-1.5 rounded-full bg-primary/80 transition-all duration-75"
            style={{
              height: `${Math.max(2, value * 64)}px`,
              opacity: 0.4 + value * 0.6,
              boxShadow: value > 0.5 ? '0 0 8px hsl(190 100% 50% / 0.5)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export default AudioVisualizer;
