import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { subscribeNewsletter } from '../lib/supabase';

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'demo' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    try {
      const connected = await subscribeNewsletter(email);
      setStatus(connected ? 'success' : 'demo');
      setMessage(connected
        ? 'Thank you. You are on the list.'
        : 'This preview is not connected to a mailing list, so your address was not sent.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('We could not save your subscription just now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`newsletter-form-wrap${dark ? ' newsletter-form-dark' : ''}`}>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="newsletter-email">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={254}
          aria-describedby="newsletter-feedback"
        />
        <button type="submit" aria-label="Join the ÉLVARÉ newsletter" disabled={isSubmitting}>
          {isSubmitting ? 'PLEASE WAIT' : 'JOIN THE LIST'} <ArrowRight size={15} strokeWidth={1.4} />
        </button>
      </form>
      <p id="newsletter-feedback" className={`form-feedback${status === 'error' ? ' form-feedback-error' : ''}`} aria-live="polite">{message}</p>
    </div>
  );
}
