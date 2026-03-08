import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import AvatarScene from '@/components/AvatarScene';
import AudioVisualizer from '@/components/AudioVisualizer';
import { Mic, MicOff } from 'lucide-react';

const Index = () => {
  const { isListening, audioData, startListening, stopListening } = useAudioAnalyzer();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* 3D Avatar Scene */}
      <div className="absolute inset-0">
        <AvatarScene audioData={audioData} isListening={isListening} />
      </div>

      {/* Top gradient overlay */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />

      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="text-2xl font-light tracking-[0.3em] uppercase text-foreground/70" style={{ fontFamily: 'var(--font-display)' }}>
          Neural <span className="text-primary text-glow font-medium">Avatar</span>
        </h1>
        <p className="text-xs tracking-[0.2em] text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
          {isListening ? 'LISTENING...' : 'STANDBY'}
        </p>
      </div>

      {/* Audio visualizer */}
      <AudioVisualizer audioData={audioData} isListening={isListening} />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />

      {/* Mic button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`
            relative flex items-center justify-center w-16 h-16 rounded-full
            transition-all duration-500 cursor-pointer
            ${isListening
              ? 'bg-primary/20 border border-primary/50 border-glow'
              : 'bg-muted border border-border hover:border-primary/30 hover:bg-muted/80'
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-primary" />
          ) : (
            <Mic className="w-6 h-6 text-muted-foreground" />
          )}

          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
              <span className="absolute -inset-2 rounded-full border border-primary/10 animate-ping" style={{ animationDelay: '0.3s' }} />
            </>
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3 tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
          {isListening ? 'TAP TO STOP' : 'TAP TO SPEAK'}
        </p>
      </div>

      {/* Status indicators */}
      {isListening && (
        <div className="absolute bottom-10 right-8 flex flex-col gap-2 text-right" style={{ fontFamily: 'var(--font-mono)' }}>
          <div className="text-[10px] text-muted-foreground">
            VOL <span className="text-primary">{(audioData.volume * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            BASS <span className="text-accent">{(audioData.bass * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            FREQ <span className="text-secondary">{(audioData.treble * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
