import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const desktopLinks = [
  { label: 'New arrivals', to: '/collections/new-arrivals' },
  { label: 'Men', to: '/shop?department=Men' },
  { label: 'Women', to: '/shop?department=Women' },
  { label: 'Collections', to: '/shop' },
  { label: 'Our story', to: '/about' },
];

export function SiteLayout() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
    setSearchOpen(false);
  };

  return (
    <>
      <div className="announcement-bar">
        <span>THE ART OF ELEGANCE</span>
        <span className="announcement-divider" aria-hidden="true">✦</span>
        <span>A quieter kind of luxury. <Link to="/collections/signature-collection">Discover the signature edit <ArrowUpRight size={11} strokeWidth={1.4} /></Link></span>
      </div>
      <header className="site-header">
        <div className="header-main container-wide">
          <button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={21} strokeWidth={1.5} /> : <Menu size={21} strokeWidth={1.5} />}
          </button>
          <Link className="header-wordmark" to="/" aria-label="ÉLVARÉ home">
            <img src="/images/elvare-logo-wordmark.webp" alt="ÉLVARÉ" width="172" height="32" />
          </Link>
          <div className="header-utilities">
            <button className="icon-button search-toggle" aria-label={searchOpen ? 'Close search' : 'Search'} aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)}>
              {searchOpen ? <X size={19} strokeWidth={1.5} /> : <Search size={19} strokeWidth={1.5} />}
            </button>
            <Link className="bag-link" to="/cart" aria-label={`Shopping bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}>
              <ShoppingBag size={19} strokeWidth={1.5} />
              <span className="bag-label">Bag</span>
              <span className="bag-count">{itemCount}</span>
            </Link>
          </div>
        </div>
        <nav className="desktop-nav" aria-label="Main navigation">
          {desktopLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>{link.label}</NavLink>
          ))}
        </nav>
        {searchOpen && (
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <Search size={18} strokeWidth={1.5} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="site-search">Search the collection</label>
            <input id="site-search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" />
            <button type="submit" className="text-button">SEARCH</button>
          </form>
        )}
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <p className="mobile-nav-eyebrow">THE ÉLVARÉ WARDROBE</p>
            {desktopLinks.map((link) => (
              <NavLink key={link.label} to={link.to} className="mobile-nav-link">{link.label}<ArrowUpRight size={16} strokeWidth={1.4} /></NavLink>
            ))}
            <div className="mobile-nav-secondary"><Link to="/about">Our story</Link><Link to="/contact">Contact</Link></div>
          </nav>
        )}
      </header>
      <main id="main-content"><Suspense fallback={<div className="route-loading" role="status">A moment, while we prepare the collection…</div>}><Outlet /></Suspense></main>
      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top container-wide">
        <div className="footer-brand-column">
          <Link to="/" className="footer-logo" aria-label="ÉLVARÉ home">
            <img src="/images/elvare-logo-wordmark.webp" alt="ÉLVARÉ" width="185" height="34" loading="lazy" />
          </Link>
          <p>Timeless pieces. Thoughtfully chosen.<br />The art of elegance, every day.</p>
          <span className="footer-mark"><img src="/images/elvare-logo-emblem.webp" alt="" width="46" height="50" loading="lazy" /></span>
        </div>
        <div className="footer-link-group">
          <h2>Explore</h2>
          <Link to="/collections/new-arrivals">New arrivals</Link>
          <Link to="/shop?department=Women">Women</Link>
          <Link to="/shop?department=Men">Men</Link>
          <Link to="/shop">All collections</Link>
        </div>
        <div className="footer-link-group">
          <h2>The house</h2>
          <Link to="/about">Our story</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/admin">Store administration</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow eyebrow-gold">A NOTE FROM THE HOUSE</span>
          <p>This is a demonstration storefront. Product names, imagery, stock and KSh prices are sample content until ÉLVARÉ’s live inventory is supplied.</p>
        </div>
      </div>
      <div className="footer-bottom container-wide">
        <span>© {new Date().getFullYear()} ÉLVARÉ. The art of elegance.</span>
        <span>Designed with intention.</span>
      </div>
    </footer>
  );
}

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}
