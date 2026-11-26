import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageMeta, formatKsh } from '../components/PageMeta';
import { ProductGrid } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import type { ColorOption } from '../types';

export function ProductPage() {
  const { slug } = useParams();
  const { products, isLoading, dataMode } = useCatalog();
  const { addItem } = useCart();
  const product = products.find((item) => item.slug === slug);
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState<ColorOption | undefined>(product?.colors[0]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedSize(product?.sizes[0] ?? '');
    setSelectedColor(product?.colors[0]);
    setAdded(false);
  }, [product?.id]);

  if (!product) {
    return (
      <section className="product-missing container-wide">
        {isLoading ? <p role="status">Finding the piece…</p> : <><p className="eyebrow">A PIECE YET TO BE FOUND</p><h1>This page has moved on.</h1><Link to="/shop" className="underlined-link"><ArrowLeft size={14} /> RETURN TO THE COLLECTION</Link></>}
      </section>
    );
  }

  const related = products.filter((item) => item.id !== product.id && (item.department === product.department || item.collection === product.collection)).slice(0, 4);
  const color = selectedColor ?? product.colors[0];

  const handleAdd = () => {
    if (!selectedSize || !color) return;
    addItem(product, selectedSize, color);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 3400);
  };

  return (
    <>
      <PageMeta title={product.name} description={product.description} />
      <section className="product-detail container-wide">
        <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: product.name }]} />
        <div className="product-detail-layout">
          <div className="product-detail-image-wrap">
            <img className="product-detail-image" src={color.image ?? product.image} alt={`${product.name} in ${color.name}, ${product.material}`} fetchPriority="high" />
            {product.isNew && <span className="product-badge product-detail-badge">New arrival</span>}
            <span className="product-image-caption">ÉLVARÉ · {product.collection.toUpperCase()}</span>
          </div>
          <div className="product-detail-copy">
            <Link to={`/collections/${product.collection.toLowerCase().replaceAll(' ', '-')}`} className="product-detail-collection">{product.collection.toUpperCase()} <ArrowRight size={13} strokeWidth={1.4} /></Link>
            <h1>{product.name}</h1>
            <p className="product-detail-price">{formatKsh(product.priceKsh)} {dataMode === 'demo' && <span>sample price</span>}</p>
            <div className="product-detail-divider" />
            <p className="product-description">{product.description}</p>
            <p className="product-material"><span>COMPOSITION</span>{product.material}</p>

            <div className="variant-block">
              <div className="variant-title"><span>COLOUR</span><span>{color.name}</span></div>
              <div className="color-options" role="group" aria-label="Select colour">
                {product.colors.map((item) => (
                  <button key={item.name} type="button" className={`color-swatch${item.name === color.name ? ' is-selected' : ''}`} style={{ '--swatch': item.hex } as React.CSSProperties} aria-label={item.name} aria-pressed={item.name === color.name} onClick={() => setSelectedColor(item)}>
                    <span />
                  </button>
                ))}
              </div>
            </div>

            <div className="variant-block">
              <div className="variant-title"><span>SELECT SIZE</span><button type="button" className="size-guide-link" onClick={() => document.getElementById('size-guide')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>SIZE GUIDE</button></div>
              <div className="size-options" role="group" aria-label="Select size">
                {product.sizes.map((size) => (
                  <button className={selectedSize === size ? 'is-selected' : ''} type="button" key={size} aria-pressed={selectedSize === size} onClick={() => setSelectedSize(size)}>{size}</button>
                ))}
              </div>
            </div>

            <button type="button" className="button button-dark add-to-bag" onClick={handleAdd} disabled={!product.stock}>
              {added ? <><Check size={16} strokeWidth={1.5} /> ADDED TO YOUR BAG</> : <><ShoppingBag size={16} strokeWidth={1.4} /> ADD TO BAG · {formatKsh(product.priceKsh)}</>}
            </button>
            {added && <p className="add-confirmation" role="status">A considered choice. <Link to="/cart">View your bag</Link></p>}
            {!product.stock && <p className="stock-note">Currently unavailable. Please check back soon.</p>}
            {product.stock > 0 && product.stock < 6 && <p className="stock-note">A few pieces remain in this sample collection.</p>}

            <div className="product-accordion" id="size-guide">
              <details open><summary>THE DETAILS</summary><p>{product.description} Finished with care, intended to be worn often. Colour may vary slightly between screens.</p></details>
              <details><summary>SIZE & FIT</summary><p>Our sample sizing runs true to size. If between sizes, consider the larger size for an easier fit. Contact the house for a tailored fit guide once customer support is live.</p></details>
              <details><summary>DELIVERY & RETURNS</summary><p>Delivery arrangements and returns policy will be confirmed when ÉLVARÉ’s live fulfilment is configured. Any delivery amount shown at checkout is illustrative only.</p></details>
            </div>
          </div>
        </div>
      </section>
      {related.length > 0 && <section className="section related-products container-wide"><div className="section-heading section-heading-spread"><div><p className="eyebrow">A NATURAL COMPANION</p><h2>Consider it <em>alongside.</em></h2></div><Link to="/shop" className="underlined-link">EXPLORE EVERYTHING <ArrowRight size={14} /></Link></div><ProductGrid products={related} limit={4} /></section>}
    </>
  );
}
