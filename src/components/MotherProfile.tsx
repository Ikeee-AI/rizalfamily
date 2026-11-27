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

export default function MotherProfile() {
  return (
    <section className="section section--ink" id="mother" data-navlabel="Mother">
      <PlateDecor n="04" position="top-left" />
      <div className="section-inner">
        <div className="eyebrow">Plate 04 — The Mother</div>
        <div className="profile reverse">
          <div>
            <div className="role-tag" style={{ color: 'var(--brass-bright)' }}>
              1826 – 1911 · Rizal&apos;s First Teacher
            </div>
            <h2 className="heading">The Household&apos;s First Scholar</h2>
            <p className="body-text">
              Teodora Alonso Realonda was educated at the Colegio de Santa Rosa — unusually
              literate for a woman of her era, fluent in Spanish, literature, mathematics, and
              business. She was José&apos;s first teacher, guiding him through his letters, his
              prayers, and his earliest stories.
            </p>
            <div className="case-file">
              <div className="tag">Case File · 1871</div>
              <p>
                Falsely accused, with her brother, of an alleged poisoning attempt, Teodora was
                imprisoned for over two years despite scant evidence — an injustice that left a
                deep mark on her young son.
              </p>
            </div>
          </div>
          <div className="frame-col">
            <div>
              <div className="oval-frame">
                <Bust3D who="Teodora" name="Teodora Alonso Realonda">
                  <Bust />
                </Bust3D>
              </div>
              <div className="name-plate">TEODORA ALONSO REALONDA</div>
              <div className="bust-note">3D reconstruction · drag to turn</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}