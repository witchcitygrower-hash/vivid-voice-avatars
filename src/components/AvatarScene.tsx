import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import AvatarHead from './AvatarHead';
import ParticleField from './ParticleField';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function AvatarScene({ audioData, isListening }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 3.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#080c14']} />
      <fog attach="fog" args={['#080c14', 5, 15]} />

      {/* Key Light - warm, slightly right */}
      <directionalLight position={[3, 4, 2]} intensity={1.8} color="#ffe8d6" />
      
      {/* Fill Light - cool, left */}
      <directionalLight position={[-3, 2, 2]} intensity={0.6} color="#7ec8e3" />
      
      {/* Rim Light - strong cyan from behind */}
      <spotLight
        position={[0, 3, -3]}
        intensity={isListening ? 3 + audioData.volume * 5 : 2}
        color="#00d4ff"
        angle={0.6}
        penumbra={0.8}
      />

      {/* Accent light - magenta from below */}
      <pointLight
        position={[0, -2, 1]}
        intensity={isListening ? 0.8 + audioData.bass * 2 : 0.4}
        color="#ff3388"
        distance={6}
      />

      {/* Ambient fill */}
      <ambientLight intensity={0.15} color="#1a1a2e" />

      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.1}>
        <AvatarHead audioData={audioData} isListening={isListening} />
      </Float>

      <ParticleField audioData={audioData} isListening={isListening} />

      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.4}
        scale={8}
        blur={2.5}
        far={4}
        color="#00d4ff"
      />

      <Environment preset="city" environmentIntensity={0.3} />
    </Canvas>
  );
}

export default AvatarScene;
