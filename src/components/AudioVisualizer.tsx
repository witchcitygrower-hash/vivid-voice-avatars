import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function AudioVisualizer({ audioData, isListening }: Props) {
  if (!isListening || !audioData.frequencies) return null;

  const bars = 48;

  return (
    <div className="absolute bottom-36 left-1/2 -translate-x-1/2 flex items-end gap-[1.5px] h-20">
      {Array.from({ length: bars }).map((_, i) => {
        const freqIdx = Math.floor((i / bars) * (audioData.frequencies?.length || 1));
        const value = audioData.frequencies ? audioData.frequencies[freqIdx] / 255 : 0;
        const hue = 190 + (i / bars) * 150; // cyan to magenta
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-[50ms]"
            style={{
              width: '3px',
              height: `${Math.max(2, value * 80)}px`,
              background: `linear-gradient(to top, hsla(${hue}, 100%, 50%, 0.3), hsla(${hue}, 100%, 60%, ${0.4 + value * 0.6}))`,
              boxShadow: value > 0.4 ? `0 0 10px hsla(${hue}, 100%, 50%, 0.4)` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export default AudioVisualizer;
