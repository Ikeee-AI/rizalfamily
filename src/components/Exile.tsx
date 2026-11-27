import TreeLink from './TreeLink';
import PlateDecor from './PlateDecor';
import Bust3D from './Bust3D';

export default function Exile() {
  return (
    <section className="section section--parchment" id="exile" data-navlabel="Exile">
      <PlateDecor n="09" position="bottom-right" />
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>
          Plate 09 — Exile &amp; Final Days
        </div>
        <h2 className="heading" style={{ maxWidth: 'none', marginLeft: 'auto', marginRight: 'auto' }}>
          The Lamp on the Eve of Execution
        </h2>
        <p className="body-text dim" style={{ margin: '0 auto' }}>
          During José&apos;s exile in Dapitan (1892–1896), his mother and sisters visited when
          they could, and letters kept the family close. On December 29, 1896 — the night
          before his execution — his family gathered with him at Fort Santiago one last time.
        </p>
        <div className="lamp-scene">
          <div className="lamp-row">
            <figure>
              <div className="oval-frame oval-frame--sm">
                <Bust3D who="Trinidad" name="Trinidad Rizal" />
              </div>
              <figcaption className="name-plate">TRINIDAD</figcaption>
            </figure>
            <div className="lamp">
              <div className="glow" />
              <div className="neck" />
              <div className="body" />
            </div>
          </div>
          <p className="body-text" style={{ margin: '0 auto' }}>
            José quietly handed his sister{' '}
            <TreeLink siblingId={9}>
              <strong>Trinidad</strong>
            </TreeLink>{' '}
            a small alcohol lamp, telling her something was hidden inside. Folded within it was
            his final poem — later known as <em>Mi Último Adiós</em>. The next morning, his
            sister{' '}
            <TreeLink siblingId={2}>
              <strong>Narcisa</strong>
            </TreeLink>{' '}
            would search Paco Cemetery to find where he&apos;d been secretly buried.
          </p>
        </div>
      </div>
    </section>
  );
}