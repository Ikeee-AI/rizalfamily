'use client';

import { useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useMemo, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { cloneBust, type BustWho } from './bust/BustScene';

// High-poly busts (subdivided, ~85-100k tris each) for desktop; the lighter set on phones.
const BUSTS_HD_URL = '/models/rizal-busts-hd.glb';
const BUSTS_URL = '/models/rizal-busts.glb';

type CardDatum = {
  who: BustWho;
  label: string;
  sub: string;
  x: number;
  y: number;
  z: number;
  accent: string;
  scale: number;
};

const CARD_DATA: CardDatum[] = [
  { who: 'Francisco', label: 'FRANCISCO', sub: '1818–1898', x: -4.1, y: 1.5, z: -1.0, accent: '#B9873C', scale: 1 },
  { who: 'Teodora', label: 'TEODORA', sub: '1826–1911', x: 3.6, y: 2.0, z: 0.4, accent: '#B9873C', scale: 1 },
  { who: 'Paciano', label: 'PACIANO', sub: '1851–1930', x: -3.3, y: -1.7, z: 1.1, accent: '#B9873C', scale: 1 },
  { who: 'Trinidad', label: 'TRINIDAD', sub: '1868–1951', x: 3.9, y: -1.6, z: -0.7, accent: '#B9873C', scale: 1 },
  { who: 'Jose', label: 'JOSÉ', sub: '1861–1896', x: 0, y: 0.2, z: 2.1, accent: '#7A3530', scale: 1.22 },
];

const FALLBACK_CARDS = [
  { label: 'FRANCISCO', left: '8%', top: '10%', rotate: '-8deg' },
  { label: 'TEODORA', left: '72%', top: '4%', rotate: '7deg' },
  { label: 'PACIANO', left: '2%', top: '54%', rotate: '5deg' },
  { label: 'TRINIDAD', left: '76%', top: '58%', rotate: '-6deg' },
  { label: 'JOSÉ', left: '40%', top: '0%', rotate: '-2deg' },
];

function bustPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(50, 8);
  ctx.bezierCurveTo(61, 8, 69, 17, 69, 29);
  ctx.bezierCurveTo(69, 38, 64, 45, 57, 48);
  ctx.bezierCurveTo(74, 53, 86, 66, 88, 92);
  ctx.lineTo(12, 92);
  ctx.bezierCurveTo(14, 66, 26, 53, 43, 48);
  ctx.bezierCurveTo(36, 45, 31, 38, 31, 29);
  ctx.bezierCurveTo(31, 17, 39, 8, 50, 8);
  ctx.closePath();
}

function makeCardTexture(topLabel: string, subLabel: string, accent: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 328;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const grad = ctx.createLinearGradient(0, 0, 256, 328);
  grad.addColorStop(0, '#ecdcae');
  grad.addColorStop(1, '#c9a862');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 328);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 316);

  ctx.fillStyle = '#241d12';
  ctx.save();
  ctx.translate(64, 105);
  ctx.scale(1.35, 1.35);
  bustPath(ctx);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#241d12';
  ctx.font = '700 18px Georgia, serif';
  ctx.fillText(topLabel, 128, 270);
  ctx.font = '400 13px Georgia, serif';
  ctx.fillStyle = '#5c4a2a';
  ctx.fillText(subLabel, 128, 293);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** Warm studio backdrop behind a 3D bust, with the name plate at the bottom. */
function makeBackdropTexture(topLabel: string, subLabel: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 328;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const glow = ctx.createRadialGradient(128, 120, 10, 128, 150, 210);
  glow.addColorStop(0, '#6b5233');
  glow.addColorStop(0.55, '#3b2c1b');
  glow.addColorStop(1, '#1d150d');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 328);

  // name plate
  ctx.fillStyle = 'rgba(16, 11, 6, 0.82)';
  ctx.fillRect(0, 252, 256, 76);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ecdcae';
  ctx.font = '700 18px Georgia, serif';
  ctx.fillText(topLabel, 128, 282);
  ctx.font = '400 13px Georgia, serif';
  ctx.fillStyle = '#c9a862';
  ctx.fillText(subLabel, 128, 305);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Small deterministic pseudo-random number in [0, 1). */
function seeded(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const CARD_W = 2.05;
const CARD_H = 2.63;
const BORDER = 0.13;
// distance below the card centre of the name plate's top edge (plate = bottom 76/328 of the backdrop)
const PLATE_TOP = CARD_H / 2 - (CARD_H * 76) / 328;

/** A frame around the card: four bars, tinted with the accent colour. */
function Frame({ w, h, accent }: { w: number; h: number; accent: string }) {
  const bars: [number, number, number, number][] = [
    [0, h / 2 - BORDER / 2, w, BORDER],
    [0, -h / 2 + BORDER / 2, w, BORDER],
    [-w / 2 + BORDER / 2, 0, BORDER, h - BORDER * 2],
    [w / 2 - BORDER / 2, 0, BORDER, h - BORDER * 2],
  ];
  return (
    <group>
      {bars.map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, 0.04]}>
          <boxGeometry args={[bw, bh, 0.12]} />
          <meshStandardMaterial color={accent} roughness={0.45} metalness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** The realistic bust, seated inside the frame; turns slightly toward the pointer. */
function FramedBust({ who, url, scale }: { who: BustWho; url: string; scale: number }) {
  const gltf = useGLTF(url, false, true);
  const anchor = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  // Head-and-shoulders crop: clip below the name plate and outside the side bars.
  const clip = useMemo(() => {
    const side = (CARD_W / 2 - BORDER) * scale;
    const local = [
      // a little above the plate: the bust stands forward of it, so perspective drops its edge
      new THREE.Plane(new THREE.Vector3(0, 1, 0), PLATE_TOP * scale - 0.1),
      new THREE.Plane(new THREE.Vector3(1, 0, 0), side),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), side),
    ];
    return { local, world: local.map(() => new THREE.Plane()) };
  }, [scale]);
  const bust = useMemo(() => {
    const b = cloneBust(gltf.scene, who);
    // own materials, so the clip plane never leaks into other canvases sharing the model
    b.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const own = (m: THREE.Material) => {
        const c = m.clone();
        c.clippingPlanes = clip.world;
        return c;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
    });
    return b;
  }, [gltf, who, clip]);

  useFrame((state) => {
    const a = anchor.current;
    if (a) clip.world.forEach((p, i) => p.copy(clip.local[i]).applyMatrix4(a.matrixWorld));
    const g = turn.current;
    if (!g) return;
    const target = state.pointer.x * 0.45 + Math.sin(state.clock.getElapsedTime() * 0.3) * 0.12;
    g.rotation.y += (target - g.rotation.y) * 0.05;
  });

  return (
    <group ref={anchor}>
      {/* the bust spans y = 0..0.57 in model units; its crown sits just under the top bar */}
      <group position={[0, -2.05 * scale, -0.05]} scale={5.6 * scale}>
        <group ref={turn}>
          <primitive object={bust} />
        </group>
      </group>
    </group>
  );
}

/** Flat silhouette card, shown while the 3D bust streams in. */
function SilhouettePlane({ data }: { data: CardDatum }) {
  const texture = useMemo(
    () => makeCardTexture(data.label, data.sub, data.accent),
    [data.label, data.sub, data.accent]
  );
  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[CARD_W * data.scale, CARD_H * data.scale]} />
      <meshStandardMaterial map={texture} roughness={0.65} metalness={0.05} />
    </mesh>
  );
}

function PhotoCard({ data, index, url }: { data: CardDatum; index: number; url: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const backdrop = useMemo(() => makeBackdropTexture(data.label, data.sub), [data.label, data.sub]);
  const w = CARD_W * data.scale;
  const h = CARD_H * data.scale;
  // Stable per-card tilt (deterministic, so renders stay pure).
  const baseRot = useMemo(
    () => ({
      z: (seeded(index * 2 + 1) - 0.5) * 0.22,
      y: (seeded(index * 2 + 2) - 0.5) * 0.4,
    }),
    [index]
  );
  const phase = index * 1.35;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;
    g.position.y = data.y + Math.sin(t * 0.6 + phase) * 0.14;
    g.rotation.z = baseRot.z + Math.sin(t * 0.4 + phase) * 0.05;
    g.rotation.y = baseRot.y + state.pointer.x * 0.08;
  });

  return (
    <group ref={groupRef} position={[data.x, data.y, data.z]}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={backdrop} roughness={0.9} />
      </mesh>
      <Frame w={w} h={h} accent={data.accent} />
      <Suspense fallback={<SilhouettePlane data={data} />}>
        <FramedBust who={data.who} url={url} scale={data.scale} />
      </Suspense>
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    const cam = state.camera;
    cam.position.x += (state.pointer.x * 1.5 - cam.position.x) * 0.05;
    cam.position.y += (-state.pointer.y * 0.9 - cam.position.y) * 0.05;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function pickBustsUrl() {
  // phones / small screens get the lighter set
  const small = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  return small ? BUSTS_URL : BUSTS_HD_URL;
}

function HeroScene() {
  const url = useMemo(() => pickBustsUrl(), []);
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        // Same tone curve as the bust portraits (Blender AgX): natural skin tones.
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.5;
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* warm studio portrait light: key from the upper left, cool fill, golden rim */}
      <hemisphereLight args={['#fbf6ee', '#3a3329', 0.75]} />
      <directionalLight color="#fff6ea" position={[-5, 6, 8]} intensity={1.8} />
      <directionalLight color="#e8eeff" position={[6, 2, 6]} intensity={0.7} />
      <directionalLight color="#ffdca6" position={[2, 5, -6]} intensity={1.2} />
      <directionalLight color="#7a3530" position={[-6, -3, -4]} intensity={0.35} />
      <CameraRig />
      {CARD_DATA.map((d, i) => (
        <PhotoCard key={d.label} data={d} index={i} url={url} />
      ))}
      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.75} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

function HeroFallback() {
  return (
    <div className="hero-fallback">
      {FALLBACK_CARDS.map((c) => (
        <div
          key={c.label}
          className="fallback-card"
          style={{ left: c.left, top: c.top, transform: `rotate(${c.rotate})` }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

let webglCache: boolean | null = null;
function hasWebGLCached() {
  if (webglCache === null) webglCache = hasWebGL();
  return webglCache;
}
const noSubscribe = () => () => {};

export default function Hero() {
  // null on the server; true/false in the browser (no setState inside an effect).
  const webglOK = useSyncExternalStore(noSubscribe, hasWebGLCached, () => null);

  return (
    <section className="section section--ink hero" id="hero" data-navlabel="Cover">
      <div className="hero-stage">
        {webglOK === true && <HeroScene />}
        {webglOK === false && <HeroFallback />}
      </div>
      <div className="hero-copy">
        <div className="eyebrow">An Archive of the Rizal Family</div>
        <h1 className="hero-title">
          Before Rizal,<br />there was a <em>family</em>.
        </h1>
        <p className="hero-sub">
          Eleven children. One hacienda. One revolution. The household that shaped José
          Rizal — Calamba, Laguna, 1848–1951.
        </p>
        <div className="scroll-cue">
          <span>SCROLL TO ENTER THE ARCHIVE</span>
          <span className="line" />
        </div>
      </div>
    </section>
  );
}