-- Label Aarfa — Supabase schema
-- Paste this into the SQL Editor in your Supabase project and run.
-- Idempotent (uses `if not exists` / `or replace`) so it is safe to re-run.

-- =============================================================
-- Tables
-- =============================================================

-- Profile data tied 1:1 to Supabase auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Add avatar_url for older schemas that pre-dated this column.
alter table public.profiles add column if not exists avatar_url text;

-- Saved addresses (a user can have many)
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- Orders (one per checkout). Money is stored in paise (INR * 100) to avoid float drift.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,  -- null for guest checkout
  guest_email text,                                        -- captured when no user_id
  status text not null default 'created'
    check (status in ('created','paid','failed','shipped','delivered','cancelled','refunded','cod_confirmed')),
  payment_method text not null default 'razorpay'
    check (payment_method in ('razorpay','cod')),

  subtotal_paise int not null,
  shipping_paise int not null default 0,
  total_paise int not null,
  currency text not null default 'INR',

  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,

  shipping_address jsonb not null,    -- snapshot at order time

  notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz
);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Promo code applied at checkout (idempotent for older schemas)
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists discount_paise int not null default 0;

-- Line items for each order. product_id mirrors the IDs in data/products.js / src/App.jsx
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id int not null,
  product_name text not null,
  size text not null,
  color text not null,
  quantity int not null check (quantity > 0),
  unit_price_paise int not null,
  line_total_paise int not null
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Newsletter sign-ups
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text not null default 'active' check (status in ('active','unsubscribed')),
  subscribed_at timestamptz not null default now()
);

-- Inbound contact-form messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Wishlist (one row per (user, product). Lets us return saved items across devices.)
create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users on delete cascade,
  product_id int not null,
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.wishlist_items enable row level security;
drop policy if exists "wishlist_own" on public.wishlist_items;
create policy "wishlist_own" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Persistent cart for logged-in users. Stored as a single JSONB blob keyed on user_id
-- so writes are atomic (no fighting with composite-key inserts on quantity changes).
-- Shape mirrors the localStorage cart: [{ key, productId, size, color, quantity }].
create table if not exists public.user_carts (
  user_id uuid primary key references auth.users on delete cascade,
  cart jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_carts enable row level security;
drop policy if exists "user_cart_own" on public.user_carts;
create policy "user_cart_own" on public.user_carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Auto-create a profile row when a new auth.user is created
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Pull whatever profile fields the OAuth provider gave us (Google returns
  -- full_name + avatar_url in raw_user_meta_data; email-OTP signups have neither
  -- and stay null until the user later signs in with a provider that supplies them).
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles: a user reads/inserts/updates only their own row. The INSERT
-- policy matters because the client `upsert(profilePatch, {onConflict:'id'})`
-- on sign-in does INSERT when the row doesn't exist yet (e.g. for users who
-- signed up before the handle_new_user trigger existed). Without it, the
-- upsert returns 403.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Addresses: full CRUD on rows you own
drop policy if exists "addresses_own" on public.addresses;
create policy "addresses_own" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders: read your own (writes happen only via server with service_role, which bypasses RLS)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);

-- Order items: readable if you can read the parent order
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
);

-- newsletter_subscribers + contact_messages: writes only via service_role, no client reads.
-- Keep RLS off (default) and never expose anon-key queries to these tables from the client.
-- If you want defence in depth: enable RLS with no policies.

-- =============================================================
-- Inventory — single source of truth for live stock
-- =============================================================
-- One row per product_id. `stock` is decremented atomically when an order
-- is placed (via try_decrement_stock below). Service role only writes;
-- the client reads through /api/inventory which uses service_role too,
-- so RLS is left off and the public anon key never touches this table.
create table if not exists public.product_stock (
  product_id int primary key,
  stock int not null default 0 check (stock >= 0),
  updated_at timestamptz not null default now()
);

-- Seed initial stock from the hardcoded values in api/_lib/products.js +
-- src/App.jsx. `on conflict do nothing` means re-running this file never
-- overwrites the live stock in production — only fills in newly-added
-- product ids. Adjust quantities manually via the Supabase dashboard.
insert into public.product_stock (product_id, stock) values
  -- Legacy line (intentionally sold out)
  (1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),(8,0),
  (9,0),(10,0),(11,0),(12,0),(13,0),(14,0),(15,0),(16,0),
  -- Premium Collection (active)
  (101,8),(102,3),(103,4),(104,5),(105,3),(106,3),(107,3),(108,3),
  (109,4),(110,5),(111,1),(112,10),(113,3),(114,5),(115,10),
  -- Co-ord Sets (Solid Farshi, 5 colour variants)
  (201,10),(202,10),(203,10),(204,10),(205,10),
  -- Pakistani Ready-to-Wear
  (301,8),(302,6),(303,7),(304,7),(305,7),(306,7),(307,7),(308,7),(309,7),(310,7),
  -- Unstitched Collection
  (401,5),(402,5),(403,5),(404,5),(405,5),(406,5),(407,5),(408,5),(409,5),(410,5),
  (411,5),(412,5),(413,5),(414,5),(415,5),(416,5),(417,5),(418,5),(419,5),
  (420,3),(421,3)
on conflict (product_id) do nothing;

-- Atomically check + decrement stock for a basket. Returns
--   { ok: true }
-- on success, or
--   { ok: false, insufficient_product_id: <id>, available: <int>, requested: <int> }
-- on failure (no rows mutated). Rows are locked in product_id order to
-- avoid deadlocks between concurrent checkouts hitting overlapping items.
create or replace function public.try_decrement_stock(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  pid int;
  qty int;
  cur int;
begin
  -- First pass: lock + verify every row, abort if any is short.
  for item in
    select e from jsonb_array_elements(p_items) e
    order by (e->>'product_id')::int
  loop
    pid := (item->>'product_id')::int;
    qty := (item->>'qty')::int;
    select stock into cur from public.product_stock where product_id = pid for update;
    if cur is null then
      -- Lazy-seed any product the in-memory catalogue knows about but the DB
      -- doesn't yet (new products added after the seed). Default to 0 so we
      -- fail safe — admin must explicitly raise it.
      insert into public.product_stock (product_id, stock) values (pid, 0);
      cur := 0;
    end if;
    if cur < qty then
      return jsonb_build_object(
        'ok', false,
        'insufficient_product_id', pid,
        'available', cur,
        'requested', qty
      );
    end if;
  end loop;

  -- Second pass: every row already locked, decrement is safe.
  for item in select e from jsonb_array_elements(p_items) e loop
    pid := (item->>'product_id')::int;
    qty := (item->>'qty')::int;
    update public.product_stock
      set stock = stock - qty, updated_at = now()
      where product_id = pid;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

-- Inverse helper for refunds / cancelled-after-paid scenarios. Adds qty back
-- to the row, lazy-seeds if missing. Never throws on missing row.
create or replace function public.increment_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  pid int;
  qty int;
begin
  for item in select e from jsonb_array_elements(p_items) e loop
    pid := (item->>'product_id')::int;
    qty := (item->>'qty')::int;
    insert into public.product_stock (product_id, stock)
      values (pid, qty)
      on conflict (product_id) do update
      set stock = public.product_stock.stock + excluded.stock,
          updated_at = now();
  end loop;
end;
$$;
