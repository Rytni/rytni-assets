-- Explicitly authorized shared-DB quota change. No score/result/points writes.
-- Rolling 24h semantics and sponsor limit (2, enforced by current Fly RPCs) stay intact.
begin;
set local lock_timeout='5s';
do $$ begin
 if to_regclass('public.giveaway_arcade_settings') is null
 or to_regprocedure('public.claim_browser_arcade_sponsor_attempt_v21536(uuid,text,text)') is null then
  raise exception 'Current Fly sponsor-credit contract required';
 end if;
end $$;
update public.giveaway_arcade_settings set attempts_per_24h=1,updated_at=now() where id=1;
do $$ begin
 if not exists(select 1 from public.giveaway_arcade_settings where id=1 and attempts_per_24h=1) then
  raise exception 'Quota update failed';
 end if;
end $$;
commit;
