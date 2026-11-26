import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatKsh } from './PageMeta';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link className="product-card-image" to={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
        <img src={product.image} alt={`${product.name} — ${product.department.toLowerCase()} ${product.category.toLowerCase()}`} loading="lazy" />
        {product.isNew && <span className="product-badge">New arrival</span>}
        <span className="product-view" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={1.35} /></span>
      </Link>
      <div className="product-card-copy">
        <div className="product-card-heading">
          <div>
            <p className="product-card-category">{product.department === 'Unisex' ? 'Accessories' : `${product.department} · ${product.category}`}</p>
            <Link className="product-card-name" to={`/product/${product.slug}`}>{product.name}</Link>
          </div>
          <span className="product-price">{formatKsh(product.priceKsh)}</span>
        </div>
        <p className="product-card-material">{product.material}</p>
        {product.colors.length > 1 && <div className="product-card-color-preview" aria-label={`${product.colors.length} colour options`}><span className="product-card-swatches" aria-hidden="true">{product.colors.slice(0, 5).map((color) => <i key={color.name} style={{ backgroundColor: color.hex }} />)}</span><span>{product.colors.length} colours</span></div>}
      </div>
    </article>
  );
}

export function ProductGrid({ products, limit }: { products: Product[]; limit?: number }) {
  const visibleProducts = typeof limit === 'number' ? products.slice(0, limit) : products;
  return (
    <div className="product-grid">
      {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
