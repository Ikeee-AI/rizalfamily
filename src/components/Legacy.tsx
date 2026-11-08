import PlateDecor from './PlateDecor';

const LEGACY = [
  {
    num: '01',
    title: 'A Revolution Continued',
    body: "Paciano fought as a general in the Philippine Revolution, carrying his brother's cause into war.",
  },
  {
    num: '02',
    title: 'A Preserved Record',
    body: "Rizal's sisters kept his letters, manuscripts, and belongings — now vital historical and literary records.",
  },
  {
    num: '03',
    title: "A Family's Mirror",
    body: 'Prosperity, education, then persecution — the family\'s arc echoes the larger story of Filipino families under colonial rule.',
  },
];

export default function Legacy() {
  return (
    <section className="section section--ink" id="legacy" data-navlabel="Legacy">
      <PlateDecor n="10" position="top-center" />
      <div className="section-inner">
        <div className="eyebrow">Plate 10 — Legacy</div>
        <h2 className="heading">What the Family Carried Forward</h2>
        <div className="legacy-grid">
          {LEGACY.map((item) => (
            <div className="legacy-item" key={item.num}>
              <div className="li-num">{item.num}</div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}