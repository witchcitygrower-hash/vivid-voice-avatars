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
      camera={{ position: [0, 0.3, 3.2], fov: 32 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: 3 }}
    >
      <color attach="background" args={['#080c14']} />
      <fog attach="fog" args={['#080c14', 5, 14]} />

      {/* Key light - warm from top right */}
      <directionalLight position={[3, 5, 4]} intensity={1.8} color="#fff5e6" castShadow />
      
      {/* Fill light - cool from left */}
      <directionalLight position={[-4, 2, 2]} intensity={0.8} color="#b0d4ff" />

      {/* Back rim light - strong cyan */}
      <spotLight
        position={[0, 3, -3]}
        intensity={isListening ? 5 + audioData.volume * 8 : 3}
        color="#00ccff"
        angle={0.6}
        penumbra={1}
        castShadow
      />

      {/* Front fill - subtle */}
      <directionalLight position={[0, 0, 5]} intensity={0.4} color="#ffffff" />

      {/* Bottom accent */}
      <pointLight
        position={[0, -2, 2]}
        intensity={isListening ? 1.5 + audioData.bass * 4 : 0.8}
        color="#00aaff"
        distance={8}
      />

      {/* Side accents */}
      <pointLight
        position={[-3, 0.5, 1]}
        intensity={isListening ? 0.8 + audioData.mid * 2 : 0.4}
        color="#4466ff"
        distance={6}
      />
      <pointLight
        position={[3, 0.5, 1]}
        intensity={isListening ? 0.8 + audioData.treble * 2 : 0.4}
        color="#00ffcc"
        distance={6}
      />

      <ambientLight intensity={0.12} color="#88aacc" />

      <AvatarHead audioData={audioData} isListening={isListening} />
      <WaveformRing audioData={audioData} isListening={isListening} />
      <ParticleField audioData={audioData} isListening={isListening} />

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.4}
        scale={8}
        blur={3}
        far={4}
        color="#004466"
      />

      <Environment preset="city" environmentIntensity={0.35} />

      <EffectComposer>
        <Bloom
          intensity={isListening ? 0.6 + audioData.volume * 0.8 : 0.3}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </Canvas>
  );
}

export default AvatarScene;
