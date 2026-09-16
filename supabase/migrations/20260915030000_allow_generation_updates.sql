create policy "Anyone can update raffle generations"
  on public.raffle_generations
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant update on public.raffle_generations to anon, authenticated;