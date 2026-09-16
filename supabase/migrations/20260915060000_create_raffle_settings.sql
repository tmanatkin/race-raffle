create table public.raffle_settings (
  id integer primary key default 1 check (id = 1),
  highest_bib_number integer not null check (highest_bib_number >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.raffle_settings (highest_bib_number)
select highest_bib_number
from public.raffle_generations
order by created_at desc
limit 1;

insert into public.raffle_settings (highest_bib_number)
select 0
where not exists (select 1 from public.raffle_settings);

alter table public.raffle_settings enable row level security;

create policy "Anyone can view raffle settings"
  on public.raffle_settings
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can update raffle settings"
  on public.raffle_settings
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant select, update on public.raffle_settings to anon, authenticated;
