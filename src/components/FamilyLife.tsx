import PlateDecor from './PlateDecor';

const TIMELINE = [
  { year: '1872–1877', place: 'Ateneo Municipal de Manila' },
  { year: '1877–1882', place: 'University of Santo Tomas, Manila' },
  { year: '1882', place: 'Universidad Central de Madrid, Spain' },
  { year: '1885–1887', place: 'Further studies across Germany & France' },
];

export default function FamilyLife() {
  return (
    <section className="section section--parchment" id="life" data-navlabel="Education">
      <PlateDecor n="07" position="bottom-left" />
      <div className="section-inner">
        <div className="eyebrow">Plate 07 — Family Life &amp; Education</div>
        <h2 className="heading">What the Family Made Possible</h2>
        <p className="body-text dim">
          Farming income, land leases, and small enterprises made the Rizal-Mercado household
          one of the more prosperous families in Calamba — prosperous enough to send José
          across the world in pursuit of an education.
        </p>
        <div className="timeline">
          {TIMELINE.map((t) => (
            <div className="t-item" key={t.year}>
              <div className="t-year">{t.year}</div>
              <div className="t-place">{t.place}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}