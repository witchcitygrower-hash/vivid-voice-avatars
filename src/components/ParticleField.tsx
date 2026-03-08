import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function ParticleField({ audioData, isListening }: Props) {
  const orbitalRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.Points>(null);

  const dustCount = 1200;
  const orbitalCount = 300;
  const trailCount = 200;

  // Ambient dust
  const dust = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() * 0.03 + 0.005;
    }
    return { positions: pos, sizes };
  }, []);

  // Orbital ring particles
  const orbital = useMemo(() => {
    const pos = new Float32Array(orbitalCount * 3);
    const angles = new Float32Array(orbitalCount);
    const radii = new Float32Array(orbitalCount);
    const speeds = new Float32Array(orbitalCount);
    const yOffsets = new Float32Array(orbitalCount);
    for (let i = 0; i < orbitalCount; i++) {
      angles[i] = (i / orbitalCount) * Math.PI * 2;
      radii[i] = 1.2 + Math.random() * 0.3;
      speeds[i] = 0.3 + Math.random() * 0.5;
      yOffsets[i] = (Math.random() - 0.5) * 0.2;
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    return { positions: pos, angles, radii, speeds, yOffsets };
  }, []);

  // Energy trails
  const trails = useMemo(() => {
    const pos = new Float32Array(trailCount * 3);
    const angles = new Float32Array(trailCount);
    const heights = new Float32Array(trailCount);
    for (let i = 0; i < trailCount; i++) {
      angles[i] = (i / trailCount) * Math.PI * 2;
      heights[i] = (Math.random() - 0.5) * 3;
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    return { positions: pos, angles, heights };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const vol = isListening ? audioData.volume : 0;
    const bass = isListening ? audioData.bass : 0;

    // Dust
    if (dustRef.current) {
      const pos = dustRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        const i3 = i * 3;
        const reactivity = 1 + vol * 2;
        pos[i3] = dust.positions[i3] + Math.sin(t * 0.2 + i * 0.01) * 0.1 * reactivity;
        pos[i3 + 1] = dust.positions[i3 + 1] + Math.cos(t * 0.15 + i * 0.02) * 0.08 * reactivity;
        pos[i3 + 2] = dust.positions[i3 + 2] + Math.sin(t * 0.1 + i * 0.015) * 0.06;
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
      dustRef.current.rotation.y = t * 0.01;
    }

    // Orbital ring
    if (orbitalRef.current) {
      const pos = orbitalRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < orbitalCount; i++) {
        const i3 = i * 3;
        const angle = orbital.angles[i] + t * orbital.speeds[i];
        const r = orbital.radii[i] + bass * 0.5 + Math.sin(t * 2 + i * 0.1) * vol * 0.3;
        pos[i3] = Math.cos(angle) * r;
        pos[i3 + 1] = orbital.yOffsets[i] + Math.sin(angle * 2 + t) * 0.1 + 0.15;
        pos[i3 + 2] = Math.sin(angle) * r;
      }
      orbitalRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Energy trails (vertical spirals)
    if (trailRef.current) {
      const pos = trailRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < trailCount; i++) {
        const i3 = i * 3;
        const progress = (t * 0.5 + trails.angles[i]) % (Math.PI * 2);
        const r = 0.9 + Math.sin(progress * 3) * 0.2 + vol * 0.5;
        const h = trails.heights[i] + Math.sin(t + i * 0.05) * 0.5;
        pos[i3] = Math.cos(progress + i * 0.3) * r;
        pos[i3 + 1] = h + Math.sin(t * 1.5 + i * 0.1) * vol * 0.8;
        pos[i3 + 2] = Math.sin(progress + i * 0.3) * r;
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Ambient dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions.slice(), 3]} count={dustCount} />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          color={isListening ? '#00bbff' : '#335566'}
          transparent
          opacity={isListening ? 0.5 + audioData.volume * 0.5 : 0.2}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Orbital ring */}
      <points ref={orbitalRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbital.positions.slice(), 3]} count={orbitalCount} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#00d4ff"
          transparent
          opacity={isListening ? 0.7 + audioData.bass * 0.3 : 0.15}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Energy trails */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trails.positions.slice(), 3]} count={trailCount} />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#ff3388"
          transparent
          opacity={isListening ? 0.4 + audioData.treble * 0.6 : 0.05}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}

export default ParticleField;
