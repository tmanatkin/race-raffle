create table public.bib_claims (
  bib_number integer primary key check (bib_number >= 0),
  claimed_at timestamptz not null default now()
);

alter table public.bib_claims enable row level security;

create policy "Anyone can claim an unused bib number"
  on public.bib_claims
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.bib_claims to anon, authenticated;
