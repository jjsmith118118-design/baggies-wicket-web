-- =====================================================================
-- Update 005: parents can mark All Stars / Dynamos as booked with the ECB
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run
-- =====================================================================
alter table public.children
  add column if not exists ecb_booked_season text;
