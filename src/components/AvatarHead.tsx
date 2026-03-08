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
  const headRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftIrisRef = useRef<THREE.Mesh>(null);
  const rightIrisRef = useRef<THREE.Mesh>(null);
  const innerMouthRef = useRef<THREE.Mesh>(null);

  // Smoothed values
  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0, breathe: 0 });

  // Materials
  const skinMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(0.08, 0.3, 0.65),
    roughness: 0.55,
    metalness: 0.02,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
    sheen: 0.3,
    sheenColor: new THREE.Color().setHSL(0.0, 0.4, 0.5),
    sheenRoughness: 0.5,
  }), []);

  const eyeWhiteMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xf5f0eb,
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  }), []);

  const irisMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(0.53, 0.9, 0.35),
    roughness: 0.05,
    metalness: 0.3,
    clearcoat: 1,
    emissive: new THREE.Color().setHSL(0.53, 1, 0.15),
    emissiveIntensity: 0.5,
  }), []);

  const lipMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(0.0, 0.45, 0.55),
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  }), []);

  const innerMouthMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2a0a0a,
    roughness: 0.9,
  }), []);

  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.1,
    metalness: 0.5,
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = smoothed.current;
    const lerp = 1 - Math.pow(0.001, delta);

    s.volume = THREE.MathUtils.lerp(s.volume, audioData.volume, lerp);
    s.bass = THREE.MathUtils.lerp(s.bass, audioData.bass, lerp);
    s.mid = THREE.MathUtils.lerp(s.mid, audioData.mid, lerp);
    s.treble = THREE.MathUtils.lerp(s.treble, audioData.treble, lerp);
    s.breathe += delta;

    if (groupRef.current) {
      // Idle breathing + subtle sway
      const breathe = Math.sin(s.breathe * 1.2) * 0.008;
      const sway = Math.sin(t * 0.5) * 0.015;
      groupRef.current.position.y = breathe;
      groupRef.current.rotation.y = sway + s.mid * 0.1 * Math.sin(t * 2);
      groupRef.current.rotation.x = Math.sin(t * 0.7) * 0.01 - s.bass * 0.03;
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.005;
    }

    // Jaw movement driven by volume
    if (jawRef.current) {
      const openAmount = s.volume * 0.35 + s.bass * 0.15;
      jawRef.current.position.y = -0.65 - openAmount * 0.2;
      jawRef.current.rotation.x = openAmount * 0.25;
      jawRef.current.scale.y = 1 + openAmount * 0.1;
    }

    // Inner mouth
    if (innerMouthRef.current) {
      const openAmount = s.volume * 0.35 + s.bass * 0.15;
      innerMouthRef.current.scale.y = 0.5 + openAmount * 2;
      innerMouthRef.current.position.y = -0.65 - openAmount * 0.08;
    }

    // Eye look direction (subtle tracking)
    const eyeX = Math.sin(t * 0.8) * 0.02;
    const eyeY = Math.cos(t * 0.6) * 0.015;
    [leftIrisRef, rightIrisRef].forEach(ref => {
      if (ref.current) {
        ref.current.position.x = eyeX;
        ref.current.position.y = eyeY;
      }
    });

    // Blink
    const blinkCycle = t % 4;
    const blinkScale = blinkCycle < 0.1 ? Math.cos(blinkCycle * Math.PI / 0.1) * 0.5 + 0.5 : 1;
    [leftEyeRef, rightEyeRef].forEach(ref => {
      if (ref.current) ref.current.scale.y = blinkScale;
    });

    // Emissive glow on iris when listening
    if (isListening) {
      irisMat.emissiveIntensity = 0.5 + s.volume * 2;
    } else {
      irisMat.emissiveIntensity = 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Head - ellipsoid */}
      <mesh ref={headRef} material={skinMat}>
        <sphereGeometry args={[0.85, 64, 64]} />
        <mesh position={[0, -0.15, 0]} scale={[1, 1.15, 1]}>
          {/* Give head a slightly elongated feel */}
        </mesh>
      </mesh>

      {/* Forehead ridge */}
      <mesh position={[0, 0.35, 0.6]} material={skinMat}>
        <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
      </mesh>

      {/* Nose bridge */}
      <mesh position={[0, -0.05, 0.78]} rotation={[0.3, 0, 0]} material={skinMat}>
        <boxGeometry args={[0.12, 0.35, 0.15]} />
      </mesh>
      {/* Nose tip */}
      <mesh position={[0, -0.2, 0.85]} material={skinMat}>
        <sphereGeometry args={[0.09, 16, 16]} />
      </mesh>
      {/* Nostrils */}
      <mesh position={[-0.06, -0.25, 0.82]} material={lipMat}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>
      <mesh position={[0.06, -0.25, 0.82]} material={lipMat}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>

      {/* Eye sockets */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.28, 0.1, 0.65]}>
          {/* Eye socket depression */}
          <mesh material={skinMat} scale={[1, 0.8, 0.5]}>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>
          {/* Eye white */}
          <mesh ref={side === -1 ? leftEyeRef : rightEyeRef} material={eyeWhiteMat} position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.12, 32, 32]} />
          </mesh>
          {/* Iris */}
          <mesh ref={side === -1 ? leftIrisRef : rightIrisRef} material={irisMat} position={[0, 0, 0.13]}>
            <sphereGeometry args={[0.065, 32, 32]} />
          </mesh>
          {/* Pupil */}
          <mesh material={pupilMat} position={[0, 0, 0.16]}>
            <sphereGeometry args={[0.035, 16, 16]} />
          </mesh>
          {/* Upper eyelid */}
          <mesh material={skinMat} position={[0, 0.06, 0.08]} scale={[1.3, 0.3, 0.8]}>
            <sphereGeometry args={[0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
        </group>
      ))}

      {/* Eyebrows */}
      {[-1, 1].map((side) => (
        <mesh key={`brow-${side}`} position={[side * 0.28, 0.3, 0.7]} rotation={[0, 0, side * -0.15]} material={skinMat}>
          <boxGeometry args={[0.22, 0.04, 0.08]} />
        </mesh>
      ))}

      {/* Cheekbones */}
      {[-1, 1].map((side) => (
        <mesh key={`cheek-${side}`} position={[side * 0.55, -0.1, 0.45]} material={skinMat}>
          <sphereGeometry args={[0.2, 16, 16]} />
        </mesh>
      ))}

      {/* Upper lip */}
      <mesh position={[0, -0.42, 0.72]} material={lipMat} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>

      {/* Lower jaw (animated) */}
      <mesh ref={jawRef} position={[0, -0.65, 0.3]} material={skinMat}>
        <sphereGeometry args={[0.55, 32, 32, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6]} />
      </mesh>

      {/* Lower lip */}
      <mesh position={[0, -0.48, 0.72]} material={lipMat} scale={[1, 0.6, 1]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>

      {/* Inner mouth (dark cavity) */}
      <mesh ref={innerMouthRef} position={[0, -0.45, 0.68]} material={innerMouthMat} scale={[1, 0.5, 0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>

      {/* Chin */}
      <mesh position={[0, -0.75, 0.5]} material={skinMat}>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <group key={`ear-${side}`} position={[side * 0.82, 0.05, 0]}>
          <mesh material={skinMat} scale={[0.3, 0.5, 0.5]}>
            <sphereGeometry args={[0.2, 16, 16]} />
          </mesh>
        </group>
      ))}

      {/* Neck */}
      <mesh position={[0, -1.1, -0.05]} material={skinMat}>
        <cylinderGeometry args={[0.25, 0.3, 0.6, 16]} />
      </mesh>
    </group>
  );
}

export default AvatarHead;
