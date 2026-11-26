import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageMeta, formatKsh } from '../components/PageMeta';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';

export function CartPage() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const { dataMode } = useCatalog();

  return (
    <>
      <PageMeta title="Your bag" description="Review your ÉLVARÉ pieces before continuing to the demonstration checkout." />
      <section className="cart-page container-wide">
        <Breadcrumbs items={[{ label: 'Your bag' }]} />
        <div className="cart-page-heading"><p className="eyebrow">THE PIECES YOU HAVE CHOSEN</p><h1>Your <em>bag.</em><span>{items.reduce((sum, item) => sum + item.quantity, 0)} pieces</span></h1></div>
        {dataMode === 'demo' && items.length > 0 && <p className="demo-data-note"><span className="demo-dot" /> SAMPLE PRODUCTS & PRICES · Illustrative content until live inventory is supplied.</p>}
        {items.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-mark">É</span>
            <p className="eyebrow">A LITTLE SPACE TO BEGIN</p>
            <h2>Your bag is taking a moment.</h2>
            <p>There is nothing here just yet. Explore considered pieces for the everyday.</p>
            <Link to="/shop" className="button button-dark">DISCOVER THE COLLECTION <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items" aria-label="Items in your shopping bag">
              {items.map((item) => (
                <article className="cart-item" key={item.key}>
                  <Link to={`/product/${item.product.slug}`} className="cart-item-image"><img src={item.product.image} alt={item.product.name} /></Link>
                  <div className="cart-item-main">
                    <div className="cart-item-heading"><div><p className="product-card-category">{item.product.department} · {item.product.category}</p><Link className="product-card-name" to={`/product/${item.product.slug}`}>{item.product.name}</Link></div><strong>{formatKsh(item.product.priceKsh * item.quantity)}</strong></div>
                    <p className="cart-variant">Colour: {item.color.name}<span>·</span>Size: {item.size}</p>
                    <div className="cart-item-actions">
                      <div className="quantity-stepper" aria-label={`Quantity for ${item.product.name}`}>
                        <button type="button" aria-label={`Decrease quantity of ${item.product.name}`} onClick={() => updateQuantity(item.key, item.quantity - 1)}><Minus size={13} /></button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" aria-label={`Increase quantity of ${item.product.name}`} disabled={item.quantity >= 10} onClick={() => updateQuantity(item.key, item.quantity + 1)}><Plus size={13} /></button>
                      </div>
                      <button type="button" className="remove-item" onClick={() => removeItem(item.key)}><Trash2 size={13} /> REMOVE</button>
                    </div>
                  </div>
                </article>
              ))}
              <Link to="/shop" className="continue-shopping"><ArrowLeft size={14} /> CONTINUE DISCOVERING</Link>
            </div>
            <aside className="order-summary">
              <p className="eyebrow">A THOUGHTFUL SELECTION</p>
              <h2>Order summary</h2>
              <div className="summary-line"><span>Subtotal</span><span>{formatKsh(subtotal)}</span></div>
              <div className="summary-line"><span>Delivery</span><span>Calculated at checkout</span></div>
              <div className="summary-divider" />
              <div className="summary-line summary-total"><span>Total</span><strong>{formatKsh(subtotal)}</strong></div>
              <p className="summary-tax-note">An illustrative delivery estimate will be shown at the next step. No payment is collected in this preview.</p>
              <Link to="/checkout" className="button button-dark button-full">CONTINUE TO CHECKOUT <ArrowRight size={15} /></Link>
              <p className="secure-note">Your bag is saved on this device only.</p>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
