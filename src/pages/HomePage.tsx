import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { ProductGrid } from '../components/ProductCard';
import { NewsletterForm } from '../components/NewsletterForm';
import { COLLECTIONS, DEMO_PRODUCTS } from '../data/products';
import { useCatalog } from '../context/CatalogContext';

export function HomePage() {
  const { products, dataMode, catalogMessage } = useCatalog();
  const bestSellers = products.filter((product) => product.isBestSeller);
  const newArrivals = products.filter((product) => product.isNew);
  const signature = COLLECTIONS.find((collection) => collection.slug === 'signature-collection')!;
  const classic = COLLECTIONS.find((collection) => collection.slug === 'the-classic-edit')!;
  const weekend = COLLECTIONS.find((collection) => collection.slug === 'weekend-collection')!;

  return (
    <>
      <PageMeta title="Timeless pieces, thoughtfully chosen" description="Discover ÉLVARÉ: timeless pieces inspired by classic tailoring, thoughtful details and the confidence of keeping things simple." />
      <section className="hero" role="img" aria-label="ÉLVARÉ models in considered tailoring beneath a limestone colonnade">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content container-wide">
          <p className="eyebrow eyebrow-gold hero-eyebrow"><span /> THE ÉLVARÉ POINT OF VIEW</p>
          <h1>QUIET STYLE.<br /><em>LASTING PRESENCE.</em></h1>
          <p className="hero-description">Discover timeless pieces inspired by classic tailoring, thoughtful details and the confidence of keeping things simple.</p>
          <div className="hero-actions">
            <Link to="/shop" className="button button-light">EXPLORE COLLECTION <ArrowRight size={15} strokeWidth={1.5} /></Link>
            <Link to="/about" className="button button-outline-light">DISCOVER ÉLVARÉ <ArrowUpRight size={14} strokeWidth={1.5} /></Link>
          </div>
          <div className="hero-side-note"><span>01</span><span className="hero-side-rule" /><span>THE CLASSIC EDIT</span></div>
        </div>
        <a className="hero-scroll" href="#the-edit"><span>SCROLL TO DISCOVER</span><ArrowDown size={13} strokeWidth={1.4} /></a>
        <div className="hero-index">01 <span>/</span> 04</div>
      </section>

      <section className="intro-strip" id="the-edit">
        <p><span>✦</span> A WARDROBE THAT WHISPERS <span>✦</span></p>
        <p><span>✦</span> MADE FOR THE MOMENTS THAT MATTER <span>✦</span></p>
        <p><span>✦</span> ELEGANCE, WITHOUT EFFORT <span>✦</span></p>
      </section>

      <section className="section collection-section container-wide">
        <div className="section-heading section-heading-spread">
          <div>
            <p className="eyebrow">A STUDY IN THE EVERYDAY</p>
            <h2>Find your <em>own rhythm.</em></h2>
          </div>
          <Link to="/shop" className="underlined-link">VIEW ALL COLLECTIONS <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
        </div>
        <div className="collection-grid">
          {[signature, classic, weekend].map((collection, index) => (
            <Link to={`/collections/${collection.slug}`} className={`collection-card collection-card-${index + 1}`} key={collection.slug}>
              <img src={collection.image} alt={collection.imageAlt} loading="lazy" />
              <span className="collection-card-overlay" />
              <div className="collection-card-copy">
                <span className="eyebrow eyebrow-gold">{collection.eyebrow}</span>
                <h3>{collection.title}</h3>
                <span className="collection-card-link">EXPLORE THE EDIT <ArrowUpRight size={15} strokeWidth={1.35} /></span>
              </div>
              <span className="collection-number">0{index + 1}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section products-section products-section-soft">
        <div className="container-wide">
          <div className="section-heading section-heading-spread">
            <div>
              <p className="eyebrow">THE PIECES YOU RETURN TO</p>
              <h2>House <em>favourites.</em></h2>
            </div>
            <Link to="/shop?sort=popular" className="underlined-link">SHOP BEST SELLERS <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
          </div>
          {dataMode === 'demo' && <p className="demo-data-note"><span className="demo-dot" /> SAMPLE COLLECTION · Names, photographs, stock and prices are illustrative until live inventory is added.</p>}
          {bestSellers.length ? <ProductGrid products={bestSellers} limit={4} /> : <ProductGrid products={DEMO_PRODUCTS.filter((product) => product.isBestSeller)} limit={4} />}
        </div>
      </section>

      <section className="editorial-feature">
        <div className="editorial-feature-photo">
          <img src="/images/editorial-women.webp" alt="A quiet ivory silhouette in the afternoon light" loading="lazy" />
          <span className="photo-caption">A STUDY IN SOFT STRUCTURE · THE SIGNATURE COLLECTION</span>
        </div>
        <div className="editorial-feature-copy">
          <p className="eyebrow eyebrow-gold">A LITTLE LESS, A LITTLE BETTER</p>
          <h2>Elegance is a<br /><em>way of being.</em></h2>
          <p>We believe a well-chosen piece can change the feeling of an entire day. So we look to considered lines, fabrics with a story to tell and details that reveal themselves slowly.</p>
          <Link className="button button-outline-light" to="/about">OUR PHILOSOPHY <ArrowUpRight size={14} strokeWidth={1.5} /></Link>
          <span className="editorial-monogram" aria-hidden="true">É</span>
        </div>
      </section>

      <section className="section new-arrivals-section container-wide">
        <div className="section-heading section-heading-spread">
          <div>
            <p className="eyebrow">A FRESH PERSPECTIVE</p>
            <h2>New, with <em>intention.</em></h2>
          </div>
          <Link to="/collections/new-arrivals" className="underlined-link">DISCOVER NEW ARRIVALS <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
        </div>
        {newArrivals.length ? <ProductGrid products={newArrivals} limit={4} /> : <ProductGrid products={DEMO_PRODUCTS.filter((product) => product.isNew)} limit={4} />}
      </section>

      <section className="philosophy-band">
        <div className="philosophy-mark"><img src="/images/elvare-logo-lockup.webp" alt="ÉLVARÉ — The art of elegance" loading="lazy" /></div>
        <div className="philosophy-copy">
          <p className="eyebrow eyebrow-gold">OUR HOUSE PRINCIPLE</p>
          <h2>Buy less.<br /><em>Choose well.</em><br />Wear often.</h2>
          <p>A point of view shaped by timeless design, honest materials and the quiet confidence of knowing what suits you.</p>
          <Link className="underlined-link underlined-link-light" to="/about">READ OUR STORY <ArrowRight size={14} strokeWidth={1.4} /></Link>
        </div>
        <div className="philosophy-decoration" aria-hidden="true">É</div>
      </section>

      <section className="newsletter-section">
        <div className="newsletter-inner container-wide">
          <div>
            <p className="eyebrow">A LETTER FROM ÉLVARÉ</p>
            <h2>Notes on the art<br />of <em>living well.</em></h2>
          </div>
          <div className="newsletter-copy">
            <p>Occasional notes on new collections, thoughtful dressing and the things worth keeping. Always considered. Never too often.</p>
            <NewsletterForm />
            <span className="newsletter-privacy">By joining, you agree to receive occasional updates from ÉLVARÉ. Unsubscribe at any time.</span>
          </div>
        </div>
      </section>

      {dataMode === 'demo' && catalogMessage && <p className="catalog-notice" role="status">{catalogMessage}</p>}
    </>
  );
}
