# ÉLVARÉ — The Art of Elegance

A responsive luxury-fashion storefront built around the supplied ÉLVARÉ emblem and wordmark. It includes editorial campaign imagery, a browsable sample catalog, product detail pages, a persistent local cart, a clearly labelled demo checkout, brand and contact pages, and a Supabase-ready administration console.

> **Launch status:** This is a fully interactive demo storefront, not a live shop. Product names, photographs, KSh prices, stock and delivery estimate are sample content. No payment is collected. The M-Pesa Daraja integration and real contact details have not been supplied or configured.

## Features

- Editorial home page with campaign hero, collection stories, best sellers, new arrivals, brand philosophy and newsletter form.
- Shop, collection, search, department/category filtering and price/popularity sorting.
- Individual product pages with colour/size selection, composition, fit and delivery notes. The Linen Shirt demo has five colourways; its selected swatch updates the garment photo and carries that variant image into the bag and checkout. Database colour options can include an optional `image` path for the same behaviour on live products.
- Responsive mobile navigation and accessible focus states.
- Persistent browser-local cart with add/remove, quantity controls, subtotal and checkout summary.
- Kenyan checkout fields (47 counties), sample KSh 350 delivery estimate, and a deliberately non-paying “Place demo order” action.
- About and contact pages. Contact channels remain labelled as coming soon; form submissions are not sent in local demo mode.
- Private admin route: Supabase Auth password sign-in, server-side `is_admin()` verification, product CRUD, protected image uploads, stock management, order status updates, customer/order overview and unpaid-order caveats.
- Supabase SQL migration with tables, validation, storage bucket and row-level security. Public orders are only created through a price-recalculating RPC and remain `awaiting_payment`.
- Supplied brand logo is preserved in `public/images/elvare-logo-original.png` and used as optimized lockup, emblem and wordmark assets. Campaign and product images are optimized WebP files in `public/images/`.

## Technologies

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3 (design tokens/config) with a custom responsive editorial stylesheet
- React Router
- Lucide React icons
- Supabase JS (optional live catalog, Auth, Postgres, RPC and Storage)

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local   # optional; leave blank for local demo mode
npm run dev
```

Open the local Vite URL. The shop works with demo data and the localStorage cart even with no Supabase project. Demo checkout creates only an in-page preview reference; it does not save customer data or send an order. Contact and newsletter forms show an explicit “not sent” preview message when unconfigured.

Useful commands:

```bash
npm run typecheck
npm run build
npm run preview
```

## Environment variables

Only a Supabase project URL and the **public anon/publishable key** are used by this browser app:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Copy `.env.example` to `.env.local` for local development. Do not commit `.env.local`. **Never put a Supabase service-role key, M-Pesa consumer secret, passkey, or other privileged credential in a `VITE_` variable or browser code.**

If Supabase is not configured, the storefront stays in demo mode. If the URL/key are present but the live product table is empty/unavailable, the UI falls back to clearly identified sample products rather than claiming the catalog is live.

## Supabase setup

1. Create a Supabase project and set `VITE_SUPABASE_URL` and the public anon/publishable key.
2. Run `supabase/migrations/20261126000000_init_elvare.sql` in the Supabase SQL editor (or adapt it to your migration workflow). It creates `products`, `profiles`, `orders`, `order_items`, `contact_messages` and `newsletter_subscribers`, plus a public-read product image bucket with admin-only writes.
3. In **Authentication → Users**, create an owner account. Confirm its `profiles` row exists, then grant its UUID the admin role from the SQL editor using the project’s trusted SQL/admin context:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'AUTH_USER_UUID';
   ```

   The browser has no sign-up flow or hard-coded admin credentials. The route checks the authenticated user with the `is_admin()` Postgres function; every privileged table/storage operation is independently restricted by RLS.
4. Add real inventory in the admin console (or insert it through a trusted process). Product images can be uploaded to the `product-images` bucket by verified administrators. To preview distinct colourways, include an `image` property alongside each colour’s `name` and `hex` in the product `colors` JSON array.
5. Verify anonymous access sees only active products and cannot query orders, profiles, messages or subscribers. Test with a non-admin authenticated account; it should be denied store-management access.
6. Review the SQL policies, privacy/retention obligations and the illustrative KSh 350 fee. Replace the demo content and obtain the brand’s approved copy, pricing, stock, delivery and returns policies before launch.

### Database and order safety

- Storefront reads only active product rows. Admin CRUD and image upload permissions depend on the database `is_admin()` role function and RLS, not on hidden frontend routes.
- Guest checkout calls `place_demo_order(...)`. The function validates item IDs, size, colour and quantity, then recalculates prices from the database. It records an `awaiting_payment` order only; it does not reserve/decrement inventory or prove a payment.
- Order values in the admin dashboard are **not collected revenue**. Do not mark an order as paid based on this status selector.
- Supabase table and storage access are controlled by policies in the migration. Do not disable RLS or expose service-role credentials to make the browser UI work.

## Remaining production integrations

- M-Pesa Daraja: implement server-side initiation/callback verification (prefer a Supabase Edge Function or secure backend), store credentials only as server secrets, validate callbacks and idempotency, reconcile payment before changing order/stock state, and test against the Daraja sandbox before production.
- Shipping: confirm courier coverage, real delivery rates, fulfilment windows and returns/exchange policy; replace the sample flat estimate.
- Business details: supply approved support email, phone, social handles, legal/privacy/terms copy, brand-approved product imagery, prices, sizes, colourways and inventory.
- Email: connect a verified transactional/newsletter provider; demo newsletter/message forms are not sent unless the matching Supabase schema is configured, and Supabase table inserts alone do not send email.
- Production hardening: add CAPTCHA/rate limiting and abuse monitoring to public forms/order RPC, privacy retention/consent rules, backups, monitoring, and end-to-end payment/order tests.

## Deploy to Vercel

1. Import the repository into Vercel and use the **Vite** preset (build command `npm run build`, output directory `dist`).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project → Settings → Environment Variables if using Supabase. Re-deploy after changing variables.
3. Add a SPA rewrite so React Router routes resolve on direct refresh. Create `vercel.json` with:

   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

4. Configure the Supabase Auth site URL and allowed redirect URLs for the production domain. Use HTTPS and review the Supabase project’s API/RLS settings before announcing the store.

## Project structure

```text
src/
  components/       Navigation, product cards, breadcrumbs, newsletter, page metadata
  context/          Catalog and browser-persistent cart providers
  data/             Sample products and collection definitions
  lib/              Supabase client, product mapping, demo order/form RPCs
  pages/            Home, shop, product, cart, checkout, about, contact, admin
  App.tsx           Routes and provider composition
  styles.css        Responsive ÉLVARÉ design system and page styling
public/images/      Supplied logo assets and optimized campaign/product imagery
supabase/migrations/ Postgres schema, row-level security, safe demo-order RPC, storage policies
```
