-- =====================================================================
-- Update 003: adult membership unlocks the family rate for juniors
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run
-- =====================================================================

-- When true, buying this (adult) membership means the family's 1st
-- junior is charged the 2nd-child rate.
alter table public.products
  add column if not exists unlocks_family_rate boolean not null default false;

-- Only the adult PLAYING membership qualifies. Add others if you want.
update public.products set unlocks_family_rate = true
where name = 'Adult Playing Membership 2027';
