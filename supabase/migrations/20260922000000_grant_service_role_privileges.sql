grant select on public.qr_scans to service_role;

grant select, insert, delete on public.raffle_entries to service_role;

grant select, insert, delete on public.raffle_generations to service_role;

grant select, update on public.raffle_settings to service_role;

grant select, delete on public.bib_checks to service_role;

grant execute on function public.check_bib_number(integer) to service_role;
grant execute on function public.redeem_bib_check(integer) to service_role;
