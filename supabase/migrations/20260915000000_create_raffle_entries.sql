create table public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null,
  position integer not null check (position > 0),
  prize_type text check (prize_type in ('premium', 'rare', 'common')),
  created_at timestamptz not null default now(),
  unique (generation_id, position)
);

create index raffle_entries_generation_position_idx
  on public.raffle_entries (generation_id, position);

alter table public.raffle_entries enable row level security;

create policy "Anyone can create raffle entries"
  on public.raffle_entries
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can view raffle entries"
  on public.raffle_entries
  for select
  to anon, authenticated
  using (true);

grant select, insert on public.raffle_entries to anon, authenticated;
