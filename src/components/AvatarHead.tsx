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

  const shellMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(0.6, 0.05, 0.72),
    roughness: 0.3,
    metalness: 0.2,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    envMapIntensity: 0.8,
  }), []);

  const darkMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.08, 0.1, 0.14),
    roughness: 0.05,
    metalness: 0.8,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2,
  }), []);

  const eyeGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.9, 1.0),
    emissive: new THREE.Color(0.0, 0.9, 1.0),
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.95,
  }), []);

  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.6, 0.85),
    emissive: new THREE.Color(0.0, 0.4, 0.6),
    emissiveIntensity: 0.6,
  }), []);

  const mouthBarMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.85, 1.0),
    emissive: new THREE.Color(0.0, 0.85, 1.0),
    emissiveIntensity: 1.5,
  }), []);

  const antMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 1.0, 0.5),
    emissive: new THREE.Color(0.0, 1.0, 0.5),
    emissiveIntensity: 2,
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = smoothed.current;
    const lerp = 1 - Math.pow(0.0005, delta);
    s.volume = THREE.MathUtils.lerp(s.volume, audioData.volume, lerp);
    s.bass = THREE.MathUtils.lerp(s.bass, audioData.bass, lerp);
    s.mid = THREE.MathUtils.lerp(s.mid, audioData.mid, lerp);
    s.treble = THREE.MathUtils.lerp(s.treble, audioData.treble, lerp);

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.008 + 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.015 - s.bass * 0.02;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.02 + s.treble * 0.03 * Math.cos(t * 1.5);
      groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.008;
    }

    if (jawRef.current) {
      const open = s.volume * 0.3 + s.bass * 0.1;
      jawRef.current.rotation.x = open * 0.12;
    }

    const eyePulse = 1.5 + s.volume * 3 + Math.sin(t * 2) * 0.3;
    eyeGlowMat.emissiveIntensity = eyePulse;
    eyeGlowMat.color.setHSL(0.5 + s.mid * 0.08, 1, 0.55);
    eyeGlowMat.emissive.setHSL(0.5 + s.mid * 0.08, 1, 0.5);

    barRefs.current.forEach((bar, i) => {
      if (bar) {
        const freq = i < 4 ? s.bass : i < 8 ? s.mid : s.treble;
        const wave = Math.sin(t * 4 + i * 0.6) * 0.1;
        bar.scale.y = Math.max(0.015, 0.02 + freq * 0.15 + s.volume * 0.06 + Math.abs(wave) * 0.02);
      }
    });
    mouthBarMat.emissiveIntensity = 1 + s.volume * 3;
    accentMat.emissiveIntensity = 0.4 + s.volume * 1.2;
    antMat.emissiveIntensity = isListening ? 2 + Math.sin(t * 5) * 1.5 : 0.4;
  });

  const barCount = 11;

  return (
    <group ref={groupRef}>
      {/* HEAD */}
      <mesh material={shellMat}>
        <sphereGeometry args={[0.6, 64, 64]} />
      </mesh>

      {/* Forehead seam */}
      <mesh position={[0, 0.12, 0]} material={accentMat} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.605, 0.002, 8, 64]} />
      </mesh>

      {/* EYES - large, round, prominent, sitting ON the surface */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.22, 0.1, 0.48]}>
          {/* Dark eye socket */}
          <mesh material={darkMat}>
            <sphereGeometry args={[0.11, 32, 32]} />
          </mesh>
          {/* Glowing iris */}
          <mesh material={eyeGlowMat} position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.07, 32, 32]} />
          </mesh>
          {/* Bright pupil */}
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Eye ring */}
          <mesh material={accentMat} position={[0, 0, 0.03]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.1, 0.005, 12, 32]} />
          </mesh>
        </group>
      ))}

      {/* NOSE - small bump */}
      <mesh position={[0, -0.04, 0.58]} material={shellMat}>
        <sphereGeometry args={[0.03, 12, 12]} />
      </mesh>

      {/* MOUTH AREA */}
      <group ref={jawRef} position={[0, -0.22, 0]}>
        <mesh position={[0, 0, 0.53]} material={darkMat}>
          <boxGeometry args={[0.3, 0.065, 0.04]} />
        </mesh>
        <group position={[0, 0, 0.555]}>
          {Array.from({ length: barCount }).map((_, i) => (
            <mesh
              key={i}
              ref={(el) => { barRefs.current[i] = el; }}
              position={[(i - (barCount - 1) / 2) * 0.022, 0, 0]}
              material={mouthBarMat}
              scale={[0.007, 0.025, 0.004]}
            >
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* CHIN */}
      <mesh position={[0, -0.38, 0.08]} material={shellMat} scale={[0.65, 0.3, 0.6]}>
        <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>

      {/* EARS */}
      {[-1, 1].map((side) => (
        <group key={`ear-${side}`} position={[side * 0.58, 0.1, 0]}>
          <mesh material={shellMat} rotation={[0, 0, side * Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.06, 0.04, 12]} />
          </mesh>
          <mesh material={accentMat} rotation={[0, 0, side * Math.PI / 2]}>
            <torusGeometry args={[0.05, 0.003, 8, 16]} />
          </mesh>
        </group>
      ))}

      {/* NECK */}
      <mesh position={[0, -0.62, 0]} material={shellMat}>
        <cylinderGeometry args={[0.12, 0.16, 0.2, 16]} />
      </mesh>
      {[-0.54, -0.6, -0.66].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={accentMat}>
          <torusGeometry args={[0.13 + i * 0.008, 0.002, 8, 24]} />
        </mesh>
      ))}

      {/* ANTENNA */}
      <mesh position={[0.1, 0.56, -0.05]} material={shellMat}>
        <cylinderGeometry args={[0.004, 0.004, 0.15, 8]} />
      </mesh>
      <mesh position={[0.1, 0.64, -0.05]} material={antMat}>
        <sphereGeometry args={[0.015, 10, 10]} />
      </mesh>

      {/* Forehead lines */}
      {[0.28, 0.33].map((y, i) => (
        <mesh key={i} position={[0, y, 0.52]} material={accentMat}>
          <boxGeometry args={[0.12 - i * 0.03, 0.002, 0.002]} />
        </mesh>
      ))}

      {/* Eye light */}
      <pointLight position={[0, 0.1, 0.6]} intensity={0.15} color="#00ddff" distance={1} />
    </group>
  );
}

export default AvatarHead;
