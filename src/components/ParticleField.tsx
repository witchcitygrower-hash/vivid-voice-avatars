import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function ParticleField({ audioData, isListening }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 800;

  const { positions, speeds, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 3;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);
      spd[i] = 0.2 + Math.random() * 0.8;
      off[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, speeds: spd, offsets: off };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const s = speeds[i];
      const o = offsets[i];
      const reactivity = isListening ? 1 + audioData.volume * 3 : 1;
      
      pos[i3] = positions[i3] + Math.sin(t * s * 0.3 + o) * 0.15 * reactivity;
      pos[i3 + 1] = positions[i3 + 1] + Math.cos(t * s * 0.4 + o) * 0.15 * reactivity;
      pos[i3 + 2] = positions[i3 + 2] + Math.sin(t * s * 0.2 + o * 2) * 0.1;
    }
    geo.attributes.position.needsUpdate = true;

    pointsRef.current.rotation.y = t * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.slice(), 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={isListening ? '#00d4ff' : '#4488aa'}
        transparent
        opacity={isListening ? 0.6 + audioData.volume * 0.4 : 0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default ParticleField;
