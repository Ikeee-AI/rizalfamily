import PlateDecor from './PlateDecor';

export default function Overview() {
  return (
    <section className="section section--parchment" id="overview" data-navlabel="Overview">
      <PlateDecor n="01" position="top-left" />
      <div className="section-inner">
        <div className="eyebrow">Plate 01 — Overview</div>
        <h2 className="heading">
          A Family of the <em>Principalía</em>
        </h2>
        <p className="body-text">
          José Protasio Rizal Mercado y Alonso Realonda was born on{' '}
          <strong>June 19, 1861</strong>, in Calamba, Laguna — the seventh of eleven children
          born to Francisco Mercado Rizal and Teodora Alonso Realonda.
        </p>
        <p className="body-text dim">
          The Rizal-Mercado household belonged to the <em>principalía</em> — an educated,
          landowning class of Filipinos under Spanish rule. They leased and farmed a hacienda
          owned by the Dominican friars in Calamba, a relationship that would later turn the
          family&apos;s fortunes upside down.
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="num">11</div>
            <div className="lbl">Children</div>
          </div>
          <div className="stat">
            <div className="num">2 / 9</div>
            <div className="lbl">Sons / Daughters</div>
          </div>
          <div className="stat">
            <div className="num">7th</div>
            <div className="lbl">José&apos;s Birth Order</div>
          </div>
          <div className="stat">
            <div className="num">1848–1951</div>
            <div className="lbl">Family Span in This Archive</div>
          </div>
        </div>
      </div>
    </section>
  );
}