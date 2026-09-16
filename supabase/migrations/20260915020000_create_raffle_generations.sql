create table public.raffle_generations (
  id uuid primary key,
  prize_count integer not null check (prize_count >= 0),
  racer_count integer not null check (racer_count > 0),
  highest_bib_number integer not null check (highest_bib_number > 0),
  created_at timestamptz not null default now()
);

create index raffle_generations_created_at_idx
  on public.raffle_generations (created_at desc);

alter table public.raffle_generations enable row level security;

create policy "Anyone can create raffle generations"
  on public.raffle_generations
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can view raffle generations"
  on public.raffle_generations
  for select
  to anon, authenticated
  using (true);

grant select, insert on public.raffle_generations to anon, authenticated;
