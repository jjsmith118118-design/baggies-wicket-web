-- =====================================================================
-- Kingston Bagpuize CC – Members area database
-- For a BRAND NEW project only (already set up? run the numbered update files instead).
-- Run this ONCE in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- =====================================================================

-- ---------- Tables --------------------------------------------------

-- One row per parent/member account (created automatically on sign-up)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Children registered by a parent
create table public.children (
  id             uuid primary key default gen_random_uuid(),
  parent_id      uuid not null references public.profiles (id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  date_of_birth  date not null,
  plays_up       boolean not null default false, -- playing in an older age group (coach agreed)
  ecb_booked_season text,                         -- season the parent says they booked All Stars/Dynamos with the ECB
  created_at     timestamptz not null default now()
);

-- Things the club sells: memberships (subs) and club kit
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  category     text not null check (category in ('membership', 'kit')),
  price_pence  integer not null check (price_pence > 0),
  price_2nd_child_pence integer check (price_2nd_child_pence > 0), -- sibling rate (2nd child)
  price_3rd_child_pence integer check (price_3rd_child_pence > 0), -- sibling rate (3rd+ child)
  season       text,                       -- e.g. '2027' (memberships)
  age_group    text,                       -- e.g. 'U11'; 'Adult'; null = any junior
  unlocks_family_rate boolean not null default false, -- adult membership that gives juniors the 2nd-child rate
  sizes        text[] not null default '{}', -- e.g. {'YS','YM','YL','S','M'}; empty = no sizes
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- One row per checkout
create table public.orders (
  id                     uuid primary key default gen_random_uuid(),
  parent_id              uuid not null references public.profiles (id) on delete cascade,
  status                 text not null default 'pending'
                           check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  total_pence            integer not null,
  stripe_session_id      text unique,
  stripe_payment_intent  text,
  receipt_url            text,
  created_at             timestamptz not null default now(),
  paid_at                timestamptz
);

-- Line items within an order
create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  child_id          uuid references public.children (id) on delete set null,
  description       text not null,          -- snapshot, e.g. "U11 Membership 2027 – Sam Smith"
  category          text not null,
  season            text,
  size              text,
  quantity          integer not null default 1 check (quantity > 0),
  unit_price_pence  integer not null,      -- what was charged
  full_price_pence  integer,               -- before sibling discount
  sibling_position  integer                -- 1st, 2nd, 3rd... junior membership that season
);

create index on public.children (parent_id);
create index on public.orders (parent_id);
create index on public.order_items (order_id);
create index on public.order_items (child_id);

-- ---------- Create a profile automatically when someone signs up ----

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper: is the current user a committee admin? ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------- Row Level Security (who can see what) -------------------

alter table public.profiles    enable row level security;
alter table public.children    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Profiles: you see yourself; admins see everyone.
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());
-- Parents may only edit their name and phone – never is_admin or email.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- Children: parents manage their own; admins can read all.
create policy "children: read own or admin" on public.children
  for select using (parent_id = auth.uid() or public.is_admin());
create policy "children: insert own" on public.children
  for insert with check (parent_id = auth.uid());
create policy "children: update own" on public.children
  for update using (parent_id = auth.uid());
create policy "children: delete own" on public.children
  for delete using (parent_id = auth.uid());

-- Products: anyone can see active products; admins see all.
-- (Add/edit products in the Supabase Table Editor.)
create policy "products: read active" on public.products
  for select using (active or public.is_admin());

-- Orders: read-only for parents (own) and admins (all).
-- Orders are only ever created/updated by the server (service role),
-- so the price can never be tampered with from the browser.
create policy "orders: read own or admin" on public.orders
  for select using (parent_id = auth.uid() or public.is_admin());
create policy "order_items: read own or admin" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.parent_id = auth.uid() or public.is_admin()))
  );

-- ---------- Starter products (EDIT PRICES before going live) --------
-- Prices are in pence: 9000 = £90.00

insert into public.products (name, description, category, price_pence, season, age_group, sizes, sort_order) values
  ('U9 Membership 2027',  'Junior subs for the 2027 season', 'membership',  6000, '2027', 'U9',  '{}', 10),
  ('U11 Membership 2027', 'Junior subs for the 2027 season', 'membership',  8000, '2027', 'U11', '{}', 11),
  ('U13 Membership 2027', 'Junior subs for the 2027 season', 'membership',  9000, '2027', 'U13', '{}', 12),
  ('U15 Membership 2027', 'Junior subs for the 2027 season', 'membership', 10000, '2027', 'U15', '{}', 13),
  ('U18 Membership 2027', 'Junior subs for the 2027 season', 'membership', 11000, '2027', 'U18', '{}', 14),
  ('Junior training shirt', 'Club training top in maroon', 'kit', 2200, null, null, '{"5-6","7-8","9-10","11-12","13","S","M"}', 20),
  ('Club cap', 'Maroon club cap', 'kit', 1500, null, null, '{}', 21);

-- ---------- Make yourself an admin ----------------------------------
-- After you've logged in to the members area once, run this with your email:
--   update public.profiles set is_admin = true where email = 'you@example.com';
