import { useRef, useEffect, useState } from 'react';
import type { AudioData } from '@/hooks/useAudioAnalyzer';
import { type AvatarAction, getActionTransforms } from '@/hooks/useAvatarAnimations';

interface Props {
  audioData: AudioData;
  isListening: boolean;
  action?: AvatarAction;
  actionProgress?: number;
}

function SVGAvatar({ audioData, isListening, action = 'idle', actionProgress = 0 }: Props) {
  const [time, setTime] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(Date.now());
  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    let lastUpdate = 0;
    const tick = (now: number) => {
      // Throttle to ~30fps to prevent page freezes
      if (now - lastUpdate >= 33) {
        lastUpdate = now;
        const t = (Date.now() - startRef.current) / 1000;
        setTime(t);
        const sm = smoothed.current;
        const lerp = 0.12;
        sm.volume += (audioData.volume - sm.volume) * lerp;
        sm.bass += (audioData.bass - sm.bass) * lerp;
        sm.mid += (audioData.mid - sm.mid) * lerp;
        sm.treble += (audioData.treble - sm.treble) * lerp;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioData]);

  const s = smoothed.current;
  const t = time;

  // Action transforms
  const at = getActionTransforms(action, actionProgress, t);

  // Base animation values
  const breathe = Math.sin(t * 1.0) * 1.5;
  const headTilt = Math.sin(t * 0.35) * 1.2 + s.treble * 2.5 * Math.cos(t * 1.2) + at.headTiltExtra;
  const headNod = Math.sin(t * 0.45) * 0.8 - s.bass * 2 + at.headExtra;
  const eyeScale = (1 + s.volume * 0.12) * at.eyeMod;
  const mouthOpen = s.volume * 18 + s.bass * 6;
  const irisX = Math.sin(t * 0.5) * 2.5;
  const irisY = Math.cos(t * 0.7) * 1.5;
  const blinkCycle = t % 3.5;
  const blink = action === 'wink' ? 1 : blinkCycle < 0.08 ? 0.05 : blinkCycle < 0.16 ? 0.5 + (blinkCycle - 0.08) / 0.08 * 0.5 : 1;
  const winkR = action === 'wink' ? 0.1 : blink;
  const glowIntensity = 0.25 + s.volume * 0.75;
  const pulseSize = (1 + Math.sin(t * 2.5) * 0.015 * (1 + s.volume * 1.5)) * at.bodyScale;

  // Mouth bars
  const barCount = 17;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const freq = i < 5 ? s.bass : i < 11 ? s.mid : s.treble;
    const wave = Math.sin(t * 4.5 + i * 0.6) * 0.15;
    return Math.max(1.5, (freq * 18 + s.volume * 6 + Math.abs(wave) * 2.5));
  });

  const ringDots = 40;

  // Arm angles (audio-reactive + action modifiers)
  const baseArmSwingL = Math.sin(t * 0.8 - 1.5) * 3 + s.volume * 15 + s.bass * 8;
  const baseArmSwingR = Math.sin(t * 0.8 + 1.5) * 3 - s.volume * 15 - s.bass * 8;
  const armSwingL = baseArmSwingL + at.armLMod;
  const armSwingR = baseArmSwingR + at.armRMod;

  // Flame intensity
  const flameBase = 0.6 + Math.sin(t * 3) * 0.1;
  const flameIntensity = flameBase + at.flameBoost * 0.4;

  // Hue rotation filter
  const hueFilter = at.hueShift ? `hue-rotate(${at.hueShift}deg)` : 'none';

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 40%, hsl(220 45% 10%) 0%, hsl(225 55% 4%) 70%, hsl(230 60% 2%) 100%)' }}>
      {/* Atmospheric fog */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 120% 60% at 50% 80%, hsla(190, 100%, 20%, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse 80% 40% at 30% 20%, hsla(260, 80%, 30%, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse 60% 30% at 70% 30%, hsla(190, 100%, 40%, 0.04) 0%, transparent 50%)
        `
      }} />

      {/* Hex grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025]">
        <defs>
          <pattern id="hexGrid" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <polygon points="30,2 55,15 55,37 30,50 5,37 5,15" fill="none" stroke="hsl(190 80% 50%)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" />
      </svg>

      {/* Ambient particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => {
          const cx = ((i * 73 + t * (5 + i * 0.3)) % 1400) - 50;
          const cy = ((i * 47 + t * (2 + i * 0.2)) % 900) - 50;
          const size = 0.5 + (i % 4) * 0.5;
          const op = 0.08 + s.volume * 0.2 + Math.sin(t * 0.5 + i) * 0.06;
          const hue = 185 + (i % 5) * 8;
          return <circle key={i} cx={cx} cy={cy} r={size} fill={`hsl(${hue} 90% 65%)`} opacity={Math.max(0.03, op)} />;
        })}
      </svg>

      {/* Main SVG */}
      <svg
        viewBox="0 0 500 750"
        className="relative z-10 w-[min(85vh,85vw)] h-auto"
        style={{
          filter: `drop-shadow(0 0 ${15 + s.volume * 30}px hsla(190, 100%, 50%, ${glowIntensity * 0.2})) ${hueFilter !== 'none' ? hueFilter : ''}`,
          opacity: at.opacity,
        }}
      >
        <defs>
          <linearGradient id="headPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 18% 82%)" />
            <stop offset="25%" stopColor="hsl(215 15% 72%)" />
            <stop offset="75%" stopColor="hsl(220 14% 58%)" />
            <stop offset="100%" stopColor="hsl(225 16% 48%)" />
          </linearGradient>
          <radialGradient id="eyeCore" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="hsl(180 100% 90%)" />
            <stop offset="30%" stopColor="hsl(185 100% 70%)" />
            <stop offset="60%" stopColor="hsl(195 100% 55%)" />
            <stop offset="100%" stopColor="hsl(210 100% 35%)" />
          </radialGradient>
          <radialGradient id="eyeHalo" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={`hsla(190, 100%, 60%, ${glowIntensity * 0.8})`} />
            <stop offset="60%" stopColor={`hsla(190, 100%, 50%, ${glowIntensity * 0.2})`} />
            <stop offset="100%" stopColor="hsla(190, 100%, 50%, 0)" />
          </radialGradient>
          <linearGradient id="jawPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 14% 62%)" />
            <stop offset="100%" stopColor="hsl(220 16% 48%)" />
          </linearGradient>
          <linearGradient id="neckMech" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 12% 52%)" />
            <stop offset="50%" stopColor="hsl(220 15% 38%)" />
            <stop offset="100%" stopColor="hsl(225 18% 30%)" />
          </linearGradient>
          <linearGradient id="bodyPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 16% 62%)" />
            <stop offset="40%" stopColor="hsl(218 14% 52%)" />
            <stop offset="100%" stopColor="hsl(222 16% 40%)" />
          </linearGradient>
          <linearGradient id="armPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 14% 58%)" />
            <stop offset="100%" stopColor="hsl(220 16% 44%)" />
          </linearGradient>
          <linearGradient id="visorBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220 40% 14%)" />
            <stop offset="50%" stopColor="hsl(225 45% 8%)" />
            <stop offset="100%" stopColor="hsl(220 40% 12%)" />
          </linearGradient>
          <linearGradient id="chinAccent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsla(190, 100%, 55%, 0)" />
            <stop offset="50%" stopColor={`hsla(190, 100%, 55%, ${0.4 + s.volume * 0.4})`} />
            <stop offset="100%" stopColor="hsla(190, 100%, 55%, 0)" />
          </linearGradient>
          <radialGradient id="chestCore" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor={`hsla(190, 100%, 60%, ${0.3 + s.volume * 0.5})`} />
            <stop offset="100%" stopColor="hsla(190, 100%, 40%, 0)" />
          </radialGradient>
          {/* Flame gradient */}
          <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsla(200, 100%, 70%, 0.9)" />
            <stop offset="40%" stopColor="hsla(210, 100%, 55%, 0.6)" />
            <stop offset="100%" stopColor="hsla(220, 100%, 40%, 0)" />
          </linearGradient>
          <linearGradient id="flameCoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsla(190, 100%, 90%, 0.95)" />
            <stop offset="50%" stopColor="hsla(200, 100%, 70%, 0.5)" />
            <stop offset="100%" stopColor="hsla(210, 100%, 50%, 0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="bigGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <clipPath id="visorClip">
            <rect x="-95" y="-28" width="190" height="56" rx="28" />
          </clipPath>
        </defs>

        {/* Whole avatar group with action transforms */}
        <g transform={`translate(${250 + at.bodyX}, ${300 + at.bodyY}) rotate(${at.bodyRotate})`}>

          {/* HEAD GROUP — tilts independently */}
          <g transform={`translate(0, ${-20 + breathe + headNod}) scale(${pulseSize}) rotate(${headTilt})`}>
            {/* Ambient energy */}
            <circle cx="0" cy="0" r="180" fill="url(#eyeHalo)" opacity={0.15 + s.volume * 0.2} />

            {/* Energy shield ring */}
            <g opacity={isListening || action === 'shield' ? 0.35 + s.volume * 0.5 : 0.06}>
              {Array.from({ length: ringDots }).map((_, i) => {
                const angle = (i / ringDots) * Math.PI * 2 + t * 0.25;
                const freqVal = audioData.frequencies ? (audioData.frequencies[i * 3] / 255) : 0;
                const baseR = (action === 'shield' ? 155 : 165) + freqVal * 25;
                const r = baseR + Math.sin(t * 1.8 + i * 0.35) * 2;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                return <circle key={i} cx={x} cy={y} r={1 + freqVal * 2.5} fill={`hsl(${185 + freqVal * 20} 100% 60%)`} opacity={0.4 + freqVal * 0.5} />;
              })}
            </g>

            {/* Neck */}
            <g>
              <rect x="-18" y="95" width="36" height="55" rx="4" fill="url(#neckMech)" />
              {[-1, 1].map((side) => (
                <g key={`p${side}`}>
                  <rect x={side * 22 - 4} y="98" width="8" height="48" rx="3" fill="hsl(215 14% 45%)" stroke="hsl(210 10% 38%)" strokeWidth="0.5" />
                  <rect x={side * 22 - 2} y={100 + breathe * 2} width="4" height="20" rx="2" fill="hsl(210 12% 55%)" />
                </g>
              ))}
              {[108, 120, 132].map((y, i) => (
                <line key={i} x1="-14" y1={y} x2="14" y2={y} stroke={`hsla(190, 70%, 50%, ${0.2 + s.volume * 0.3})`} strokeWidth="1" strokeDasharray="3 2" />
              ))}
            </g>

            {/* Head */}
            <g>
              <ellipse cx="0" cy="5" rx="112" ry="122" fill="hsl(220 16% 42%)" />
              <ellipse cx="0" cy="0" rx="110" ry="120" fill="url(#headPlate)" />
              <ellipse cx="0" cy="-15" rx="105" ry="100" fill="none" stroke="hsla(210, 20%, 90%, 0.08)" strokeWidth="1" />
              <path d="M-60,-85 Q0,-95 60,-85" fill="none" stroke="hsl(210 12% 52%)" strokeWidth="0.8" />
              <path d="M-80,-50 Q0,-58 80,-50" fill="none" stroke="hsl(210 12% 52%)" strokeWidth="0.6" opacity="0.5" />
              {[-1, 1].map((sd) => (
                <path key={`pl${sd}`} d={`M${sd*85},-60 L${sd*100},-10 L${sd*95},50 L${sd*80},85`} fill="none" stroke="hsl(210 12% 52%)" strokeWidth="0.7" opacity="0.4" />
              ))}
              <rect x="-35" y="-92" width="70" height="18" rx="4" fill="hsl(215 14% 60%)" stroke="hsl(210 12% 50%)" strokeWidth="0.5" />
              <rect x="-12" y="-87" width="24" height="8" rx="2" fill="hsl(220 35% 12%)" />
              <rect x="-8" y="-85" width={16 * (0.3 + s.volume * 0.7)} height="4" rx="1.5" fill="hsl(190 100% 55%)" opacity={0.5 + s.volume * 0.5} filter="url(#glow)" />
              <path d="M-25,-108 Q0,-118 25,-108 L20,-95 Q0,-100 -20,-95 Z" fill="hsl(215 14% 60%)" stroke="hsl(210 12% 50%)" strokeWidth="0.5" />
            </g>

            {/* Visor */}
            <g>
              <rect x="-96" y="-29" width="192" height="58" rx="29" fill="hsl(225 45% 6%)" />
              <rect x="-93" y="-26" width="186" height="52" rx="26" fill="url(#visorBand)" stroke="hsl(190 40% 30%)" strokeWidth="0.8" />
              <rect x="-90" y="-23" width="180" height="46" rx="23" fill="none" stroke="hsla(190, 60%, 50%, 0.1)" strokeWidth="0.5" />
              <g clipPath="url(#visorClip)">
                <rect x={-95 + ((t * 40) % 220)} y="-28" width="30" height="56" fill="hsla(190, 100%, 60%, 0.03)" />
              </g>
            </g>

            {/* Eyes */}
            {[-1, 1].map((side) => {
              const blinkVal = side === 1 ? winkR : blink;
              return (
                <g key={side} transform={`translate(${side * 38}, 0) scale(${eyeScale}, ${eyeScale * blinkVal})`}>
                  <circle cx="0" cy="0" r="25" fill="hsl(225 50% 5%)" />
                  <circle cx="0" cy="0" r="32" fill="url(#eyeHalo)" filter="url(#softGlow)" opacity={glowIntensity * 0.5} />
                  <circle cx="0" cy="0" r="22" fill="none" stroke="hsl(195 80% 35%)" strokeWidth="2" />
                  <circle cx="0" cy="0" r="22" fill="none" stroke={`hsla(190, 100%, 55%, ${0.3 + s.volume * 0.5})`} strokeWidth="1" filter="url(#glow)" />
                  {[0,1,2,3].map((seg) => {
                    const a1 = (seg/4)*Math.PI*2+t*0.5, a2 = a1+Math.PI*0.35;
                    return <path key={seg} d={`M${Math.cos(a1)*19},${Math.sin(a1)*19} A19,19 0 0,1 ${Math.cos(a2)*19},${Math.sin(a2)*19}`} fill="none" stroke="hsl(190 80% 50%)" strokeWidth="1" opacity={0.3+s.volume*0.3} />;
                  })}
                  <circle cx={irisX} cy={irisY} r="14" fill="url(#eyeCore)" filter="url(#glow)" />
                  <circle cx={irisX} cy={irisY} r="5" fill="hsl(185 100% 92%)" opacity="0.95" />
                  <circle cx={irisX} cy={irisY} r="8" fill="none" stroke="hsla(180, 100%, 80%, 0.3)" strokeWidth="0.5" />
                  <circle cx={irisX+5} cy={irisY-5} r="2.5" fill="white" opacity="0.9" />
                  <circle cx={irisX-3} cy={irisY+4} r="1.2" fill="white" opacity="0.4" />
                </g>
              );
            })}

            {/* Eyebrows */}
            {[-1,1].map((side) => (
              <g key={`brow${side}`}>
                <path d={`M${side*18},${-34-s.volume*3} L${side*58},${-38-s.volume*4+side*2} L${side*62},${-35-s.volume*3}`} fill="none" stroke="hsl(215 15% 65%)" strokeWidth="3" strokeLinecap="round" />
                <path d={`M${side*28},${-36-s.volume*3} L${side*52},${-39-s.volume*4}`} fill="none" stroke={`hsla(190, 80%, 55%, ${0.3+s.volume*0.5})`} strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)" />
              </g>
            ))}

            {/* Nose */}
            <line x1="0" y1="14" x2="0" y2="32" stroke="hsl(210 12% 55%)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-4" y1="32" x2="4" y2="32" stroke="hsl(210 12% 50%)" strokeWidth="1.5" strokeLinecap="round" />

            {/* Jaw */}
            <g>
              <path d="M-75,40 Q-85,50 -80,70 Q-70,95 0,100 Q70,95 80,70 Q85,50 75,40" fill="url(#jawPlate)" stroke="hsl(210 12% 50%)" strokeWidth="0.7" />
              <path d="M-70,42 Q0,38 70,42" fill="none" stroke="hsl(210 10% 48%)" strokeWidth="0.6" opacity="0.5" />
              <rect x="-30" y="85" width="60" height="2" rx="1" fill="url(#chinAccent)" filter="url(#glow)" />
            </g>

            {/* Mouth */}
            <g transform="translate(0, 58)">
              <rect x="-52" y={-10-mouthOpen/2} width="104" height={20+mouthOpen} rx="8" fill="hsl(225 45% 6%)" stroke="hsl(195 40% 25%)" strokeWidth="0.8" />
              <rect x="-48" y={-7-mouthOpen/2} width="96" height={14+mouthOpen} rx="5" fill="none" stroke="hsla(190, 50%, 40%, 0.15)" strokeWidth="0.5" />
              {bars.map((h, i) => {
                const x = (i-(barCount-1)/2)*5.5;
                const op = 0.4+s.volume*0.6;
                const hue = 185+(i/barCount)*15;
                return (
                  <g key={i}>
                    <rect x={x-1.8} y={-h/2} width={3} height={h} rx="1" fill={`hsl(${hue} 100% 55%)`} opacity={op} filter="url(#glow)" />
                    <rect x={x-1.2} y={-h/2+0.5} width={1.8} height={h*0.4} rx="0.5" fill={`hsl(${hue} 100% 80%)`} opacity={op*0.5} />
                  </g>
                );
              })}
            </g>

            {/* Ears */}
            {[-1,1].map((side) => (
              <g key={`ear${side}`} transform={`translate(${side*110}, -5)`}>
                <rect x={side>0?-6:-10} y="-18" width="16" height="36" rx="5" fill="hsl(215 14% 55%)" stroke="hsl(210 12% 45%)" strokeWidth="0.8" />
                <rect x={side>0?-3:-7} y="-12" width="10" height="24" rx="3" fill="hsl(220 20% 18%)" />
                {[-6,0,6].map((y,j) => (
                  <circle key={j} cx={side>0?2:-2} cy={y} r="1.8" fill={j===1?'hsl(190 100% 55%)':`hsl(${160+j*30} 70% 45%)`} opacity={0.3+s.volume*0.5+Math.sin(t*2+j)*0.15} filter="url(#glow)" />
                ))}
                <rect x={side>0?6:-12} y="-30" width="6" height="15" rx="2" fill="hsl(215 14% 58%)" stroke="hsl(210 12% 48%)" strokeWidth="0.5" />
              </g>
            ))}

            {/* Temple vents */}
            {[-1,1].map((side) => (
              <g key={`v${side}`}>
                {[0,7,14,21].map((y,j) => (
                  <g key={j}>
                    <rect x={side*80+(side>0?0:-14)} y={-12+y} width={14} height={3.5} rx="1" fill="hsl(220 25% 15%)" stroke="hsl(215 20% 22%)" strokeWidth="0.3" />
                    <rect x={side*80+(side>0?1:-13)} y={-11+y} width={4+s.volume*6} height={1.5} rx="0.5" fill="hsl(190 100% 50%)" opacity={0.15+s.volume*0.3+Math.sin(t*3+j)*0.1} />
                  </g>
                ))}
              </g>
            ))}

            {/* Antennas */}
            <line x1="18" y1="-112" x2="18" y2="-148" stroke="hsl(215 14% 58%)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="18" cy="-152" r="5" fill={isListening?"hsl(160 100% 50%)":"hsl(190 50% 40%)"} opacity={isListening?0.6+Math.sin(t*5)*0.4:0.35} filter="url(#glow)" />
            <line x1="-15" y1="-105" x2="-20" y2="-128" stroke="hsl(215 14% 55%)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="-20" cy="-131" r="3" fill="hsl(190 80% 50%)" opacity={0.2+s.mid*0.4} filter="url(#glow)" />

            {/* Forehead details */}
            <g opacity={0.3+s.volume*0.3}>
              <line x1="-25" y1="-65" x2="25" y2="-65" stroke="hsl(190 50% 45%)" strokeWidth="0.8" />
              <line x1="-18" y1="-72" x2="18" y2="-72" stroke="hsl(190 50% 45%)" strokeWidth="0.6" />
              {[-1,1].map((sd) => (
                <path key={`ch${sd}`} d={`M${sd*45},-75 L${sd*55},-65 L${sd*45},-55`} fill="none" stroke="hsl(190 60% 50%)" strokeWidth="0.8" opacity="0.4" />
              ))}
            </g>

            {/* Cheek details */}
            {[-1,1].map((sd) => (
              <g key={`ck${sd}`}>
                <path d={`M${sd*65},25 L${sd*85},15 L${sd*90},35 L${sd*75},50 Z`} fill="none" stroke="hsl(210 10% 52%)" strokeWidth="0.5" opacity="0.4" />
                <circle cx={sd*78} cy={32} r="2" fill="hsl(190 100% 55%)" opacity={0.2+s.volume*0.4} filter="url(#glow)" />
              </g>
            ))}
          </g>

          {/* BODY — square torso */}
          <g transform={`translate(0, ${100 + breathe * 0.5})`}>
            <rect x="-70" y="-20" width="140" height="110" rx="8" fill="url(#bodyPlate)" stroke="hsl(210 12% 45%)" strokeWidth="1" />
            <rect x="-68" y="-18" width="136" height="106" rx="7" fill="none" stroke="hsla(210, 20%, 90%, 0.05)" strokeWidth="0.5" />
            <rect x="-35" y="-10" width="70" height="50" rx="5" fill="hsl(220 30% 12%)" stroke="hsl(215 20% 22%)" strokeWidth="0.5" />
            <circle cx="0" cy="15" r="18" fill="url(#chestCore)" filter="url(#softGlow)" />
            <circle cx="0" cy="15" r="10" fill={`hsla(190, 100%, 60%, ${0.15+s.volume*0.4})`} />
            <circle cx="0" cy="15" r="5" fill={`hsla(190, 100%, 75%, ${0.2+s.volume*0.3})`} filter="url(#glow)" />
            {[-1,1].map((sd) => (
              <g key={`cd${sd}`}>
                {[0,10,20].map((y,j) => <rect key={j} x={sd>0?42:-60} y={-5+y} width="16" height="3" rx="1" fill="hsl(220 25% 15%)" />)}
                <circle cx={sd*52} cy={35} r="3" fill="hsl(190 100% 55%)" opacity={0.2+s.volume*0.4} filter="url(#glow)" />
              </g>
            ))}
            <rect x="-50" y="80" width="100" height="2" rx="1" fill="url(#chinAccent)" filter="url(#glow)" />
            <rect x="-55" y="72" width="110" height="16" rx="3" fill="hsl(218 16% 38%)" stroke="hsl(215 14% 32%)" strokeWidth="0.5" />
          </g>

          {/* ARMS — audio reactive + action controlled */}
          {[
            { side: -1, swing: armSwingL, label: 'L' },
            { side: 1, swing: armSwingR, label: 'R' },
          ].map(({ side, swing, label }) => (
            <g key={`arm-${label}`} transform={`translate(${side * 85}, ${90 + breathe * 0.5})`}>
              {/* Shoulder joint */}
              <circle cx="0" cy="0" r="12" fill="hsl(215 14% 55%)" stroke="hsl(210 12% 45%)" strokeWidth="1" />
              <circle cx="0" cy="0" r="5" fill="hsl(220 20% 20%)" />
              <circle cx="0" cy="0" r="2.5" fill="hsl(190 100% 55%)" opacity={0.3+s.volume*0.3} filter="url(#glow)" />
              {/* Upper arm */}
              <g transform={`rotate(${swing})`}>
                <rect x="-10" y="8" width="20" height="50" rx="5" fill="url(#armPlate)" stroke="hsl(210 12% 42%)" strokeWidth="0.8" />
                <rect x="-6" y="15" width="12" height="20" rx="3" fill="hsl(220 22% 16%)" />
                <rect x="-3" y="18" width={6} height="3" rx="1" fill="hsl(190 100% 55%)" opacity={0.2+s.mid*0.4} />
                {/* Elbow */}
                <circle cx="0" cy="60" r="8" fill="hsl(215 14% 50%)" stroke="hsl(210 12% 40%)" strokeWidth="0.8" />
                <circle cx="0" cy="60" r="3" fill="hsl(220 20% 18%)" />
                {/* Forearm */}
                <g transform={`translate(0, 60) rotate(${-swing * 0.5 + side * 5})`}>
                  <rect x="-8" y="5" width="16" height="45" rx="4" fill="url(#armPlate)" stroke="hsl(210 12% 42%)" strokeWidth="0.7" />
                  <line x1="-4" y1="15" x2="-4" y2="40" stroke="hsl(190 50% 40%)" strokeWidth="0.6" opacity="0.3" />
                  <line x1="4" y1="15" x2="4" y2="40" stroke="hsl(190 50% 40%)" strokeWidth="0.6" opacity="0.3" />
                  {/* Hand */}
                  <rect x="-9" y="48" width="18" height="14" rx="5" fill="hsl(215 14% 52%)" stroke="hsl(210 12% 42%)" strokeWidth="0.6" />
                  {[-4,0,4].map((fx,fi) => (
                    <line key={fi} x1={fx} y1="55" x2={fx} y2="60" stroke="hsl(210 10% 40%)" strokeWidth="1" strokeLinecap="round" />
                  ))}
                </g>
              </g>
            </g>
          ))}

          {/* === BLUE FLAME THRUSTERS === */}
          <g transform={`translate(0, ${210 + breathe * 0.5})`}>
            {/* Left thruster */}
            {[-25, 25].map((tx, ti) => {
              const flicker = Math.sin(t * 15 + ti * 3) * 0.15;
              const h = 30 + flameIntensity * 25 + flicker * 10;
              const w = 12 + flameIntensity * 6;
              return (
                <g key={ti} transform={`translate(${tx}, 0)`}>
                  {/* Thruster nozzle */}
                  <rect x="-8" y="-8" width="16" height="10" rx="2" fill="hsl(220 20% 30%)" stroke="hsl(215 15% 40%)" strokeWidth="0.5" />
                  {/* Outer flame */}
                  <ellipse cx="0" cy={h * 0.4} rx={w} ry={h} fill="url(#flameGrad)" opacity={flameIntensity * 0.7 + flicker * 0.3} filter="url(#bigGlow)" />
                  {/* Core flame */}
                  <ellipse cx="0" cy={h * 0.3} rx={w * 0.5} ry={h * 0.7} fill="url(#flameCoreGrad)" opacity={flameIntensity * 0.9} />
                  {/* Flame particles */}
                  {Array.from({ length: 6 }).map((_, pi) => {
                    const py = ((t * 80 + pi * 30) % (h * 1.5));
                    const px = Math.sin(t * 8 + pi * 2 + ti) * (w * 0.4);
                    const size = 1.5 - (py / (h * 1.5)) * 1.2;
                    return size > 0.2 ? (
                      <circle key={pi} cx={px} cy={py} r={size} fill="hsla(195, 100%, 80%, 0.7)" opacity={1 - py / (h * 1.5)} />
                    ) : null;
                  })}
                </g>
              );
            })}
            {/* Center glow on ground */}
            <ellipse cx="0" cy={60 + flameIntensity * 20} rx={50 + flameIntensity * 15} ry={8} fill={`hsla(200, 100%, 60%, ${flameIntensity * 0.15})`} filter="url(#softGlow)" />
          </g>

          {/* Sparkle effect particles */}
          {action === 'sparkle' && Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2 + t * 2;
            const r = 120 + Math.sin(t * 3 + i) * 30;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r - 20;
            return <circle key={`sp${i}`} cx={x} cy={y} r={1.5 + Math.sin(t * 5 + i) * 0.8} fill="hsla(50, 100%, 80%, 0.8)" filter="url(#glow)" />;
          })}

          {/* Shield ring effect */}
          {action === 'shield' && (
            <circle cx="0" cy="50" r={150 + Math.sin(t * 2) * 5} fill="none" stroke={`hsla(190, 100%, 60%, ${0.3 + Math.sin(t * 3) * 0.1})`} strokeWidth="3" filter="url(#bigGlow)" />
          )}
        </g>

        {/* Orbital rings when listening */}
        {isListening && (
          <g opacity={0.15 + s.volume * 0.25}>
            <circle cx={250 + at.bodyX} cy={300 + at.bodyY} r={190 + s.volume * 12} fill="none" stroke="hsl(190 80% 50%)" strokeWidth="0.6" opacity="0.4" strokeDasharray="6 12" style={{ transform: `rotate(${t * 15}deg)`, transformOrigin: `${250 + at.bodyX}px ${300 + at.bodyY}px` }} />
            <circle cx={250 + at.bodyX} cy={300 + at.bodyY} r={205 + s.bass * 15} fill="none" stroke="hsl(220 60% 50%)" strokeWidth="0.4" opacity="0.25" strokeDasharray="4 16" style={{ transform: `rotate(${-t * 10}deg)`, transformOrigin: `${250 + at.bodyX}px ${300 + at.bodyY}px` }} />
          </g>
        )}
      </svg>
    </div>
  );
}

export default SVGAvatar;
