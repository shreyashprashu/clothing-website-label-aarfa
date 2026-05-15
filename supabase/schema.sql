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
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  insert into public.profiles (id, email)
  values (new.id, new.email)
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

-- Profiles: a user reads/updates only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
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
