-- All fixture writes and candidate function definitions roll back.
create temp table winner_scope_tests(test text primary key,passed boolean not null check(passed));
do $$
declare p public.participants%rowtype;old_season uuid;archive uuid:=gen_random_uuid();cur uuid:=public.giveaway_active_season_id();w uuid:=gen_random_uuid();v record;answer jsonb;original_snapshot jsonb;fake_row jsonb;
begin
 select id into old_season from public.giveaway_seasons where id<>cur order by ends_at desc limit 1;
 select * into p from public.participants where season_id=cur limit 1;
 p.id:=gen_random_uuid();p.email:='winner-scopes-fixture@example.invalid';p.name:='QA Winner Scopes';p.steamid:='999555888';p.tiktok:='@qa.winnerscope';p.is_test_account:=false;p.globally_banned:=false;p.global_ban_id:=null;p.progression_blocked:=false;p.points:=9999999;p.points_reached_at:=now();
 select id into p.user_id from auth.users where raw_app_meta_data->>'season4_launch_fixture'='true' limit 1;
 if p.user_id is null then raise exception 'No QA identity';end if;
 insert into public.participants select p.*;
 select * into v from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope';
 insert into winner_scope_tests values('non_winner_no_badges',not v.current_season and not v.past_seasons);
 insert into public.giveaway_winner_archive(id,season_id,season_key,season_title,participant_id,name,game,points)
 values(archive,old_season,'qa-old','QA past season',p.id,p.name,'Cuphead',999);
 select * into v from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope';
 insert into winner_scope_tests values('past_win_not_current',v.past_seasons and not v.current_season);
 -- Simulate the compact rollover: archive keeps its original participant ID;
 -- a new-season participant is linked by the exact preserved Auth user.
 update public.giveaway_winner_archive set participant_id=gen_random_uuid() where id=archive;
 update public.giveaway_social_winner_identity_v2 set participant_id=(select participant_id from public.giveaway_winner_archive where id=archive) where archive_id=archive;
 -- The archive trigger intentionally removes changed identities; restore the verified fixture proof explicitly.
 insert into public.giveaway_social_winner_identity_v2(archive_id,participant_id,user_id,source)
 select id,participant_id,p.user_id,'QA_ROLLBACK_PROOF' from public.giveaway_winner_archive where id=archive
 on conflict(archive_id) do update set participant_id=excluded.participant_id,user_id=excluded.user_id;
 select * into v from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope';
 insert into winner_scope_tests values('past_auth_identity_survives_new_participant',v.past_seasons and not v.current_season);
 insert into public.winners(id,season_id,participant_id,name,game,points) values(w,cur,p.id,p.name,'Cuphead',10);
 select * into v from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope';
 insert into winner_scope_tests values('current_and_past_preserved_independently',v.past_seasons and v.current_season);
 delete from public.winners where id=w;
 select * into v from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope';
 insert into winner_scope_tests values('selection_removal_updates_live',v.past_seasons and not v.current_season);
 -- Private archive proof cannot be replaced by a matching display name/handle.
 update public.giveaway_social_winner_identity_v2 set user_id=(select id from auth.users where id<>p.user_id limit 1) where archive_id=archive;
 select * into v from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope';
 insert into winner_scope_tests values('foreign_archive_identity_not_attributed',not v.past_seasons and not v.current_season);
 update public.giveaway_social_winner_identity_v2 set user_id=p.user_id where archive_id=archive;
 -- Validate public projections using an existing stored snapshot, modified in this rollback-only transaction.
 select payload into original_snapshot from public.giveaway_social_snapshots_v2 where channel='main';
 fake_row:='{"handle":"qa.winnerscope","comments":12,"commented_posts":5,"liked_posts":0,"active_days":8,"score":31,"comment_days":8,"comment_weeks":3,"winner_selected":true}';
 update public.giveaway_social_snapshots_v2 set payload=jsonb_set(jsonb_set(jsonb_set(original_snapshot,'{periods,0,scopes,all,comments}',jsonb_build_array(fake_row)),'{periods,0,scopes,all,activity}',jsonb_build_array(fake_row)),'{periods,0,scopes,all,progression}','[]'::jsonb),season_id=cur where channel='main';
 answer:=public.giveaway_social_rankings_v2('main');
 insert into winner_scope_tests values('public_scopes_are_separate',answer->'winner_badges'->'qa.winnerscope'='{"current_season":false,"past_seasons":true}'::jsonb);
 insert into winner_scope_tests values('snapshot_v2_contract_unchanged',answer->'snapshot'->'periods'->0->'scopes'->'all'->'comments'->0=fake_row);
 insert into winner_scope_tests values('public_map_only_visible_handles',1=(select count(*) from jsonb_object_keys(answer->'winner_badges')));
 insert into winner_scope_tests values('private_identity_not_public',not (answer::text like '%'||p.user_id::text||'%') and not (answer::text like '%'||p.email||'%') and not (answer::text like '%points_reached_at%'));
 answer:=public.giveaway_social_progression_pending_v2('main');
 insert into winner_scope_tests values('waiting_cards_receive_season_scopes',answer->'winner_badges'->'qa.winnerscope'='{"current_season":false,"past_seasons":true}'::jsonb);
 update public.participants set globally_banned=true where id=p.id;
 insert into winner_scope_tests values('banned_member_has_no_public_scope',not exists(select 1 from public.giveaway_social_winner_scopes_v1() s where s.handle='qa.winnerscope'));
end $$;
insert into winner_scope_tests values
 ('private_helper_denied_anon',not has_function_privilege('anon','public.giveaway_social_winner_scopes_v1()','execute')),
 ('private_helper_denied_user',not has_function_privilege('authenticated','public.giveaway_social_winner_scopes_v1()','execute')),
 ('public_projection_allowed',has_function_privilege('anon','public.giveaway_social_rankings_v2(text)','execute'));
select * from winner_scope_tests order by test;
rollback;
