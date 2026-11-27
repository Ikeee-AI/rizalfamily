'use client';

import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as RPointerEvent, type RefObject } from 'react';
import { soundStore } from '@/lib/soundStore';
import type { HouseAmbience } from './tahanan/houseAmbience';
import { HOTSPOTS, QUIZ, STOPS, type HotspotId } from './tahanan/tourData';
import type { Mode, Quality } from './tahanan/TahananScene';

// three.js needs the browser — load the scene on the client only, and only when needed.
const TahananScene = dynamic(() => import('./tahanan/TahananScene'), { ssr: false });

const LAST = STOPS.length - 1;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function detectQuality(): Quality {
  // ?quality=low|high overrides detection (handy for testing the phone version on desktop).
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'low' || forced === 'high') return forced;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || mem <= 4 || cores <= 4 ? 'low' : 'high';
}

type Device = { webgl: boolean | null; quality: Quality; touch: boolean; reduced: boolean };
const SERVER_DEVICE: Device = { webgl: null, quality: 'high', touch: false, reduced: false };
let clientDevice: Device | null = null;
function getDevice(): Device {
  if (!clientDevice) {
    clientDevice = {
      webgl: hasWebGL(),
      quality: detectQuality(),
      touch: window.matchMedia('(pointer: coarse)').matches,
      // Visitors who ask for reduced motion get gentle cuts between stops instead of camera flights.
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  }
  return clientDevice;
}
const noSubscribe = () => () => {};

/* --------------------------------------------------------------- Quiz */

function Quiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUIZ.map(() => null));
  const done = answers.every((a) => a !== null);
  const score = answers.filter((a, i) => a === QUIZ[i].answer).length;

  return (
    <div className="th-quiz">
      {QUIZ.map((item, qi) => {
        const chosen = answers[qi];
        return (
          <fieldset key={item.q} className="th-q">
            <legend>
              <span className="th-q-num">{String(qi + 1).padStart(2, '0')}</span> {item.q}
            </legend>
            <div className="th-q-options">
              {item.options.map((opt, oi) => {
                const state =
                  chosen === null ? '' : oi === item.answer ? 'is-right' : oi === chosen ? 'is-wrong' : 'is-dim';
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`th-opt ${state}`}
                    disabled={chosen !== null}
                    onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {chosen !== null && <p className="th-q-explain">{item.explain}</p>}
          </fieldset>
        );
      })}
      {done && (
        <div className="th-score">
          <strong>
            {score} / {QUIZ.length}
          </strong>{' '}
          {score === QUIZ.length ? '— a true historian of Calamba.' : '— scroll back up and look again.'}
          <button type="button" className="th-link" onClick={() => setAnswers(QUIZ.map(() => null))}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Joystick */

function Joystick({ vecRef }: { vecRef: RefObject<{ x: number; y: number }> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const R = 46;

  const update = (e: RPointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y);
    if (d > R) {
      x = (x / d) * R;
      y = (y / d) * R;
    }
    setKnob({ x, y });
    vecRef.current = { x: x / R, y: -y / R };
  };
  const reset = () => {
    setKnob({ x: 0, y: 0 });
    vecRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={base}
      className="th-joy"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e);
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      aria-label="Move"
      role="presentation"
    >
      <div className="th-joy-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

/* ------------------------------------------------------------ Section */

export default function Tahanan() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const joystickRef = useRef({ x: 0, y: 0 });

  const { webgl, quality, touch, reduced } = useSyncExternalStore(noSubscribe, getDevice, () => SERVER_DEVICE);
  const [nearest, setNearest] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mount, setMount] = useState(false); // load the scene once we get close
  const [visible, setVisible] = useState(false); // render only while on screen
  const [ready, setReady] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [stop, setStop] = useState(0);
  const [mode, setMode] = useState<Mode>('tour');
  const [openId, setOpenId] = useState<HotspotId | null>(null);
  const [night, setNight] = useState(false);
  const soundOn = useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.getServer);
  const ambienceRef = useRef<HouseAmbience | null>(null);

  // Scroll → tour progress (0 … number of stops − 1).
  useEffect(() => {
    const section = sectionRef.current;
    const scroller = section?.closest('.scrollframe') as HTMLElement | null;
    if (!section || !scroller) return;

    const onScroll = () => {
      const sr = section.getBoundingClientRect();
      const cr = scroller.getBoundingClientRect();
      const travelled = cr.top - sr.top;
      const span = section.offsetHeight - scroller.clientHeight;
      const t = Math.min(1, Math.max(0, travelled / span));
      const p = t * LAST;
      progressRef.current = p;
      // Scroll-snapping fights the long tour, so pause it while the tour fills the screen.
      scroller.classList.toggle('snap-paused', sr.top < cr.bottom - 2 && sr.bottom > cr.top + 2);
      const near = Math.round(p);
      const s = Math.abs(p - near) < 0.3 ? near : -1;
      setStop((prev) => (prev === s ? prev : s));
      setNearest((prev) => (prev === near ? prev : near));
    };
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMount(true);
      },
      { root: scroller, rootMargin: '120% 0px 120% 0px' }
    );
    io.observe(section);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      scroller.classList.remove('snap-paused');
      io.disconnect();
    };
  }, []);

  // Lock page scrolling while exploring.
  useEffect(() => {
    const scroller = sectionRef.current?.closest('.scrollframe') as HTMLElement | null;
    if (!scroller) return;
    scroller.style.overflowY = mode === 'explore' ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openId) setOpenId(null);
        else if (mode === 'explore') setMode('tour');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      scroller.style.overflowY = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mode, openId]);

  // House ambience plays while the global sound is on and the tour is on screen.
  const exploringNow = mode === 'explore';
  useEffect(() => {
    const active = soundOn && (visible || exploringNow);
    if (!active) {
      ambienceRef.current?.pause();
      return;
    }
    let cancelled = false;
    void (async () => {
      if (!ambienceRef.current) {
        const { HouseAmbience } = await import('./tahanan/houseAmbience');
        if (cancelled) return;
        ambienceRef.current = new HouseAmbience();
      }
      ambienceRef.current.setNight(night);
      ambienceRef.current.start();
    })();
    return () => {
      cancelled = true;
    };
  }, [soundOn, visible, exploringNow, night]);

  useEffect(
    () => () => {
      ambienceRef.current?.dispose();
      ambienceRef.current = null;
    },
    []
  );

  // Story cards: move focus into the card, and back to where it was when it closes.
  useEffect(() => {
    if (!openId) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, [openId]);

  const onHotspot = useCallback((id: HotspotId) => setOpenId(id), []);
  const onReady = useCallback(() => setReady(true), []);
  const onProgress = useCallback((p: number) => setLoadPct(Math.round(p)), []);

  function readMore(id: string) {
    setOpenId(null);
    setMode('tour');
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  }

  function jumpTo(i: number) {
    const section = sectionRef.current;
    const scroller = section?.closest('.scrollframe') as HTMLElement | null;
    if (!section || !scroller) return;
    const span = section.offsetHeight - scroller.clientHeight;
    const sectionTop = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top: sectionTop + (i / LAST) * span, behavior: 'smooth' });
  }

  const current = stop >= 0 ? STOPS[stop] : null;
  const open = openId ? HOTSPOTS[openId] : null;
  const exploring = mode === 'explore';

  return (
    <section
      ref={sectionRef}
      className="section tahanan"
      id="tahanan"
      data-navlabel="The House"
      style={{ height: `${STOPS.length * 110}vh` }}
      aria-label="Ang Tahanan — an interactive 3D tour of the Rizal family home"
    >
      <div className={`th-stage${exploring ? ' th-stage--explore' : ''}`}>
        {webgl === false && (
          <div className="th-fallback">
            <div className="eyebrow">Ang Tahanan</div>
            <p className="body-text">
              This 3D tour needs WebGL, which your browser doesn&apos;t support. The rest of the
              archive works as normal — keep scrolling.
            </p>
          </div>
        )}

        {webgl && mount && (
          <TahananScene
            progressRef={progressRef}
            joystickRef={joystickRef}
            mode={mode}
            activeStop={stop}
            quality={quality}
            running={visible || exploring}
            night={night}
            reducedMotion={reduced}
            onHotspot={onHotspot}
            onReady={onReady}
            onProgress={onProgress}
          />
        )}

        {/* Reduced motion: a soft fade instead of a camera flight. */}
        {reduced && ready && !exploring && <div className="th-cut" key={nearest} aria-hidden />}

        {/* Screen readers: what the current view shows. */}
        {ready && !exploring && (
          <p className="th-sr" aria-live="polite">
            {STOPS[nearest]?.title}. {STOPS[nearest]?.alt}
          </p>
        )}

        {/* Keyboard & screen-reader access to every story, not just the ones on screen. */}
        {ready && (
          <nav className="th-stories" aria-label="Stories in this house">
            <span className="th-stories-title">Stories in this house</span>
            <ul>
              {(Object.keys(HOTSPOTS) as HotspotId[]).map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => setOpenId(id)}>
                    {HOTSPOTS[id].label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {webgl && !ready && (
          <div className="th-loading" role="status">
            <div className="loading-text">Building the house… {loadPct}%</div>
            <div className="th-loading-bar">
              <div style={{ width: `${loadPct}%` }} />
            </div>
          </div>
        )}

        {ready && (
          <button
            type="button"
            className={`th-time${exploring ? ' th-time--explore' : ''}`}
            onClick={() => setNight((n) => !n)}
            aria-pressed={night}
            aria-label={night ? 'Switch to daytime' : 'Switch to evening'}
          >
            <span aria-hidden>{night ? '☾' : '☀'}</span> {night ? 'Evening' : 'Day'}
          </button>
        )}

        {/* Tour UI */}
        {!exploring && ready && (
          <>
            <ol className="th-steps" aria-label="Tour stops">
              {STOPS.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    className={i === stop ? 'active' : ''}
                    onClick={() => jumpTo(i)}
                    aria-label={`Go to: ${s.title}`}
                  >
                    <span className="tip">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>

            {current && current.key !== 'finale' && (
              <div className="th-card" key={current.key}>
                <div className="m-eyebrow">{current.eyebrow}</div>
                <h3>{current.title}</h3>
                <p>{current.text}</p>
                {current.hotspot && (
                  <button type="button" className="th-btn" onClick={() => setOpenId(current.hotspot!)}>
                    Look closer: {HOTSPOTS[current.hotspot].label}
                  </button>
                )}
                {stop === 0 && <div className="th-hint">Scroll to move · click glowing markers</div>}
              </div>
            )}

            {current?.key === 'finale' && (
              <div className="th-finale">
                <div className="m-eyebrow">{current.eyebrow}</div>
                <h3>{current.title}</h3>
                <p>{current.text}</p>
                <button type="button" className="th-btn th-btn--primary" onClick={() => setMode('explore')}>
                  Explore freely →
                </button>
                <Quiz />
              </div>
            )}

            {current?.key !== 'finale' && (
              <button type="button" className="th-explore-chip" onClick={() => setMode('explore')}>
                Explore freely
              </button>
            )}
          </>
        )}

        {/* Explore UI */}
        {exploring && (
          <>
            <button type="button" className="th-exit" onClick={() => setMode('tour')}>
              ✕ Back to the tour
            </button>
            <div className="th-help">
              {touch
                ? 'Left stick to walk · drag to look · tap objects to learn more'
                : 'W A S D to walk · Shift to run · drag to look · click objects · Esc to exit'}
            </div>
            {touch && <Joystick vecRef={joystickRef} />}
          </>
        )}

        {open && (
          <div className="tree-modal-backdrop" onClick={() => setOpenId(null)} role="presentation">
            <div
              className="tree-modal th-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="th-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button ref={closeRef} type="button" className="close-btn" onClick={() => setOpenId(null)}>
                Close
              </button>
              <div className="m-eyebrow">{open.eyebrow}</div>
              <h3 id="th-modal-title">{open.title}</h3>
              {open.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              {open.readMore && (
                <button type="button" className="th-link" onClick={() => readMore(open.readMore!.id)}>
                  {open.readMore.label} →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
