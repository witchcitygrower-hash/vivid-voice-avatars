import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

// Custom shader material for holographic skin
const HoloSkinVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDisplacement;
  
  uniform float uTime;
  uniform float uBass;
  uniform float uVolume;
  uniform float uMid;
  
  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    float noise = snoise(position * 2.0 + uTime * 0.3) * 0.02;
    float audioDisp = uVolume * 0.03 + uBass * 0.02;
    float pulse = sin(uTime * 2.0 + position.y * 3.0) * uMid * 0.01;
    
    vDisplacement = noise + audioDisp + pulse;
    
    vec3 newPosition = position + normal * vDisplacement;
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const HoloSkinFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDisplacement;
  
  uniform float uTime;
  uniform float uVolume;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform vec3 uCameraPos;
  
  void main() {
    vec3 viewDir = normalize(uCameraPos - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    
    // Subsurface scattering approximation
    vec3 skinBase = vec3(0.85, 0.65, 0.55);
    vec3 skinDeep = vec3(0.6, 0.25, 0.2);
    vec3 skinColor = mix(skinBase, skinDeep, fresnel * 0.3);
    
    // Iridescent highlights reacting to audio
    float iridescence = sin(fresnel * 6.28 + uTime * 0.5) * 0.5 + 0.5;
    vec3 iriColor = vec3(
      sin(iridescence * 6.28) * 0.5 + 0.5,
      sin(iridescence * 6.28 + 2.094) * 0.5 + 0.5,
      sin(iridescence * 6.28 + 4.189) * 0.5 + 0.5
    );
    
    // Cyber glow lines
    float scanLine = smoothstep(0.48, 0.5, fract(vWorldPosition.y * 15.0 + uTime * 0.5));
    float scanLine2 = smoothstep(0.49, 0.5, fract(vWorldPosition.y * 40.0 - uTime * 0.8));
    
    vec3 glowColor = vec3(0.0, 0.83, 1.0); // Cyan
    vec3 accentGlow = vec3(1.0, 0.2, 0.5); // Magenta
    
    // Audio reactive emission
    float audioGlow = uVolume * 0.8 + uBass * 0.4;
    float pulseGlow = sin(uTime * 3.0) * 0.1 + 0.1;
    
    // Combine
    vec3 color = skinColor;
    
    // Add iridescent rim
    color += iriColor * fresnel * (0.3 + audioGlow * 0.5);
    
    // Add scan lines
    color += glowColor * scanLine * (0.05 + audioGlow * 0.15);
    color += accentGlow * scanLine2 * (0.03 + uTreble * 0.1);
    
    // Add fresnel glow
    color += glowColor * fresnel * (0.15 + audioGlow * 0.4 + pulseGlow);
    
    // Specular
    vec3 lightDir = normalize(vec3(1.0, 2.0, 2.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
    color += vec3(1.0, 0.95, 0.9) * spec * 0.6;
    
    // Displacement coloring
    color += glowColor * abs(vDisplacement) * 5.0;
    
    float alpha = 0.92 + fresnel * 0.08;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface Props {
  audioData: AudioData;
  isListening: boolean;
}

function AvatarHead({ audioData, isListening }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const headMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const innerMouthRef = useRef<THREE.Mesh>(null);
  const leftIrisRef = useRef<THREE.Mesh>(null);
  const rightIrisRef = useRef<THREE.Mesh>(null);
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);

  const smoothed = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });

  const headUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVolume: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 },
    uCameraPos: { value: new THREE.Vector3(0, 0.3, 3.2) },
  }), []);

  const eyeMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xf8f4f0,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2,
  }), []);

  const irisMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.0, 0.7, 0.9),
    roughness: 0.05,
    metalness: 0.5,
    clearcoat: 1,
    emissive: new THREE.Color(0.0, 0.4, 0.6),
    emissiveIntensity: 0.8,
    envMapIntensity: 3,
  }), []);

  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x010101,
    roughness: 0.05,
    metalness: 0.8,
    emissive: new THREE.Color(0, 0.1, 0.15),
    emissiveIntensity: 0.3,
  }), []);

  const lipMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.75, 0.35, 0.35),
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    sheen: 0.5,
    sheenColor: new THREE.Color(0.9, 0.4, 0.4),
  }), []);

  const innerMouthMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1a0505,
    roughness: 0.95,
    metalness: 0,
  }), []);

  const skinMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(0.08, 0.35, 0.62),
    roughness: 0.45,
    metalness: 0.01,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
    sheen: 0.4,
    sheenColor: new THREE.Color(0.8, 0.5, 0.4),
    sheenRoughness: 0.4,
    envMapIntensity: 1.5,
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = smoothed.current;
    const lerp = 1 - Math.pow(0.0005, delta);

    s.volume = THREE.MathUtils.lerp(s.volume, audioData.volume, lerp);
    s.bass = THREE.MathUtils.lerp(s.bass, audioData.bass, lerp);
    s.mid = THREE.MathUtils.lerp(s.mid, audioData.mid, lerp);
    s.treble = THREE.MathUtils.lerp(s.treble, audioData.treble, lerp);

    // Update shader uniforms
    if (headMaterialRef.current) {
      headMaterialRef.current.uniforms.uTime.value = t;
      headMaterialRef.current.uniforms.uVolume.value = s.volume;
      headMaterialRef.current.uniforms.uBass.value = s.bass;
      headMaterialRef.current.uniforms.uMid.value = s.mid;
      headMaterialRef.current.uniforms.uTreble.value = s.treble;
    }

    // Head movement
    if (groupRef.current) {
      const breathe = Math.sin(t * 1.0) * 0.01;
      const nod = Math.sin(t * 0.7) * 0.012 - s.bass * 0.04;
      const tilt = Math.sin(t * 0.4) * 0.008 + s.mid * 0.06 * Math.sin(t * 1.5);
      const turn = Math.sin(t * 0.3) * 0.02 + s.treble * 0.05 * Math.cos(t * 2);

      groupRef.current.position.y = breathe + 0.15;
      groupRef.current.rotation.x = nod;
      groupRef.current.rotation.y = turn;
      groupRef.current.rotation.z = tilt;
    }

    // Jaw
    if (jawRef.current) {
      const open = s.volume * 0.5 + s.bass * 0.2;
      jawRef.current.position.y = -0.62 - open * 0.18;
      jawRef.current.rotation.x = open * 0.3;
    }

    // Inner mouth
    if (innerMouthRef.current) {
      const open = s.volume * 0.5 + s.bass * 0.2;
      innerMouthRef.current.scale.set(1, 0.3 + open * 3, 0.5 + open * 1.5);
      innerMouthRef.current.position.y = -0.53 - open * 0.06;
    }

    // Eye tracking (look toward camera with subtle wander)
    const eyeTargetX = Math.sin(t * 0.6) * 0.015 + Math.sin(t * 1.7) * 0.005;
    const eyeTargetY = Math.cos(t * 0.8) * 0.01 + Math.sin(t * 2.1) * 0.003;
    [leftIrisRef, rightIrisRef].forEach(ref => {
      if (ref.current) {
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, eyeTargetX, 0.1);
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, eyeTargetY, 0.1);
      }
    });

    // Blink
    const blinkCycle = t % 3.5;
    const blink = blinkCycle < 0.12 ? Math.cos(blinkCycle * Math.PI / 0.12) * 0.5 + 0.5 : 1;
    [leftEyeGroupRef, rightEyeGroupRef].forEach(ref => {
      if (ref.current) ref.current.scale.y = blink;
    });

    // Iris glow reactivity
    irisMat.emissiveIntensity = 0.5 + s.volume * 3;
    irisMat.color.setHSL(0.52 + s.mid * 0.1, 0.9, 0.35 + s.volume * 0.2);
  });

  return (
    <group ref={groupRef}>
      {/* Main head - custom shader */}
      <mesh>
        <sphereGeometry args={[0.82, 128, 128]} />
        <shaderMaterial
          ref={headMaterialRef}
          vertexShader={HoloSkinVertexShader}
          fragmentShader={HoloSkinFragmentShader}
          uniforms={headUniforms}
          transparent
        />
      </mesh>

      {/* Jawline / chin area */}
      <mesh position={[0, -0.45, 0.2]} material={skinMat} scale={[0.8, 0.5, 0.7]}>
        <sphereGeometry args={[0.6, 48, 48]} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.05, 0.76]} rotation={[0.2, 0, 0]} material={skinMat}>
        <boxGeometry args={[0.1, 0.3, 0.15]} />
      </mesh>
      <mesh position={[0, -0.18, 0.84]} material={skinMat}>
        <sphereGeometry args={[0.075, 24, 24]} />
      </mesh>

      {/* Eyes */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.27, 0.08, 0.62]}>
          <group ref={side === -1 ? leftEyeGroupRef : rightEyeGroupRef}>
            <mesh material={eyeMat} position={[0, 0, 0.04]}>
              <sphereGeometry args={[0.115, 48, 48]} />
            </mesh>
            <mesh ref={side === -1 ? leftIrisRef : rightIrisRef} material={irisMat} position={[0, 0, 0.13]}>
              <sphereGeometry args={[0.06, 48, 48]} />
            </mesh>
            <mesh material={pupilMat} position={[0, 0, 0.155]}>
              <sphereGeometry args={[0.03, 24, 24]} />
            </mesh>
            {/* Cornea highlight */}
            <mesh position={[0.02, 0.02, 0.16]}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshBasicMaterial color={0xffffff} />
            </mesh>
          </group>
          {/* Upper eyelid */}
          <mesh material={skinMat} position={[0, 0.06, 0.06]} scale={[1.3, 0.25, 0.8]}>
            <sphereGeometry args={[0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
        </group>
      ))}

      {/* Eyebrows - slight arch */}
      {[-1, 1].map((side) => (
        <mesh key={`brow-${side}`} position={[side * 0.27, 0.28, 0.68]} rotation={[0, 0, side * -0.12]} material={skinMat}>
          <capsuleGeometry args={[0.02, 0.16, 4, 8]} />
        </mesh>
      ))}

      {/* Lips */}
      <mesh position={[0, -0.38, 0.72]} material={lipMat} scale={[1, 0.5, 0.8]}>
        <sphereGeometry args={[0.14, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
      <mesh position={[0, -0.44, 0.72]} material={lipMat} scale={[1, 0.4, 0.8]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>

      {/* Jaw (animated) */}
      <mesh ref={jawRef} position={[0, -0.62, 0.25]} material={skinMat}>
        <sphereGeometry args={[0.5, 48, 48, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65]} />
      </mesh>

      {/* Inner mouth */}
      <mesh ref={innerMouthRef} position={[0, -0.42, 0.68]} material={innerMouthMat} scale={[1, 0.3, 0.5]}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <mesh key={`ear-${side}`} position={[side * 0.8, 0.05, 0]} material={skinMat} scale={[0.25, 0.45, 0.4]}>
          <sphereGeometry args={[0.2, 16, 16]} />
        </mesh>
      ))}

      {/* Neck */}
      <mesh position={[0, -1.05, -0.05]} material={skinMat}>
        <cylinderGeometry args={[0.22, 0.28, 0.55, 24]} />
      </mesh>

      {/* Cheekbones */}
      {[-1, 1].map((side) => (
        <mesh key={`cheek-${side}`} position={[side * 0.5, -0.08, 0.42]} material={skinMat}>
          <sphereGeometry args={[0.18, 16, 16]} />
        </mesh>
      ))}
    </group>
  );
}

export default AvatarHead;
