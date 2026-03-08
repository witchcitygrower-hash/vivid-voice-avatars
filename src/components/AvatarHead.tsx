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
  const leftEyeGlowRef = useRef<THREE.Mesh>(null);
  const rightEyeGlowRef = useRef<THREE.Mesh>(null);
  const visorRef = useRef<THREE.Mesh>(null);
  const antennaLightRef = useRef<THREE.Mesh>(null);
  const mouthBarsRef = useRef<THREE.Group>(null);

  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });

  // Materials
  const shellMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.12, 0.13, 0.16),
    roughness: 0.15,
    metalness: 0.95,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 3,
  }), []);

  const darkShellMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.05, 0.05, 0.07),
    roughness: 0.2,
    metalness: 0.9,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }), []);

  const accentMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.0, 0.6, 0.8),
    roughness: 0.3,
    metalness: 0.8,
    emissive: new THREE.Color(0.0, 0.3, 0.5),
    emissiveIntensity: 0.5,
  }), []);

  const eyeGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.9, 1.0),
    emissive: new THREE.Color(0.0, 0.9, 1.0),
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.95,
  }), []);

  const visorMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.01, 0.02, 0.04),
    roughness: 0.0,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transparent: true,
    opacity: 0.7,
    envMapIntensity: 5,
  }), []);

  const mouthBarMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.0, 0.8, 1.0),
    emissive: new THREE.Color(0.0, 0.8, 1.0),
    emissiveIntensity: 1.5,
  }), []);

  const antennaGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 0.2, 0.3),
    emissive: new THREE.Color(1.0, 0.1, 0.2),
    emissiveIntensity: 2,
  }), []);

  const jointMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.08, 0.08, 0.1),
    roughness: 0.4,
    metalness: 0.95,
  }), []);

  // Mouth bar refs
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = smoothed.current;
    const lerp = 1 - Math.pow(0.0005, delta);

    s.volume = THREE.MathUtils.lerp(s.volume, audioData.volume, lerp);
    s.bass = THREE.MathUtils.lerp(s.bass, audioData.bass, lerp);
    s.mid = THREE.MathUtils.lerp(s.mid, audioData.mid, lerp);
    s.treble = THREE.MathUtils.lerp(s.treble, audioData.treble, lerp);

    // Head movement - subtle robotic
    if (groupRef.current) {
      const nod = Math.sin(t * 0.5) * 0.015 - s.bass * 0.03;
      const turn = Math.sin(t * 0.3) * 0.025 + s.treble * 0.04 * Math.cos(t * 1.5);
      const tilt = Math.sin(t * 0.4) * 0.01;

      groupRef.current.position.y = Math.sin(t * 0.8) * 0.008 + 0.15;
      groupRef.current.rotation.x = nod;
      groupRef.current.rotation.y = turn;
      groupRef.current.rotation.z = tilt;
    }

    // Jaw - slight open on volume
    if (jawRef.current) {
      const open = s.volume * 0.3 + s.bass * 0.15;
      jawRef.current.position.y = -0.52 - open * 0.08;
      jawRef.current.rotation.x = open * 0.15;
    }

    // Eye glow pulse
    const eyePulse = 1.5 + s.volume * 4 + Math.sin(t * 2) * 0.3;
    eyeGlowMat.emissiveIntensity = eyePulse;
    eyeGlowMat.opacity = 0.7 + s.volume * 0.3;

    // Eye color shift
    const hue = 0.5 + s.mid * 0.1 + Math.sin(t * 0.5) * 0.02;
    eyeGlowMat.color.setHSL(hue, 1, 0.5);
    eyeGlowMat.emissive.setHSL(hue, 1, 0.5);

    // Mouth bars - audio visualizer
    barRefs.current.forEach((bar, i) => {
      if (bar) {
        const freq = i < 3 ? s.bass : i < 6 ? s.mid : s.treble;
        const wave = Math.sin(t * 3 + i * 0.8) * 0.3;
        const height = 0.01 + freq * 0.12 + s.volume * 0.04 + wave * 0.02;
        bar.scale.y = Math.max(0.01, height);
      }
    });

    // Mouth bar glow
    mouthBarMat.emissiveIntensity = 1.0 + s.volume * 3;

    // Antenna light blink
    if (antennaLightRef.current) {
      const blink = Math.sin(t * 4) > 0.3 ? 1 : 0.2;
      antennaGlowMat.emissiveIntensity = isListening ? 3 * blink : 0.5;
    }

    // Accent strips react
    accentMat.emissiveIntensity = 0.3 + s.volume * 1.5;
  });

  const mouthBarCount = 9;

  return (
    <group ref={groupRef}>
      {/* Main cranium - rounded box shape */}
      <mesh material={shellMat}>
        <sphereGeometry args={[0.75, 64, 64]} />
      </mesh>

      {/* Top plate - flattened */}
      <mesh position={[0, 0.55, -0.05]} material={shellMat} scale={[0.85, 0.2, 0.85]}>
        <sphereGeometry args={[0.6, 32, 32]} />
      </mesh>

      {/* Face plate - slightly protruding */}
      <mesh position={[0, -0.05, 0.55]} material={darkShellMat} scale={[0.75, 0.65, 0.3]}>
        <sphereGeometry args={[0.7, 48, 48]} />
      </mesh>

      {/* Visor / eye band */}
      <mesh ref={visorRef} position={[0, 0.08, 0.68]} material={visorMat} scale={[0.55, 0.18, 0.12]}>
        <boxGeometry args={[1, 1, 1, 1, 1, 1]} />
      </mesh>

      {/* Eyes - glowing circles behind visor */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.2, 0.08, 0.72]}>
          {/* Eye socket ring */}
          <mesh material={accentMat}>
            <torusGeometry args={[0.065, 0.008, 16, 32]} />
          </mesh>
          {/* Eye glow */}
          <mesh
            ref={side === -1 ? leftEyeGlowRef : rightEyeGlowRef}
            material={eyeGlowMat}
          >
            <circleGeometry args={[0.055, 32]} />
          </mesh>
          {/* Inner pupil dot */}
          <mesh position={[0, 0, 0.001]}>
            <circleGeometry args={[0.02, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}

      {/* Nose ridge - subtle geometric */}
      <mesh position={[0, -0.05, 0.74]} material={darkShellMat} scale={[0.04, 0.15, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>

      {/* Mouth area - LED bar array */}
      <group ref={mouthBarsRef} position={[0, -0.28, 0.72]}>
        {Array.from({ length: mouthBarCount }).map((_, i) => {
          const x = (i - (mouthBarCount - 1) / 2) * 0.035;
          return (
            <mesh
              key={i}
              ref={(el) => { barRefs.current[i] = el; }}
              position={[x, 0, 0]}
              material={mouthBarMat}
              scale={[0.012, 0.03, 0.01]}
            >
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          );
        })}
        {/* Mouth plate backing */}
        <mesh position={[0, 0, -0.01]} material={darkShellMat}>
          <boxGeometry args={[0.35, 0.08, 0.005]} />
        </mesh>
      </group>

      {/* Side panels / cheek plates */}
      {[-1, 1].map((side) => (
        <group key={`panel-${side}`}>
          <mesh position={[side * 0.65, -0.05, 0.15]} material={shellMat} scale={[0.15, 0.5, 0.5]}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          {/* Accent strip on side */}
          <mesh position={[side * 0.66, -0.05, 0.15]} material={accentMat} scale={[0.005, 0.35, 0.3]}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        </group>
      ))}

      {/* Jaw piece */}
      <mesh ref={jawRef} position={[0, -0.52, 0.2]} material={shellMat}>
        <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6]} />
      </mesh>

      {/* Jaw accent line */}
      <mesh position={[0, -0.55, 0.42]} material={accentMat} scale={[0.3, 0.008, 0.01]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>

      {/* Neck - mechanical */}
      <mesh position={[0, -0.9, -0.02]} material={jointMat}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 16]} />
      </mesh>
      {/* Neck rings */}
      {[-0.78, -0.85, -0.92].map((y, i) => (
        <mesh key={i} position={[0, y, -0.02]} material={accentMat}>
          <torusGeometry args={[0.2, 0.006, 8, 24]} />
        </mesh>
      ))}

      {/* Ears / sensor pods */}
      {[-1, 1].map((side) => (
        <group key={`ear-${side}`} position={[side * 0.72, 0.05, 0]}>
          <mesh material={darkShellMat}>
            <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
          </mesh>
          <mesh position={[side * 0.02, 0, 0]} material={accentMat}>
            <torusGeometry args={[0.07, 0.005, 8, 16]} />
          </mesh>
        </group>
      ))}

      {/* Antenna */}
      <mesh position={[0.15, 0.72, -0.1]} material={jointMat}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
      </mesh>
      <mesh ref={antennaLightRef} position={[0.15, 0.83, -0.1]} material={antennaGlowMat}>
        <sphereGeometry args={[0.02, 12, 12]} />
      </mesh>

      {/* Forehead accent lines */}
      {[0.32, 0.38].map((y, i) => (
        <mesh key={`fline-${i}`} position={[0, y, 0.68]} material={accentMat} scale={[0.25 - i * 0.05, 0.004, 0.005]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}

      {/* Top vent slits */}
      {[-0.08, 0, 0.08].map((x, i) => (
        <mesh key={`vent-${i}`} position={[x, 0.62, 0.2]} material={darkShellMat} scale={[0.02, 0.005, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

export default AvatarHead;
