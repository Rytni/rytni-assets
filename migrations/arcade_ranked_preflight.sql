-- Read-only: no player data, tokens, emails or attempt identities.
begin read only;
select jsonb_build_object(
 'fly',(select to_jsonb(s) from (select attempts_per_24h,enabled from public.giveaway_arcade_settings where id=1)s),
 'snake_tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'snake_product_%' and c.relkind='r'),
 'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'config',p.proconfig)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like '%snake_product%' or p.proname in ('giveaway_can_access_player','giveaway_active_season_id','get_browser_arcade_hub_v21533','start_browser_arcade_attempt_v21533','claim_browser_arcade_sponsor_attempt_v21536'))),
 'columns',(select jsonb_agg(jsonb_build_object('name',column_name,'type',data_type)) from information_schema.columns where table_schema='public' and table_name='participants' and column_name in ('id','user_id','season_id','name')),
 'digest_ready',to_regprocedure('extensions.digest(text,text)') is not null
) as preflight;
commit;
