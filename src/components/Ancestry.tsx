import PlateDecor from './PlateDecor';

export default function Ancestry() {
  return (
    <section className="section section--ink" id="ancestry" data-navlabel="Origins">
      <PlateDecor n="02" position="bottom-right" />
      <div className="section-inner">
        <div className="eyebrow">Plate 02 — Origins of a Name</div>
        <h2 className="heading">From Lam-co to Rizal</h2>
        <p className="body-text">
          Rizal&apos;s ancestry mixed Chinese, Spanish, and Filipino roots — with Japanese
          descent also claimed by family tradition on his mother&apos;s side. The paternal line
          traces to <strong>Domingo Lam-co</strong>, a Chinese immigrant from Fujian who settled
          in the Philippines in the late 1600s and was baptized Catholic.
        </p>
        <p className="body-text dim">
          Under an 1849 decree requiring Filipino families to adopt permanent Spanish surnames,
          the family — already using &quot;Mercado&quot; — also took on{' '}
          <strong>&quot;Rizal,&quot;</strong> from the Spanish <em>ricial</em>, meaning a green
          field or new pasture. Paciano began using it at school, possibly to distance the
          family from a name linked to his mentor, Fr. José Burgos, executed in 1872. José
          followed his brother&apos;s lead upon entering the Ateneo.
        </p>
        <div className="lineage">
          <span className="node">Lam-co · Fujian, China</span>
          <span className="arrow">→</span>
          <span className="node">Mercado · adopted family name</span>
          <span className="arrow">→</span>
          <span className="node">Rizal · 1849 decree</span>
        </div>
      </div>
    </section>
  );
}