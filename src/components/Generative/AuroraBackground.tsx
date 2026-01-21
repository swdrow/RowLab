import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

// Simplex noise implementation (minimal, embedded)
const SIMPLEX_SKEW = 0.5 * (Math.sqrt(3) - 1);
const SIMPLEX_UNSKEW = (3 - Math.sqrt(3)) / 6;

function simplex2D(x: number, y: number): number {
  const s = (x + y) * SIMPLEX_SKEW;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * SIMPLEX_UNSKEW;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;

  const x1 = x0 - i1 + SIMPLEX_UNSKEW;
  const y1 = y0 - j1 + SIMPLEX_UNSKEW;
  const x2 = x0 - 1 + 2 * SIMPLEX_UNSKEW;
  const y2 = y0 - 1 + 2 * SIMPLEX_UNSKEW;

  const grad = (hash: number, gx: number, gy: number) => {
    const h = hash & 7;
    const u = h < 4 ? gx : gy;
    const v = h < 4 ? gy : gx;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  };

  const perm = (n: number) => ((n * 1664525 + 1013904223) >>> 0) & 255;

  let n0 = 0, n1 = 0, n2 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    n0 = t0 * t0 * grad(perm(i + perm(j)), x0, y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    n1 = t1 * t1 * grad(perm(i + i1 + perm(j + j1)), x1, y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    n2 = t2 * t2 * grad(perm(i + 1 + perm(j + 1)), x2, y2);
  }

  return 70 * (n0 + n1 + n2);
}

// Shader material for aurora effect
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uIntensity;
  varying vec2 vUv;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;

    // Add mouse influence (subtle)
    float mouseInfluence = length(uv - uMouse) * 0.3;

    // Multi-layered noise for organic feel
    float noise1 = snoise(uv * 2.0 + uTime * 0.05) * 0.5 + 0.5;
    float noise2 = snoise(uv * 3.0 - uTime * 0.03 + vec2(10.0, 0.0)) * 0.5 + 0.5;
    float noise3 = snoise(uv * 1.5 + uTime * 0.04 + vec2(0.0, 10.0)) * 0.5 + 0.5;

    // Mix colors based on noise
    vec3 color = mix(uColor1, uColor2, noise1);
    color = mix(color, uColor3, noise2 * 0.5);

    // Apply intensity with edge fade
    float edgeFade = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    edgeFade *= smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);

    float alpha = uIntensity * edgeFade * (noise3 * 0.5 + 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

interface AuroraMeshProps {
  color1: THREE.Color;
  color2: THREE.Color;
  color3: THREE.Color;
  intensity: number;
  speed: number;
}

function AuroraMesh({ color1, color2, color3, intensity, speed }: AuroraMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uColor1: { value: color1 },
      uColor2: { value: color2 },
      uColor3: { value: color3 },
      uIntensity: { value: intensity },
    }),
    [color1, color2, color3, intensity]
  );

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1 - e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * speed;
      materialRef.current.uniforms.uMouse.value.set(
        THREE.MathUtils.lerp(
          materialRef.current.uniforms.uMouse.value.x,
          mouseRef.current.x,
          0.05
        ),
        THREE.MathUtils.lerp(
          materialRef.current.uniforms.uMouse.value.y,
          mouseRef.current.y,
          0.05
        )
      );
    }
  });

  return (
    <mesh ref={meshRef} scale={[size.width / 100, size.height / 100, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

interface AuroraBackgroundProps {
  /** Primary color (hex) */
  color1?: string;
  /** Secondary color (hex) */
  color2?: string;
  /** Tertiary color (hex) */
  color3?: string;
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AuroraBackground - Animated mesh gradient using Three.js shaders
 * Creates a subtle, organic aurora effect with mouse interactivity
 * Falls back to static gradient for reduced motion preference
 */
export function AuroraBackground({
  color1 = '#0070F3', // blade-blue
  color2 = '#7C3AED', // coxswain-violet
  color3 = '#06B6D4', // spectrum-cyan
  intensity = 0.15,
  speed = 1,
  className = '',
}: AuroraBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  const threeColors = useMemo(
    () => ({
      color1: new THREE.Color(color1),
      color2: new THREE.Color(color2),
      color3: new THREE.Color(color3),
    }),
    [color1, color2, color3]
  );

  // Static fallback for reduced motion or mobile
  if (shouldReduceMotion) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${color1}20 0%, ${color2}10 50%, transparent 100%)`,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 1] }}
        style={{ background: 'transparent' }}
      >
        <AuroraMesh
          color1={threeColors.color1}
          color2={threeColors.color2}
          color3={threeColors.color3}
          intensity={intensity}
          speed={speed}
        />
      </Canvas>
    </div>
  );
}

export default AuroraBackground;
