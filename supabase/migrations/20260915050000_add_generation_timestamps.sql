alter table public.raffle_generations
  add column updated_at timestamptz not null default now();

update public.raffle_generations
set updated_at = created_at;
