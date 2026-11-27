'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, Sky, Stars, useGLTF, useProgress } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import {
  EXPLORE_BOUNDS,
  EXPLORE_SPAWN,
  HOTSPOTS,
  STOPS,
  b2t,
  type HotspotId,
  type Vec3,
} from './tourData';
import Figures, { FIGURE_MESHES } from './Figures';

// Fast raycasting (hotspot picking + walking collisions) via bounding-volume hierarchies.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const MODEL_URL = { high: '/models/rizal-house.glb', low: '/models/rizal-house-mobile.glb' };

export type Quality = 'high' | 'low';
export type Mode = 'tour' | 'explore';

export type SceneProps = {
  progressRef: RefObject<number>;
  joystickRef: RefObject<{ x: number; y: number }>;
  mode: Mode;
  activeStop: number;
  quality: Quality;
  running: boolean;
  night: boolean;
  reducedMotion: boolean;
  onHotspot: (id: HotspotId) => void;
  onReady: () => void;
  onProgress: (pct: number) => void;
};

type World = {
  colliders: THREE.Object3D[];
  pickables: THREE.Object3D[];
  ownerOf: (o: THREE.Object3D) => HotspotId | null;
  capiz: THREE.MeshStandardMaterial[];
};

const v3 = (p: Vec3) => new THREE.Vector3(...b2t(p));

// Names that should never block walking (vegetation, fields, distant scenery).
const NON_COLLIDER = /^(Palm|Tree_|FarTree|Field_|Mt_Makiling|Far_Terrain|Hotspot_Moth|anthurium|fern)/i;
const NON_COLLIDER_MAT = /(palm_|_imp_|cane_|rice_|anthurium|fern)/i;
const FAR = /^(Far_Terrain|Mt_Makiling|FarTree)/;

const NODE_TO_HOTSPOT = new Map<string, HotspotId>();
for (const h of Object.values(HOTSPOTS)) for (const n of h.nodes) NODE_TO_HOTSPOT.set(n, h.id);

function ancestorNames(o: THREE.Object3D) {
  const names: string[] = [];
  let cur: THREE.Object3D | null = o;
  while (cur) {
    if (cur.name) names.push(cur.name);
    cur = cur.parent;
  }
  return names;
}

/* ------------------------------------------------------------------ House */

function House({
  worldRef,
  quality,
  onReady,
}: {
  worldRef: RefObject<World | null>;
  quality: Quality;
  onReady: () => void;
}) {
  const gltf = useGLTF(MODEL_URL[quality], false, true);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const root = gltf.scene;
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const colliders: THREE.Object3D[] = [];
    const pickables: THREE.Object3D[] = [];
    const capiz = new Set<THREE.MeshStandardMaterial>();
    const houseCentre = new THREE.Vector3(...b2t([7, 5, 0]));
    const tmp = new THREE.Vector3();
    const shadows = quality === 'high';

    root.updateMatrixWorld(true);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const names = ancestorNames(mesh);
      const top = names[names.length - 2] ?? mesh.name; // child of the scene root
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
      const matNames = mats.map((m) => m.name).join(' ');

      for (const m of mats) {
        if (m.map) m.map.anisotropy = maxAniso;
        if (m.name === 'capiz') {
          // Capiz shell: luminous, pearly — skip costly real transmission.
          const pm = m as THREE.MeshPhysicalMaterial;
          pm.transmission = 0;
          pm.emissive = new THREE.Color('#fff1d6');
          pm.emissiveIntensity = 0.55;
          pm.roughness = 0.4;
          capiz.add(pm);
        }
        if (m.name.includes('_imp_')) {
          m.alphaTest = 0.5;
          m.transparent = false;
          m.side = THREE.DoubleSide;
        }
        if (/palm_frond|palm_rachis|cane_leaf|rice_green/.test(m.name)) m.side = THREE.DoubleSide;
        if (m.name === 'vintage_oil_lamp_flame') {
          m.emissive = new THREE.Color('#ffb04a');
          m.emissiveIntensity = 6;
          m.toneMapped = false;
        }
        if (m.name === 'paddy_water') {
          m.roughness = 0.05;
          m.metalness = 0.3;
        }
      }

      const far = FAR.test(top) || names.some((n) => FAR.test(n));
      mesh.getWorldPosition(tmp);
      const near = tmp.distanceTo(houseCentre) < 45 || (mesh as THREE.InstancedMesh).isInstancedMesh;
      mesh.castShadow = shadows && !far && near && !/^(Ground|Street|Path_|Int_Floor|Int_Ceiling)/.test(top);
      mesh.receiveShadow = shadows && !far;

      const isInstanced = (mesh as THREE.InstancedMesh).isInstancedMesh;
      const hotspot = names.some((n) => NODE_TO_HOTSPOT.has(n));
      const collider =
        !far &&
        !names.some((n) => NON_COLLIDER.test(n)) &&
        !NON_COLLIDER_MAT.test(matNames) &&
        !(isInstanced && /palm_|_imp_/.test(matNames));

      if (collider || hotspot) {
        if (!mesh.geometry.boundsTree) mesh.geometry.computeBoundsTree();
      }
      if (collider) colliders.push(mesh);
      if (collider || hotspot) pickables.push(mesh);
    });

    worldRef.current = {
      colliders,
      pickables,
      capiz: [...capiz],
      ownerOf: (o) => {
        for (const n of ancestorNames(o)) {
          const id = NODE_TO_HOTSPOT.get(n);
          if (id) return id;
        }
        return null;
      },
    };
    onReady();
  }, [gltf, gl, quality, worldRef, onReady]);

  return <primitive object={gltf.scene} />;
}

/* ------------------------------------------------------------- Lighting */

const SUN_DIR = new THREE.Vector3(...b2t([30, -26, 34])).normalize();

// Day ↔ evening palette. Each pair is [day, evening].
const NIGHT_BELOW = new THREE.Vector3(...b2t([30, -26, -6])).normalize();
const C = (hex: string) => new THREE.Color(hex);
const PAL = {
  fog: [C('#c9d4d2'), C('#1a2131')],
  hemiSky: [C('#cfe0ee'), C('#31446b')],
  hemiGround: [C('#5d5235'), C('#15110b')],
  sun: [C('#ffe2b8'), C('#9fb4d8')],
  fill: [C('#ffe6c4'), C('#ff9d4d')],
  capiz: [C('#fff1d6'), C('#ffb15e')],
};
const mix = (out: THREE.Color, pair: THREE.Color[], t: number) => out.lerpColors(pair[0], pair[1], t);
const lerp = THREE.MathUtils.lerp;
const SKY_TMP = new THREE.Vector3();

function applyCapiz(capiz: THREE.MeshStandardMaterial[], t: number) {
  for (const m of capiz) {
    mix(m.emissive, PAL.capiz, t);
    m.emissiveIntensity = lerp(0.55, 1.6, t);
    m.userData.mood = t;
  }
}

function applyFills(group: THREE.Group, t: number) {
  for (const child of group.children) {
    const f = child as THREE.PointLight;
    const day = f.userData.day as number;
    f.intensity = lerp(day, day * 0.32, t);
    mix(f.color, PAL.fill, t);
  }
}

function Lighting({
  quality,
  night,
  worldRef,
}: {
  quality: Quality;
  night: boolean;
  worldRef: RefObject<World | null>;
}) {
  const lamp = useRef<THREE.PointLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fog = useRef<THREE.FogExp2>(null);
  const sky = useRef<THREE.Mesh>(null);
  const fills = useRef<THREE.Group>(null);
  const mood = useRef<number | null>(null);
  const centre = useMemo(() => new THREE.Vector3(...b2t([7, 5, 0])), []);

  useEffect(() => {
    const s = sun.current;
    if (!s) return;
    s.target.position.copy(centre);
    s.target.updateMatrixWorld();
  }, [centre]);

  useFrame((state, dt) => {
    const goal = night ? 1 : 0;
    const prev = mood.current;
    const t = prev === null ? goal : THREE.MathUtils.damp(prev, goal, 2.2, Math.min(dt, 0.1));
    mood.current = t;
    const time = state.clock.getElapsedTime();

    // The oil lamp always flickers, and becomes the main light of the room in the evening.
    const l = lamp.current;
    if (l) {
      const flicker = Math.sin(time * 9.1) * 0.35 + Math.sin(time * 23.7) * 0.2;
      l.intensity = lerp(3.2, 9, t) + flicker * lerp(1, 2.2, t);
      l.distance = lerp(5, 10, t);
    }
    const capiz = worldRef.current?.capiz ?? [];
    const settled = prev !== null && Math.abs(prev - t) < 1e-4;
    if (settled && capiz[0]?.userData.mood === t) return;

    if (sun.current) {
      sun.current.intensity = lerp(2.6, 0.32, t);
      mix(sun.current.color, PAL.sun, t);
    }
    if (hemi.current) {
      hemi.current.intensity = lerp(0.85, 0.32, t);
      mix(hemi.current.color, PAL.hemiSky, t);
      mix(hemi.current.groundColor, PAL.hemiGround, t);
    }
    if (fog.current) mix(fog.current.color, PAL.fog, t);
    if (fills.current) applyFills(fills.current, t);
    const skyMat = sky.current?.material as THREE.ShaderMaterial | undefined;
    if (skyMat?.uniforms?.sunPosition) {
      SKY_TMP.copy(SUN_DIR).lerp(NIGHT_BELOW, t).normalize();
      skyMat.uniforms.sunPosition.value.copy(SKY_TMP);
      skyMat.uniforms.rayleigh.value = lerp(1.4, 0.5, t);
    }
    state.scene.environmentIntensity = lerp(1, 0.18, t);
    applyCapiz(capiz, t);
  });

  const sunPos = centre.clone().addScaledVector(SUN_DIR, 60);
  const high = quality === 'high';

  return (
    <>
      <Sky
        ref={sky as never}
        distance={4500}
        sunPosition={SUN_DIR.toArray()}
        turbidity={7}
        rayleigh={1.4}
        mieCoefficient={0.006}
        mieDirectionalG={0.85}
      />
      {night && <Stars radius={900} depth={200} count={2500} factor={18} saturation={0} fade speed={0.3} />}
      <fogExp2 ref={fog} attach="fog" args={['#c9d4d2', 0.00085]} />
      <hemisphereLight ref={hemi} args={['#cfe0ee', '#5d5235', 0.85]} />
      <directionalLight
        ref={sun}
        position={sunPos.toArray()}
        color="#ffe2b8"
        intensity={2.6}
        castShadow={high}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {/* Interior fill — the roof shadows the rooms, so they get their own light.
          In the evening these dim to a warm, lamplit glow. */}
      <group ref={fills}>
        <pointLight userData={{ day: 14 }} position={b2t([7, 3, 6.0])} intensity={14} distance={11} color="#ffe6c4" />
        <pointLight userData={{ day: 10 }} position={b2t([3.5, 8.3, 6.0])} intensity={10} distance={8} color="#ffe2bd" />
        {high && (
          <pointLight userData={{ day: 9 }} position={b2t([10.8, 8.4, 6.0])} intensity={9} distance={8} color="#ffe2bd" />
        )}
        <pointLight userData={{ day: 12 }} position={b2t([7, 5, 2.8])} intensity={12} distance={12} color="#ffd9a8" />
      </group>
      <pointLight ref={lamp} position={b2t([2.0, 1.6, 4.5])} intensity={3.2} distance={5} color="#ffa64d" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#cfe0ee" position={[0, 20, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffd9a6" position={SUN_DIR.clone().multiplyScalar(30).toArray()} scale={[30, 12, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#6f6a48" position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[60, 60, 1]} />
      </Environment>
    </>
  );
}

/* --------------------------------------------------------------- Tour rig */

type Seg = { pts: THREE.Vector3[]; cum: number[]; len: number };

const STOP_POS = STOPS.map((s) => v3(s.pos));
const STOP_TGT = STOPS.map((s) => v3(s.target));
const SEGS: Seg[] = STOPS.slice(0, -1).map((s, i) => {
  const pts = [STOP_POS[i], ...(s.via ?? []).map(v3), STOP_POS[i + 1]];
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1]));
  return { pts, cum, len: cum[cum.length - 1] };
});

function pointOnSeg(seg: Seg, u: number, out: THREE.Vector3) {
  const d = THREE.MathUtils.clamp(u, 0, 1) * seg.len;
  let k = 1;
  while (k < seg.cum.length - 1 && seg.cum[k] < d) k++;
  const a = seg.cum[k - 1];
  const span = seg.cum[k] - a || 1;
  return out.lerpVectors(seg.pts[k - 1], seg.pts[k], (d - a) / span);
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Scratch objects reused every frame (one scene instance at a time).
const TOUR_TMP = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), ahead: new THREE.Vector3(), look: new THREE.Vector3() };
const WALK_TMP = { o: new THREE.Vector3(), d: new THREE.Vector3(), move: new THREE.Vector3(), down: new THREE.Vector3(0, -1, 0) };
const WALK_RAY = new THREE.Raycaster();
WALK_RAY.firstHitOnly = true;
const PICK_RAY = new THREE.Raycaster();
PICK_RAY.firstHitOnly = true;

function TourRig({ progressRef, reducedMotion }: { progressRef: RefObject<number>; reducedMotion: boolean }) {
  const smooth = useRef<number | null>(null);

  useFrame((state, dt) => {
    const tmp = TOUR_TMP;
    const camera = state.camera;
    const goal = progressRef.current ?? 0;
    // Reduced motion: cut straight to the nearest stop (the page fades over the cut).
    smooth.current = reducedMotion
      ? Math.round(goal)
      : smooth.current === null
        ? goal
        : THREE.MathUtils.damp(smooth.current, goal, 3.2, Math.min(dt, 0.1));
    const p = THREE.MathUtils.clamp(smooth.current, 0, STOPS.length - 1);
    const i = Math.min(Math.floor(p), STOPS.length - 2);
    const e = smoothstep(0.12, 0.88, p - i);
    const seg = SEGS[i];

    pointOnSeg(seg, e, tmp.pos);
    tmp.tgt.lerpVectors(STOP_TGT[i], STOP_TGT[i + 1], e);

    // While travelling through doors/stairs, look where we are going.
    const travel = Math.sin(Math.PI * e) * (seg.pts.length > 2 ? 0.85 : 0.3);
    if (travel > 0.001 && e < 0.98) {
      pointOnSeg(seg, Math.min(1, e + 0.1), tmp.ahead);
      tmp.ahead.sub(tmp.pos);
      if (tmp.ahead.lengthSq() > 1e-6) {
        tmp.ahead.normalize().multiplyScalar(6).add(tmp.pos);
        tmp.tgt.lerp(tmp.ahead, travel);
      }
    }

    // Gentle parallax from the pointer when resting at a stop.
    const rest = 1 - Math.sin(Math.PI * e);
    tmp.look.copy(tmp.tgt);
    const sway = reducedMotion ? 0 : rest;
    tmp.look.x += state.pointer.x * 0.35 * sway;
    tmp.look.y += state.pointer.y * 0.2 * sway;

    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.look);
  });
  return null;
}

/* ------------------------------------------------------------ Explore rig */

const EYE = 1.62;

function ExploreRig({
  worldRef,
  joystickRef,
}: {
  worldRef: RefObject<World | null>;
  joystickRef: RefObject<{ x: number; y: number }>;
}) {
  const gl = useThree((s) => s.gl);
  const st = useRef({
    feet: new THREE.Vector3(...b2t(EXPLORE_SPAWN.pos)),
    yaw: EXPLORE_SPAWN.yaw,
    pitch: 0,
    keys: new Set<string>(),
    drag: null as null | { x: number; y: number },
  });
  useEffect(() => {
    const s = st.current;
    const el = gl.domElement;
    const keyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        s.keys.add(k);
        if (k.startsWith('arrow')) e.preventDefault();
      }
    };
    const keyUp = (e: KeyboardEvent) => s.keys.delete(e.key.toLowerCase());
    const down = (e: PointerEvent) => {
      s.drag = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const dx = e.clientX - s.drag.x;
      const dy = e.clientY - s.drag.y;
      s.drag = { x: e.clientX, y: e.clientY };
      const k = e.pointerType === 'touch' ? 0.006 : 0.004;
      s.yaw -= dx * k;
      s.pitch = THREE.MathUtils.clamp(s.pitch - dy * k, -1.2, 1.2);
    };
    const up = () => {
      s.drag = null;
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      s.keys.clear();
    };
  }, [gl]);

  useFrame((state, rawDt) => {
    const ray = WALK_RAY;
    const tmp = WALK_TMP;
    const camera = state.camera;
    const dt = Math.min(rawDt, 0.05);
    const s = st.current;
    const world = worldRef.current;
    const k = s.keys;

    let fwd = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    let strafe = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
    if (k.has('arrowleft')) s.yaw += 1.8 * dt;
    if (k.has('arrowright')) s.yaw -= 1.8 * dt;
    const joy = joystickRef.current;
    if (joy && (Math.abs(joy.x) > 0.05 || Math.abs(joy.y) > 0.05)) {
      fwd = joy.y;
      strafe = joy.x;
    }

    const speed = k.has('shift') ? 4.2 : 2.1;
    const sin = Math.sin(s.yaw);
    const cos = Math.cos(s.yaw);
    tmp.move.set(-sin * fwd + cos * strafe, 0, -cos * fwd - sin * strafe);
    if (tmp.move.lengthSq() > 1) tmp.move.normalize();
    tmp.move.multiplyScalar(speed * dt);

    const blocked = (dx: number, dz: number) => {
      if (!world) return false;
      const len = Math.hypot(dx, dz);
      if (len < 1e-5) return false;
      tmp.d.set(dx / len, 0, dz / len);
      for (const h of [0.6, 1.3]) {
        tmp.o.set(s.feet.x, s.feet.y + h, s.feet.z);
        ray.set(tmp.o, tmp.d);
        ray.far = len + 0.32;
        if (ray.intersectObjects(world.colliders, false).length) return true;
      }
      return false;
    };

    // Move with wall sliding.
    if (!blocked(tmp.move.x, tmp.move.z)) {
      s.feet.x += tmp.move.x;
      s.feet.z += tmp.move.z;
    } else if (!blocked(tmp.move.x, 0)) {
      s.feet.x += tmp.move.x;
    } else if (!blocked(0, tmp.move.z)) {
      s.feet.z += tmp.move.z;
    }

    const b = EXPLORE_BOUNDS;
    s.feet.x = THREE.MathUtils.clamp(s.feet.x, b.minX, b.maxX);
    s.feet.z = THREE.MathUtils.clamp(s.feet.z, -b.maxY, -b.minY);

    // Follow the floor (handles stairs).
    if (world) {
      tmp.o.set(s.feet.x, s.feet.y + 0.6, s.feet.z);
      ray.set(tmp.o, tmp.down);
      ray.far = 8;
      const hit = ray.intersectObjects(world.colliders, false)[0];
      if (hit) s.feet.y = THREE.MathUtils.damp(s.feet.y, hit.point.y, 14, dt);
      else s.feet.y = Math.max(0, s.feet.y - 6 * dt);
    }

    camera.position.set(s.feet.x, s.feet.y + EYE, s.feet.z);
    camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ');
  });
  return null;
}

/* ---------------------------------------------------- Picking + markers */

function Picker({
  worldRef,
  onHotspot,
}: {
  worldRef: RefObject<World | null>;
  onHotspot: (id: HotspotId) => void;
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const ray = PICK_RAY;
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;
    let pending = false;
    let last: PointerEvent | null = null;

    const pick = (e: PointerEvent): HotspotId | null => {
      const world = worldRef.current;
      if (!world) return null;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      ray.far = 60;
      const hit = ray.intersectObjects(world.pickables.concat(FIGURE_MESHES), false)[0];
      return hit ? world.ownerOf(hit.object) : null;
    };

    const onDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      downAt = null;
      if (moved > 6) return;
      const id = pick(e);
      if (id) onHotspot(id);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (last) el.style.cursor = pick(last) ? 'pointer' : '';
      });
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointermove', onMove);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointermove', onMove);
      el.style.cursor = '';
    };
  }, [gl, camera, worldRef, onHotspot]);

  return null;
}

const SEE_RAY = new THREE.Raycaster();
SEE_RAY.firstHitOnly = true;
const SEE_TMP = { d: new THREE.Vector3() };
// How close you must be to see a marker while exploring (metres).
const MARKER_RANGE: Partial<Record<HotspotId, number>> = { fields: 60, gate: 16 };

function Marker({
  id,
  checkSight,
  worldRef,
  onHotspot,
}: {
  id: HotspotId;
  checkSight: boolean;
  worldRef: RefObject<World | null>;
  onHotspot: (id: HotspotId) => void;
}) {
  const h = HOTSPOTS[id];
  const btn = useRef<HTMLButtonElement>(null);
  const pos = useMemo(() => new THREE.Vector3(...b2t(h.marker)), [h]);
  const tick = useRef(0);

  // While exploring, only show markers that are near and not behind a wall.
  useFrame((state) => {
    const el = btn.current;
    if (!el) return;
    if (!checkSight) {
      if (el.dataset.hidden !== undefined) {
        delete el.dataset.hidden;
        el.tabIndex = 0;
        el.removeAttribute('aria-hidden');
      }
      return;
    }
    if (tick.current++ % 8) return;
    const cam = state.camera.position;
    const dist = cam.distanceTo(pos);
    let visible = dist < (MARKER_RANGE[id] ?? 9);
    const world = worldRef.current;
    if (visible && world) {
      SEE_TMP.d.subVectors(pos, cam).normalize();
      SEE_RAY.set(cam, SEE_TMP.d);
      SEE_RAY.far = Math.max(0, dist - 0.6);
      const hit = SEE_RAY.intersectObjects(world.colliders, false)[0];
      if (hit && world.ownerOf(hit.object) !== id) visible = false;
    }
    if (visible) {
      delete el.dataset.hidden;
      el.tabIndex = 0;
      el.removeAttribute('aria-hidden');
    } else {
      el.dataset.hidden = '';
      el.tabIndex = -1; // hidden markers drop out of the keyboard tab order
      el.setAttribute('aria-hidden', 'true');
    }
  });

  return (
    <Html position={pos} center zIndexRange={[40, 0]}>
      <button ref={btn} type="button" className="th-marker" onClick={() => onHotspot(id)}>
        <span className="th-marker-dot" aria-hidden />
        <span className="th-marker-label">{h.label}</span>
      </button>
    </Html>
  );
}

function Markers({
  ids,
  checkSight,
  worldRef,
  onHotspot,
}: {
  ids: HotspotId[];
  checkSight: boolean;
  worldRef: RefObject<World | null>;
  onHotspot: (id: HotspotId) => void;
}) {
  return (
    <>
      {ids.map((id) => (
        <Marker key={id} id={id} checkSight={checkSight} worldRef={worldRef} onHotspot={onHotspot} />
      ))}
    </>
  );
}

function ProgressReporter({ onProgress }: { onProgress: (pct: number) => void }) {
  const progress = useProgress((s) => s.progress);
  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);
  return null;
}

/* ------------------------------------------------------------------ Root */

export default function TahananScene(props: SceneProps) {
  const { mode, activeStop, quality, running, night, reducedMotion, progressRef, joystickRef, onHotspot, onReady, onProgress } =
    props;
  const worldRef = useRef<World | null>(null);
  const high = quality === 'high';

  const markerIds: HotspotId[] =
    mode === 'explore'
      ? (Object.keys(HOTSPOTS) as HotspotId[])
      : activeStop >= 0 && STOPS[activeStop]?.hotspot
        ? [STOPS[activeStop].hotspot as HotspotId]
        : [];

  return (
    <Canvas
      shadows={high ? 'soft' : false}
      dpr={high ? [1, 1.75] : [1, 1.25]}
      frameloop={running ? 'always' : 'never'}
      camera={{ fov: 55, near: 0.05, far: 5000, position: b2t(STOPS[0].pos) }}
      gl={{ antialias: !high, powerPreference: 'high-performance', toneMapping: THREE.AgXToneMapping }}
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    >
      <ProgressReporter onProgress={onProgress} />
      <Lighting quality={quality} night={night} worldRef={worldRef} />
      <Suspense fallback={null}>
        <House worldRef={worldRef} quality={quality} onReady={onReady} />
      </Suspense>
      <Suspense fallback={null}>
        <Figures quality={quality} />
      </Suspense>
      {mode === 'tour' ? (
        <TourRig progressRef={progressRef} reducedMotion={reducedMotion} />
      ) : (
        <ExploreRig worldRef={worldRef} joystickRef={joystickRef} />
      )}
      <Picker worldRef={worldRef} onHotspot={onHotspot} />
      <Markers ids={markerIds} checkSight={mode === 'explore'} worldRef={worldRef} onHotspot={onHotspot} />
      {high && (
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.55} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette offset={0.25} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.AGX} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
