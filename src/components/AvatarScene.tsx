import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import AvatarHead from './AvatarHead';
import ParticleField from './ParticleField';
import WaveformRing from './WaveformRing';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function AvatarScene({ audioData, isListening }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 3.5], fov: 28 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: 3 }}
    >
      <color attach="background" args={['#0a0e18']} />
      <fog attach="fog" args={['#0a0e18', 5, 14]} />

      {/* Key light */}
      <directionalLight position={[2, 4, 3]} intensity={0.9} color="#fff0dd" castShadow />
      {/* Fill */}
      <directionalLight position={[-3, 1, 2]} intensity={0.4} color="#aaccee" />
      {/* Rim - cyan from behind */}
      <spotLight
        position={[0, 2, -3]}
        intensity={isListening ? 2.5 + audioData.volume * 4 : 1.5}
        color="#00ccff"
        angle={0.6}
        penumbra={1}
      />
      {/* Bottom fill */}
      <pointLight
        position={[0, -2, 1.5]}
        intensity={isListening ? 0.5 + audioData.bass * 1.5 : 0.3}
        color="#0088cc"
        distance={5}
      />
      {/* Side accents */}
      <pointLight position={[-2.5, 0.5, 1]} intensity={0.2} color="#4466ff" distance={4} />
      <pointLight position={[2.5, 0.5, 1]} intensity={0.2} color="#00ffcc" distance={4} />

      <ambientLight intensity={0.08} color="#667788" />

      <AvatarHead audioData={audioData} isListening={isListening} />
      <WaveformRing audioData={audioData} isListening={isListening} />
      <ParticleField audioData={audioData} isListening={isListening} />

      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.35}
        scale={6}
        blur={3}
        far={3}
        color="#004466"
      />

      <Environment preset="city" environmentIntensity={0.2} />

      <EffectComposer>
        <Bloom
          intensity={isListening ? 0.5 + audioData.volume * 0.6 : 0.25}
          luminanceThreshold={0.65}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </Canvas>
  );
}

export default AvatarScene;
