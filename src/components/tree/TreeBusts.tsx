'use client';

// One transparent canvas over the family tree. Each locket gets its own drei
// <View> (a scissored viewport that follows the locket's DOM box), so the tree
// can show a live bust in every locket with a single WebGL context.

import { PerspectiveCamera, View, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { BUSTS_URL, cloneBust, hasBust, type BustWho } from '../bust/BustScene';

export type TreeBustItem = { key: string; who: BustWho; track: RefObject<HTMLElement | null> };

const scissor = new THREE.Vector4();

/**
 * Clone the bust's materials and cut each fragment outside the ellipse inscribed
 * in the current viewport, so the bust sits inside the locket's oval.
 */
function ovalClip(bust: THREE.Object3D) {
  const oval = { value: new THREE.Vector4() };
  bust.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const patch = (m: THREE.Material) => {
      const c = m.clone();
      c.onBeforeCompile = (shader) => {
        shader.uniforms.uOval = oval;
        shader.fragmentShader = shader.fragmentShader
          .replace('void main() {', 'uniform vec4 uOval;\nvoid main() {')
          .replace(
            'void main() {',
            `void main() {
  vec2 ovalR = uOval.zw * 0.5;
  vec2 ovalD = (gl_FragCoord.xy - uOval.xy - ovalR) / ovalR;
  if (dot(ovalD, ovalD) > 1.0) discard;`
          );
      };
      c.customProgramCacheKey = () => 'locket-oval';
      return c;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(patch) : patch(mesh.material);
    mesh.onBeforeRender = (renderer) => {
      // the View's scissor box, in drawing-buffer pixels (origin bottom-left, like gl_FragCoord)
      renderer.getScissor(scissor);
      oval.value.copy(scissor).multiplyScalar(renderer.getPixelRatio());
    };
  });
  return bust;
}

function LocketBust({ who, phase }: { who: BustWho; phase: number }) {
  const gltf = useGLTF(BUSTS_URL, false, true);
  const bust = useMemo(() => ovalClip(cloneBust(gltf.scene, who)), [gltf, who]);
  const turn = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (turn.current) turn.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.35 + phase) * 0.35;
  });
  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={22}
        position={[0, 0.45, 1.05]}
        near={0.05}
        far={10}
        onUpdate={(c) => c.lookAt(0, 0.42, 0)}
      />
      <hemisphereLight args={['#fbf6ee', '#3a3329', 0.9]} />
      <directionalLight position={[-1.2, 1.6, 1.8]} intensity={1.9} color="#fff6ea" />
      <directionalLight position={[1.4, 0.6, 1.2]} intensity={0.9} color="#e8eeff" />
      <directionalLight position={[0.6, 1.2, -1.8]} intensity={1.3} color="#ffdca6" />
      <group ref={turn}>
        <primitive object={bust} />
      </group>
    </>
  );
}

/** Tells the tree which people have a bust in the model, once it has loaded. */
function Available({ items, onAvailable }: { items: TreeBustItem[]; onAvailable: (who: BustWho[]) => void }) {
  const gltf = useGLTF(BUSTS_URL, false, true);
  useEffect(() => {
    onAvailable([...new Set(items.map((i) => i.who))].filter((w) => hasBust(gltf.scene, w)));
  }, [gltf, items, onAvailable]);
  return null;
}

export default function TreeBusts({
  items,
  available,
  running,
  onAvailable,
}: {
  items: TreeBustItem[];
  available: BustWho[];
  running: boolean;
  onAvailable: (who: BustWho[]) => void;
}) {
  return (
    <Canvas
      className="tree-busts"
      frameloop={running ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.5;
      }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Available items={items} onAvailable={onAvailable} />
        {items
          .filter((i) => available.includes(i.who))
          .map((i, n) => (
            <View key={i.key} track={i.track as RefObject<HTMLElement>}>
              <LocketBust who={i.who} phase={n * 1.7} />
            </View>
          ))}
      </Suspense>
    </Canvas>
  );
}
