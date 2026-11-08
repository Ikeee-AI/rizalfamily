'use client';

import { useEffect, useRef, useState } from 'react';
import PlateDecor from './PlateDecor';

type Sibling = {
  id: number;
  name: string;
  nick: string;
  years: string;
  x: number;
  y: number;
  bio: string;
};

const SIBLINGS: Sibling[] = [
  { id: 0, name: 'Saturnina', nick: 'Neneng', years: '1850–1913', x: 60, y: 410,
    bio: "The eldest of the eleven children. She married Manuel Timoteo Hidalgo of Tanauan, Batangas — who was later exiled to Bohol during the Calamba land conflict for his family ties to Rizal. Business-minded, she stayed closely involved in family affairs and corresponded often with José during his years abroad." },
  { id: 1, name: 'Paciano', nick: '', years: '1851–1930', x: 158, y: 396,
    bio: "The only brother among the eleven, and eleven years José's senior. He studied under Fr. José Burgos, one of the priests executed in 1872, which shaped his reformist views — and cut his own studies short. Paciano largely financed José's education in Manila and Europe, later became a general in the Philippine Revolution, and quietly declined honors afterward, preferring life as a farmer in Los Baños." },
  { id: 2, name: 'Narcisa', nick: 'Sisa', years: '1852–1939', x: 256, y: 382,
    bio: 'Married schoolteacher Antonio López. After Rizal\'s execution, she searched Paco Cemetery and located his secretly buried, unmarked grave — later marking the site discreetly with a slab inscribed "R.P.J.," his initials reversed, to avoid drawing attention from authorities.' },
  { id: 3, name: 'Olimpia', nick: '', years: '1855–1887', x: 354, y: 368,
    bio: "Married telegraph operator Silvestre Ubaldo. She died young, in 1887, reportedly from complications following childbirth. Ubaldo was among the relatives later exiled during the Calamba land conflict." },
  { id: 4, name: 'Lucía', nick: '', years: '1857–1919', x: 452, y: 354,
    bio: "Married Mariano Herbosa, a Calamba farmer. When Herbosa died of cholera in 1889, the local parish priest denied him a Catholic burial solely because of his family ties to Rizal — one of the clearest examples of the persecution the extended family endured." },
  { id: 5, name: 'María', nick: 'Biang', years: '1859–1945', x: 550, y: 340,
    bio: "Married Daniel Faustino Cruz of Biñan. One of the sisters who kept up frequent correspondence with José throughout his travels." },
  { id: 6, name: 'José', nick: 'Pepe', years: '1861–1896', x: 650, y: 354,
    bio: "The seventh child, and the reason this archive exists. His life and work are explored throughout the rest of this exhibit." },
  { id: 7, name: 'Concepción', nick: 'Concha', years: '1862–1865', x: 747, y: 368,
    bio: "Died at about age three, likely from illness. José, then around four years old, later described her death as his first real experience of grief." },
  { id: 8, name: 'Josefa', nick: 'Panggoy', years: '1865–1945', x: 845, y: 382,
    bio: "Never married, and stayed close to home to help care for their parents. Together with Trinidad, she helped preserve José's final letters and belongings after his execution." },
  { id: 9, name: 'Trinidad', nick: 'Trining', years: '1868–1951', x: 943, y: 396,
    bio: "Never married; she lived with and cared for their mother, Teodora, in her later years. On the night before José's execution, he secretly gave her a small alcohol lamp — hidden inside was his final poem, later known as Mi Último Adiós. She kept it safe, and became the last surviving Rizal sibling." },
  { id: 10, name: 'Soledad', nick: 'Choleng', years: '1870–1929', x: 1041, y: 410,
    bio: "The youngest of the eleven children. She married Pantaleón Quintero and is the least documented of the siblings in historical accounts." },
];

function forkPath(x: number, y: number) {
  const midX = (600 + x) / 2;
  return `M600,140 C${midX},140 ${midX},${y} ${x},${y}`;
}

function Locket({ isJose }: { isJose?: boolean }) {
  return (
    <div className="locket" style={isJose ? { borderColor: 'var(--oxblood)' } : undefined}>
      <svg viewBox="0 0 100 100" className="silhouette">
        <path
          d="M50 8 C61 8 69 17 69 29 C69 38 64 45 57 48 C74 53 86 66 88 92 L12 92 C14 66 26 53 43 48 C36 45 31 38 31 29 C31 17 39 8 50 8 Z"
          fill="#2B2013"
        />
      </svg>
    </div>
  );
}

export default function FamilyTree() {
  const [selected, setSelected] = useState<Sibling | null>(null);
  const [visible, setVisible] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    function onOpenSibling(e: Event) {
      const id = (e as CustomEvent<number>).detail;
      const sib = SIBLINGS.find((s) => s.id === id);
      if (sib) setSelected(sib);
    }
    window.addEventListener('open-sibling', onOpenSibling);
    return () => window.removeEventListener('open-sibling', onOpenSibling);
  }, []);

  return (
    <section className="section section--parchment" id="tree" data-navlabel="Family Tree">
      <PlateDecor n="05" position="top-center" />
      <div className="section-inner tree-wrap">
        <div className="eyebrow">Plate 05 — The Family Tree</div>
        <h2 className="heading">Eleven Branches</h2>
        <p className="body-text dim">Click on a name to read their story.</p>

        <div className={`tree-canvas${visible ? ' is-visible' : ''}`} ref={canvasRef}>
          <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
            <path d="M600,70 L600,140" />
            {SIBLINGS.map((s) => (
              <path key={s.id} d={forkPath(s.x, s.y)} />
            ))}
          </svg>

          <div className="parent-node" style={{ top: '12.5%' }}>
            <div className="pn-inner">FRANCISCO &amp; TEODORA</div>
          </div>

          {SIBLINGS.map((s) => (
            <div
              key={s.id}
              className="child-node"
              style={{ left: `${(s.x / 1200) * 100}%`, top: `${(s.y / 560) * 100}%` }}
            >
              <button type="button" onClick={() => setSelected(s)} aria-haspopup="dialog">
                <Locket isJose={s.id === 6} />
                <span className="cname" style={s.id === 6 ? { color: 'var(--oxblood)' } : undefined}>
                  {s.name}
                  {s.nick ? ` "${s.nick}"` : ''}
                </span>
                <span className="cyears">{s.years}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="tree-mobile">
          {SIBLINGS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSelected(s)} aria-haspopup="dialog">
              <Locket isJose={s.id === 6} />
              <span className="cname" style={s.id === 6 ? { color: 'var(--oxblood)' } : undefined}>
                {s.name}
              </span>
              <span className="cyears">{s.years}</span>
            </button>
          ))}
        </div>

        <div className="tree-hint">Tap or click any name above ↑</div>
      </div>

      {selected && (
        <div
          className="tree-modal-backdrop open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="tree-modal" role="dialog" aria-modal="true">
            <button className="close-btn" onClick={() => setSelected(null)}>
              CLOSE ✕
            </button>
            <div className="m-eyebrow">Sibling {selected.id + 1} of 11</div>
            <h3>
              {selected.name}
              {selected.nick ? ` "${selected.nick}"` : ''}
            </h3>
            <div className="m-years">{selected.years}</div>
            <p>{selected.bio}</p>
          </div>
        </div>
      )}
    </section>
  );
}