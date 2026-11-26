-- ÉLVARÉ storefront foundation
-- Apply this migration to a Supabase project before enabling the live catalog/admin UI.
-- Checkout creates an order marked awaiting_payment only; this migration does not integrate a payment provider.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 1 and 140),
  department text not null default 'Unisex' check (department in ('Men', 'Women', 'Unisex')),
  category text not null,
  collection text not null,
  price_ks integer not null check (price_ks >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text not null default '',
  material text not null default '',
  sizes text[] not null default array['One size']::text[],
  colors jsonb not null default '[]'::jsonb check (jsonb_typeof(colors) = 'array'),
  image_url text not null,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_collection_idx on public.products (is_active, collection);
create index if not exists products_department_category_idx on public.products (department, category);
create index if not exists products_featured_idx on public.products (is_featured, is_best_seller, is_new);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  county text not null,
  town text not null,
  subtotal_ks integer not null check (subtotal_ks >= 0),
  delivery_fee_ks integer not null check (delivery_fee_ks >= 0),
  total_ks integer not null check (total_ks = subtotal_ks + delivery_fee_ks),
  payment_method text not null default 'mpesa_pending' check (payment_method in ('mpesa_pending')),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'processing', 'dispatched', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  image_url text not null,
  unit_price_ks integer not null check (unit_price_ks >= 0),
  quantity integer not null check (quantity between 1 and 10),
  size text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Guest checkout RPC: recalculates all prices from the trusted product table,
-- validates available sizes/colours and records an unpaid demo order.
-- The KSh 350 delivery value is illustrative; update it with the real fulfilment policy before launch.
create or replace function public.place_demo_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address text,
  p_county text,
  p_town text,
  p_items jsonb
)
returns table (order_id uuid, subtotal_ks integer, delivery_fee_ks integer, total_ks integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_product public.products%rowtype;
  v_item jsonb;
  v_normalized_items jsonb := '[]'::jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_size text;
  v_color text;
  v_subtotal integer := 0;
  v_delivery_fee integer := 350;
begin
  if char_length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then
    raise exception 'Please provide a valid customer name.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_customer_email, ''))) not between 5 and 254
     or trim(p_customer_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Please provide a valid email address.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_customer_phone, ''))) not between 7 and 22 then
    raise exception 'Please provide a valid phone number.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_delivery_address, ''))) not between 5 and 300
     or char_length(trim(coalesce(p_county, ''))) not between 2 and 80
     or char_length(trim(coalesce(p_town, ''))) not between 2 and 100 then
    raise exception 'Please provide a complete delivery address.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'The order must contain a list of products.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'The order must contain between one and fifty lines.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'An order line contains an invalid product or quantity.' using errcode = '22023';
    end;

    if v_quantity not between 1 and 10 then
      raise exception 'Each product quantity must be between one and ten.' using errcode = '22023';
    end if;

    select * into v_product
    from public.products p
    where p.id = v_product_id and p.is_active = true;

    if not found then
      raise exception 'One of the selected pieces is no longer available.' using errcode = '22023';
    end if;
    if v_product.stock < v_quantity then
      raise exception 'There is not enough sample stock for %.', v_product.name using errcode = '22023';
    end if;

    v_size := left(trim(coalesce(v_item ->> 'size', '')), 40);
    v_color := left(trim(coalesce(v_item ->> 'color', '')), 80);
    if v_size = '' or (cardinality(v_product.sizes) > 0 and not (v_size = any(v_product.sizes))) then
      raise exception 'The selected size is not available for %.', v_product.name using errcode = '22023';
    end if;
    if v_color = '' or (jsonb_array_length(v_product.colors) > 0 and not exists (
      select 1 from jsonb_array_elements(v_product.colors) as color_option(value)
      where color_option.value ->> 'name' = v_color
    )) then
      raise exception 'The selected colour is not available for %.', v_product.name using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + (v_product.price_ks * v_quantity);
    v_normalized_items := v_normalized_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_slug', v_product.slug,
      'image_url', v_product.image_url,
      'unit_price_ks', v_product.price_ks,
      'quantity', v_quantity,
      'size', v_size,
      'color', v_color
    ));
  end loop;

  if v_subtotal > 10000000 then
    raise exception 'The order value exceeds the demonstration limit.' using errcode = '22023';
  end if;

  insert into public.orders (
    customer_user_id, customer_name, customer_email, customer_phone,
    delivery_address, county, town, subtotal_ks, delivery_fee_ks, total_ks,
    payment_method, status
  ) values (
    auth.uid(), trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    trim(p_delivery_address), trim(p_county), trim(p_town), v_subtotal, v_delivery_fee,
    v_subtotal + v_delivery_fee, 'mpesa_pending', 'awaiting_payment'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_normalized_items)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, product_slug, image_url,
      unit_price_ks, quantity, size, color
    ) values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name',
      v_item ->> 'product_slug',
      v_item ->> 'image_url',
      (v_item ->> 'unit_price_ks')::integer,
      (v_item ->> 'quantity')::integer,
      v_item ->> 'size',
      v_item ->> 'color'
    );
  end loop;

  return query select v_order_id, v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee;
end;
$$;

revoke all on function public.place_demo_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_demo_order(text, text, text, text, text, text, jsonb) to anon, authenticated;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  message text not null check (char_length(trim(message)) between 8 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 5 and 254),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Explicit API grants are paired with (and constrained by) the RLS policies below.
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.profiles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select on public.newsletter_subscribers to authenticated;

-- Public visitors can read active products; every write is administrator-only.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
for select to anon, authenticated
using (is_active = true or public.is_admin());
drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products
for insert to authenticated with check (public.is_admin());
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products
for delete to authenticated using (public.is_admin());

-- Profiles are private to the owner and verified store administrators.
drop policy if exists profiles_owner_or_admin_read on public.profiles;
create policy profiles_owner_or_admin_read on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

-- Guest orders are submitted only through the validating RPC. No public table read/write policies exist.
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders
for select to authenticated using (public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items
for select to authenticated using (public.is_admin());

-- A contact form may submit bounded messages; only administrators can read them.
drop policy if exists contact_public_insert on public.contact_messages;
create policy contact_public_insert on public.contact_messages
for insert to anon, authenticated with check (
  char_length(trim(name)) between 2 and 120
  and char_length(email) between 5 and 254
  and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and char_length(trim(message)) between 8 and 2000
);
drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages
for select to authenticated using (public.is_admin());

-- Newsletter sign-ups are private; table reads are restricted to the store owner.
drop policy if exists newsletter_public_insert on public.newsletter_subscribers;
create policy newsletter_public_insert on public.newsletter_subscribers
for insert to anon, authenticated with check (
  char_length(email) between 5 and 254
  and email = lower(email)
  and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
);
drop policy if exists newsletter_admin_read on public.newsletter_subscribers;
create policy newsletter_admin_read on public.newsletter_subscribers
for select to authenticated using (public.is_admin());

-- Product assets are public to view and private to upload/manage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- No service-role key, M-Pesa credentials or privileged tokens belong in this project.
