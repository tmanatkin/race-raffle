alter table public.bib_claims rename to bib_checks;
alter table public.bib_checks rename column claimed_at to checked_at;
alter index bib_claims_generation_position_idx rename to bib_checks_generation_position_idx;

drop policy "Anyone can claim an unused bib number" on public.bib_checks;
create policy "Anyone can check an unused bib number"
  on public.bib_checks
  for insert
  to anon, authenticated
  with check (true);

drop policy "Anyone can view bib claim assignments" on public.bib_checks;
create policy "Anyone can view bib check assignments"
  on public.bib_checks
  for select
  to anon, authenticated
  using (true);

drop policy "Anyone can reset bib claim assignments" on public.bib_checks;
create policy "Anyone can reset bib check assignments"
  on public.bib_checks
  for delete
  to anon, authenticated
  using (true);

drop function if exists public.claim_bib_number(integer);

create function public.check_bib_number(p_bib_number integer)
returns table (
  status text,
  bib_number integer,
  generation_id uuid,
  raffle_position integer,
  prize_type text,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_generation public.raffle_generations%rowtype;
  existing_check public.bib_checks%rowtype;
  next_position integer;
  assigned_prize_type text;
  bib_settings public.raffle_settings%rowtype;
begin
  select * into current_generation
  from public.raffle_generations
  order by created_at desc
  limit 1
  for update;

  if current_generation.id is null then
    return query select 'no_generation'::text, p_bib_number, null::uuid, null::integer, null::text, null::timestamptz;
    return;
  end if;

  select * into bib_settings
  from public.raffle_settings as rs
  where rs.id = 1;

  if p_bib_number < bib_settings.lowest_bib_number or p_bib_number > bib_settings.highest_bib_number then
    return query select 'invalid'::text, p_bib_number, null::uuid, null::integer, null::text, null::timestamptz;
    return;
  end if;

  select bc.* into existing_check
  from public.bib_checks as bc
  where bc.bib_number = p_bib_number;

  if found then
    return query select
      'already_checked'::text,
      existing_check.bib_number,
      existing_check.generation_id,
      existing_check.raffle_position,
      existing_check.prize_type,
      existing_check.redeemed_at;
    return;
  end if;

  select coalesce(max(bc.raffle_position), 0) + 1 into next_position
  from public.bib_checks as bc
  where bc.generation_id = current_generation.id;

  select re.prize_type into assigned_prize_type
  from public.raffle_entries as re
  where re.generation_id = current_generation.id
    and re.position = next_position;

  if not found then
    return query select 'list_exhausted'::text, p_bib_number, current_generation.id, null::integer, null::text, null::timestamptz;
    return;
  end if;

  insert into public.bib_checks (bib_number, generation_id, raffle_position, prize_type)
  values (p_bib_number, current_generation.id, next_position, assigned_prize_type);

  return query select
    'checked'::text,
    p_bib_number,
    current_generation.id,
    next_position,
    assigned_prize_type,
    null::timestamptz;
end;
$$;

grant execute on function public.check_bib_number(integer) to anon, authenticated;

drop function if exists public.redeem_bib_claim(integer);

create function public.redeem_bib_check(p_bib_number integer)
returns table (
  status text,
  bib_number integer,
  prize_type text,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_check public.bib_checks%rowtype;
begin
  select bc.* into existing_check
  from public.bib_checks as bc
  where bc.bib_number = p_bib_number
  for update;

  if not found then
    return query select 'not_checked'::text, p_bib_number, null::text, null::timestamptz;
    return;
  end if;

  if existing_check.prize_type is null then
    return query select 'no_prize'::text, p_bib_number, existing_check.prize_type, existing_check.redeemed_at;
    return;
  end if;

  if existing_check.redeemed_at is not null then
    return query select 'already_redeemed'::text, p_bib_number, existing_check.prize_type, existing_check.redeemed_at;
    return;
  end if;

  update public.bib_checks
  set redeemed_at = now()
  where bib_checks.bib_number = p_bib_number
  returning bib_checks.redeemed_at into existing_check.redeemed_at;

  return query select 'redeemed'::text, p_bib_number, existing_check.prize_type, existing_check.redeemed_at;
end;
$$;

grant execute on function public.redeem_bib_check(integer) to anon, authenticated;
