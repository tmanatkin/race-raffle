create policy "Anyone can view bib claim assignments"
  on public.bib_claims
  for select
  to anon, authenticated
  using (true);

grant select on public.bib_claims to anon, authenticated;
