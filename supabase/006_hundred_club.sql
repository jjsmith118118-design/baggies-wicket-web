-- =====================================================================
-- Update 006: the 100 Club lottery
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run
-- Safe to run again (it skips anything that already exists).
-- =====================================================================

-- One row per number, 1–100. Who holds it, until when, and any hold
-- while a payment is on its way.
create table if not exists public.club_numbers (
  number          integer primary key check (number between 1 and 100),
  holder_id       uuid references public.profiles (id) on delete set null,
  paid_until      date,
  reserved_by     uuid references public.profiles (id) on delete set null,
  reserved_until  timestamptz,
  reserved_payment_id uuid
);
insert into public.club_numbers (number)
  select n from generate_series(1, 100) as n
  on conflict (number) do nothing;

-- One row per purchase (one or more numbers, one year each).
create table if not exists public.lottery_payments (
  id                    uuid primary key default gen_random_uuid(),
  member_id             uuid not null references public.profiles (id) on delete cascade,
  numbers               integer[] not null,
  amount_pence          integer not null check (amount_pence > 0),
  reference             text not null unique,      -- what the member puts on the bank transfer
  method                text not null check (method in ('truelayer', 'bank_transfer')),
  status                text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  provider_payment_id   text,                      -- TrueLayer's payment id, for pay-by-bank
  unassigned_numbers    integer[],                 -- numbers someone else took before this payment arrived
  created_at            timestamptz not null default now(),
  paid_at               timestamptz,
  confirmed_by          uuid references public.profiles (id) on delete set null -- committee member, or null if automatic
);
create index if not exists lottery_payments_member_idx on public.lottery_payments (member_id);
create index if not exists lottery_payments_status_idx on public.lottery_payments (status);
-- A TrueLayer payment can only ever pay for one purchase.
create unique index if not exists lottery_payments_provider_payment_idx on public.lottery_payments (provider_payment_id);

-- One row per monthly draw.
create table if not exists public.lottery_draws (
  id                 uuid primary key default gen_random_uuid(),
  draw_month         date not null unique,         -- first of the month; one draw per month
  drawn_at           timestamptz not null default now(),
  drawn_by           uuid references public.profiles (id) on delete set null,
  eligible_numbers   integer[] not null,           -- every number in the draw, for the record
  first_number       integer not null,
  first_holder_id    uuid references public.profiles (id) on delete set null,
  first_winner_name  text not null,                -- e.g. "Jordan S."
  first_prize_pence  integer not null,
  second_number      integer not null,
  second_holder_id   uuid references public.profiles (id) on delete set null,
  second_winner_name text not null,
  second_prize_pence integer not null,
  prizes_paid_at     timestamptz
);

-- ---------- Row Level Security ---------------------------------------
-- All changes go through the server (service role). Browsers only read.
alter table public.club_numbers     enable row level security;
alter table public.lottery_payments enable row level security;
alter table public.lottery_draws    enable row level security;

drop policy if exists "club_numbers: admin read" on public.club_numbers;
create policy "club_numbers: admin read" on public.club_numbers
  for select using (public.is_admin());

drop policy if exists "lottery_payments: read own or admin" on public.lottery_payments;
create policy "lottery_payments: read own or admin" on public.lottery_payments
  for select using (member_id = auth.uid() or public.is_admin());

drop policy if exists "lottery_draws: members read" on public.lottery_draws;
create policy "lottery_draws: members read" on public.lottery_draws
  for select using (auth.uid() is not null);

-- ---------- The board members see -------------------------------------
-- Members can't see who holds which number, only whether it's free.
create or replace function public.lottery_board()
returns table (number integer, state text, paid_until date)
language sql stable security definer set search_path = public as $$
  select n.number,
    case
      when n.holder_id = auth.uid() and n.paid_until >= current_date - 30 then 'mine'
      when n.reserved_by = auth.uid() and n.reserved_until > now() then 'mine_pending'
      when n.reserved_until > now() then 'reserved'
      when n.holder_id is not null and n.paid_until >= current_date - 30 then 'taken'
      else 'available'
    end,
    case when n.holder_id = auth.uid() then n.paid_until end
  from public.club_numbers n
  order by n.number;
$$;
grant execute on function public.lottery_board() to authenticated;

-- ---------- Server-only actions ---------------------------------------

-- Hold numbers for a member and record the pending payment, all at once,
-- so two people can't grab the same number.
create or replace function public.lottery_reserve(
  p_member uuid, p_numbers integer[], p_amount integer, p_reference text,
  p_method text, p_reserve_days integer, p_grace_days integer
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_payment uuid := gen_random_uuid();
  v_row public.club_numbers;
begin
  for v_row in
    select * from public.club_numbers where number = any (p_numbers) order by number for update
  loop
    if v_row.reserved_until > now() and v_row.reserved_by is distinct from p_member then
      raise exception 'NUMBER_UNAVAILABLE:%', v_row.number;
    end if;
    if v_row.holder_id is not null and v_row.holder_id <> p_member
       and v_row.paid_until >= current_date - p_grace_days then
      raise exception 'NUMBER_UNAVAILABLE:%', v_row.number;
    end if;
  end loop;

  insert into public.lottery_payments (id, member_id, numbers, amount_pence, reference, method)
  values (v_payment, p_member, p_numbers, p_amount, p_reference, p_method);

  update public.club_numbers
     set reserved_by = p_member,
         reserved_until = now() + make_interval(days => p_reserve_days),
         reserved_payment_id = v_payment
   where number = any (p_numbers);

  return v_payment;
end;
$$;

-- Mark a payment as paid and give the member their numbers for a year
-- (added on to any time they already have). Safe to call twice.
-- Returns true only for the call that actually changed it.
create or replace function public.lottery_mark_paid(
  p_payment uuid, p_confirmed_by uuid, p_grace_days integer
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_pay public.lottery_payments;
  v_row public.club_numbers;
  v_skipped integer[] := '{}';
begin
  select * into v_pay from public.lottery_payments where id = p_payment for update;
  if not found or v_pay.status = 'paid' then return false; end if;

  for v_row in
    select * from public.club_numbers where number = any (v_pay.numbers) order by number for update
  loop
    if v_row.holder_id is not null and v_row.holder_id <> v_pay.member_id
       and v_row.paid_until >= current_date - p_grace_days then
      -- Someone else holds it now (this payment arrived after the hold ran out).
      v_skipped := v_skipped || v_row.number;
      continue;
    end if;
    update public.club_numbers set
      paid_until = case
        when holder_id = v_pay.member_id and paid_until >= current_date then (paid_until + interval '1 year')::date
        else (current_date + interval '1 year')::date end,
      holder_id = v_pay.member_id,
      reserved_by = null, reserved_until = null, reserved_payment_id = null
    where number = v_row.number;
  end loop;

  update public.lottery_payments
     set status = 'paid', paid_at = now(), confirmed_by = p_confirmed_by,
         unassigned_numbers = nullif(v_skipped, '{}')
   where id = p_payment;
  return true;
end;
$$;

create or replace function public.lottery_cancel(p_payment uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.club_numbers
     set reserved_by = null, reserved_until = null, reserved_payment_id = null
   where reserved_payment_id = p_payment;
  update public.lottery_payments set status = 'cancelled' where id = p_payment and status = 'pending';
  return found;
end;
$$;

-- Only the server (service role) may run these.
revoke all on function public.lottery_reserve(uuid, integer[], integer, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.lottery_mark_paid(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.lottery_cancel(uuid) from public, anon, authenticated;
