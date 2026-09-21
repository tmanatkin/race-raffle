alter table public.raffle_entries
  add column prize_number integer;

alter table public.raffle_entries
  add constraint raffle_entries_prize_number_check
  check (
    (prize_type = 'prize' and prize_number > 0)
    or (prize_type is null and prize_number is null)
  );
