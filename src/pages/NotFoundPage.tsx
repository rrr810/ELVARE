import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';

export function NotFoundPage() {
  return (
    <section className="not-found container-wide">
      <PageMeta title="Page not found" description="This ÉLVARÉ page could not be found." />
      <span className="not-found-number">404</span>
      <p className="eyebrow">A SMALL DETOUR</p>
      <h1>Not all who wander<br /><em>are lost.</em></h1>
      <p>The page you were looking for is no longer here. The collection is just a step away.</p>
      <Link to="/" className="button button-dark"><ArrowLeft size={15} /> RETURN TO ÉLVARÉ</Link>
    </section>
  );
}
