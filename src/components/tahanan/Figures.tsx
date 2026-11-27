'use client';

// The Rizal family in the house — realistic figures built in Blender with
// MPFB (MakeHuman, CC0 assets) and period clothing. An artist's
// reconstruction: the faces are not exact likenesses.

import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { Quality } from './TahananScene';

const FIGURES_URL = '/models/rizal-figures.glb';

/** Figure meshes, for click picking (filled once the model loads). */
export const FIGURE_MESHES: THREE.Object3D[] = [];

// Hair, brows and lashes use alpha-cut textures: an alpha test keeps them crisp
// and correctly sorted against the room.
const prepared = new WeakSet<THREE.Material>();
function prepareMaterial(m: THREE.Material) {
  if (prepared.has(m)) return;
  prepared.add(m);
  const std = m as THREE.MeshStandardMaterial;
  if (std.transparent || std.alphaTest > 0) {
    std.transparent = false;
    std.alphaTest = 0.4;
    std.depthWrite = true;
    std.side = THREE.DoubleSide;
  }
  std.needsUpdate = true;
}

export default function Figures({ quality }: { quality: Quality }) {
  const gltf = useGLTF(FIGURES_URL, false, true);

  useEffect(() => {
    FIGURE_MESHES.length = 0;
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(prepareMaterial);
      mesh.castShadow = quality === 'high';
      mesh.receiveShadow = quality === 'high';
      if (!mesh.geometry.boundsTree) mesh.geometry.computeBoundsTree();
      FIGURE_MESHES.push(mesh);
    });
    return () => {
      FIGURE_MESHES.length = 0;
    };
  }, [gltf, quality]);

  return <primitive object={gltf.scene} />;
}
