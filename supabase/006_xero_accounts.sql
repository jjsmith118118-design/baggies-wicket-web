-- =====================================================================
-- Update 006: optional Xero account code per product
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run
-- Leave xero_account_code empty to use the automatic mapping:
--   junior memberships → 0005, adult → 0002, social → 0025, kit → 0013
-- =====================================================================
alter table public.products
  add column if not exists xero_account_code text;
