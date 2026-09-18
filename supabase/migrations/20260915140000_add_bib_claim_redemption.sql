alter table public.bib_claims
  add column redeemed_at timestamptz;

drop function if exists public.claim_bib_number(integer);

create function public.claim_bib_number(p_bib_number integer)
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
  existing_claim public.bib_claims%rowtype;
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

  select bc.* into existing_claim
  from public.bib_claims as bc
  where bc.bib_number = p_bib_number;

  if found then
    return query select
      'already_claimed'::text,
      existing_claim.bib_number,
      existing_claim.generation_id,
      existing_claim.raffle_position,
      existing_claim.prize_type,
      existing_claim.redeemed_at;
    return;
  end if;

  select coalesce(max(bc.raffle_position), 0) + 1 into next_position
  from public.bib_claims as bc
  where bc.generation_id = current_generation.id;

  select re.prize_type into assigned_prize_type
  from public.raffle_entries as re
  where re.generation_id = current_generation.id
    and re.position = next_position;

  if not found then
    return query select 'list_exhausted'::text, p_bib_number, current_generation.id, null::integer, null::text, null::timestamptz;
    return;
  end if;

  insert into public.bib_claims (bib_number, generation_id, raffle_position, prize_type)
  values (p_bib_number, current_generation.id, next_position, assigned_prize_type);

  return query select
    'claimed'::text,
    p_bib_number,
    current_generation.id,
    next_position,
    assigned_prize_type,
    null::timestamptz;
end;
$$;

grant execute on function public.claim_bib_number(integer) to anon, authenticated;

create or replace function public.redeem_bib_claim(p_bib_number integer)
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
  existing_claim public.bib_claims%rowtype;
begin
  select bc.* into existing_claim
  from public.bib_claims as bc
  where bc.bib_number = p_bib_number
  for update;

  if not found then
    return query select 'not_claimed'::text, p_bib_number, null::text, null::timestamptz;
    return;
  end if;

  if existing_claim.prize_type is null then
    return query select 'no_prize'::text, p_bib_number, existing_claim.prize_type, existing_claim.redeemed_at;
    return;
  end if;

  if existing_claim.redeemed_at is not null then
    return query select 'already_redeemed'::text, p_bib_number, existing_claim.prize_type, existing_claim.redeemed_at;
    return;
  end if;

  update public.bib_claims
  set redeemed_at = now()
  where bib_claims.bib_number = p_bib_number
  returning bib_claims.redeemed_at into existing_claim.redeemed_at;

  return query select 'redeemed'::text, p_bib_number, existing_claim.prize_type, existing_claim.redeemed_at;
end;
$$;

grant execute on function public.redeem_bib_claim(integer) to anon, authenticated;
