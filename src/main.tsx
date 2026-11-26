import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Restore deep links redirected through GitHub Pages' 404.html SPA fallback.
const fallbackPath = new URLSearchParams(window.location.search).get('p');
if (fallbackPath) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const safeRoute = `/${fallbackPath.replace(/^\/+/, '')}`;
  window.history.replaceState(null, '', `${basePath}${safeRoute}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
