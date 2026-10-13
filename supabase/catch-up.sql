-- =====================================================================
-- CATCH-UP SCRIPT – brings the database fully up to date.
-- Safe to run even if you've already run some earlier scripts.
-- (Requires schema.sql to have been run once already.)
-- Prices are in pence: 9000 = £90. EDIT THEM before running.
-- =====================================================================

-- New columns
alter table public.products
  add column if not exists price_2nd_child_pence integer check (price_2nd_child_pence > 0),
  add column if not exists price_3rd_child_pence integer check (price_3rd_child_pence > 0),
  add column if not exists unlocks_family_rate boolean not null default false;

alter table public.order_items
  add column if not exists full_price_pence integer,
  add column if not exists sibling_position integer;

-- Switch off the separate U11–U20 memberships (keeps U9 and Adult)
update public.products set active = false
where category = 'membership' and season = '2027'
  and age_group is not null and age_group not in ('U9', 'Adult');

-- One junior sub for all junior ages
insert into public.products (name, description, category, price_pence, season, age_group, sort_order)
select 'Junior Membership 2027', 'Junior subs for the 2027 season', 'membership', 9000, '2027', null, 10
where not exists (select 1 from public.products where name = 'Junior Membership 2027');

update public.products
set active = true, age_group = null,
    price_pence = 9000,             -- 1st child
    price_2nd_child_pence = 6000,   -- 2nd child
    price_3rd_child_pence = 4000    -- 3rd child and beyond
where name = 'Junior Membership 2027';

-- Adult memberships
insert into public.products (name, description, category, price_pence, season, age_group, sort_order)
select 'Adult Playing Membership 2027', 'For adults playing league or friendly cricket', 'membership', 15000, '2027', 'Adult', 30
where not exists (select 1 from public.products where name = 'Adult Playing Membership 2027');

insert into public.products (name, description, category, price_pence, season, age_group, sort_order)
select 'Adult Social Membership 2027', 'Non-playing members and supporters', 'membership', 3000, '2027', 'Adult', 31
where not exists (select 1 from public.products where name = 'Adult Social Membership 2027');

-- Adult Playing gives the family's 1st child the 2nd-child rate
update public.products set unlocks_family_rate = true
where name = 'Adult Playing Membership 2027';

-- Show what's on sale now
select name, age_group, price_pence, price_2nd_child_pence, price_3rd_child_pence, unlocks_family_rate, active
from public.products order by active desc, sort_order;
