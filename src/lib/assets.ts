const BASE_URL = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/** Resolve public assets against Vite's deployment base (root on Vercel, /ELVARE/ on GitHub Pages). */
export function assetPath(path: string) {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return `${BASE_URL}${path.replace(/^\/+/, '')}`;
}
