import Bust3D from './Bust3D';
import PlateDecor from './PlateDecor';

function Bust() {
  return (
    <svg viewBox="0 0 100 100" className="silhouette">
      <path
        d="M50 8 C61 8 69 17 69 29 C69 38 64 45 57 48 C74 53 86 66 88 92 L12 92 C14 66 26 53 43 48 C36 45 31 38 31 29 C31 17 39 8 50 8 Z"
        fill="#2B2013"
      />
    </svg>
  );
}

export default function FatherProfile() {
  return (
    <section className="section section--parchment" id="father" data-navlabel="Father">
      <PlateDecor n="03" position="bottom-right" />
      <div className="section-inner">
        <div className="eyebrow">Plate 03 — The Father</div>
        <div className="profile">
          <div className="frame-col">
            <div>
              <div className="oval-frame">
                <Bust3D who="Francisco" name="Francisco Mercado Rizal">
                  <Bust />
                </Bust3D>
              </div>
              <div className="name-plate">FRANCISCO MERCADO RIZAL</div>
              <div className="bust-note">3D reconstruction · drag to turn</div>
            </div>
          </div>
          <div>
            <div className="role-tag">1818 – 1898 · Farmer &amp; Leaseholder</div>
            <h2 className="heading">A Model of Discipline</h2>
            <p className="body-text">
              Born May 11, 1818, in Biñan, Laguna, Francisco studied philosophy and Latin at
              the Colegio de San José before becoming a farmer and leaseholder (
              <em>inquilino</em>) on the Dominican-owned hacienda in Calamba.
            </p>
            <p className="body-text dim">
              Industrious, disciplined, and reserved, he built the family&apos;s well-known
              stone-and-wood house and provided a stable home for eleven children. José would
              later describe him simply as a model father — hardworking, and a man of few but
              honest words.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}