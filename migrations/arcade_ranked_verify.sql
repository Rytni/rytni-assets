-- Read-only, no real attempt spending, no names/ids/tokens in output.
begin read only;
do $$ declare p public.participants%rowtype; begin
 select * into p from public.participants where user_id is not null
  and season_id=public.giveaway_active_season_id() limit 1;
 perform set_config('request.jwt.claim.sub',p.user_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id)::text,true);
 perform set_config('qa.participant',p.id::text,true);
end $$;
select jsonb_build_object(
 'fly_normal_limit',(select attempts_per_24h from public.giveaway_arcade_settings where id=1),
 'snake_settings',(select jsonb_build_object('enabled',enabled,'normal_limit',normal_limit,'sponsor_limit',sponsor_limit,'approved_releases',approved_releases) from public.snake_product_settings where id=1),
 'snake_attempt_rows',(select count(*) from public.snake_product_attempts),
 'snake_claim_rows',(select count(*) from public.snake_product_sponsor_claims),
 'season',(select jsonb_build_object('status',status,'ends_at',ends_at,'expired',ends_at<now()) from public.giveaway_seasons where id=public.giveaway_active_season_id()),
 'closed_hub',public.get_snake_product_hub_v1(current_setting('qa.participant')::uuid),
 'anon_can_execute',has_function_privilege('anon','public.get_snake_product_hub_v1(uuid)','EXECUTE'),
 'authenticated_can_execute',has_function_privilege('authenticated','public.get_snake_product_hub_v1(uuid)','EXECUTE'),
 'authenticated_direct_table_access',has_table_privilege('authenticated','public.snake_product_attempts','SELECT'),
 'rls_tables',(select count(*) from pg_class where oid in ('public.snake_product_settings'::regclass,'public.snake_product_attempts'::regclass,'public.snake_product_sponsor_claims'::regclass) and relrowsecurity)
) as verification;
rollback;
