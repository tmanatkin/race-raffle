create policy "Anyone can reset bib claim assignments"
  on public.bib_claims
  for delete
  to anon, authenticated
  using (true);

grant delete on public.bib_claims to anon, authenticated;
