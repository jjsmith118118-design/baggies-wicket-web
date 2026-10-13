-- =====================================================================
-- Update 002: sibling discounts + adult memberships
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run
-- (You've already run schema.sql; this adds to it.)
-- =====================================================================

-- Sibling rates on memberships. Leave both empty (null) for no discount.
--   price_2nd_child_pence: price for the family's 2nd junior membership
--   price_3rd_child_pence: price for the 3rd and every one after
alter table public.products
  add column if not exists price_2nd_child_pence integer check (price_2nd_child_pence > 0),
  add column if not exists price_3rd_child_pence integer check (price_3rd_child_pence > 0);

-- Record what was charged and why, for your records.
alter table public.order_items
  add column if not exists full_price_pence integer,
  add column if not exists sibling_position integer;

-- ---------- EDIT THESE PRICES (pence: 6000 = £60) --------------------

-- Sibling rates for the junior membership
update public.products
set price_2nd_child_pence = 6000,   -- 2nd child
    price_3rd_child_pence = 4000    -- 3rd child and beyond
where name = 'Junior Membership 2027';

-- Adult memberships. Adults choose which one they want.
-- age_group must be exactly 'Adult'. Add, rename or remove rows as you like.
insert into public.products (name, description, category, price_pence, season, age_group, sort_order) values
  ('Adult Playing Membership 2027', 'For adults playing league or friendly cricket', 'membership', 15000, '2027', 'Adult', 30),
  ('Adult Social Membership 2027',  'Non-playing members and supporters',           'membership',  3000, '2027', 'Adult', 31);
