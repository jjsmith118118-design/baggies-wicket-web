-- =====================================================================
-- Update 004: children can play up into an older age group
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run
-- =====================================================================
alter table public.children
  add column if not exists plays_up boolean not null default false;
