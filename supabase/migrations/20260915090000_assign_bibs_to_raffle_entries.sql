alter table public.bib_claims
  add column generation_id uuid references public.raffle_generations(id),
  add column raffle_position integer,
  add column prize_type text check (prize_type in ('prize') or prize_type is null);

create unique index bib_claims_generation_position_idx
  on public.bib_claims (generation_id, raffle_position)
  where generation_id is not null and raffle_position is not null;

create or replace function public.claim_bib_number(p_bib_number integer)
returns table (
  status text,
  bib_number integer,
  generation_id uuid,
  raffle_position integer,
  prize_type text
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
begin
  select * into current_generation
  from public.raffle_generations
  order by created_at desc
  limit 1
  for update;

  if current_generation.id is null then
    return query select 'no_generation'::text, p_bib_number, null::uuid, null::integer, null::text;
    return;
  end if;

  if p_bib_number < 0 or p_bib_number > (select highest_bib_number from public.raffle_settings where id = 1) then
    return query select 'invalid'::text, p_bib_number, null::uuid, null::integer, null::text;
    return;
  end if;

  select * into existing_claim
  from public.bib_claims
  where bib_claims.bib_number = p_bib_number;

  if found then
    return query select
      'already_claimed'::text,
      existing_claim.bib_number,
      existing_claim.generation_id,
      existing_claim.raffle_position,
      existing_claim.prize_type;
    return;
  end if;

  select coalesce(max(raffle_position), 0) + 1 into next_position
  from public.bib_claims
  where bib_claims.generation_id = current_generation.id;

  select raffle_entries.prize_type into assigned_prize_type
  from public.raffle_entries
  where raffle_entries.generation_id = current_generation.id
    and raffle_entries.position = next_position;

  if not found then
    return query select 'list_exhausted'::text, p_bib_number, current_generation.id, null::integer, null::text;
    return;
  end if;

  insert into public.bib_claims (bib_number, generation_id, raffle_position, prize_type)
  values (p_bib_number, current_generation.id, next_position, assigned_prize_type);

  return query select
    'claimed'::text,
    p_bib_number,
    current_generation.id,
    next_position,
    assigned_prize_type;
end;
$$;

grant execute on function public.claim_bib_number(integer) to anon, authenticated;
