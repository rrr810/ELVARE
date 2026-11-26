import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Clock3, Mail, MapPin } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageMeta } from '../components/PageMeta';
import { submitContactMessage } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';

export function ContactPage() {
  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'sent' | 'preview' | ''>('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setResult('');
    try {
      const saved = await submitContactMessage(fields);
      setResult(saved ? 'sent' : 'preview');
      setFields({ name: '', email: '', message: '' });
    } catch {
      setError('We could not save your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="Contact the house" description="Get in touch with the ÉLVARÉ team. Customer contact details will be published when the store is ready to launch." />
      <section className="contact-hero">
        <div className="container-wide">
          <Breadcrumbs items={[{ label: 'Contact' }]} />
          <p className="eyebrow eyebrow-gold">A NOTE, WHENEVER YOU LIKE</p>
          <h1>We are <em>listening.</em></h1>
          <p>For a question, a thought or simply to say hello — we look forward to hearing from you.</p>
        </div>
      </section>

      <section className="contact-main container-wide">
        <div className="contact-details">
          <p className="eyebrow">THE HOUSE DESK</p>
          <h2>A conversation<br /><em>begins here.</em></h2>
          <p className="contact-intro">Our customer care details are being prepared. Until they are confirmed, please use the preview form on this page.</p>
          <div className="contact-detail-list">
            <div><Mail size={17} strokeWidth={1.3} /><span><small>EMAIL</small><strong>Details coming soon</strong></span><ArrowUpRight size={14} /></div>
            <div><MapPin size={17} strokeWidth={1.3} /><span><small>TELEPHONE</small><strong>Details coming soon</strong></span><ArrowUpRight size={14} /></div>
            <div><Clock3 size={17} strokeWidth={1.3} /><span><small>INSTAGRAM</small><strong>Coming soon</strong></span><span className="placeholder-link">Link to be added</span></div>
          </div>
          <p className="contact-hours"><span className="eyebrow">CUSTOMER SUPPORT</span><br />Support hours and response times will be published when the store launches.</p>
          {!isSupabaseConfigured && <p className="contact-demo-note">The form is a preview. No contact details are published or invented here.</p>}
        </div>

        <div className="contact-form-card">
          <div className="contact-form-heading"><span className="eyebrow eyebrow-gold">SEND A NOTE</span><h2>How can we help?</h2><p>Fields marked with an asterisk are required.</p></div>
          <form onSubmit={submit} className="contact-form">
            <label className="form-field"><span>YOUR NAME *</span><input autoComplete="name" name="name" value={fields.name} onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))} required maxLength={120} placeholder="Your name" /></label>
            <label className="form-field"><span>EMAIL ADDRESS *</span><input type="email" autoComplete="email" name="email" value={fields.email} onChange={(event) => setFields((current) => ({ ...current, email: event.target.value }))} required maxLength={254} placeholder="you@example.com" /></label>
            <label className="form-field"><span>YOUR MESSAGE *</span><textarea name="message" value={fields.message} onChange={(event) => setFields((current) => ({ ...current, message: event.target.value }))} required minLength={8} maxLength={2000} rows={5} placeholder="Tell us what is on your mind…" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {result && <p className="form-success" role="status"><Check size={16} />{result === 'sent' ? 'Thank you. Your note has been received by the connected store.' : 'Thank you. This preview did not send or store your note; connect Supabase to enable messages.'}</p>}
            <button className="button button-dark button-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'PREPARING…' : 'SEND YOUR NOTE'} <ArrowUpRight size={14} /></button>
            <p className="contact-privacy">We will only use your details to respond. Please do not include sensitive personal information.</p>
          </form>
        </div>
      </section>
      <section className="contact-endnote"><span className="gold-rule" /><p>Thank you for thinking of ÉLVARÉ.</p></section>
    </>
  );
}
