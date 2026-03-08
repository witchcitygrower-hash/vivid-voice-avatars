import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function WaveformRing({ audioData, isListening }: Props) {
  const ringRef = useRef<any>(null);
  const ring2Ref = useRef<any>(null);
  const segments = 128;

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const geometry2 = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    [ringRef, ring2Ref].forEach((ref, ringIdx) => {
      if (!ref.current) return;
      const pos = ref.current.geometry.attributes.position.array as Float32Array;
      const baseRadius = ringIdx === 0 ? 1.3 : 1.5;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        let r = baseRadius;
        
        if (isListening && audioData.frequencies) {
          const freqIdx = Math.floor((i / segments) * audioData.frequencies.length);
          const freqVal = audioData.frequencies[freqIdx] / 255;
          r += freqVal * 0.4 * (ringIdx === 0 ? 1 : 0.6);
        }
        
        r += Math.sin(angle * 4 + t * 2) * 0.02;
        
        const i3 = i * 3;
        pos[i3] = Math.cos(angle) * r;
        pos[i3 + 1] = Math.sin(t + angle * 2) * 0.03;
        pos[i3 + 2] = Math.sin(angle) * r;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
      ref.current.rotation.y = t * (ringIdx === 0 ? 0.1 : -0.08);
    });
  });

  return (
    <group position={[0, 0.15, 0]}>
      {/* @ts-ignore */}
      <line ref={ringRef} geometry={geometry}>
        <lineBasicMaterial
          color="#00d4ff"
          transparent
          opacity={isListening ? 0.6 + audioData.volume * 0.4 : 0.08}
          blending={THREE.AdditiveBlending}
        />
      {/* @ts-ignore */}
      </line>
      {/* @ts-ignore */}
      <line ref={ring2Ref} geometry={geometry2}>
        <lineBasicMaterial
          color="#ff3388"
          transparent
          opacity={isListening ? 0.3 + audioData.treble * 0.4 : 0.04}
          blending={THREE.AdditiveBlending}
        />
      {/* @ts-ignore */}
      </line>
    </group>
  );
}

export default WaveformRing;
