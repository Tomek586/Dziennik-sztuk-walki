import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scrollState } from '@/scroll';

/**
 * Wojownik-sylwetka z tuszu: modele z Mixamo (ten sam rig X Bot), materiał
 * podmieniony na głęboką czerń — cynobrowy rim daje kontur w stylu sumi-e.
 *
 * Pliki (po konwersji FBX→GLB) leżą w /public/models/. Segmenty scrolla
 * przełączają klipy z płynnym crossfade.
 */
const MODELS = {
  idle: '/models/fight-idle.glb',
  jabCross: '/models/jab-cross.glb',
  roundhouse: '/models/roundhouse.glb',
  takedown: '/models/takedown.glb',
  mmaKick: '/models/mma-kick.glb',
  victory: '/models/victory.glb',
} as const;

type ClipKey = keyof typeof MODELS;

/** progress → który klip gra (kolejność sekcji strony) */
const SEGMENTS: { until: number; clip: ClipKey }[] = [
  { until: 0.12, clip: 'idle' }, // hero — postawa bojowa
  { until: 0.32, clip: 'jabCross' }, // 01 głos — kombinacja ciosów
  { until: 0.52, clip: 'roundhouse' }, // 02 technika — kopnięcie okrężne
  { until: 0.68, clip: 'takedown' }, // 03 droga — wejście w nogi (BJJ)
  { until: 0.86, clip: 'mmaKick' }, // 04 rytuał — kopnięcie MMA
  { until: 1.01, clip: 'victory' }, // finał — victory
];

const INK_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#0e0c0a',
  roughness: 0.82,
  metalness: 0.06,
});

export function InkFighter() {
  const base = useGLTF(MODELS.idle);
  const jabCross = useGLTF(MODELS.jabCross);
  const roundhouse = useGLTF(MODELS.roundhouse);
  const takedown = useGLTF(MODELS.takedown);
  const mmaKick = useGLTF(MODELS.mmaKick);
  const victory = useGLTF(MODELS.victory);

  const groupRef = useRef<THREE.Group>(null);
  const activeRef = useRef<ClipKey>('idle');
  const lastSwitchRef = useRef(0);

  // tuszowa sylwetka: podmień materiały wszystkich meshy
  useEffect(() => {
    base.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = INK_MATERIAL;
        obj.castShadow = false;
        obj.frustumCulled = false;
      }
    });
  }, [base.scene]);

  const { mixer, actions } = useMemo(() => {
    const mx = new THREE.AnimationMixer(base.scene);
    const clipOf = (g: { animations: THREE.AnimationClip[] }) => g.animations[0];
    const make = (clip: THREE.AnimationClip | undefined) =>
      clip ? mx.clipAction(clip) : null;
    const acts: Record<ClipKey, THREE.AnimationAction | null> = {
      idle: make(clipOf(base)),
      jabCross: make(clipOf(jabCross)),
      roundhouse: make(clipOf(roundhouse)),
      takedown: make(clipOf(takedown)),
      mmaKick: make(clipOf(mmaKick)),
      victory: make(clipOf(victory)),
    };
    acts.idle?.play();
    return { mixer: mx, actions: acts };
  }, [base, jabCross, roundhouse, takedown, mmaKick, victory]);

  useFrame((state, delta) => {
    mixer.update(delta);

    // wygładzony postęp + minimalny odstęp między zmianami klipu:
    // szybki scroll nie przerzuca wojownika przez kilka ruchów naraz
    const p = scrollState.smooth;
    const next = (SEGMENTS.find((s) => p < s.until) ?? SEGMENTS[SEGMENTS.length - 1]!).clip;
    const now = state.clock.elapsedTime;
    if (next !== activeRef.current && now - lastSwitchRef.current > 0.55) {
      const from = actions[activeRef.current];
      const to = actions[next];
      if (to) {
        to.reset().fadeIn(0.5).play();
        from?.fadeOut(0.5);
        activeRef.current = next;
        lastSwitchRef.current = now;
      }
    }

    // delikatny obrót całej postaci w rytm scrolla (już wygładzonego)
    const g = groupRef.current;
    if (g) g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, -0.4 + p * 1.6, 0.05);
  });

  return (
    <group ref={groupRef} position={[0, -1.45, 0]} scale={1.6}>
      <primitive object={base.scene} />
    </group>
  );
}
