create table public.qr_scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.qr_scans enable row level security;

create policy "Anyone can create qr scans"
  on public.qr_scans
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.qr_scans to anon, authenticated;