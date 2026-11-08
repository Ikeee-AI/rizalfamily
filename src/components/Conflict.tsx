const EXILED = [
  { tag: 'Exiled', title: 'Paciano Rizal', note: 'Brother — exiled from Calamba' },
  { tag: 'Exiled', title: 'Manuel Hidalgo', note: "Saturnina's husband — exiled to Bohol" },
  { tag: 'Exiled', title: 'Silvestre Ubaldo', note: "Olimpia's husband — also exiled" },
  { tag: 'Denied Burial', title: 'Mariano Herbosa', note: "Lucía's husband — refused Catholic rites, 1889" },
];

export default function Conflict() {
  return (
    <section className="section section--ink" id="conflict" data-navlabel="Calamba">
      <div className="section-inner">
        <div className="eyebrow" style={{ color: 'var(--oxblood)' }}>
          Plate 08 — The Calamba Conflict
        </div>
        <h2 className="heading">Eviction, 1891</h2>
        <p className="body-text">
          The family leased its land from the Dominican friars who owned the Calamba hacienda.
          When rents rose and tenants faced growing abuses, José helped organize formal
          complaints — including from his own family.
        </p>
        <p className="body-text dim">
          The retaliation was swift: authorities had the Rizal family and other tenants evicted,
          their homes demolished. This conflict directly radicalized José, feeding the
          injustices at the heart of <em>Noli Me Tángere</em> and <em>El Filibusterismo</em>.
        </p>
        <div className="card-grid">
          {EXILED.map((e) => (
            <div className="mini-card" key={e.title}>
              <div className="mc-tag">{e.tag}</div>
              <div className="mc-title">{e.title}</div>
              <p>{e.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}