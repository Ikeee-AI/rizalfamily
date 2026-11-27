'use client';

// One realistic 3D bust. Francisco, Teodora, Paciano and Trinidad were built in
// Blender with MPFB / MakeHuman CC0 assets; José was generated from his portrait
// (Modly / Hunyuan3D) and coloured by projecting that photo onto the mesh.
// Reconstructions: shaped toward the archive photos, not exact likenesses.

import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Every person who may have a bust. A name only shows a bust once a BUST_<name>
// node exists in the GLB; until then the page keeps its silhouette.
export type BustWho =
  | 'Francisco'
  | 'Teodora'
  | 'Saturnina'
  | 'Paciano'
  | 'Narcisa'
  | 'Olimpia'
  | 'Lucia'
  | 'Maria'
  | 'Jose'
  | 'Concepcion'
  | 'Josefa'
  | 'Trinidad'
  | 'Soledad';

export const BUSTS_URL = '/models/rizal-busts.glb';
// Head-and-shoulders framing (busts span z = 0..0.57, crown at the top).
const TARGET: [number, number, number] = [0, 0.4, 0];
const CAMERA_POS: [number, number, number] = [0, 0.44, 1.2];

export function hasBust(scene: THREE.Object3D, who: BustWho) {
  return !!scene.getObjectByName(`BUST_${who}`);
}

// Hair, brows and lashes use alpha-cut textures: render them with an alpha test
// (crisp, correctly sorted) instead of blending.
const prepared = new WeakSet<THREE.Material>();
export function prepareMaterial(m: THREE.Material) {
  if (prepared.has(m)) return;
  prepared.add(m);
  const std = m as THREE.MeshStandardMaterial;
  if (std.transparent || std.alphaTest > 0) {
    std.transparent = false;
    std.alphaTest = 0.4;
    std.depthWrite = true;
    std.side = THREE.DoubleSide;
  }
  std.envMapIntensity = 0.6;
  std.needsUpdate = true;
}

export function cloneBust(scene: THREE.Object3D, who: BustWho) {
  const src = scene.getObjectByName(`BUST_${who}`);
  if (!src) return new THREE.Group();
  // Keep the node's own transform: mesh compression stores its offset/scale there.
  const bust = src.clone(true);
  bust.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(prepareMaterial);
  });
  return bust;
}

function Bust({ who, sway, onReady }: { who: BustWho; sway: boolean; onReady: () => void }) {
  const gltf = useGLTF(BUSTS_URL, false, true);
  const bust = useMemo(() => cloneBust(gltf.scene, who), [gltf, who]);
  const turn = useRef<THREE.Group>(null);

  useEffect(() => {
    onReady();
  }, [bust, onReady]);

  useFrame((state) => {
    const g = turn.current;
    if (!g || !sway) return;
    // a slow, gentle turn — like a portrait catching the light
    g.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.32;
  });

  return (
    <group ref={turn}>
      <primitive object={bust} />
    </group>
  );
}

export default function BustScene({
  who,
  reducedMotion,
  running,
  onReady,
}: {
  who: BustWho;
  reducedMotion: boolean;
  running: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      frameloop={running ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ fov: 24, position: CAMERA_POS, near: 0.05, far: 10 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...TARGET);
        // Same tone curve family as Blender (AgX): keeps skin tones from going orange.
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.5;
      }}
      aria-hidden
    >
      {/* warm "studio portrait" light: key from the upper left, soft fill, golden rim */}
      <hemisphereLight args={['#fbf6ee', '#3a3329', 0.9]} />
      <directionalLight position={[-1.2, 1.6, 1.8]} intensity={1.9} color="#fff6ea" />
      <directionalLight position={[1.4, 0.6, 1.2]} intensity={0.9} color="#e8eeff" />
      <directionalLight position={[0.6, 1.2, -1.8]} intensity={1.3} color="#ffdca6" />
      <Suspense fallback={null}>
        <Bust who={who} sway={!reducedMotion} onReady={onReady} />
      </Suspense>
      <OrbitControls
        target={TARGET}
        enableZoom={false}
        enablePan={false}
        enableDamping
        rotateSpeed={0.6}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
        minPolarAngle={Math.PI / 2 - 0.35}
        maxPolarAngle={Math.PI / 2 + 0.15}
      />
    </Canvas>
  );
}
