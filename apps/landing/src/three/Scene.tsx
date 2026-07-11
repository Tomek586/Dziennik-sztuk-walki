import { Component, Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '@/scroll';
import { InkFighter } from './InkFighter';

const INK = '#0c0a08';
const VERMILION = '#d6402f';
const GOLD = '#c0972f';
const PAPER = '#f2e9da';

/** Kamera: zjazd i łuk w rytm scrolla + delikatna paralaksa myszy. */
function CameraRig() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    // wygładzony postęp — kamera nie skacze przy szybkim scrollu
    const p = scrollState.smooth;
    const targetX = Math.sin(p * Math.PI * 1.2) * 1.1 + pointer.x * 0.25;
    const targetY = 1.35 - p * 0.9 + pointer.y * 0.15;
    const targetZ = 6.4 - Math.sin(p * Math.PI) * 1.2;
    camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
    camera.lookAt(0, 0.9, 0);
  });
  return null;
}

/** Zawiesina tuszu — cząsteczki dryfujące w górę, przyspieszają przy scrollu. */
function InkParticles({ count = 650 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cInk = new THREE.Color('#3a332b');
    const cVer = new THREE.Color(VERMILION);
    const cGold = new THREE.Color(GOLD);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 6 - 1.5;
      pos[i * 3 + 2] = Math.sin(a) * r - 1;
      const roll = Math.random();
      const c = roll < 0.08 ? cVer : roll < 0.13 ? cGold : cInk;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame((_, delta) => {
    const points = ref.current;
    if (!points) return;
    const speed = 0.12 + Math.min(Math.abs(scrollState.velocity) * 0.02, 0.6);
    const arr = points.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = arr.getY(i) + delta * speed * (0.5 + (i % 5) * 0.2);
      if (y > 5) y = -1.6;
      arr.setY(i, y);
    }
    arr.needsUpdate = true;
    points.rotation.y += delta * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** Enso — koło pędzla; fallback bohatera do czasu wgrania modeli z Mixamo. */
function InkTotem() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.z -= delta * 0.12;
    const breathe = 0.62 * (1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.02);
    g.scale.setScalar(breathe);
    g.rotation.x = scrollState.progress * 0.7 - 0.1;
  });
  return (
    <group ref={group} position={[1.7, 1.0, -0.6]} scale={0.62}>
      {/* gruby ślad tuszu (niedomknięty — enso) */}
      <mesh rotation={[0, 0, 0.6]}>
        <torusGeometry args={[1.5, 0.13, 24, 160, Math.PI * 1.82]} />
        <meshStandardMaterial color="#181410" roughness={0.75} />
      </mesh>
      {/* cienki cynobrowy akcent */}
      <mesh rotation={[0, 0, 1.1]} position={[0, 0, -0.05]}>
        <torusGeometry args={[1.62, 0.02, 12, 140, Math.PI * 1.5]} />
        <meshBasicMaterial color={VERMILION} />
      </mesh>
      {/* złota drobina */}
      <mesh position={[1.28, 0.95, 0.1]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
    </group>
  );
}

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Scene() {
  return (
    <div id="canvas-root">
      <Canvas
        camera={{ position: [0, 1.35, 6.4], fov: 34 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(INK);
          scene.fog = new THREE.Fog(INK, 7, 14);
        }}
      >
        {/* światła: cynobrowy rim zza pleców + złote wypełnienie + zimny księżyc */}
        <ambientLight intensity={0.25} color={PAPER} />
        <directionalLight position={[-4, 3, -4]} intensity={9} color={VERMILION} />
        <directionalLight position={[3, 1.5, -2]} intensity={2.4} color={GOLD} />
        <directionalLight position={[0, 4, 5]} intensity={0.55} color="#cfd8e3" />

        <CameraRig />
        <InkParticles />

        <ModelBoundary fallback={<InkTotem />}>
          <Suspense fallback={<InkTotem />}>
            <InkFighter />
          </Suspense>
        </ModelBoundary>

        {/* podłoga-mgła: ciemny dysk kotwiczący scenę */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
          <circleGeometry args={[7, 48]} />
          <meshStandardMaterial color="#0e0b09" roughness={1} />
        </mesh>
      </Canvas>
    </div>
  );
}
