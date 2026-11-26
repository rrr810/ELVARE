import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageMeta, formatKsh } from '../components/PageMeta';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { isSupabaseConfigured, submitDemoOrder } from '../lib/supabase';

type CheckoutFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  county: string;
  town: string;
};

type PlacedOrder = { reference: string; persisted: boolean };

const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang’a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

const DELIVERY_FEE_KSH = 350;
const emptyFields: CheckoutFields = { name: '', email: '', phone: '', address: '', county: '', town: '' };

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { dataMode } = useCatalog();
  const [fields, setFields] = useState<CheckoutFields>(emptyFields);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const total = subtotal + DELIVERY_FEE_KSH;

  const updateField = (field: keyof CheckoutFields, value: string) => setFields((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (isSupabaseConfigured && dataMode === 'live') {
        const result = await submitDemoOrder({
          customerName: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          address: fields.address.trim(),
          county: fields.county,
          town: fields.town.trim(),
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color.name,
          })),
        });
        setPlacedOrder({ reference: result.order_id, persisted: true });
      } else {
        const reference = `ELV-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        setPlacedOrder({ reference, persisted: false });
      }
      clearCart();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not save this demo order. Please review your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <section className="checkout-success container-wide">
        <PageMeta title="Order preview" description="Your ÉLVARÉ checkout demonstration is complete. No payment has been processed." />
        <div className="success-seal"><span>É</span></div>
        <p className="eyebrow eyebrow-gold">A NOTE FROM THE HOUSE</p>
        <h1>Your choice, <em>considered.</em></h1>
        <p className="success-copy">{placedOrder.persisted
          ? 'Your demonstration order has been recorded in the connected store as awaiting payment. This is not a paid or confirmed order.'
          : 'This is a local checkout preview only. No order was transmitted and no payment was taken.'}</p>
        <div className="success-reference"><span>REFERENCE</span><strong>{placedOrder.reference}</strong></div>
        <p className="payment-not-live"><ShieldCheck size={16} /> M-Pesa Daraja is not connected. No payment has been initiated.</p>
        <Link to="/shop" className="button button-dark">RETURN TO THE COLLECTION <ArrowRight size={14} /></Link>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="empty-checkout container-wide">
        <PageMeta title="Checkout" description="Review your ÉLVARÉ bag before continuing." />
        <Breadcrumbs items={[{ label: 'Checkout' }]} />
        <p className="eyebrow">NOTHING TO CHECK OUT JUST YET</p>
        <h1>Your bag is <em>waiting.</em></h1>
        <p>Choose a piece from the collection to begin.</p>
        <Link to="/shop" className="button button-dark">DISCOVER THE COLLECTION <ArrowRight size={14} /></Link>
      </section>
    );
  }

  return (
    <>
      <PageMeta title="Checkout" description="Enter delivery details for your ÉLVARÉ demonstration order." />
      <section className="checkout-page container-wide">
        <Breadcrumbs items={[{ label: 'Your bag', to: '/cart' }, { label: 'Checkout' }]} />
        <div className="checkout-heading"><p className="eyebrow">THE FINAL DETAILS</p><h1>Almost <em>yours.</em></h1></div>
        <div className="checkout-demo-alert"><span className="demo-dot" /><div><strong>Demo checkout — no payment will be taken.</strong><p>M-Pesa Daraja credentials and a live payment service have not been configured. This checkout is for preview purposes only.</p></div></div>
        <form className="checkout-layout" onSubmit={handleSubmit}>
          <div className="checkout-form-column">
            <section className="checkout-form-section">
              <div className="checkout-section-heading"><span>01</span><div><h2>Your details</h2><p>How may we address you?</p></div></div>
              <div className="form-grid">
                <label className="form-field form-field-wide"><span>FULL NAME</span><input autoComplete="name" name="name" value={fields.name} onChange={(event) => updateField('name', event.target.value)} required maxLength={120} placeholder="Your full name" /></label>
                <label className="form-field"><span>EMAIL ADDRESS</span><input type="email" autoComplete="email" name="email" value={fields.email} onChange={(event) => updateField('email', event.target.value)} required maxLength={254} placeholder="you@example.com" /></label>
                <label className="form-field"><span>PHONE NUMBER</span><input type="tel" autoComplete="tel" name="phone" value={fields.phone} onChange={(event) => updateField('phone', event.target.value)} required minLength={7} maxLength={22} pattern="[+0-9() -]{7,22}" placeholder="+254 7XX XXX XXX" /></label>
              </div>
            </section>

            <section className="checkout-form-section">
              <div className="checkout-section-heading"><span>02</span><div><h2>Delivery address</h2><p>Where should this piece find you?</p></div></div>
              <div className="form-grid">
                <label className="form-field form-field-wide"><span>STREET ADDRESS</span><textarea autoComplete="street-address" name="address" value={fields.address} onChange={(event) => updateField('address', event.target.value)} required maxLength={300} rows={2} placeholder="Building, street and any helpful directions" /></label>
                <label className="form-field"><span>COUNTY</span><select autoComplete="address-level1" name="county" value={fields.county} onChange={(event) => updateField('county', event.target.value)} required><option value="">Choose a county</option>{KENYAN_COUNTIES.map((county) => <option value={county} key={county}>{county}</option>)}</select></label>
                <label className="form-field"><span>TOWN / CITY</span><input autoComplete="address-level2" name="town" value={fields.town} onChange={(event) => updateField('town', event.target.value)} required maxLength={100} placeholder="Town or city" /></label>
              </div>
            </section>

            <section className="checkout-form-section">
              <div className="checkout-section-heading"><span>03</span><div><h2>Payment method</h2><p>For a future checkout integration.</p></div></div>
              <label className="payment-option">
                <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={(event) => setPaymentMethod(event.target.value)} />
                <span className="payment-option-mark">M</span>
                <span className="payment-option-copy"><strong>M-Pesa</strong><small>Daraja integration pending · no payment is initiated</small></span>
                <span className="payment-pending">COMING SOON</span>
              </label>
            </section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="checkout-privacy">Your information is used only to prepare this demonstration order. Please avoid entering sensitive personal information.</p>
          </div>

          <aside className="checkout-summary">
            <p className="eyebrow">A CONSIDERED SELECTION</p><h2>Order summary</h2>
            <div className="checkout-summary-items">{items.map((item) => <div className="checkout-summary-item" key={item.key}><img src={item.product.image} alt="" /><div><strong>{item.product.name}</strong><span>{item.size} · {item.color.name} · Qty {item.quantity}</span></div><b>{formatKsh(item.product.priceKsh * item.quantity)}</b></div>)}</div>
            <div className="summary-line"><span>Subtotal</span><span>{formatKsh(subtotal)}</span></div>
            <div className="summary-line"><span>Delivery estimate</span><span>{formatKsh(DELIVERY_FEE_KSH)}</span></div>
            <p className="delivery-estimate-note">Illustrative flat estimate only. Set your actual delivery policy before launch.</p>
            <div className="summary-divider" />
            <div className="summary-line summary-total"><span>Total</span><strong>{formatKsh(total)}</strong></div>
            <button className="button button-dark button-full checkout-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'PREPARING YOUR PREVIEW…' : 'PLACE DEMO ORDER'} {!isSubmitting && <ArrowRight size={15} />}
            </button>
            <div className="checkout-secure-note"><ShieldCheck size={15} strokeWidth={1.4} /><span>No charge. No payment request. Demo only.</span></div>
            <Link to="/cart" className="back-to-bag"><ArrowLeft size={13} /> RETURN TO YOUR BAG</Link>
          </aside>
        </form>
      </section>
    </>
  );
}
