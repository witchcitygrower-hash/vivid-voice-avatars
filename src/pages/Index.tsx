import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import AvatarScene from '@/components/AvatarScene';
import AudioVisualizer from '@/components/AudioVisualizer';
import { Mic, MicOff } from 'lucide-react';

const Index = () => {
  const { isListening, audioData, startListening, stopListening } = useAudioAnalyzer();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background select-none">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <AvatarScene audioData={audioData} isListening={isListening} />
      </div>

      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-background/90 to-transparent pointer-events-none" />

      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h1
          className="text-xl tracking-[0.4em] uppercase font-light"
          style={{ fontFamily: 'var(--font-display)', color: 'hsl(var(--foreground) / 0.5)' }}
        >
          Neural <span className="text-glow font-semibold" style={{ color: 'hsl(var(--primary))' }}>Avatar</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isListening ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              boxShadow: isListening ? '0 0 8px hsl(var(--primary))' : 'none',
            }}
          />
          <p
            className="text-[10px] tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--muted-foreground))' }}
          >
            {isListening ? 'ACTIVE — PROCESSING AUDIO' : 'STANDBY — AWAITING INPUT'}
          </p>
        </div>
      </div>

      {/* Audio visualizer */}
      <AudioVisualizer audioData={audioData} isListening={isListening} />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />

      {/* Mic button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={isListening ? stopListening : startListening}
          className="group relative flex items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-all duration-700 outline-none"
          style={{
            background: isListening
              ? 'radial-gradient(circle, hsl(var(--primary) / 0.2), transparent)'
              : 'hsl(var(--muted))',
            border: `1px solid ${isListening ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))'}`,
            boxShadow: isListening ? 'var(--glow-primary)' : 'none',
          }}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          ) : (
            <Mic className="w-5 h-5 transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} />
          )}

          {isListening && (
            <>
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ border: '1px solid hsl(var(--primary) / 0.2)' }}
              />
              <span
                className="absolute -inset-3 rounded-full animate-ping"
                style={{ border: '1px solid hsl(var(--primary) / 0.1)', animationDelay: '0.4s' }}
              />
            </>
          )}
        </button>
        <p
          className="text-center text-[10px] mt-3 tracking-[0.25em]"
          style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--muted-foreground))' }}
        >
          {isListening ? 'TAP TO STOP' : 'TAP TO SPEAK'}
        </p>
      </div>

      {/* Stats */}
      {isListening && (
        <div
          className="absolute bottom-12 right-6 flex flex-col gap-1.5 text-right z-10"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {[
            { label: 'VOL', value: audioData.volume, color: 'hsl(var(--primary))' },
            { label: 'BASS', value: audioData.bass, color: 'hsl(var(--accent))' },
            { label: 'MID', value: audioData.mid, color: 'hsl(var(--secondary))' },
            { label: 'HI', value: audioData.treble, color: '#00ffaa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 justify-end">
              <span className="text-[9px] tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {label}
              </span>
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${value * 100}%`,
                    background: color,
                    boxShadow: value > 0.3 ? `0 0 6px ${color}` : 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
