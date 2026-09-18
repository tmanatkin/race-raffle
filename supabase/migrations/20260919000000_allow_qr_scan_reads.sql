create policy "Anyone can view qr scans"
  on public.qr_scans
  for select
  to anon, authenticated
  using (true);

grant select on public.qr_scans to anon, authenticated;
