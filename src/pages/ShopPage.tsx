import { useMemo } from 'react';
import { ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageMeta } from '../components/PageMeta';
import { ProductGrid } from '../components/ProductCard';
import { COLLECTIONS, PRODUCT_CATEGORIES } from '../data/products';
import { useCatalog } from '../context/CatalogContext';

export function ShopPage() {
  const { collectionSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, dataMode, catalogMessage } = useCatalog();
  const collection = collectionSlug ? COLLECTIONS.find((item) => item.slug === collectionSlug) : undefined;
  const department = searchParams.get('department') ?? '';
  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'featured';

  const availableCategories = department === 'Men'
    ? [...PRODUCT_CATEGORIES.Men]
    : department === 'Women'
      ? [...PRODUCT_CATEGORIES.Women]
      : [...new Set([...PRODUCT_CATEGORIES.Men, ...PRODUCT_CATEGORIES.Women])];

  const visibleProducts = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesDepartment = !department || product.department === department;
      const matchesCategory = !category || product.category === category;
      const matchesCollection = !collection || (collection.slug === 'new-arrivals'
        ? product.isNew
        : product.collection.toLowerCase().replaceAll(' ', '-') === collection.slug);
      const matchesSearch = !normalizedQuery || [product.name, product.department, product.category, product.collection, product.description]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesDepartment && matchesCategory && matchesCollection && matchesSearch;
    });

    if (sort === 'price-low') filtered.sort((a, b) => a.priceKsh - b.priceKsh);
    if (sort === 'price-high') filtered.sort((a, b) => b.priceKsh - a.priceKsh);
    if (sort === 'newest') filtered.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    if (sort === 'popular') filtered.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
    return filtered;
  }, [products, department, category, collection, search, sort]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const heading = search
    ? `Searching for “${search}”`
    : department
      ? `${department}'s collection`
      : collection?.title ?? 'The complete wardrobe';
  const metaTitle = collection?.title ?? (department ? `${department}'s collection` : 'Shop the collection');

  return (
    <>
      <PageMeta title={metaTitle} description={collection?.description ?? 'Explore the ÉLVARÉ wardrobe: thoughtful tailoring, elegant essentials and considered accessories.'} />
      <section className="shop-hero">
        <div className="container-wide shop-hero-inner">
          <Breadcrumbs items={collection ? [{ label: 'Collections', to: '/shop' }, { label: collection.title }] : [{ label: 'Shop' }]} />
          <p className="eyebrow eyebrow-gold">{collection?.eyebrow ?? 'THE ÉLVARÉ WARDROBE'}</p>
          <h1>{collection?.title ?? (department ? `The ${department.toLowerCase()} edit` : 'Considered, from every angle.')}</h1>
          <p>{collection?.description ?? 'Timeless pieces, designed to find their place in the everyday.'}</p>
          <span className="shop-hero-rule" />
        </div>
      </section>

      <section className="shop-main container-wide">
        <div className="shop-toolbar">
          <div className="shop-result-count"><SlidersHorizontal size={15} strokeWidth={1.35} /><span>{visibleProducts.length} {visibleProducts.length === 1 ? 'piece' : 'pieces'}</span></div>
          <div className="shop-filters" aria-label="Filter and sort products">
            <label className="filter-select-label">DEPARTMENT
              <select value={department} onChange={(event) => updateFilter('department', event.target.value)} aria-label="Filter by department">
                <option value="">All</option><option value="Women">Women</option><option value="Men">Men</option><option value="Unisex">Accessories</option>
              </select>
            </label>
            <label className="filter-select-label">CATEGORY
              <select value={category} onChange={(event) => updateFilter('category', event.target.value)} aria-label="Filter by category">
                <option value="">All categories</option>
                {availableCategories.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <label className="filter-select-label">SORT BY
              <select value={sort} onChange={(event) => updateFilter('sort', event.target.value)} aria-label="Sort products">
                <option value="featured">Featured</option><option value="popular">Best sellers</option><option value="newest">New arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>

        {dataMode === 'demo' && <div className="demo-data-note"><span className="demo-dot" /> SAMPLE COLLECTION <span>·</span> Product names, images and prices are illustrative until live stock is added.</div>}
        {isLoading && <p className="loading-note" role="status">Curating the collection…</p>}
        {catalogMessage && <p className="catalog-inline-note" role="status">{catalogMessage}</p>}

        {visibleProducts.length ? <ProductGrid products={visibleProducts} /> : (
          <div className="empty-collection">
            <span className="eyebrow">NOTHING HERE JUST YET</span>
            <h2>{heading}</h2>
            <p>Try another category or return to the full ÉLVARÉ collection.</p>
            <Link to="/shop" className="button button-dark">EXPLORE ALL PIECES <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
          </div>
        )}
      </section>

      <div className="shop-bottom-note"><span className="gold-rule" /><p>Considered pieces. A little less, a little better.</p><Link to="/about" className="underlined-link">THE ÉLVARÉ APPROACH <ArrowUpRight size={14} strokeWidth={1.4} /></Link></div>
    </>
  );
}
