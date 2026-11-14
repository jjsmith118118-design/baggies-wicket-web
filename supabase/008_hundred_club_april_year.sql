-- =====================================================================
-- Update 008: the 100 Club runs on a club year from 1 April to 31 March
-- Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run (safe to run again)
--
--  * A number bought at any time is in the draws until the next 31 March.
--  * On 1 April every number lapses. From 1 to 14 April last year's holder can
--    renew their own number; nobody else can take it. From 15 April any number
--    that wasn't renewed goes on general sale.
--  * Numbers nobody holds can be bought at any time of year.
-- =====================================================================

-- The 31 March that ends the club year containing a given date.
create or replace function public.lottery_season_end(d date) returns date
language sql immutable as $$
  select make_date(extract(year from d)::int + case when extract(month from d) >= 4 then 1 else 0 end, 3, 31);
$$;

-- What a member sees on the board. Lapsed numbers stay with their holder for
-- 14 days (1-14 April) so only that holder can renew them.
create or replace function public.lottery_board()
returns table (number integer, state text, paid_until date)
language sql stable security definer set search_path = public as $$
  select n.number,
    case
      when n.holder_id = auth.uid() and n.paid_until >= current_date - 14 then 'mine'
      when n.reserved_by = auth.uid() and n.reserved_until > now() then 'mine_pending'
      when n.reserved_until > now() then 'reserved'
      when n.holder_id is not null and n.paid_until >= current_date - 14 then 'taken'
      else 'available'
    end,
    case when n.holder_id = auth.uid() then n.paid_until end
  from public.club_numbers n
  order by n.number;
$$;
grant execute on function public.lottery_board() to authenticated;

-- Holding numbers while payment arrives. Same as before, plus: a member can't
-- pay again for a number that's already paid up for this club year.
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
    if v_row.holder_id = p_member and v_row.paid_until >= public.lottery_season_end(current_date) then
      raise exception 'ALREADY_PAID:%', v_row.number;
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

-- Marking paid: the number is now in the draws until 31 March of the current
-- club year (never shortening anything already paid for).
create or replace function public.lottery_mark_paid(
  p_payment uuid, p_confirmed_by uuid, p_grace_days integer
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_pay public.lottery_payments;
  v_row public.club_numbers;
  v_skipped integer[] := '{}';
  v_until date := public.lottery_season_end(current_date);
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
      paid_until = case when holder_id = v_pay.member_id and paid_until > v_until then paid_until else v_until end,
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

revoke all on function public.lottery_reserve(uuid, integer[], integer, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.lottery_mark_paid(uuid, uuid, integer) from public, anon, authenticated;
