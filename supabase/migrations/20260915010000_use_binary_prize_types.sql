alter table public.raffle_entries
  drop constraint raffle_entries_prize_type_check;

update public.raffle_entries
set prize_type = 'prize'
where prize_type is not null;

alter table public.raffle_entries
  add constraint raffle_entries_prize_type_check
  check (prize_type = 'prize' or prize_type is null);