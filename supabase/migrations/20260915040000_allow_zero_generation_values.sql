alter table public.raffle_generations
  drop constraint raffle_generations_racer_count_check,
  drop constraint raffle_generations_highest_bib_number_check;

alter table public.raffle_generations
  add constraint raffle_generations_racer_count_check
    check (racer_count >= 0),
  add constraint raffle_generations_highest_bib_number_check
    check (highest_bib_number >= 0);