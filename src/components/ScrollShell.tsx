'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import AmbientHum from './AmbientHum';

type NavItem = { id: string; label: string };

export default function ScrollShell({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef('');
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    function done() {
      setLoading(false);
    }
    if (document.readyState === 'complete') {
      done();
    } else {
      window.addEventListener('load', done);
    }
    const failSafe = setTimeout(done, 2500);
    return () => {
      window.removeEventListener('load', done);
      clearTimeout(failSafe);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>('.section[data-navlabel]')
    );
    const items = sections.map((s) => ({ id: s.id, label: s.dataset.navlabel || '' }));
    setNavItems(items);
    if (items.length > 0) {
      activeIdRef.current = items[0].id;
      setActiveId(items[0].id);
    }

    const revealTargets = container.querySelectorAll<HTMLElement>('.section-inner');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.22 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeIdRef.current = entry.target.id;
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach((s) => navObserver.observe(s));

    function onScroll() {
      if (!container) return;
      const max = container.scrollHeight - container.clientHeight;
      setProgress(max > 0 ? (container.scrollTop / max) * 100 : 0);
    }
    container.addEventListener('scroll', onScroll);

    function onKey(e: KeyboardEvent) {
      if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(e.key)) return;
      e.preventDefault();
      const idx = sections.findIndex((s) => s.id === activeIdRef.current);
      let nextIdx = idx;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        nextIdx = Math.min(idx + 1, sections.length - 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        nextIdx = Math.max(idx - 1, 0);
      }
      sections[nextIdx]?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    document.addEventListener('keydown', onKey);

    return () => {
      revealObserver.disconnect();
      navObserver.disconnect();
      container.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <div className={`loading-screen${loading ? '' : ' hidden'}`} aria-hidden={!loading}>
        <div className="loading-text">Opening the Archive…</div>
      </div>

      <div className="progress-rail">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        className="toc-toggle"
        onClick={() => setTocOpen((v) => !v)}
        aria-expanded={tocOpen}
        aria-label="Toggle table of contents"
      >
        ☰
      </button>
      {tocOpen && (
        <div className="toc-panel">
          <div className="toc-title">Contents</div>
          {navItems.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                goTo(item.id);
                setTocOpen(false);
              }}
            >
              <span className="toc-num">{String(i).padStart(2, '0')}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <AmbientHum />

      <nav className="dotnav" aria-label="Section navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeId ? 'active' : ''}
            aria-label={`Go to ${item.label}`}
            onClick={() => goTo(item.id)}
          >
            <span className="tip">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="scrollframe" ref={containerRef}>
        {children}
      </div>
    </>
  );
}