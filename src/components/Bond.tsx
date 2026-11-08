import TreeLink from './TreeLink';
import PlateDecor from './PlateDecor';

export default function Bond() {
  return (
    <section className="section section--ink" id="bond" data-navlabel="Paciano">
      <PlateDecor n="06" position="top-right" />
      <div className="section-inner">
        <div className="eyebrow">Plate 06 — A Brother&apos;s Devotion</div>
        <h2 className="heading">Rizal and Paciano</h2>
        <p className="body-text">
          Eleven years José&apos;s senior, <TreeLink siblingId={1}>Paciano</TreeLink> was less an
          older brother than a second father — mentor, financier, and closest confidant. His own
          education at the Colegio de San José, under the reformist priest Fr. José Burgos,
          shaped the convictions he would pass on to José.
        </p>
        <p className="body-text dim">
          When Burgos was executed in 1872, Paciano&apos;s own path narrowed — so he redirected
          his ambitions toward his younger brother, financing much of José&apos;s schooling in
          Manila and Europe, at times selling or mortgaging property to do it. The brothers
          exchanged frank, constant letters on politics, family, and José&apos;s writing.
          Paciano later served as a general in the Philippine Revolution.
        </p>
        <div className="lineage">
          <span className="node">Fr. Burgos, mentor</span>
          <span className="arrow">→</span>
          <span className="node">Paciano, reformist</span>
          <span className="arrow">→</span>
          <span className="node">José, writer &amp; reformer</span>
        </div>
      </div>
    </section>
  );
}