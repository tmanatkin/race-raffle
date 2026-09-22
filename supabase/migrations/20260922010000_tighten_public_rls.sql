drop policy "Anyone can create raffle generations" on public.raffle_generations;
drop policy "Anyone can update raffle generations" on public.raffle_generations;
revoke insert, update on public.raffle_generations from anon, authenticated;

drop policy "Anyone can view raffle entries" on public.raffle_entries;
drop policy "Anyone can create raffle entries" on public.raffle_entries;
revoke select, insert on public.raffle_entries from anon, authenticated;


drop policy "Anyone can update raffle settings" on public.raffle_settings;
revoke update on public.raffle_settings from anon, authenticated;

drop policy "Anyone can view bib check assignments" on public.bib_checks;
drop policy "Anyone can check an unused bib number" on public.bib_checks;
drop policy "Anyone can reset bib check assignments" on public.bib_checks;
revoke select, insert, delete on public.bib_checks from anon, authenticated;

drop policy "Anyone can view qr scans" on public.qr_scans;
revoke select on public.qr_scans from anon, authenticated;

revoke execute on function public.redeem_bib_check(integer) from anon, authenticated;
