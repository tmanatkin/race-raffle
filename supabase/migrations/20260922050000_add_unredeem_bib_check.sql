create function public.unredeem_bib_check(p_bib_number integer)
returns table (
  status text,
  bib_number integer,
  prize_type text,
  prize_number integer,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_check public.bib_checks%rowtype;
  matching_prize_number integer;
begin
  select bc.* into existing_check
  from public.bib_checks as bc
  where bc.bib_number = p_bib_number
  for update;

  if not found then
    return query select 'not_checked'::text, p_bib_number, null::text, null::integer, null::timestamptz;
    return;
  end if;

  select re.prize_number into matching_prize_number
  from public.raffle_entries as re
  where re.generation_id = existing_check.generation_id
    and re.position = existing_check.raffle_position;

  if existing_check.prize_type is null then
    return query select 'no_prize'::text, p_bib_number, existing_check.prize_type, matching_prize_number, existing_check.redeemed_at;
    return;
  end if;

  if existing_check.redeemed_at is null then
    return query select 'already_unredeemed'::text, p_bib_number, existing_check.prize_type, matching_prize_number, existing_check.redeemed_at;
    return;
  end if;

  update public.bib_checks
  set redeemed_at = null
  where bib_checks.bib_number = p_bib_number;

  return query select 'unredeemed'::text, p_bib_number, existing_check.prize_type, matching_prize_number, null::timestamptz;
end;
$$;

revoke execute on function public.unredeem_bib_check(integer) from public, anon, authenticated;
grant execute on function public.unredeem_bib_check(integer) to service_role;
