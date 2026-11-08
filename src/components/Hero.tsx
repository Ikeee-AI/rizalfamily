'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type CardDatum = {
  label: string;
  sub: string;
  x: number;
  y: number;
  z: number;
  accent: string;
  scale: number;
};

const CARD_DATA: CardDatum[] = [
  { label: 'FRANCISCO', sub: '1818–1898', x: -4.1, y: 1.5, z: -1.0, accent: '#B9873C', scale: 1 },
  { label: 'TEODORA', sub: '1826–1911', x: 3.6, y: 2.0, z: 0.4, accent: '#B9873C', scale: 1 },
  { label: 'PACIANO', sub: '1851–1930', x: -3.3, y: -1.7, z: 1.1, accent: '#B9873C', scale: 1 },
  { label: 'TRINIDAD', sub: '1868–1951', x: 3.9, y: -1.6, z: -0.7, accent: '#B9873C', scale: 1 },
  { label: 'JOSÉ', sub: '1861–1896', x: 0, y: 0.2, z: 2.1, accent: '#7A3530', scale: 1.22 },
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

function PhotoCard({ data, index }: { data: CardDatum; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(
    () => makeCardTexture(data.label, data.sub, data.accent),
    [data.label, data.sub, data.accent]
  );
  const baseRot = useMemo(
    () => ({
      z: (Math.random() - 0.5) * 0.22,
      y: (Math.random() - 0.5) * 0.4,
    }),
    []
  );
  const phase = index * 1.35;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.y = data.y + Math.sin(t * 0.6 + phase) * 0.14;
    mesh.rotation.z = baseRot.z + Math.sin(t * 0.4 + phase) * 0.05;
    mesh.rotation.y = baseRot.y + state.pointer.x * 0.08;
  });

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]}>
      <planeGeometry args={[2.05 * data.scale, 2.63 * data.scale]} />
      <meshStandardMaterial
        map={texture}
        transparent
        roughness={0.65}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
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

function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight color="#e0b267" position={[5, 6, 8]} intensity={0.9} />
      <directionalLight color="#7a3530" position={[-6, -3, -4]} intensity={0.35} />
      <CameraRig />
      {CARD_DATA.map((d, i) => (
        <PhotoCard key={d.label} data={d} index={i} />
      ))}
      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur />
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

export default function Hero() {
  const [webglOK, setWebglOK] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOK(hasWebGL());
  }, []);

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