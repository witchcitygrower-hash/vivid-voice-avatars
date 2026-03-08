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
      <color attach="background" args={['#050810']} />
      <fog attach="fog" args={['#050810', 4, 12]} />

      {/* Three-point cinematic lighting */}
      <directionalLight position={[3, 5, 3]} intensity={2.2} color="#ffe4cc" castShadow />
      <directionalLight position={[-4, 2, 1]} intensity={0.8} color="#6ec8f0" />
      
      {/* Rim light */}
      <spotLight
        position={[0, 4, -4]}
        intensity={isListening ? 4 + audioData.volume * 8 : 2.5}
        color="#00ccff"
        angle={0.5}
        penumbra={1}
        castShadow
      />

      {/* Bottom accent */}
      <pointLight
        position={[0, -3, 1.5]}
        intensity={isListening ? 1.2 + audioData.bass * 4 : 0.5}
        color="#ff2266"
        distance={8}
      />

      {/* Side accents */}
      <pointLight
        position={[-3, 0, 0]}
        intensity={isListening ? 0.5 + audioData.mid * 2 : 0.2}
        color="#4400ff"
        distance={6}
      />
      <pointLight
        position={[3, 0, 0]}
        intensity={isListening ? 0.5 + audioData.treble * 2 : 0.2}
        color="#00ffaa"
        distance={6}
      />

      <ambientLight intensity={0.08} color="#0a0a1a" />

      <AvatarHead audioData={audioData} isListening={isListening} />
      <WaveformRing audioData={audioData} isListening={isListening} />
      <ParticleField audioData={audioData} isListening={isListening} />

      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.5}
        scale={10}
        blur={3}
        far={5}
        color="#00aaff"
      />

      <Environment preset="night" environmentIntensity={0.4} />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={isListening ? 1.2 + audioData.volume * 1.5 : 0.6}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </Canvas>
  );
}

export default AvatarScene;
