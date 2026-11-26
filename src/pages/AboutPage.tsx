import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageMeta } from '../components/PageMeta';
import { assetPath } from '../lib/assets';

export function AboutPage() {
  return (
    <>
      <PageMeta title="Our story" description="Discover the ÉLVARÉ point of view: confidence, character and timeless elegance through thoughtfully selected pieces." />
      <section className="about-hero">
        <img src={assetPath('/images/editorial-hero.webp')} alt="Two ÉLVARÉ models beneath a monumental limestone colonnade" fetchPriority="high" />
        <div className="about-hero-shade" />
        <div className="about-hero-copy container-wide">
          <Breadcrumbs items={[{ label: 'Our story' }]} />
          <p className="eyebrow eyebrow-gold">THE ÉLVARÉ POINT OF VIEW</p>
          <h1>Not louder.<br /><em>More considered.</em></h1>
          <p>A quieter expression of elegance, for the life you are living now.</p>
        </div>
        <span className="about-hero-caption">THE ART OF ELEGANCE · EST. IN INTENTION</span>
      </section>

      <section className="about-intro container-wide">
        <div className="about-intro-mark"><img src={assetPath('/images/elvare-logo-lockup.webp')} alt="ÉLVARÉ — The art of elegance" loading="lazy" /></div>
        <div className="about-intro-copy">
          <p className="eyebrow">A NOTE ON GETTING DRESSED</p>
          <h2>Clothing is the beginning.<br /><em>Confidence is the feeling.</em></h2>
          <p>At ÉLVARÉ, we believe style is more than clothing. It is confidence, character and timeless elegance.</p>
          <p>Our vision is to redefine everyday fashion through thoughtfully selected pieces, sophisticated design and an appreciation for the finer details.</p>
        </div>
      </section>

      <section className="about-editorial">
        <div className="about-editorial-image"><img src={assetPath('/images/editorial-men.webp')} alt="Quietly confident tailoring in a sun-warmed stone arch" loading="lazy" /></div>
        <div className="about-editorial-copy">
          <span className="eyebrow eyebrow-gold">THE THOUGHT BEHIND THE PIECE</span>
          <h2>Made for the<br /><em>long view.</em></h2>
          <p>We look for the things that endure: a shoulder that sits just so, a fabric that feels better with time, a detail discovered on the second or third wearing.</p>
          <p>It is a slower, more intentional way of dressing. Not because the world is moving too quickly, but because the best things deserve to be chosen with care.</p>
          <Link to="/shop" className="underlined-link underlined-link-light">EXPLORE THE COLLECTION <ArrowRight size={14} /></Link>
          <span className="about-quote-mark" aria-hidden="true">“</span>
        </div>
      </section>

      <section className="values-section container-wide">
        <div className="section-heading"><p className="eyebrow">A FEW THINGS WE BELIEVE</p><h2>Our house <em>principles.</em></h2></div>
        <div className="values-grid">
          <article><span>01</span><h3>Less, with intention.</h3><p>Every piece should earn its place. A thoughtful wardrobe begins with a point of view, not a passing trend.</p></article>
          <article><span>02</span><h3>Quiet confidence.</h3><p>True elegance does not need to announce itself. It is there in how something fits, feels and moves with you.</p></article>
          <article><span>03</span><h3>Always evolving.</h3><p>Good design keeps learning. We stay curious about craft, proportion and what it means to dress well today.</p></article>
        </div>
      </section>

      <section className="about-cta">
        <p className="eyebrow eyebrow-gold">THE WARDROBE, RECONSIDERED</p>
        <h2>Find the feeling<br />of <em>less, but better.</em></h2>
        <Link className="button button-light" to="/shop">DISCOVER ÉLVARÉ <ArrowUpRight size={14} /></Link>
      </section>
    </>
  );
}
