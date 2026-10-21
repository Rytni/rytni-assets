-- Run after the candidate migration in the SAME transaction, then ROLLBACK.
create temp table security_test_results(test text primary key, passed boolean not null check(passed));
insert into security_test_results values
 ('legacy_rollover_bypass_closed',not has_function_privilege('service_role','public.admin_rollover_season_v21512(uuid,text,text,timestamptz,timestamptz,integer,text,boolean)','execute')),
 ('anonymous_internal_daily_denied',not has_function_privilege('anon','public.giveaway_arcade_ensure_daily_v21538(timestamptz)','execute')),
 ('authenticated_internal_archive_denied',not has_function_privilege('authenticated','public.giveaway_arcade_archive_daily_winners_v21538()','execute')),
 ('anonymous_commit_denied',not has_function_privilege('anon','public.admin_commit_arcade_verified_v1(uuid,text,uuid,uuid,text,text,jsonb,text)','execute')),
 ('authenticated_commit_denied',not has_function_privilege('authenticated','public.admin_commit_arcade_verified_v1(uuid,text,uuid,uuid,text,text,jsonb,text)','execute')),
 ('public_archive_points_private',not has_column_privilege('anon','public.giveaway_winner_archive','points','select')),
 ('public_archive_identity_private',not has_column_privilege('authenticated','public.giveaway_winner_archive','participant_id','select')),
 ('public_archive_ui_preserved',has_column_privilege('anon','public.giveaway_winner_archive','name','select') and has_column_privilege('anon','public.giveaway_winner_archive','archived_at','select')),
 ('archived_standings_private',not has_table_privilege('anon','public.giveaway_season_standings_archive','select')),
 ('verification_receipts_private',not has_table_privilege('authenticated','public.arcade_verified_results_v1','insert')),
 ('backup_receipts_private',not has_function_privilege('authenticated','public.admin_register_season_backup_v1(uuid,text,jsonb)','execute'));

do $$ declare original uuid; qa uuid; p public.participants%rowtype; a jsonb; answer jsonb; manifest jsonb; token text:='rollback-security-client-token'; points_before bigint; canonical jsonb; begin
 original:=public.giveaway_active_season_id();
 select * into p from public.participants where user_id is not null and not coalesce(globally_banned,false) limit 1;
 update public.giveaway_seasons set status='archived' where id=original;
 insert into public.giveaway_seasons(name,season_key,starts_at,ends_at,status,form_enabled,winners_target)
 values('Rollback security fixture','rollback-security-'||gen_random_uuid()::text,now()-interval '2 days',now()+interval '1 day','active',false,1) returning id into qa;
 p.id:=gen_random_uuid();p.season_id:=qa;p.tiktok:='security.fixture.'||substr(replace(p.id::text,'-',''),1,6);
 p.steamid:='999999999999999999';p.email:='security-fixture-'||p.id::text||'@example.invalid';p.name:='Rollback security fixture';
 insert into public.participants select p.*;
 perform set_config('request.jwt.claim.sub',p.user_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','authenticated')::text,true);
 update public.participants set is_test_account=false where id=p.id;
 answer:=public.get_my_top10_status();
 insert into security_test_results values('eligible_top10_preserved',answer->>'in_top_10'='true');
 update public.participants set globally_banned=true where id=p.id;
 answer:=public.get_my_top10_status();
 insert into security_test_results values('banned_top10_excluded',answer->>'in_top_10'='false');
 update public.participants set globally_banned=false where id=p.id;
 a:=public.start_browser_arcade_attempt_v21533(p.id,token,'security-fixture');
 if a->>'status'<>'started' then raise exception 'Fly fixture could not start';end if;
 answer:=public.finish_browser_arcade_attempt_v21533(p.id,(a->>'attempt_id')::uuid,token,3600000,1000000,3000,1000,0);
 insert into security_test_results values('legacy_fly_forgery_denied',answer->>'status'='verification_required');
 update public.giveaway_arcade_attempts set seed=1,started_at=now()-interval '1 minute' where id=(a->>'attempt_id')::uuid;
 canonical:='{"score":254,"spores":0,"gates":0,"jumps":0,"ticks":363,"perfect_count":0,"perfect_best":0,"portal_count":0,"bonus_pickups":0,"duration_ms":6050}';
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_commit_arcade_verified_v1(p.user_id,'fly',p.id,(a->>'attempt_id')::uuid,token,'security-fixture',canonical,repeat('1',64));
 insert into security_test_results values('verified_fly_award_succeeds',answer->>'success'='true' and (answer->>'points_awarded')::integer=100);
 select points into points_before from public.participants where id=p.id;
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_commit_arcade_verified_v1(p.user_id,'fly',p.id,(a->>'attempt_id')::uuid,token,'security-fixture',canonical,repeat('1',64));
 insert into security_test_results values('verified_fly_retry_idempotent',answer->>'success'='true' and points_before=(select points from public.participants where id=p.id));
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_commit_arcade_verified_v1(p.user_id,'fly',p.id,(a->>'attempt_id')::uuid,token,'security-fixture',canonical,repeat('2',64));
 insert into security_test_results values('changed_replay_digest_denied',answer->>'status'='replay_mismatch');

 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_arcade_verification_context_v1(gen_random_uuid(),'fly',p.id,(a->>'attempt_id')::uuid,token,'security-fixture');
 insert into security_test_results values('foreign_owner_context_denied',answer->>'status'='forbidden');
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_arcade_verification_context_v1(p.user_id,'fly',p.id,(a->>'attempt_id')::uuid,token||'wrong','security-fixture');
 insert into security_test_results values('wrong_client_context_denied',answer->>'status'='client_mismatch');
 perform set_config('request.jwt.claim.sub',p.user_id::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','authenticated')::text,true);
 a:=public.start_snake_product_attempt_v1(p.id,token,'snake-next-2fbc81ae44ef','rollback-security-once');
 if a->>'status'<>'started' then raise exception 'Snake fixture could not start';end if;
 answer:=public.finish_snake_product_attempt_v1(p.id,token,(a->>'attempt_id')::uuid,'snake-next-2fbc81ae44ef',1000,60,20000,'{}');
 insert into security_test_results values('legacy_snake_forgery_denied',answer->>'status'='verification_required');
 update public.snake_product_attempts set seed=1,started_at=now()-interval '1 minute' where id=(a->>'attempt_id')::uuid;
 canonical:='{"score":100,"ticks":257,"duration_ms":4283,"audit":{"seed":1,"foods":1,"length":9,"max_combo":1,"portal_uses":0,"expansions":0,"stage":0,"bonuses":0,"final_hash":"dc89831b"}}';
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_commit_arcade_verified_v1(p.user_id,'snake',p.id,(a->>'attempt_id')::uuid,token,'snake-next-2fbc81ae44ef',canonical,repeat('3',64));
 insert into security_test_results values('verified_snake_result_succeeds',answer->>'success'='true' and answer->>'score'='100');

 -- A stale old Manager can no longer start a destructive rollover.
 update public.giveaway_seasons set ends_at=now()-interval '1 hour' where id=qa;
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
 answer:=public.admin_rollover_season_v21513(qa,'Next fixture','next-fixture-'||gen_random_uuid()::text,now(),now()+interval '1 day',1,repeat('0',64),'',true);
 insert into security_test_results values('incomplete_old_backup_blocks_rollover',answer->>'success'='false' and answer->>'error' like '%verified backup%');
 manifest:=public.admin_season_backup_plan_v1(qa);
 insert into security_test_results values('backup_covers_arcade_partner_weekly',manifest->'tables' ?& array['giveaway_arcade_attempts','snake_product_attempts','giveaway_arcade_daily_attempts','giveaway_partner_claims','giveaway_weekly_contract_assignments']);
 perform public.admin_register_season_backup_v1(qa,repeat('a',64),manifest);
 answer:=public.admin_rollover_season_v21513(qa,'Next fixture','next-fixture-'||gen_random_uuid()::text,now(),now()+interval '1 day',1,repeat('a',64),'',true);
 if answer->>'success'<>'true' then raise exception 'Synthetic rollover failed: %',answer->>'error';end if;
 insert into security_test_results values('verified_rollover_with_snake_fk_succeeds',true);
end $$;
select test,passed from security_test_results order by test;
