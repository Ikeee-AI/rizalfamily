import PlateDecor from './PlateDecor';

export default function Closing() {
  return (
    <section className="section section--parchment closing" id="closing" data-navlabel="Closing">
      <PlateDecor n="11" position="bottom-left" />
      <div className="section-inner">
        <div className="eyebrow" style={{ justifyContent: 'center' }}>
          Plate 11 — Closing
        </div>
        <h2 className="heading">
          A hero raised by eleven names,
          <br />
          and two who taught him first.
        </h2>
        <p className="body-text dim" style={{ margin: '0 auto' }}>
          Every reform José Rizal wrote toward began, in some way, at home — in a mother&apos;s
          early lessons, a father&apos;s discipline, a brother&apos;s sacrifice, and a family
          that paid dearly for standing beside him.
        </p>
        <div className="credits">A CLASS PROJECT ARCHIVE · COMPILED FROM HISTORICAL RECORDS OF THE RIZAL FAMILY</div>
        <div className="credits credits--sub">
          3D BUSTS BASED ON COLORIZED PORTRAITS BY PINOY HISTORY
        </div>
      </div>
    </section>
  );
}