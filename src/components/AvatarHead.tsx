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
  const jawRef = useRef<THREE.Group>(null);

  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  // -- Materials --
  const mainMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.82, 0.84, 0.88),
    roughness: 0.28,
    metalness: 0.25,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.0,
  }), []);

  const darkMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.18, 0.2, 0.25),
    roughness: 0.08,
    metalness: 0.7,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.5,
  }), []);

  const midGrayMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.5, 0.52, 0.56),
    roughness: 0.35,
    metalness: 0.5,
    clearcoat: 0.5,
    envMapIntensity: 1,
  }), []);

  const eyeGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.9, 1.0),
    emissive: new THREE.Color(0.0, 0.9, 1.0),
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.95,
  }), []);

  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.6, 0.8),
    emissive: new THREE.Color(0.0, 0.4, 0.6),
    emissiveIntensity: 0.8,
  }), []);

  const mouthBarMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.85, 1.0),
    emissive: new THREE.Color(0.0, 0.85, 1.0),
    emissiveIntensity: 2,
  }), []);

  const antennaMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 1.0, 0.5),
    emissive: new THREE.Color(0.0, 1.0, 0.5),
    emissiveIntensity: 2.5,
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = smoothed.current;
    const lerp = 1 - Math.pow(0.0005, delta);

    s.volume = THREE.MathUtils.lerp(s.volume, audioData.volume, lerp);
    s.bass = THREE.MathUtils.lerp(s.bass, audioData.bass, lerp);
    s.mid = THREE.MathUtils.lerp(s.mid, audioData.mid, lerp);
    s.treble = THREE.MathUtils.lerp(s.treble, audioData.treble, lerp);

    // Subtle head movement
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.008 + 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.015 - s.bass * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.025 + s.treble * 0.03 * Math.cos(t * 1.5);
      groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.008;
    }

    // Jaw open
    if (jawRef.current) {
      const open = s.volume * 0.35 + s.bass * 0.12;
      jawRef.current.rotation.x = open * 0.15;
      jawRef.current.position.y = -open * 0.04;
    }

    // Eye glow
    const eyePulse = 1.5 + s.volume * 4 + Math.sin(t * 2) * 0.4;
    eyeGlowMat.emissiveIntensity = eyePulse;
    const hue = 0.5 + s.mid * 0.08;
    eyeGlowMat.color.setHSL(hue, 1, 0.55);
    eyeGlowMat.emissive.setHSL(hue, 1, 0.5);

    // Mouth bars
    barRefs.current.forEach((bar, i) => {
      if (bar) {
        const freq = i < 4 ? s.bass : i < 8 ? s.mid : s.treble;
        const wave = Math.sin(t * 4 + i * 0.6) * 0.12;
        const height = 0.02 + freq * 0.18 + s.volume * 0.08 + Math.abs(wave) * 0.03;
        bar.scale.y = Math.max(0.02, height);
      }
    });
    mouthBarMat.emissiveIntensity = 1.2 + s.volume * 3.5;

    // Accent glow
    accentMat.emissiveIntensity = 0.5 + s.volume * 1.5;

    // Antenna blink
    antennaMat.emissiveIntensity = isListening
      ? 2 + Math.sin(t * 5) * 1.5
      : 0.4 + Math.sin(t * 1.5) * 0.3;
  });

  const barCount = 13;

  return (
    <group ref={groupRef}>
      {/* ===== CRANIUM - capsule/pill shape ===== */}
      <mesh material={mainMat} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.62, 64, 64]} />
      </mesh>

      {/* Top cap - slightly darker */}
      <mesh position={[0, 0.52, 0]} material={midGrayMat} scale={[0.7, 0.15, 0.7]}>
        <sphereGeometry args={[0.5, 32, 16]} />
      </mesh>

      {/* Head seam - horizontal line */}
      <mesh position={[0, 0.15, 0]} material={accentMat} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.625, 0.003, 8, 64]} />
      </mesh>

      {/* ===== VISOR / EYE BAND ===== */}
      {/* Dark visor plate - integrated into head */}
      <mesh position={[0, 0.08, 0.42]} material={darkMat}>
        <boxGeometry args={[0.82, 0.28, 0.38]} />
      </mesh>
      {/* Visor rounded edges */}
      <mesh position={[0, 0.08, 0.55]} material={darkMat} scale={[0.82, 0.28, 0.15]}>
        <sphereGeometry args={[0.5, 32, 16]} />
      </mesh>

      {/* ===== EYES ===== */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.18, 0.08, 0.6]}>
          {/* Eye ring */}
          <mesh material={accentMat} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.072, 0.007, 16, 32]} />
          </mesh>
          {/* Eye glow disc */}
          <mesh material={eyeGlowMat}>
            <circleGeometry args={[0.06, 32]} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.022, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* ===== NOSE - minimal ridge ===== */}
      <mesh position={[0, -0.04, 0.6]} material={midGrayMat}>
        <boxGeometry args={[0.03, 0.08, 0.03]} />
      </mesh>

      {/* ===== MOUTH AREA ===== */}
      <group ref={jawRef} position={[0, -0.22, 0]}>
        {/* Mouth plate */}
        <mesh position={[0, 0, 0.56]} material={darkMat}>
          <boxGeometry args={[0.4, 0.1, 0.06]} />
        </mesh>

        {/* LED mouth bars */}
        <group position={[0, 0, 0.59]}>
          {Array.from({ length: barCount }).map((_, i) => {
            const x = (i - (barCount - 1) / 2) * 0.025;
            return (
              <mesh
                key={i}
                ref={(el) => { barRefs.current[i] = el; }}
                position={[x, 0, 0]}
                material={mouthBarMat}
                scale={[0.008, 0.035, 0.006]}
              >
                <boxGeometry args={[1, 1, 1]} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* ===== CHIN - integrated, not floating ===== */}
      <mesh position={[0, -0.45, 0.05]} material={mainMat} scale={[0.75, 0.4, 0.75]}>
        <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
      </mesh>

      {/* Chin accent line */}
      <mesh position={[0, -0.38, 0.35]} material={accentMat}>
        <boxGeometry args={[0.2, 0.004, 0.004]} />
      </mesh>

      {/* ===== EARS - flush with head ===== */}
      {[-1, 1].map((side) => (
        <group key={`ear-${side}`} position={[side * 0.6, 0.08, 0]}>
          {/* Ear disc */}
          <mesh material={midGrayMat} rotation={[0, 0, side * Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.08, 0.04, 16]} />
          </mesh>
          {/* Ear glow ring */}
          <mesh material={accentMat} rotation={[0, 0, side * Math.PI / 2]}>
            <torusGeometry args={[0.065, 0.004, 8, 16]} />
          </mesh>
          {/* Ear center dot */}
          <mesh position={[side * 0.02, 0, 0]} material={eyeGlowMat} rotation={[0, side * Math.PI / 2, 0]}>
            <circleGeometry args={[0.012, 8]} />
          </mesh>
        </group>
      ))}

      {/* ===== NECK ===== */}
      <mesh position={[0, -0.72, 0]} material={midGrayMat}>
        <cylinderGeometry args={[0.14, 0.18, 0.25, 16]} />
      </mesh>
      {/* Neck accent rings */}
      {[-0.62, -0.68, -0.74].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={accentMat}>
          <torusGeometry args={[0.155 + i * 0.008, 0.003, 8, 24]} />
        </mesh>
      ))}

      {/* ===== ANTENNA ===== */}
      <mesh position={[0.1, 0.62, -0.05]} material={midGrayMat}>
        <cylinderGeometry args={[0.005, 0.005, 0.18, 8]} />
      </mesh>
      <mesh position={[0.1, 0.72, -0.05]} material={antennaMat}>
        <sphereGeometry args={[0.018, 12, 12]} />
      </mesh>

      {/* ===== FOREHEAD DETAILS ===== */}
      {[0.28, 0.33].map((y, i) => (
        <mesh key={`fl-${i}`} position={[0, y, 0.55]} material={accentMat}>
          <boxGeometry args={[0.15 - i * 0.04, 0.003, 0.003]} />
        </mesh>
      ))}

      {/* ===== TEMPLE VENTS ===== */}
      {[-1, 1].map((side) => (
        <group key={`vent-${side}`} position={[side * 0.48, 0.08, 0.25]}>
          {[0.03, 0, -0.03].map((y, j) => (
            <mesh key={j} position={[0, y, 0]} material={darkMat}>
              <boxGeometry args={[0.04, 0.008, 0.06]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ===== SUBTLE EYE LIGHT ===== */}
      <pointLight position={[0, 0.08, 0.7]} intensity={0.2} color="#00ddff" distance={1.2} />
    </group>
  );
}

export default AvatarHead;
