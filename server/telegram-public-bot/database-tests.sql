-- Transaction-only integration QA. No Telegram HTTP calls; all rows and DDL roll back.
create temp table restore_test_results(test text primary key,passed boolean not null check(passed));
do $$
declare p public.participants%rowtype; uid uuid; sub uuid:=gen_random_uuid(); sid uuid:=public.giveaway_active_season_id(); t timestamptz:=now();
 f uuid:=gen_random_uuid();sn uuid:=gen_random_uuid();rows_before bigint;event text;quiet_from int;quiet_to int;v record;
begin
 perform set_config('request.jwt.claim.role','service_role',true);
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 select id into uid from auth.users where raw_app_meta_data->>'season4_launch_fixture'='true' limit 1;
 if uid is null then raise exception 'No safe QA Auth identity';end if;
 select * into p from public.participants where season_id=sid limit 1;
 if p.id is null then raise exception 'No row template';end if;
 p.id:=gen_random_uuid();p.user_id:=uid;p.email:='telegram-restore-fixture@example.invalid';p.name:='Rollback Telegram QA';p.steamid:='999888777';p.tiktok:='@qa.telegram.restore';p.is_test_account:=false;p.globally_banned:=false;p.global_ban_id:=null;p.progression_blocked:=false;p.sponsor_chest_claimed_at:=null;p.last_daily_chest_at:=null;p.last_boost_at:=null;
 insert into public.participants select p.*;
 insert into public.giveaway_telegram_subscriptions(id,user_id,telegram_user_id,telegram_chat_id,active,notify_chest,notify_question,notify_videos,notify_winner,notify_secret_missions,linked_at)
 values(sub,uid,-899777661,-899777661,true,false,false,false,false,false,t-interval '3 days');
 update public.giveaway_telegram_opportunity_config set enabled=true;
 update public.giveaway_game_config set sponsor_chest_enabled=true,sponsor_chest_cooldown_minutes=360 where id=1;
 update public.giveaway_arcade_settings set enabled=true,attempts_per_24h=1 where id=1;
 update public.snake_product_settings set enabled=true where id=1;
 insert into restore_test_results values('never_used_no_initial_spam',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.participants set sponsor_chest_claimed_at=t-interval '6 hours'+interval '1 second' where id=p.id;
 insert into restore_test_results values('chest_not_before_due',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.participants set sponsor_chest_claimed_at=t-interval '6 hours' where id=p.id;
 insert into restore_test_results values('chest_exact_configured_boundary',exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub and e.kind='sponsor_chest' and (e.payload->>'ready_at')::timestamptz=t));
 insert into public.giveaway_arcade_attempts(id,season_id,participant_id,seed,client_token_hash,started_at,expires_at,release_version,is_sponsor)
 values(f,sid,p.id,1,repeat('a',64),t-interval '24 hours',t-interval '12 hours','telegram-qa',false);
 insert into public.snake_product_attempts(id,season_id,participant_id,owner_user_id,seed,client_token_hash,request_id,started_at,expires_at,release_version,is_sponsor)
 values(sn,sid,p.id,uid,1,repeat('b',64),'telegram-qa',t-interval '24 hours',t-interval '12 hours','snake-next-6aa3220dae34',false);
 insert into restore_test_results values('both_games_regular_restored',2=(select count(*) from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub and e.kind in ('arcade_fly','arcade_snake') and e.payload->>'opportunity'='regular'));
 -- A quiet-hours wait does not claim any message. The events remain deduplicated.
 quiet_from:=(extract(hour from t)::int*60+extract(minute from t)::int+1439)%1440;quiet_to:=(quiet_from+3)%1440;
 update public.giveaway_telegram_subscriptions set quiet_hours_enabled=true,timezone_offset_minutes=0,quiet_start_minutes=quiet_from,quiet_end_minutes=quiet_to where id=sub;
 perform * from public.telegram_claim_due_notifications_v2292(250);
 insert into restore_test_results values('quiet_hours_preserved',not exists(select 1 from public.giveaway_telegram_deliveries where subscription_id=sub and status='processing'));
 select count(*) into rows_before from public.giveaway_telegram_deliveries where subscription_id=sub;
 perform * from public.telegram_claim_due_notifications_v2292(250);
 insert into restore_test_results values('queue_idempotency',rows_before=3 and rows_before=(select count(*) from public.giveaway_telegram_deliveries where subscription_id=sub));
 -- A chest claimed during quiet hours invalidates the old reminder.
 update public.participants set sponsor_chest_claimed_at=t where id=p.id;
 perform * from public.telegram_claim_due_notifications_v2292(250);
 insert into restore_test_results values('consumed_chest_stale_event_cancelled',exists(select 1 from public.giveaway_telegram_deliveries where subscription_id=sub and kind='sponsor_chest' and attempts=3 and last_error='opportunity_no_longer_available'));
 -- New regular attempts invalidate regular reminders and make sponsor restoration relevant.
 insert into public.giveaway_arcade_attempts(season_id,participant_id,seed,client_token_hash,started_at,expires_at,release_version,is_sponsor)
 values(sid,p.id,1,repeat('a',64),t,t+interval '12 hours','telegram-qa',false);
 insert into public.snake_product_attempts(season_id,participant_id,owner_user_id,seed,client_token_hash,request_id,started_at,expires_at,release_version,is_sponsor)
 values(sid,p.id,uid,1,repeat('b',64),'telegram-qa-new',t,t+interval '12 hours','snake-next-6aa3220dae34',false);
 insert into restore_test_results values('spent_regular_not_advertised',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 insert into public.giveaway_arcade_sponsor_claims(season_id,participant_id,attempt_id,claimed_at,consumed_at) values(sid,p.id,f,t-interval '24 hours',t-interval '23 hours');
 insert into public.snake_product_sponsor_claims(season_id,participant_id,owner_user_id,request_id,client_token_hash,release_version,attempt_id,claimed_at,consumed_at,result)
 values(sid,p.id,uid,'telegram-qa-sponsor',repeat('b',64),'snake-next-6aa3220dae34',sn,t-interval '24 hours',t-interval '23 hours','{}'::jsonb);
 insert into restore_test_results values('sponsor_slots_restored_both_games',2=(select count(*) from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub and e.payload->>'opportunity'='sponsor'));
 insert into public.giveaway_arcade_sponsor_claims(season_id,participant_id,claimed_at) values(sid,p.id,t);
 insert into public.snake_product_sponsor_claims(season_id,participant_id,owner_user_id,request_id,client_token_hash,release_version,claimed_at,result) values(sid,p.id,uid,'telegram-qa-credit',repeat('b',64),'snake-next-6aa3220dae34',t,'{}'::jsonb);
 insert into restore_test_results values('unspent_credit_not_a_new_sponsor_slot_notice',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.participants set sponsor_chest_claimed_at=t-interval '7 hours' where id=p.id;
 update public.giveaway_telegram_subscriptions set notify_sponsor_chest=false,notify_arcade=false where id=sub;
 insert into restore_test_results values('separate_preferences',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.giveaway_telegram_subscriptions set notify_sponsor_chest=true,notify_arcade=true where id=sub;
 update public.participants set globally_banned=true where id=p.id;
 insert into restore_test_results values('banned_excluded',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.participants set globally_banned=false,is_test_account=true where id=p.id;
 insert into restore_test_results values('test_accounts_excluded',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.participants set is_test_account=false,progression_blocked=true where id=p.id;
 insert into restore_test_results values('progression_blocked_excluded',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.participants set progression_blocked=false where id=p.id;
 update public.giveaway_telegram_subscriptions set active=false where id=sub;
 insert into restore_test_results values('paused_subscription_excluded',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.giveaway_telegram_subscriptions set active=true,linked_at=t+interval '1 second' where id=sub;
 insert into restore_test_results values('pre_link_history_not_announced',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.giveaway_telegram_subscriptions set linked_at=t-interval '3 days',quiet_hours_enabled=false where id=sub;
 update public.giveaway_game_config set sponsor_chest_enabled=false where id=1;
 insert into restore_test_results values('disabled_sponsor_chest_excluded',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
 update public.giveaway_game_config set sponsor_chest_enabled=true where id=1;
 insert into restore_test_results values('ended_season_excluded',not exists(select 1 from public.telegram_restored_opportunities_v2330(t+interval '365 days') e where e.subscription_id=sub));
 update public.giveaway_telegram_opportunity_config set enabled=false;
 insert into restore_test_results values('deployment_gate',not exists(select 1 from public.telegram_restored_opportunities_v2330(t) e where e.subscription_id=sub));
end $$;
insert into restore_test_results values
 ('anonymous_helper_denied',not has_function_privilege('anon','public.telegram_restored_opportunities_v2330(timestamptz)','execute')),
 ('authenticated_helper_denied',not has_function_privilege('authenticated','public.telegram_restored_opportunities_v2330(timestamptz)','execute')),
 ('anonymous_queue_denied',not has_function_privilege('anon','public.telegram_claim_due_notifications_v2292(integer)','execute')),
 ('config_private',not has_table_privilege('anon','public.giveaway_telegram_opportunity_config','select'));
select * from restore_test_results order by test;
rollback;
