'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { BustWho } from './bust/BustScene';

// three.js needs the browser: load the bust scene on the client, and only near the viewport.
const BustScene = dynamic(() => import('./bust/BustScene'), { ssr: false });

type Env = { webgl: boolean; reduced: boolean } | null;
let env: Env = null;
function getEnv(): Env {
  if (!env) {
    let webgl = false;
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webgl = false;
    }
    env = { webgl, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
  }
  return env;
}
const noSubscribe = () => () => {};

/**
 * A realistic 3D bust inside a portrait frame. Shows `children` (the flat
 * silhouette) until the model is ready, or for good if WebGL isn't available.
 */
export default function Bust3D({ who, name, children }: { who: BustWho; name: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const device = useSyncExternalStore(noSubscribe, getEnv, () => null);
  const [near, setNear] = useState(false); // mount the scene when close to the viewport
  const [visible, setVisible] = useState(false); // animate only while on screen
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = el.closest('.scrollframe');
    const nearIo = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      root,
      rootMargin: '150% 0px 150% 0px',
    });
    const seenIo = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { root });
    nearIo.observe(el);
    seenIo.observe(el);
    return () => {
      nearIo.disconnect();
      seenIo.disconnect();
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const live = !!device?.webgl && near;

  return (
    <div
      ref={ref}
      className={`bust3d${live && ready ? ' bust3d--ready' : ''}`}
      role="img"
      aria-label={`${name}: a 3D portrait reconstruction${live ? '. Drag to turn it.' : '.'}`}
    >
      <div className="bust3d-fallback" aria-hidden>
        {children}
      </div>
      {live && (
        <BustScene who={who} reducedMotion={device.reduced} running={visible} onReady={onReady} />
      )}
    </div>
  );
}
