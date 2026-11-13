-- =====================================================================
-- Update 007: let members pay subs and kit by bank (TrueLayer) as well as card
-- Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run
-- Safe to run again. Only adds columns; existing orders become "card".
-- =====================================================================

alter table public.orders
  add column if not exists payment_method text not null default 'card',
  add column if not exists payment_reference text,     -- what appears on the club's bank statement
  add column if not exists truelayer_payment_id text;  -- TrueLayer's id for a pay-by-bank order

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_payment_method_check') then
    alter table public.orders
      add constraint orders_payment_method_check check (payment_method in ('card', 'bank'));
  end if;
end $$;

-- Each bank reference is unique, so the treasurer can match it on the statement.
create unique index if not exists orders_payment_reference_idx on public.orders (payment_reference);
-- A TrueLayer payment can only ever pay for one order.
create unique index if not exists orders_truelayer_payment_idx on public.orders (truelayer_payment_id);
