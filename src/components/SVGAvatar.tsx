import { useRef, useEffect, useState } from 'react';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function SVGAvatar({ audioData, isListening }: Props) {
  const [time, setTime] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(Date.now());
  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    const tick = () => {
      const t = (Date.now() - startRef.current) / 1000;
      setTime(t);

      const s = smoothed.current;
      const lerp = 0.12;
      s.volume += (audioData.volume - s.volume) * lerp;
      s.bass += (audioData.bass - s.bass) * lerp;
      s.mid += (audioData.mid - s.mid) * lerp;
      s.treble += (audioData.treble - s.treble) * lerp;

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioData]);

  const s = smoothed.current;
  const t = time;

  // Derived values
  const breathe = Math.sin(t * 1.2) * 2;
  const headTilt = Math.sin(t * 0.4) * 1.5 + s.treble * 3 * Math.cos(t * 1.5);
  const headNod = Math.sin(t * 0.5) * 1 - s.bass * 3;
  const eyeScale = 1 + s.volume * 0.15;
  const mouthOpen = s.volume * 22 + s.bass * 8;
  const irisX = Math.sin(t * 0.6) * 3;
  const irisY = Math.cos(t * 0.8) * 2;
  const blinkCycle = t % 3.2;
  const blink = blinkCycle < 0.1 ? 0.1 : 1;
  const glowIntensity = 0.3 + s.volume * 0.7;
  const pulseSize = 1 + Math.sin(t * 3) * 0.02 * (1 + s.volume * 2);

  // Mouth bar heights
  const barCount = 15;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const freq = i < 5 ? s.bass : i < 10 ? s.mid : s.treble;
    const wave = Math.sin(t * 5 + i * 0.5) * 0.2;
    return Math.max(2, (freq * 20 + s.volume * 8 + Math.abs(wave) * 3));
  });

  // Frequency ring dots
  const ringDots = 32;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, hsl(215 40% 8%) 0%, hsl(220 50% 3%) 100%)' }}>
      {/* Background grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(200 80% 60%)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => {
          const cx = ((i * 73 + t * (8 + i * 0.5)) % 1400) - 50;
          const cy = ((i * 47 + t * (3 + i * 0.3)) % 900) - 50;
          const size = 1 + (i % 3);
          const opacity = 0.15 + s.volume * 0.3 + Math.sin(t + i) * 0.1;
          return (
            <circle key={i} cx={cx} cy={cy} r={size} fill="hsl(190 100% 60%)" opacity={Math.max(0.05, opacity)} />
          );
        })}
      </svg>

      {/* Main avatar SVG */}
      <svg
        viewBox="0 0 500 600"
        className="relative z-10 w-[min(80vh,80vw)] h-auto"
        style={{ filter: `drop-shadow(0 0 ${20 + s.volume * 40}px hsla(190, 100%, 50%, ${glowIntensity * 0.3}))` }}
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="headGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="hsl(210 15% 78%)" />
            <stop offset="60%" stopColor="hsl(210 12% 65%)" />
            <stop offset="100%" stopColor="hsl(215 15% 50%)" />
          </radialGradient>

          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(185 100% 85%)" />
            <stop offset="40%" stopColor="hsl(190 100% 60%)" />
            <stop offset="100%" stopColor="hsl(200 100% 35%)" />
          </radialGradient>

          <radialGradient id="eyeGlow2" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={`hsla(190, 100%, 60%, ${glowIntensity})`} />
            <stop offset="100%" stopColor="hsla(190, 100%, 60%, 0)" />
          </radialGradient>

          <linearGradient id="neckGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(210 12% 60%)" />
            <stop offset="100%" stopColor="hsl(215 15% 45%)" />
          </linearGradient>

          <linearGradient id="visorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 30% 18%)" />
            <stop offset="100%" stopColor="hsl(220 35% 10%)" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="bigGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <g transform={`translate(250, 280) scale(${pulseSize}) rotate(${headTilt}) translate(0, ${breathe + headNod})`}>
          {/* === AMBIENT GLOW === */}
          <circle cx="0" cy="0" r="160" fill="url(#eyeGlow2)" opacity={0.2 + s.volume * 0.4} />

          {/* === FREQUENCY RING === */}
          <g opacity={isListening ? 0.4 + s.volume * 0.5 : 0.08}>
            {Array.from({ length: ringDots }).map((_, i) => {
              const angle = (i / ringDots) * Math.PI * 2 + t * 0.3;
              const freqVal = audioData.frequencies ? (audioData.frequencies[i * 4] / 255) : 0;
              const baseR = 145 + freqVal * 30;
              const r = baseR + Math.sin(t * 2 + i * 0.4) * 3;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const dotSize = 1.5 + freqVal * 3;
              return (
                <circle key={i} cx={x} cy={y} r={dotSize} fill="hsl(190 100% 60%)" opacity={0.5} />
              );
            })}
          </g>

          {/* === NECK === */}
          <rect x="-22" y="95" width="44" height="60" rx="8" fill="url(#neckGrad)" />
          {[105, 118, 131].map((y, i) => (
            <line key={i} x1="-18" y1={y} x2="18" y2={y} stroke="hsl(190 70% 50%)" strokeWidth="1" opacity={0.3 + s.volume * 0.4} />
          ))}

          {/* === HEAD SHAPE === */}
          <ellipse cx="0" cy="0" rx="110" ry="120" fill="url(#headGrad)" stroke="hsl(210 15% 55%)" strokeWidth="1.5" />

          {/* Head panel line */}
          <ellipse cx="0" cy="12" rx="108" ry="1" fill="none" stroke="hsl(190 60% 50%)" strokeWidth="0.8" opacity={0.3 + s.volume * 0.5} />

          {/* Top cap */}
          <ellipse cx="0" cy="-95" rx="60" ry="22" fill="hsl(210 12% 58%)" stroke="hsl(210 15% 52%)" strokeWidth="1" />

          {/* === VISOR BAND === */}
          <rect x="-90" y="-25" width="180" height="50" rx="25" fill="url(#visorGrad)" stroke="hsl(190 60% 40%)" strokeWidth="1" opacity="0.9" />

          {/* === EYES === */}
          {[-1, 1].map((side) => (
            <g key={side} transform={`translate(${side * 40}, 0) scale(${eyeScale}, ${eyeScale * blink})`}>
              {/* Eye glow halo */}
              <circle cx="0" cy="0" r="28" fill="url(#eyeGlow2)" filter="url(#softGlow)" opacity={glowIntensity * 0.6} />

              {/* Eye socket */}
              <circle cx="0" cy="0" r="22" fill="hsl(220 30% 8%)" />

              {/* Iris */}
              <circle cx={irisX} cy={irisY} r="16" fill="url(#eyeGlow)" filter="url(#glow)" />

              {/* Pupil */}
              <circle cx={irisX} cy={irisY} r="6" fill="hsl(190 100% 90%)" opacity="0.9" />

              {/* Specular */}
              <circle cx={irisX + 5} cy={irisY - 5} r="3" fill="white" opacity="0.8" />

              {/* Eye ring */}
              <circle cx="0" cy="0" r="22" fill="none" stroke="hsl(190 80% 50%)" strokeWidth="1.5" opacity={0.5 + s.volume * 0.5} filter="url(#glow)" />
            </g>
          ))}

          {/* === EYEBROW ACCENTS === */}
          {[-1, 1].map((side) => (
            <line key={`brow-${side}`}
              x1={side * 40 - 18} y1={-30 - s.volume * 3}
              x2={side * 40 + 18} y2={-32 - s.volume * 3 + side * 2}
              stroke="hsl(190 80% 55%)" strokeWidth="2" strokeLinecap="round"
              opacity={0.5 + s.volume * 0.5} filter="url(#glow)"
            />
          ))}

          {/* === NOSE === */}
          <line x1="0" y1="15" x2="0" y2="30" stroke="hsl(210 12% 55%)" strokeWidth="2.5" strokeLinecap="round" />

          {/* === MOUTH === */}
          <g transform={`translate(0, 55)`}>
            {/* Mouth backing */}
            <rect x="-50" y={-8 - mouthOpen / 2} width="100" height={16 + mouthOpen} rx="6"
              fill="hsl(220 35% 8%)" stroke="hsl(190 50% 35%)" strokeWidth="0.8" />

            {/* LED bars */}
            {bars.map((h, i) => {
              const x = (i - (barCount - 1) / 2) * 6;
              const barOpacity = 0.5 + s.volume * 0.5;
              return (
                <rect key={i} x={x - 2} y={-h / 2} width={3.5} height={h} rx="1"
                  fill="hsl(190 100% 55%)" opacity={barOpacity} filter="url(#glow)" />
              );
            })}
          </g>

          {/* === EARS === */}
          {[-1, 1].map((side) => (
            <g key={`ear-${side}`} transform={`translate(${side * 108}, 0)`}>
              <rect x={side > 0 ? -4 : -8} y="-12" width="12" height="24" rx="4"
                fill="hsl(210 12% 58%)" stroke="hsl(210 15% 48%)" strokeWidth="1" />
              <circle cx={side * 2} cy="0" r="3"
                fill="hsl(190 100% 55%)" opacity={0.4 + s.volume * 0.6} filter="url(#glow)" />
            </g>
          ))}

          {/* === ANTENNA === */}
          <line x1="20" y1="-115" x2="20" y2="-145" stroke="hsl(210 12% 55%)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="-148" r="5"
            fill={isListening ? "hsl(160 100% 50%)" : "hsl(190 60% 40%)"}
            opacity={isListening ? 0.6 + Math.sin(t * 5) * 0.4 : 0.4}
            filter="url(#glow)"
          />

          {/* === FOREHEAD DETAILS === */}
          <line x1="-20" y1="-60" x2="20" y2="-60" stroke="hsl(190 60% 50%)" strokeWidth="1" opacity={0.25 + s.volume * 0.3} />
          <line x1="-14" y1="-68" x2="14" y2="-68" stroke="hsl(190 60% 50%)" strokeWidth="0.8" opacity={0.2 + s.volume * 0.3} />

          {/* === TEMPLE VENTS === */}
          {[-1, 1].map((side) => (
            <g key={`vent-${side}`}>
              {[0, 8, 16].map((y, j) => (
                <rect key={j} x={side * 82} y={-8 + y} width={12} height={3} rx="1"
                  fill="hsl(215 20% 22%)" />
              ))}
            </g>
          ))}
        </g>

        {/* === WAVEFORM RING (outer) === */}
        {isListening && audioData.waveform && (
          <g opacity={0.2 + s.volume * 0.3}>
            <circle cx="250" cy="280" r={185 + s.volume * 15} fill="none"
              stroke="hsl(190 100% 55%)" strokeWidth="0.8" opacity="0.3"
              strokeDasharray="4 8"
              style={{ transform: `rotate(${t * 20}deg)`, transformOrigin: '250px 280px' }}
            />
            <circle cx="250" cy="280" r={200 + s.bass * 20} fill="none"
              stroke="hsl(340 80% 55%)" strokeWidth="0.6" opacity="0.2"
              strokeDasharray="3 12"
              style={{ transform: `rotate(${-t * 15}deg)`, transformOrigin: '250px 280px' }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export default SVGAvatar;
