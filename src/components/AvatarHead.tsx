import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function AvatarHead({ audioData, isListening }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const antennaLightRef = useRef<THREE.Mesh>(null);

  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  // -- Materials --
  const whiteMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.55, 0.58, 0.62),
    roughness: 0.35,
    metalness: 0.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.2,
  }), []);

  const lightGrayMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.45, 0.47, 0.52),
    roughness: 0.4,
    metalness: 0.5,
    clearcoat: 0.5,
    envMapIntensity: 1,
  }), []);

  const darkPlateMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.15, 0.17, 0.22),
    roughness: 0.1,
    metalness: 0.6,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 3,
  }), []);

  const cyanGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.85, 1.0),
    emissive: new THREE.Color(0.0, 0.85, 1.0),
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.95,
  }), []);

  const cyanAccentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.7, 0.9),
    emissive: new THREE.Color(0.0, 0.5, 0.7),
    emissiveIntensity: 1.2,
  }), []);

  const mouthBarMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.85, 1.0),
    emissive: new THREE.Color(0.0, 0.85, 1.0),
    emissiveIntensity: 2,
  }), []);

  const antennaGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 1.0, 0.6),
    emissive: new THREE.Color(0.0, 1.0, 0.5),
    emissiveIntensity: 3,
  }), []);

  const jointMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.35, 0.37, 0.42),
    roughness: 0.5,
    metalness: 0.8,
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = smoothed.current;
    const lerp = 1 - Math.pow(0.0005, delta);

    s.volume = THREE.MathUtils.lerp(s.volume, audioData.volume, lerp);
    s.bass = THREE.MathUtils.lerp(s.bass, audioData.bass, lerp);
    s.mid = THREE.MathUtils.lerp(s.mid, audioData.mid, lerp);
    s.treble = THREE.MathUtils.lerp(s.treble, audioData.treble, lerp);

    // Head movement
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.01 + 0.15;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.02 - s.bass * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.03 + s.treble * 0.04 * Math.cos(t * 1.5);
      groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.01;
    }

    // Jaw
    if (jawRef.current) {
      const open = s.volume * 0.4 + s.bass * 0.15;
      jawRef.current.position.y = -0.48 - open * 0.06;
      jawRef.current.rotation.x = open * 0.12;
    }

    // Eye glow
    const eyePulse = 2 + s.volume * 5 + Math.sin(t * 2) * 0.5;
    cyanGlowMat.emissiveIntensity = eyePulse;
    const hue = 0.5 + s.mid * 0.08;
    cyanGlowMat.color.setHSL(hue, 1, 0.55);
    cyanGlowMat.emissive.setHSL(hue, 1, 0.5);

    // Eye look direction
    const lookX = Math.sin(t * 0.6) * 0.012;
    const lookY = Math.cos(t * 0.8) * 0.008;
    [leftEyeRef, rightEyeRef].forEach(ref => {
      if (ref.current) {
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, lookX, 0.08);
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, lookY, 0.08);
      }
    });

    // Mouth bars
    barRefs.current.forEach((bar, i) => {
      if (bar) {
        const freq = i < 3 ? s.bass : i < 7 ? s.mid : s.treble;
        const wave = Math.sin(t * 4 + i * 0.7) * 0.15;
        const height = 0.015 + freq * 0.15 + s.volume * 0.06 + Math.abs(wave) * 0.03;
        bar.scale.y = Math.max(0.015, height);
      }
    });
    mouthBarMat.emissiveIntensity = 1.5 + s.volume * 4;

    // Antenna
    if (antennaLightRef.current) {
      antennaGlowMat.emissiveIntensity = isListening
        ? 2 + Math.sin(t * 6) * 1.5
        : 0.5 + Math.sin(t * 1.5) * 0.3;
    }

    cyanAccentMat.emissiveIntensity = 0.8 + s.volume * 2;
  });

  const mouthBarCount = 11;

  return (
    <group ref={groupRef}>
      {/* === CRANIUM === */}
      {/* Main head sphere - white/light */}
      <mesh material={whiteMat}>
        <sphereGeometry args={[0.72, 64, 64]} />
      </mesh>

      {/* Top dome cap */}
      <mesh position={[0, 0.48, -0.05]} material={lightGrayMat} scale={[0.82, 0.25, 0.82]}>
        <sphereGeometry args={[0.55, 32, 32]} />
      </mesh>

      {/* Center head seam line */}
      <mesh position={[0, 0.1, 0]} material={cyanAccentMat} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.725, 0.004, 8, 64]} />
      </mesh>

      {/* === FACE PLATE === */}
      {/* Dark visor / face area */}
      <mesh position={[0, 0.02, 0.52]} material={darkPlateMat} scale={[0.68, 0.42, 0.28]}>
        <sphereGeometry args={[0.72, 48, 48]} />
      </mesh>

      {/* Visor border glow */}
      <mesh position={[0, 0.02, 0.6]} material={cyanAccentMat} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.27, 0.005, 8, 32]} />
      </mesh>

      {/* === EYES === */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.19, 0.06, 0.7]}>
          {/* Eye socket ring */}
          <mesh material={cyanAccentMat}>
            <torusGeometry args={[0.075, 0.006, 16, 32]} />
          </mesh>
          {/* Glowing eye */}
          <mesh
            ref={side === -1 ? leftEyeRef : rightEyeRef}
            material={cyanGlowMat}
          >
            <circleGeometry args={[0.065, 32]} />
          </mesh>
          {/* Bright center dot */}
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.025, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Outer glow ring */}
          <mesh material={cyanAccentMat}>
            <ringGeometry args={[0.065, 0.075, 32]} />
          </mesh>
        </group>
      ))}

      {/* === EYEBROW ACCENTS === */}
      {[-1, 1].map((side) => (
        <mesh key={`brow-${side}`} position={[side * 0.19, 0.18, 0.68]} material={cyanAccentMat} scale={[0.12, 0.006, 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}

      {/* === NOSE === */}
      <mesh position={[0, -0.06, 0.73]} material={lightGrayMat} scale={[0.03, 0.1, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>

      {/* === MOUTH - LED BARS === */}
      <group position={[0, -0.22, 0.7]}>
        {Array.from({ length: mouthBarCount }).map((_, i) => {
          const x = (i - (mouthBarCount - 1) / 2) * 0.03;
          return (
            <mesh
              key={i}
              ref={(el) => { barRefs.current[i] = el; }}
              position={[x, 0, 0]}
              material={mouthBarMat}
              scale={[0.01, 0.04, 0.008]}
            >
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          );
        })}
        {/* Backing plate */}
        <mesh position={[0, 0, -0.008]} material={darkPlateMat}>
          <boxGeometry args={[0.38, 0.06, 0.004]} />
        </mesh>
      </group>

      {/* === CHEEK PLATES === */}
      {[-1, 1].map((side) => (
        <group key={`cheek-${side}`}>
          <mesh position={[side * 0.58, -0.02, 0.22]} material={lightGrayMat} scale={[0.12, 0.35, 0.4]}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          {/* Cheek accent line */}
          <mesh position={[side * 0.59, -0.02, 0.22]} material={cyanAccentMat} scale={[0.004, 0.25, 0.25]}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          {/* Cheek vent dots */}
          {[0.05, 0, -0.05].map((yOff, j) => (
            <mesh key={j} position={[side * 0.6, yOff - 0.02, 0.3]} material={cyanAccentMat}>
              <circleGeometry args={[0.008, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* === JAW === */}
      <mesh ref={jawRef} position={[0, -0.48, 0.18]} material={whiteMat}>
        <sphereGeometry args={[0.42, 32, 32, 0, Math.PI * 2, Math.PI * 0.38, Math.PI * 0.62]} />
      </mesh>
      {/* Jaw accent */}
      <mesh position={[0, -0.52, 0.38]} material={cyanAccentMat} scale={[0.22, 0.005, 0.01]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>

      {/* === EARS / SENSORS === */}
      {[-1, 1].map((side) => (
        <group key={`ear-${side}`} position={[side * 0.7, 0.05, 0]}>
          <mesh material={lightGrayMat} rotation={[0, 0, side * 0.2]}>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 12]} />
          </mesh>
          <mesh position={[side * 0.01, 0, 0]} material={cyanAccentMat}>
            <torusGeometry args={[0.065, 0.004, 8, 16]} />
          </mesh>
          {/* Ear light */}
          <mesh position={[side * 0.04, 0, 0]} material={cyanGlowMat}>
            <circleGeometry args={[0.015, 8]} />
          </mesh>
        </group>
      ))}

      {/* === NECK === */}
      <mesh position={[0, -0.85, -0.02]} material={jointMat}>
        <cylinderGeometry args={[0.16, 0.2, 0.3, 16]} />
      </mesh>
      {/* Neck rings */}
      {[-0.72, -0.8, -0.88].map((y, i) => (
        <mesh key={i} position={[0, y, -0.02]} material={cyanAccentMat}>
          <torusGeometry args={[0.18 + i * 0.01, 0.005, 8, 24]} />
        </mesh>
      ))}

      {/* === ANTENNA === */}
      <mesh position={[0.12, 0.68, -0.08]} material={jointMat}>
        <cylinderGeometry args={[0.006, 0.006, 0.22, 8]} />
      </mesh>
      <mesh ref={antennaLightRef} position={[0.12, 0.8, -0.08]} material={antennaGlowMat}>
        <sphereGeometry args={[0.025, 12, 12]} />
      </mesh>

      {/* === FOREHEAD DETAILS === */}
      {/* Horizontal accent lines */}
      {[0.3, 0.36].map((y, i) => (
        <mesh key={`fl-${i}`} position={[0, y, 0.64]} material={cyanAccentMat} scale={[0.2 - i * 0.04, 0.003, 0.004]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}

      {/* Top vent slits */}
      {[-0.06, 0, 0.06].map((x, i) => (
        <mesh key={`vent-${i}`} position={[x, 0.58, 0.25]} material={darkPlateMat} scale={[0.015, 0.004, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}

      {/* === Point lights on robot === */}
      <pointLight position={[0, 0.06, 0.8]} intensity={0.3} color="#00ddff" distance={1.5} />
      <pointLight position={[0, -0.22, 0.75]} intensity={0.15} color="#00ddff" distance={1} />
    </group>
  );
}

export default AvatarHead;
