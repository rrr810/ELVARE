import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowUpRight, Boxes, Check, CircleAlert, ClipboardList, ImagePlus, LoaderCircle, LogOut, PackagePlus, Pencil, ShieldCheck, ShoppingBag, Trash2, Users } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { PageMeta, formatKsh } from '../components/PageMeta';
import { useCatalog } from '../context/CatalogContext';
import { PRODUCT_CATEGORIES } from '../data/products';
import { isSupabaseConfigured, mapDatabaseProduct, supabase } from '../lib/supabase';
import type { Department, Product, StoreOrder } from '../types';

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  department: Department;
  category: string;
  collection: string;
  price_ks: string;
  stock: string;
  description: string;
  material: string;
  sizes: string;
  colors_json: string;
  image_url: string;
  is_new: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_active: boolean;
};

type OrderItemRecord = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  size: string;
  color: string;
  unit_price_ks: number;
};

type AdminTab = 'overview' | 'products' | 'orders' | 'customers';

const blankProduct: ProductForm = {
  name: '', slug: '', department: 'Women', category: 'Dresses', collection: 'Signature Collection', price_ks: '', stock: '0',
  description: '', material: '', sizes: 'XS, S, M, L', colors_json: '[{\"name\":\"Warm ivory\",\"hex\":\"#e9e1d3\"}]',
  image_url: '/images/editorial-hero.webp', is_new: true, is_featured: false, is_best_seller: false, is_active: true,
};

const ADMIN_TABS: Array<{ key: AdminTab; label: string; icon: typeof Activity }> = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'products', label: 'Products', icon: Boxes },
  { key: 'orders', label: 'Orders', icon: ClipboardList },
  { key: 'customers', label: 'Customers', icon: Users },
];

const ORDER_STATUSES = ['awaiting_payment', 'processing', 'dispatched', 'delivered', 'cancelled'];

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(supabase));
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRecord[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { refreshCatalog } = useCatalog();
  const client = supabase;

  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsCheckingSession(false);
      }
    });
    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsCheckingSession(false);
      setIsAdmin(false);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!session || !client) return;
    let active = true;
    setIsCheckingRole(true);
    void client.rpc('is_admin').then(({ data, error }) => {
      if (!active) return;
      setIsAdmin(!error && data === true);
      setIsCheckingRole(false);
      if (error) setLoginError('Could not verify administrator access. Check the Supabase migration and access policies.');
    });
    return () => { active = false; };
  }, [session, client]);

  const loadDashboard = useCallback(async () => {
    if (!client) return;
    setIsLoadingData(true);
    setActionError('');
    const [productResult, orderResult, itemResult, profileResult] = await Promise.all([
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
      client.from('order_items').select('id,order_id,product_name,quantity,size,color,unit_price_ks').order('created_at', { ascending: true }).limit(500),
      client.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    const errors = [productResult.error, orderResult.error, itemResult.error, profileResult.error].filter(Boolean);
    if (errors.length) setActionError(errors[0]?.message ?? 'Some store data could not be loaded.');
    setProducts((productResult.data ?? []).map((row) => mapDatabaseProduct(row as Record<string, unknown>)));
    setOrders((orderResult.data ?? []) as StoreOrder[]);
    setOrderItems((itemResult.data ?? []) as OrderItemRecord[]);
    setProfileCount(profileResult.count ?? 0);
    setIsLoadingData(false);
  }, [client]);

  useEffect(() => {
    if (isAdmin) void loadDashboard();
  }, [isAdmin, loadDashboard]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;
    setLoginError('');
    const { error } = await client.auth.signInWithPassword({ email: credentials.email.trim(), password: credentials.password });
    if (error) setLoginError(error.message);
  };

  const handleSignOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    setIsAdmin(false);
  };

  const handleProductChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
      const checked = event.target.checked;
      setProductForm((current) => ({ ...current, [name]: checked }));
      return;
    }
    setProductForm((current) => ({ ...current, [name]: value }));
    if (name === 'name' && !productForm.id) setProductForm((current) => ({ ...current, name: value, slug: slugify(value) }));
  };

  const editProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      department: product.department,
      category: product.category,
      collection: product.collection,
      price_ks: String(product.priceKsh),
      stock: String(product.stock),
      description: product.description,
      material: product.material,
      sizes: product.sizes.join(', '),
      colors_json: JSON.stringify(product.colors, null, 2),
      image_url: product.image,
      is_new: product.isNew,
      is_featured: product.isFeatured,
      is_best_seller: product.isBestSeller,
      is_active: product.isActive ?? true,
    });
    setShowProductForm(true);
    setTab('products');
    window.setTimeout(() => document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !client || !session?.user.id) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setActionError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setActionError('Images must be 8 MB or smaller.');
      return;
    }
    setActionError('');
    setIsUploading(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) setActionError(error.message);
    else {
      const { data } = client.storage.from('product-images').getPublicUrl(path);
      setProductForm((current) => ({ ...current, image_url: data.publicUrl }));
      setActionMessage('Image uploaded to the product-images bucket.');
    }
    setIsUploading(false);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;
    setActionError('');
    setActionMessage('');
    let colors;
    try {
      colors = JSON.parse(productForm.colors_json);
      if (!Array.isArray(colors) || colors.some((color) => typeof color?.name !== 'string' || typeof color?.hex !== 'string')) throw new Error();
    } catch {
      setActionError('Colour options must be valid JSON, for example: [{"name":"Ivory","hex":"#e9e1d3"}].');
      return;
    }
    const payload = {
      name: productForm.name.trim(),
      slug: slugify(productForm.slug || productForm.name),
      department: productForm.department,
      category: productForm.category,
      collection: productForm.collection.trim(),
      price_ks: Number(productForm.price_ks),
      stock: Number(productForm.stock),
      description: productForm.description.trim(),
      material: productForm.material.trim(),
      sizes: productForm.sizes.split(',').map((size) => size.trim()).filter(Boolean).length
        ? productForm.sizes.split(',').map((size) => size.trim()).filter(Boolean)
        : ['One size'],
      colors,
      image_url: productForm.image_url.trim(),
      is_new: productForm.is_new,
      is_featured: productForm.is_featured,
      is_best_seller: productForm.is_best_seller,
      is_active: productForm.is_active,
    };
    if (!payload.name || !payload.slug || !payload.collection || !payload.image_url || !Number.isFinite(payload.price_ks) || payload.price_ks < 0 || !Number.isInteger(payload.stock) || payload.stock < 0) {
      setActionError('Check the product name, collection, image URL, price and stock fields.');
      return;
    }
    setIsSaving(true);
    const query = productForm.id
      ? client.from('products').update(payload).eq('id', productForm.id)
      : client.from('products').insert(payload);
    const { error } = await query;
    setIsSaving(false);
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionMessage(productForm.id ? 'Piece updated.' : 'Piece added to the catalog.');
    setProductForm(blankProduct);
    setShowProductForm(false);
    await loadDashboard();
    await refreshCatalog();
  };

  const deleteProduct = async (product: Product) => {
    if (!client || !window.confirm(`Remove ${product.name} from the catalog?`)) return;
    setActionError('');
    const { error } = await client.from('products').delete().eq('id', product.id);
    if (error) setActionError(error.message);
    else {
      setActionMessage(`${product.name} was removed.`);
      await loadDashboard();
      await refreshCatalog();
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!client) return;
    setActionError('');
    const { error } = await client.from('orders').update({ status }).eq('id', orderId);
    if (error) setActionError(error.message);
    else {
      setActionMessage('Order status updated. This does not indicate payment.');
      await loadDashboard();
    }
  };

  if (!isSupabaseConfigured || !client) {
    return <AdminSetup />;
  }

  return (
    <>
      <PageMeta title="Store administration" description="Secure ÉLVARÉ store administration. Requires a configured Supabase project and an administrator account." />
      {isCheckingSession ? <section className="admin-loading"><LoaderCircle className="spin" size={20} /><span>Checking secure session…</span></section> : !session ? (
        <section className="admin-login-page container-wide">
          <div className="admin-login-aside"><img src="/images/elvare-logo-lockup.webp" alt="ÉLVARÉ — The art of elegance" /><p>THE HOUSE, IN GOOD HANDS</p></div>
          <div className="admin-login-card">
            <Link to="/" className="admin-back-link"><ArrowLeft size={13} /> RETURN TO THE STOREFRONT</Link>
            <p className="eyebrow eyebrow-gold">ÉLVARÉ · PRIVATE ACCESS</p>
            <h1>Welcome <em>back.</em></h1>
            <p className="admin-login-intro">Sign in with an administrator account provisioned in Supabase. New accounts cannot be created here.</p>
            <form onSubmit={handleLogin} className="admin-auth-form">
              <label className="form-field"><span>EMAIL ADDRESS</span><input type="email" autoComplete="username" value={credentials.email} onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} required /></label>
              <label className="form-field"><span>PASSWORD</span><input type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} required minLength={8} /></label>
              {loginError && <p className="form-error" role="alert">{loginError}</p>}
              <button className="button button-dark button-full" type="submit">SIGN IN SECURELY <ShieldCheck size={15} /></button>
            </form>
            <p className="admin-security-note"><ShieldCheck size={15} /> Access is verified server-side with the Supabase <code>is_admin()</code> role check.</p>
          </div>
        </section>
      ) : isCheckingRole ? (
        <section className="admin-loading"><LoaderCircle className="spin" size={20} /><span>Verifying administrator access…</span></section>
      ) : !isAdmin ? (
        <section className="admin-denied container-wide"><CircleAlert size={30} /><p className="eyebrow">PRIVATE ACCESS ONLY</p><h1>This account is not an <em>administrator.</em></h1><p>Store access is granted by an existing Supabase administrator. Your credentials have not been given store privileges.</p><button className="button button-outline-dark" onClick={handleSignOut}>SIGN OUT</button></section>
      ) : (
        <section className="admin-shell">
          <aside className="admin-sidebar">
            <Link className="admin-sidebar-brand" to="/"><img src="/images/elvare-logo-wordmark.webp" alt="ÉLVARÉ" /><span>HOUSE CONSOLE</span></Link>
            <p className="admin-sidebar-label">STORE MANAGEMENT</p>
            <nav aria-label="Administration">
              {ADMIN_TABS.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={`admin-sidebar-link${tab === key ? ' is-active' : ''}`} onClick={() => setTab(key)}><Icon size={17} strokeWidth={1.45} />{label}</button>)}
            </nav>
            <div className="admin-sidebar-bottom"><span><span className="admin-online-dot" /> SUPABASE CONNECTED</span><button type="button" onClick={handleSignOut}><LogOut size={15} /> Sign out</button></div>
          </aside>
          <div className="admin-main">
            <div className="admin-topbar"><div><span className="eyebrow">ÉLVARÉ / STORE MANAGEMENT</span><h1>{ADMIN_TABS.find((item) => item.key === tab)?.label}</h1></div><div className="admin-user"><span className="admin-user-avatar">{session.user.email?.slice(0, 1).toUpperCase() ?? 'É'}</span><span>{session.user.email}</span><span className="admin-role-pill">ADMIN</span></div></div>
            <div className="admin-content">
              <div className="admin-demo-notice"><CircleAlert size={16} /><span><strong>Payments are not enabled.</strong> Orders created from checkout remain awaiting payment and do not confirm a transaction.</span><button type="button" onClick={() => void loadDashboard()} aria-label="Refresh store data"><ArrowDownToLine size={15} /></button></div>
              {actionError && <p className="admin-feedback admin-feedback-error" role="alert">{actionError}</p>}
              {actionMessage && <p className="admin-feedback" role="status"><Check size={15} />{actionMessage}</p>}
              {isLoadingData ? <div className="admin-loading-inline"><LoaderCircle className="spin" size={19} /> Loading store data…</div> : (
                <>
                  {tab === 'overview' && <AdminOverview products={products} orders={orders} profileCount={profileCount} setTab={setTab} />}
                  {tab === 'products' && <AdminProducts products={products} onEdit={editProduct} onDelete={deleteProduct} onNew={() => { setProductForm(blankProduct); setShowProductForm(true); }} />}
                  {tab === 'orders' && <AdminOrders orders={orders} orderItems={orderItems} onStatusChange={updateOrderStatus} />}
                  {tab === 'customers' && <AdminCustomers customers={orders} profileCount={profileCount} />}
                </>
              )}
              {tab === 'products' && showProductForm && (
                <section id="admin-product-form" className="admin-product-editor">
                  <div className="admin-editor-heading"><div><p className="eyebrow">CATALOGUE MANAGEMENT</p><h2>{productForm.id ? 'Refine this piece.' : 'Introduce a new piece.'}</h2></div><button type="button" className="icon-button" onClick={() => setShowProductForm(false)} aria-label="Close product editor">×</button></div>
                  <form className="admin-product-form" onSubmit={saveProduct}>
                    <label className="form-field"><span>PRODUCT NAME</span><input name="name" value={productForm.name} onChange={handleProductChange} required maxLength={140} /></label>
                    <label className="form-field"><span>URL SLUG</span><input name="slug" value={productForm.slug} onChange={handleProductChange} required maxLength={160} /></label>
                    <label className="form-field"><span>DEPARTMENT</span><select name="department" value={productForm.department} onChange={(event) => { const department = event.target.value as Department; setProductForm((current) => ({ ...current, department, category: department === 'Men' ? PRODUCT_CATEGORIES.Men[0] : department === 'Women' ? PRODUCT_CATEGORIES.Women[0] : 'Accessories' })); }}><option>Women</option><option>Men</option><option>Unisex</option></select></label>
                    <label className="form-field"><span>CATEGORY</span><select name="category" value={productForm.category} onChange={handleProductChange}>{(productForm.department === 'Men' ? PRODUCT_CATEGORIES.Men : productForm.department === 'Women' ? PRODUCT_CATEGORIES.Women : ['Accessories']).map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className="form-field"><span>COLLECTION</span><input name="collection" value={productForm.collection} onChange={handleProductChange} required maxLength={120} placeholder="Signature Collection" /></label>
                    <label className="form-field"><span>PRICE · KSh</span><input name="price_ks" type="number" min="0" step="1" value={productForm.price_ks} onChange={handleProductChange} required /></label>
                    <label className="form-field"><span>STOCK</span><input name="stock" type="number" min="0" step="1" value={productForm.stock} onChange={handleProductChange} required /></label>
                    <label className="form-field"><span>MATERIAL</span><input name="material" value={productForm.material} onChange={handleProductChange} maxLength={140} placeholder="100% linen" /></label>
                    <label className="form-field admin-field-wide"><span>DESCRIPTION</span><textarea name="description" value={productForm.description} onChange={handleProductChange} rows={3} maxLength={1200} /></label>
                    <label className="form-field"><span>SIZES · COMMA SEPARATED</span><input name="sizes" value={productForm.sizes} onChange={handleProductChange} placeholder="XS, S, M, L" /></label>
                    <label className="form-field admin-field-wide"><span>COLOURS · JSON</span><textarea name="colors_json" value={productForm.colors_json} onChange={handleProductChange} rows={3} /><small>Example: [{'{'}"name":"Ivory","hex":"#e9e1d3"{'}'}]</small></label>
                    <div className="form-field admin-field-wide"><span>PRODUCT PHOTOGRAPH</span><div className="admin-image-row"><input name="image_url" value={productForm.image_url} onChange={handleProductChange} placeholder="Paste an image URL or upload below" /><label className="admin-upload-button"><ImagePlus size={16} />{isUploading ? 'UPLOADING…' : 'UPLOAD'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={isUploading} /></label></div></div>
                    {productForm.image_url && <div className="admin-image-preview"><img src={productForm.image_url} alt="Product image preview" /><span>Preview</span></div>}
                    <div className="admin-checkboxes admin-field-wide"><label><input type="checkbox" name="is_new" checked={productForm.is_new} onChange={handleProductChange} /> New arrival</label><label><input type="checkbox" name="is_featured" checked={productForm.is_featured} onChange={handleProductChange} /> Featured</label><label><input type="checkbox" name="is_best_seller" checked={productForm.is_best_seller} onChange={handleProductChange} /> Best seller</label><label><input type="checkbox" name="is_active" checked={productForm.is_active} onChange={handleProductChange} /> Visible in store</label></div>
                    <div className="admin-editor-actions admin-field-wide"><button type="button" className="button button-outline-dark" onClick={() => setShowProductForm(false)}>CANCEL</button><button type="submit" className="button button-dark" disabled={isSaving || isUploading}>{isSaving ? 'SAVING…' : productForm.id ? 'SAVE CHANGES' : 'ADD PIECE'} <PackagePlus size={15} /></button></div>
                  </form>
                </section>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function AdminSetup() {
  return <section className="admin-setup container-wide"><PageMeta title="Store administration" description="Supabase setup is required to access the private ÉLVARÉ administration console." /><div className="admin-setup-card"><div className="admin-setup-mark"><img src="/images/elvare-logo-emblem.webp" alt="ÉLVARÉ emblem" /></div><p className="eyebrow">ÉLVARÉ · PRIVATE ACCESS</p><h1>The house is <em>being prepared.</em></h1><p>Store administration is locked until Supabase URL and public anon key are configured. This page never accepts a hard-coded admin password and never exposes a service-role key.</p><div className="admin-setup-steps"><span><Check size={14} /> Add the two public Vite environment variables</span><span><Check size={14} /> Apply the Supabase schema and row-level security policies</span><span><Check size={14} /> Create an administrator account in Supabase Auth</span></div><Link to="/" className="button button-dark">RETURN TO ÉLVARÉ <ArrowUpRight size={14} /></Link></div></section>;
}

function AdminOverview({ products, orders, profileCount, setTab }: { products: Product[]; orders: StoreOrder[]; profileCount: number; setTab: (tab: AdminTab) => void }) {
  const outstandingValue = orders.reduce((sum, order) => sum + Number(order.total_ks || 0), 0);
  const lowStock = products.filter((product) => product.stock < 5).length;
  return (
    <>
      <div className="admin-stats-grid"><article><div className="admin-stat-icon"><Boxes size={17} /></div><span>ACTIVE PRODUCTS</span><strong>{products.filter((item) => item.isActive !== false).length}</strong><small>{lowStock} with fewer than 5 units in stock</small></article><article><div className="admin-stat-icon"><ClipboardList size={17} /></div><span>RECORDED ORDERS</span><strong>{orders.length}</strong><small>Payment status is not verified</small></article><article><div className="admin-stat-icon"><Users size={17} /></div><span>AUTHENTICATED PROFILES</span><strong>{profileCount}</strong><small>Guest checkouts are listed with orders</small></article><article><div className="admin-stat-icon"><ShoppingBag size={17} /></div><span>ORDER VALUE · NOT COLLECTED</span><strong>{formatKsh(outstandingValue)}</strong><small>Recorded values only · no payments</small></article></div>
      <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest orders</h2></div><button className="admin-table-link" onClick={() => setTab('orders')}>ALL ORDERS <ArrowUpRight size={13} /></button></div>{orders.length ? <div className="admin-recent-orders">{orders.slice(0, 5).map((order) => <div key={order.id}><span className="admin-order-icon"><ShoppingBag size={15} /></span><div><strong>{order.customer_name}</strong><small>{new Date(order.created_at).toLocaleDateString('en-KE')} · {order.status.replaceAll('_', ' ')}</small></div><b>{formatKsh(Number(order.total_ks))}</b></div>)}</div> : <p className="admin-empty-state">There are no recorded orders yet.</p>}</section><section className="admin-panel admin-stock-panel"><div className="admin-panel-heading"><div><p className="eyebrow">INVENTORY WATCH</p><h2>Stock to note</h2></div><button className="admin-table-link" onClick={() => setTab('products')}>PRODUCTS <ArrowUpRight size={13} /></button></div>{products.filter((product) => product.stock < 8).slice(0, 5).length ? products.filter((product) => product.stock < 8).slice(0, 5).map((product) => <div className="admin-low-stock" key={product.id}><span className="stock-warning-dot" /><span>{product.name}</span><strong>{product.stock} left</strong></div>) : <p className="admin-empty-state">No low-stock pieces to flag.</p>}</section></div>
      <p className="admin-report-note"><ShieldCheck size={15} /> Sales metrics reflect order values only. They must not be interpreted as paid revenue until a verified payment gateway is connected.</p>
    </>
  );
}

function AdminProducts({ products, onEdit, onDelete, onNew }: { products: Product[]; onEdit: (product: Product) => void; onDelete: (product: Product) => void; onNew: () => void }) {
  return <section className="admin-panel admin-table-panel"><div className="admin-panel-heading"><div><p className="eyebrow">THE CATALOGUE</p><h2>Product inventory</h2></div><button className="button button-dark admin-add-button" onClick={onNew}><PackagePlus size={15} /> ADD A PIECE</button></div>{products.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PIECE</th><th>COLLECTION</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.department} · {product.category}</small></span></div></td><td>{product.collection}</td><td>{formatKsh(product.priceKsh)}</td><td><span className={product.stock < 5 ? 'stock-low' : ''}>{product.stock}</span></td><td><span className={`status-pill${product.isActive === false ? ' status-pill-muted' : ''}`}>{product.isActive === false ? 'HIDDEN' : product.stock < 1 ? 'OUT OF STOCK' : 'ACTIVE'}</span></td><td><div className="admin-row-actions"><button type="button" aria-label={`Edit ${product.name}`} onClick={() => onEdit(product)}><Pencil size={14} /></button><button type="button" aria-label={`Delete ${product.name}`} onClick={() => onDelete(product)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <p className="admin-empty-state">No products yet. Add the first live piece to your catalog.</p>}</section>;
}

function AdminOrders({ orders, orderItems, onStatusChange }: { orders: StoreOrder[]; orderItems: OrderItemRecord[]; onStatusChange: (id: string, status: string) => void }) {
  return <section className="admin-panel admin-table-panel"><div className="admin-panel-heading"><div><p className="eyebrow">CUSTOMER CHECKOUTS</p><h2>Order register</h2></div><span className="admin-table-count">{orders.length} total</span></div>{orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>REFERENCE</th><th>CUSTOMER</th><th>PLACED</th><th>ORDER VALUE</th><th>STATUS</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><details className="admin-order-items"><summary><code>{order.id.slice(0, 8).toUpperCase()}</code><small>VIEW PIECES</small></summary><div>{orderItems.filter((item) => item.order_id === order.id).map((item) => <p key={item.id}><strong>{item.product_name} × {item.quantity}</strong><span>{item.size} · {item.color} · {formatKsh(Number(item.unit_price_ks))} each</span></p>)}</div></details></td><td><div className="admin-order-customer"><strong>{order.customer_name}</strong><small>{order.customer_email} · {order.customer_phone}</small></div></td><td>{new Date(order.created_at).toLocaleDateString('en-KE')}</td><td>{formatKsh(Number(order.total_ks))}</td><td><label className="visually-hidden" htmlFor={`status-${order.id}`}>Order status for {order.customer_name}</label><select id={`status-${order.id}`} className="status-select" value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value)}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></td></tr>)}</tbody></table></div> : <p className="admin-empty-state">No recorded orders yet. Demo checkout orders will appear here after the Supabase migration is applied.</p>}</section>;
}

function AdminCustomers({ customers, profileCount }: { customers: StoreOrder[]; profileCount: number }) {
  const latestByEmail = new Map<string, StoreOrder>();
  const ordersByEmail = new Map<string, number>();
  customers.forEach((order) => {
    const email = order.customer_email.toLowerCase();
    ordersByEmail.set(email, (ordersByEmail.get(email) ?? 0) + 1);
    const existing = latestByEmail.get(email);
    if (!existing || new Date(order.created_at) > new Date(existing.created_at)) latestByEmail.set(email, order);
  });
  const uniqueCustomers = Array.from(latestByEmail.values());
  return <section className="admin-panel admin-table-panel"><div className="admin-panel-heading"><div><p className="eyebrow">CUSTOMER RELATIONSHIPS</p><h2>Customer overview</h2></div><span className="admin-table-count">{uniqueCustomers.length} guest contacts · {profileCount} profiles</span></div><p className="admin-customer-note">Guest contact details are derived from recorded orders. Authentication profiles are counted separately and are only visible to authorised administrators.</p>{uniqueCustomers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CUSTOMER</th><th>EMAIL</th><th>PHONE</th><th>ORDERS</th><th>LATEST ORDER</th></tr></thead><tbody>{uniqueCustomers.map((customer) => <tr key={customer.customer_email}><td>{customer.customer_name}</td><td>{customer.customer_email}</td><td>{customer.customer_phone}</td><td>{ordersByEmail.get(customer.customer_email.toLowerCase()) ?? 0}</td><td>{new Date(customer.created_at).toLocaleDateString('en-KE')}</td></tr>)}</tbody></table></div> : <p className="admin-empty-state">No guest customers have placed an order yet.</p>}</section>;
}
