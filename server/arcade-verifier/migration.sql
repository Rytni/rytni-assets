begin;
-- Season 4 hardening. No season transition or public MAIN release.
create table if not exists public.arcade_verified_results_v1 (
 game text not null check(game in ('fly','snake')),
 attempt_id uuid not null, participant_id uuid not null, owner_user_id uuid not null,
 season_id uuid not null, release_version text not null,
 evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
 summary jsonb not null, result jsonb, verified_at timestamptz not null default now(),
 primary key(game,attempt_id)
);
alter table public.arcade_verified_results_v1 enable row level security;
revoke all on public.arcade_verified_results_v1 from public,anon,authenticated;

create or replace function public.admin_arcade_verification_context_v1(
 p_user_id uuid,p_game text,p_participant_id uuid,p_attempt_id uuid,p_client_token text,p_release text
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth,extensions as $$
declare p public.participants%rowtype; a jsonb; token_hash text; allowed boolean;
begin
 if not public.giveaway_is_admin() then raise exception 'forbidden';end if;
 -- Never inherit the service-role bypass when checking player eligibility.
 perform set_config('request.jwt.claim.role','authenticated',true);
 perform set_config('request.jwt.claim.sub',p_user_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p_user_id,'role','authenticated')::text,true);
 select * into p from public.participants where id=p_participant_id;
 if p.user_id is distinct from p_user_id or coalesce(p.globally_banned,false) or public.giveaway_is_globally_banned(p.email,p.steamid,p.tiktok) or not coalesce(public.giveaway_can_access_player(p),false) then
  return jsonb_build_object('success',false,'status','forbidden');end if;
 if p_client_token is null or length(p_client_token) not between 16 and 512 then return jsonb_build_object('success',false,'status','client_mismatch');end if;
 if p_game='snake' then
  select to_jsonb(t) into a from public.snake_product_attempts t where t.id=p_attempt_id and t.participant_id=p.id and t.owner_user_id=p_user_id and t.season_id=p.season_id and t.game='snake';
  token_hash:=encode(extensions.digest(p_client_token||':'||p_user_id::text||':'||p.id::text,'sha256'),'hex');
  select enabled and p_release=any(approved_releases) into allowed from public.snake_product_settings where id=1;
 elsif p_game='fly' then
  select to_jsonb(t) into a from public.giveaway_arcade_attempts t where t.id=p_attempt_id and t.participant_id=p.id and t.season_id=p.season_id;
  token_hash:=encode(extensions.digest(p_client_token||':'||p.id::text,'sha256'),'hex');
  select enabled into allowed from public.giveaway_arcade_settings where id=1;
 else return jsonb_build_object('success',false,'status','invalid_game');end if;
 if a is null then return jsonb_build_object('success',false,'status','attempt_not_found');end if;
 if token_hash is distinct from a->>'client_token_hash' then return jsonb_build_object('success',false,'status','client_mismatch');end if;
 if a->>'release_version' is distinct from left(p_release,32) then return jsonb_build_object('success',false,'status','release_mismatch');end if;
 if not coalesce(allowed,false) then return jsonb_build_object('success',false,'status','disabled');end if;
 if a->>'status' not in ('started','finished') or (a->>'expires_at')::timestamptz<now() then return jsonb_build_object('success',false,'status','expired');end if;
 return jsonb_build_object('success',true,'seed',(a->>'seed')::bigint,'season_id',p.season_id,
 'max_ticks',floor((extract(epoch from now()-(a->>'started_at')::timestamptz)+2)*60),
 'max_duration_ms',floor((extract(epoch from now()-(a->>'started_at')::timestamptz)+2)*1000));
end $$;
revoke all on function public.admin_arcade_verification_context_v1(uuid,text,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_arcade_verification_context_v1(uuid,text,uuid,uuid,text,text) to service_role;

create or replace function public.admin_commit_arcade_verified_v1(
 p_user_id uuid,p_game text,p_participant_id uuid,p_attempt_id uuid,p_client_token text,p_release text,
 p_summary jsonb,p_evidence_sha256 text
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth,extensions as $$
declare context jsonb; saved public.arcade_verified_results_v1%rowtype; answer jsonb;
begin
 if not public.giveaway_is_admin() then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_game||':'||p_attempt_id::text,0));
 -- Lock in the same order as the legacy finalizers.
 perform 1 from public.participants where id=p_participant_id for update;
 context:=public.admin_arcade_verification_context_v1(p_user_id,p_game,p_participant_id,p_attempt_id,p_client_token,p_release);
 if not coalesce((context->>'success')::boolean,false) then return context;end if;
 if jsonb_typeof(p_summary)<>'object' or (p_summary->>'duration_ms')::bigint>(context->>'max_duration_ms')::bigint
  or p_evidence_sha256 is null or p_evidence_sha256 !~ '^[0-9a-f]{64}$' then return jsonb_build_object('success',false,'status','invalid_replay');end if;
 select * into saved from public.arcade_verified_results_v1 where game=p_game and attempt_id=p_attempt_id;
 if found then
  if saved.owner_user_id<>p_user_id or saved.evidence_sha256<>p_evidence_sha256 or saved.summary<>p_summary then return jsonb_build_object('success',false,'status','replay_mismatch');end if;
  return saved.result;
 end if;
 insert into public.arcade_verified_results_v1(game,attempt_id,participant_id,owner_user_id,season_id,release_version,evidence_sha256,summary)
 values(p_game,p_attempt_id,p_participant_id,p_user_id,(context->>'season_id')::uuid,p_release,p_evidence_sha256,p_summary);
 if p_game='fly' then
  answer:=public.finish_browser_arcade_attempt_v21533(p_participant_id,p_attempt_id,p_client_token,(p_summary->>'duration_ms')::integer,(p_summary->>'score')::integer,(p_summary->>'spores')::integer,(p_summary->>'gates')::integer,(p_summary->>'jumps')::integer);
 else
  answer:=public.finish_snake_product_attempt_v1(p_participant_id,p_client_token,p_attempt_id,p_release,(p_summary->>'duration_ms')::integer,(p_summary->>'ticks')::integer,(p_summary->>'score')::integer,p_summary->'audit');
 end if;
 if not coalesce((answer->>'success')::boolean,false) then
  delete from public.arcade_verified_results_v1 where game=p_game and attempt_id=p_attempt_id;
  return answer;
 end if;
 update public.arcade_verified_results_v1 set result=answer where game=p_game and attempt_id=p_attempt_id;
 return answer;
end $$;
revoke all on function public.admin_commit_arcade_verified_v1(uuid,text,uuid,uuid,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.admin_commit_arcade_verified_v1(uuid,text,uuid,uuid,text,text,jsonb,text) to service_role;

-- These are internal helpers; public hub SECURITY DEFINER functions retain access.
revoke execute on function public.giveaway_arcade_ensure_daily_v21538(timestamptz) from public,anon,authenticated;
revoke execute on function public.giveaway_arcade_archive_daily_winners_v21538() from public,anon,authenticated;

revoke select on public.giveaway_winner_archive from public,anon,authenticated;
revoke select on public.giveaway_season_standings_archive from public,anon,authenticated;
grant select(season_title,name,game,won_at,archived_at) on public.giveaway_winner_archive to anon,authenticated;
-- Full archived standings are internal; publicly exposing the snapshot also leaks identifiers.


CREATE OR REPLACE FUNCTION public.finish_browser_arcade_attempt_v21533(p_participant_id uuid, p_attempt_id uuid, p_client_token text, p_duration_ms integer, p_score integer, p_spores integer, p_gates integer, p_jumps integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
declare
  v_player public.participants%rowtype;
  v_attempt public.giveaway_arcade_attempts%rowtype;
  v_settings public.giveaway_arcade_settings%rowtype;
  v_hash text;v_points bigint;v_max_plausible bigint;
begin

  if not exists(select 1 from public.arcade_verified_results_v1 v where v.game='fly' and v.attempt_id=p_attempt_id and v.participant_id=p_participant_id and v.owner_user_id=auth.uid() and v.summary->'duration_ms'=to_jsonb(p_duration_ms) and v.summary->'score'=to_jsonb(p_score) and v.summary->'spores'=to_jsonb(p_spores) and v.summary->'gates'=to_jsonb(p_gates) and v.summary->'jumps'=to_jsonb(p_jumps)) then return jsonb_build_object('success',false,'status','verification_required');end if;
  if auth.uid() is null then return jsonb_build_object('success',false,'status','not_authenticated');end if;
  select * into v_player from public.participants
    where id=p_participant_id and season_id=public.giveaway_active_season_id() for update;
  if v_player.id is null then return jsonb_build_object('success',false,'status','not_found');end if;
  if not public.giveaway_can_access_player(v_player) then return jsonb_build_object('success',false,'status','forbidden');end if;
  select * into v_attempt from public.giveaway_arcade_attempts
    where id=p_attempt_id and participant_id=v_player.id and season_id=v_player.season_id for update;
  if v_attempt.id is null then return jsonb_build_object('success',false,'status','attempt_not_found');end if;
  if v_attempt.status='finished' then
    return jsonb_build_object('success',true,'status','already_finished','score',v_attempt.score,
      'points_awarded',v_attempt.points_awarded,'points',v_player.points);
  end if;
  if v_attempt.status<>'started' then return jsonb_build_object('success',false,'status',v_attempt.status);end if;
  if v_attempt.expires_at<now() then
    update public.giveaway_arcade_attempts set status='expired' where id=v_attempt.id;
    return jsonb_build_object('success',false,'status','expired');
  end if;
  v_hash:=encode(extensions.digest(coalesce(nullif(p_client_token,''),auth.uid()::text)||':'||v_player.id::text,'sha256'),'hex');
  if v_hash<>v_attempt.client_token_hash then return jsonb_build_object('success',false,'status','client_mismatch');end if;
  select * into v_settings from public.giveaway_arcade_settings where id=1;
  v_max_plausible:=floor(greatest(coalesce(p_duration_ms,0),0)/1000.0*100)::bigint
    +greatest(coalesce(p_spores,0),0)::bigint*320
    +greatest(coalesce(p_gates,0),0)::bigint*460+1500;
  if p_duration_ms is null or p_duration_ms<500 or p_duration_ms>43200000
    or p_score is null or p_score<0 or p_score>v_settings.max_score or p_score::bigint>v_max_plausible
    or p_spores is null or p_spores<0 or p_spores>floor(p_duration_ms/180.0)::integer+10
    or p_gates is null or p_gates<0 or p_gates>floor(p_duration_ms/450.0)::integer+8
    or p_jumps is null or p_jumps<0 or p_jumps>floor(p_duration_ms/100.0)::integer+12 then
    update public.giveaway_arcade_attempts set status='rejected',finished_at=now(),duration_ms=p_duration_ms,
      score=p_score,spores=p_spores,gates=p_gates,jumps=p_jumps where id=v_attempt.id;
    return jsonb_build_object('success',false,'status','invalid_result');
  end if;

  v_points:=greatest(coalesce(v_player.points,0),0)+v_settings.reward_points;
  update public.participants set points=v_points,points_reached_at=now() where id=v_player.id;
  update public.giveaway_arcade_attempts set status='finished',finished_at=now(),duration_ms=p_duration_ms,
    score=p_score,spores=p_spores,gates=p_gates,jumps=p_jumps,points_awarded=v_settings.reward_points
  where id=v_attempt.id;
  update public.giveaway_points_ledger
    set source_type='browser_arcade',source_label='Mushroom Fly',source_icon='gamepad-2',
      reference_id=v_attempt.id::text,
      metadata=jsonb_build_object('score',p_score,'spores',p_spores,'gates',p_gates,'duration_ms',p_duration_ms,'mode','endless')
    where id=(select id from public.giveaway_points_ledger
      where participant_id=v_player.id and transaction_id=txid_current() order by id desc limit 1);

  return jsonb_build_object('success',true,'status','finished','score',p_score,
    'points_awarded',v_settings.reward_points,'points',v_points);
end;$function$
;

CREATE OR REPLACE FUNCTION public.finish_snake_product_attempt_v1(p_participant_id uuid, p_client_token text, p_attempt_id uuid, p_release text, p_duration_ms integer, p_ticks integer, p_score integer, p_audit jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'extensions'
AS $function$
declare
  v_p public.participants%rowtype; v_s public.snake_product_settings%rowtype;
  v_a public.snake_product_attempts%rowtype; v_hash text; v_best integer; v_result jsonb;
  v_key text; v_value jsonb; v_invalid boolean:=false; v_counter numeric; v_max_score bigint;
begin

  if not exists(select 1 from public.arcade_verified_results_v1 v where v.game='snake' and v.attempt_id=p_attempt_id and v.participant_id=p_participant_id and v.owner_user_id=auth.uid() and v.summary->'duration_ms'=to_jsonb(p_duration_ms) and v.summary->'score'=to_jsonb(p_score) and v.summary->'ticks'=to_jsonb(p_ticks) and v.summary->'audit'=to_jsonb(p_audit)) then return jsonb_build_object('success',false,'status','verification_required');end if;
  if auth.uid() is null then return jsonb_build_object('success',false,'status','not_authenticated'); end if;
  select * into v_p from public.participants p where p.id=p_participant_id for update;
  if v_p.id is null or not coalesce(public.snake_product_can_access_v1(v_p),false) then
    return jsonb_build_object('success',false,'status','forbidden'); end if;
  select * into v_a from public.snake_product_attempts where id=p_attempt_id and game='snake'
    and season_id=v_p.season_id and participant_id=v_p.id and owner_user_id=auth.uid() for update;
  if v_a.id is null then return jsonb_build_object('success',false,'status','attempt_not_found'); end if;
  if p_client_token is null or length(p_client_token) not between 16 and 512 then
    return jsonb_build_object('success',false,'status','client_mismatch'); end if;
  v_hash:=encode(extensions.digest(p_client_token||':'||auth.uid()::text||':'||v_p.id::text,'sha256'),'hex');
  if v_a.client_token_hash<>v_hash then return jsonb_build_object('success',false,'status','client_mismatch'); end if;
  if p_release is null or v_a.release_version<>p_release then return jsonb_build_object('success',false,'status','release_mismatch'); end if;
  if v_a.status='finished' then return v_a.result; end if;
  if v_a.status<>'started' then return jsonb_build_object('success',false,'status',v_a.status); end if;
  if v_a.expires_at<now() then update public.snake_product_attempts set status='expired' where id=v_a.id;
    return jsonb_build_object('success',false,'status','expired'); end if;
  select * into v_s from public.snake_product_settings where id=1;
  if v_s.id is null or not v_s.enabled then return jsonb_build_object('success',false,'status','disabled'); end if;
  if not (p_release=any(v_s.approved_releases)) then return jsonb_build_object('success',false,'status','release_not_approved'); end if;
  if p_duration_ms is null or p_duration_ms not between 0 and 43200000
    or p_duration_ms>floor(extract(epoch from now()-v_a.started_at)*1000)::bigint+5000
    or p_ticks is null or p_ticks not between 0 and 2592000
    or abs(p_ticks::bigint*1000-p_duration_ms::bigint*60)>1000
    or p_score is null or p_score not between 0 and v_s.max_score
    or p_audit is null or jsonb_typeof(p_audit)<>'object' or octet_length(p_audit::text)>65536 then
    update public.snake_product_attempts set status='rejected',finished_at=now() where id=v_a.id;
    return jsonb_build_object('success',false,'status','invalid_result'); end if;
  -- Deliberately broad envelope, not authoritative replay or anti-cheat.
  -- Canonical movement never exceeds one move per five 60Hz ticks; use ample score headroom.
  v_max_score:=case when p_ticks=0 then 0 else p_ticks::bigint*400+2000 end;
  if p_score::bigint>v_max_score then v_invalid:=true; end if;
  foreach v_key in array array['foods','length','max_combo','portal_uses','expansions','stage','bonuses'] loop
    if p_audit ? v_key then
      v_value:=p_audit->v_key;
      if jsonb_typeof(v_value)<>'number' then v_invalid:=true;
      else
        v_counter:=(v_value::text)::numeric;
        if v_counter<0 or v_counter>2592000 or floor(v_counter)<>v_counter then v_invalid:=true;
        elsif v_key='foods' and v_counter>floor(p_ticks/5.0)+1 then v_invalid:=true;
        elsif v_key='length' and v_counter>8192 then v_invalid:=true;
        elsif v_key='max_combo' and v_counter>8 then v_invalid:=true;
        elsif v_key in ('portal_uses','expansions','stage','bonuses') and v_counter>p_ticks+1 then v_invalid:=true;
        end if;
      end if;
    end if;
  end loop;
  if p_audit ? 'seed' then
    if jsonb_typeof(p_audit->'seed')<>'number' then v_invalid:=true;
    elsif ((p_audit->'seed')::text)::numeric<>v_a.seed then v_invalid:=true; end if;
  end if;
  if p_audit ? 'final_hash' then
    if jsonb_typeof(p_audit->'final_hash')<>'string' or length(p_audit->>'final_hash')>128 then v_invalid:=true; end if;
  end if;
  if v_invalid then
    update public.snake_product_attempts set status='rejected',finished_at=now() where id=v_a.id;
    return jsonb_build_object('success',false,'status','invalid_result'); end if;
  select coalesce(max(score),0) into v_best from public.snake_product_attempts where game='snake'
    and season_id=v_p.season_id and participant_id=v_p.id and status='finished';
  v_result:=jsonb_build_object('success',true,'status','finished','score',p_score,
    'best_score',greatest(v_best,p_score),'record',p_score>v_best,'points_awarded',0);
  update public.snake_product_attempts set status='finished',finished_at=now(),duration_ms=p_duration_ms,
    ticks=p_ticks,score=p_score,audit=p_audit,result=v_result where id=v_a.id;
  -- Deliberately no participants.points or giveaway_points_ledger writes.
  return v_result;
end $function$
;

CREATE OR REPLACE FUNCTION public.finish_browser_arcade_daily_v21538(p_participant_id uuid, p_attempt_id uuid, p_submission_id uuid, p_client_token text, p_duration_ms integer, p_score integer, p_spores integer, p_gates integer, p_jumps integer, p_perfect_count integer, p_perfect_best integer, p_portal_count integer, p_bonus_pickups integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
declare v_p public.participants%rowtype;v_a public.giveaway_arcade_daily_attempts%rowtype;v_c public.giveaway_arcade_daily_challenges%rowtype;v_hash text;v_max bigint;v_best integer;v_rank integer;v_king integer;v_is_king boolean;
begin
  -- This unused legacy daily protocol has no authoritative replay adapter.
  return jsonb_build_object('success',false,'status','verification_required');
  if auth.uid() is null then return jsonb_build_object('success',false,'status','not_authenticated');end if;select * into v_p from public.participants where id=p_participant_id and season_id=public.giveaway_active_season_id() for update;if v_p.id is null or not public.giveaway_can_access_player(v_p) then return jsonb_build_object('success',false,'status','forbidden');end if;
  select * into v_a from public.giveaway_arcade_daily_attempts where id=p_attempt_id and participant_id=v_p.id for update;if v_a.id is null then return jsonb_build_object('success',false,'status','attempt_not_found');end if;if v_a.status='finished' then return jsonb_build_object('success',true,'status','already_finished','score',v_a.score,'training',v_a.training);end if;if v_a.status<>'started' or v_a.expires_at<now() then return jsonb_build_object('success',false,'status','expired');end if;
  select * into v_c from public.giveaway_arcade_daily_challenges where id=v_a.challenge_id;v_hash:=encode(extensions.digest(coalesce(nullif(p_client_token,''),auth.uid()::text)||':'||v_p.id::text,'sha256'),'hex');if v_hash<>v_a.client_token_hash then return jsonb_build_object('success',false,'status','client_mismatch');end if;
  v_max:=floor(greatest(coalesce(p_duration_ms,0),0)/1000.0*125)::bigint+greatest(coalesce(p_spores,0),0)::bigint*340+greatest(coalesce(p_gates,0),0)::bigint*520+greatest(coalesce(p_perfect_count,0),0)::bigint*500+greatest(coalesce(p_portal_count,0),0)::bigint*12000+3000;
  if p_submission_id is null or p_duration_ms<500 or p_duration_ms>43200000 or p_score<0 or p_score>10000000 or p_score::bigint>v_max or p_spores<0 or p_spores>floor(p_duration_ms/150.0)::int+40 or p_gates<0 or p_gates>floor(p_duration_ms/400.0)::int+10 or p_jumps<0 or p_jumps>floor(p_duration_ms/90.0)::int+20 or p_perfect_count<0 or p_perfect_count>p_gates or p_perfect_best<0 or p_perfect_best>p_perfect_count or p_portal_count<0 or p_portal_count>floor(p_duration_ms/45000.0)::int+1 or p_bonus_pickups<0 or p_bonus_pickups>floor(p_duration_ms/1000.0)::int+12 then update public.giveaway_arcade_daily_attempts set status='rejected',finished_at=now(),submission_id=p_submission_id where id=v_a.id;return jsonb_build_object('success',false,'status','invalid_result');end if;
  update public.giveaway_arcade_daily_attempts set status='finished',finished_at=now(),submission_id=p_submission_id,duration_ms=p_duration_ms,score=p_score,spores=p_spores,gates=p_gates,jumps=p_jumps,perfect_count=p_perfect_count,perfect_best=p_perfect_best,portal_count=p_portal_count,bonus_pickups=p_bonus_pickups,score_breakdown=jsonb_build_object('coins',p_spores*150,'perfect',greatest(p_score-p_spores*150-p_gates*210,0),'base',p_gates*210,'total',p_score) where id=v_a.id;
  if v_a.training then return jsonb_build_object('success',true,'status','finished','training',true,'score',p_score);end if;
  select coalesce(max(score),0)::int into v_best from public.giveaway_arcade_daily_attempts where challenge_id=v_a.challenge_id and participant_id=v_p.id and status='finished' and not training;
  with best as(select participant_id,max(score)::int score,min(finished_at) filter(where score=(select max(x.score) from public.giveaway_arcade_daily_attempts x where x.challenge_id=v_a.challenge_id and x.participant_id=a.participant_id and x.status='finished' and not x.training)) finished_at from public.giveaway_arcade_daily_attempts a where challenge_id=v_a.challenge_id and status='finished' and not training group by participant_id),ranked as(select *,row_number() over(order by score desc,finished_at asc)::int place from best) select place into v_rank from ranked where participant_id=v_p.id;
  select coalesce(max(score),0)::int into v_king from public.giveaway_arcade_daily_attempts where challenge_id=v_a.challenge_id and status='finished' and not training;v_is_king:=v_rank=1;
  return jsonb_build_object('success',true,'status','finished','training',false,'score',p_score,'daily_best',v_best,'daily_rank',v_rank,'is_king',v_is_king,'to_king',case when v_is_king then 0 else greatest(v_king-v_best+1,0) end,'attempts_remaining',greatest(v_c.ranked_attempts-(select count(*) from public.giveaway_arcade_daily_attempts where challenge_id=v_a.challenge_id and participant_id=v_p.id and not training),0),'score_breakdown',jsonb_build_object('coins',p_spores*150,'perfect',greatest(p_score-p_spores*150-p_gates*210,0),'base',p_gates*210,'total',p_score));
 exception when unique_violation then select * into v_a from public.giveaway_arcade_daily_attempts where submission_id=p_submission_id and participant_id=v_p.id and id=p_attempt_id;if v_a.id is null then return jsonb_build_object('success',false,'status','duplicate_submission');end if;return jsonb_build_object('success',true,'status','already_finished','score',v_a.score,'training',v_a.training);end $function$
;

-- Complete, verified local backup contract. This does not start a season.
create table if not exists public.giveaway_backup_receipts_v1(
 backup_sha256 text primary key check(backup_sha256 ~ '^[0-9a-f]{64}$'),
 season_id uuid not null, manifest jsonb not null, created_at timestamptz not null default now()
);
alter table public.giveaway_backup_receipts_v1 enable row level security;
revoke all on public.giveaway_backup_receipts_v1 from public,anon,authenticated;

create or replace function public.admin_season_backup_plan_v1(p_season_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth,extensions as $$
declare r record; item jsonb; manifest jsonb:='{}'; condition text;
begin
 perform public.giveaway_require_admin();
 if not exists(select 1 from public.giveaway_seasons where id=p_season_id) then raise exception 'Unknown season';end if;
 for r in select c.relname as name,exists(select 1 from pg_attribute a where a.attrelid=c.oid and a.attname='season_id' and not a.attisdropped) as seasonal
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname<>'giveaway_backup_receipts_v1' order by c.relname loop
  condition:=case when r.seasonal then format(' where t.season_id=%L::uuid',p_season_id) else '' end;
  execute format('select jsonb_build_object(''count'',count(*),''revision_sha256'',encode(extensions.digest(coalesce(string_agg(t.ctid::text||'':''||t.xmin::text,E''\n'' order by t.ctid),''''),''sha256''),''hex''),''seasonal'',%L::boolean) from public.%I t%s',r.seasonal,r.name,condition) into item;
  manifest:=manifest||jsonb_build_object(r.name,item);
 end loop;
 return jsonb_build_object('version',1,'season_id',p_season_id,'tables',manifest);
end $$;

create or replace function public.admin_season_backup_page_v1(p_season_id uuid,p_table text,p_offset integer default 0,p_limit integer default 1000)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare answer jsonb; seasonal boolean;
begin
 perform public.giveaway_require_admin();
 if p_offset<0 or p_limit not between 1 and 1000 then raise exception 'Invalid page';end if;
 select exists(select 1 from pg_attribute a where a.attrelid=c.oid and a.attname='season_id' and not a.attisdropped) into seasonal
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname=p_table and c.relname<>'giveaway_backup_receipts_v1';
 if not found then raise exception 'Invalid backup table';end if;
 execute format('select coalesce(jsonb_agg(to_jsonb(t) order by chosen.row_ctid),''[]'') from (select ctid as row_ctid from public.%I t%s order by t.ctid offset %s limit %s) chosen join public.%I t on t.ctid=chosen.row_ctid',p_table,case when seasonal then format(' where t.season_id=%L::uuid',p_season_id) else '' end,p_offset,p_limit,p_table) into answer;
 return answer;
end $$;

create or replace function public.admin_register_season_backup_v1(p_season_id uuid,p_backup_sha256 text,p_manifest jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth as $$
begin
 perform public.giveaway_require_admin();
 if p_backup_sha256 !~ '^[0-9a-f]{64}$' or (p_manifest #- '{tables,giveaway_telegram_scheduler_health}') is distinct from (public.admin_season_backup_plan_v1(p_season_id) #- '{tables,giveaway_telegram_scheduler_health}') then raise exception 'Backup changed or incomplete; retry';end if;
 insert into public.giveaway_backup_receipts_v1(backup_sha256,season_id,manifest) values(p_backup_sha256,p_season_id,p_manifest)
 on conflict(backup_sha256) do update set manifest=excluded.manifest,created_at=now() where giveaway_backup_receipts_v1.season_id=excluded.season_id;
 return jsonb_build_object('success',true);
end $$;

revoke all on function public.admin_season_backup_plan_v1(uuid) from public,anon,authenticated;
revoke all on function public.admin_season_backup_page_v1(uuid,text,integer,integer) from public,anon,authenticated;
revoke all on function public.admin_register_season_backup_v1(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_season_backup_plan_v1(uuid) to service_role;
grant execute on function public.admin_season_backup_page_v1(uuid,text,integer,integer) to service_role;
grant execute on function public.admin_register_season_backup_v1(uuid,text,jsonb) to service_role;

CREATE OR REPLACE FUNCTION public.admin_rollover_season_v21513(p_expected_season_id uuid, p_name text, p_season_key text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_winners_target integer, p_backup_sha256 text, p_announcement text DEFAULT ''::text, p_disable_empty_coupons boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$

declare

  v_old public.giveaway_seasons%rowtype;

  v_new uuid;

  v_participants integer:=0;

  v_linked integer:=0;

  v_confirmed integer:=0;

  v_winners integer:=0;

  v_total_points bigint:=0;

  v_purged integer:=0;

  v_rows integer:=0;

  v_auth_before integer:=0;

  v_auth_after integer:=0;

  v_pending_reports integer:=0;

  v_available_keys integer:=0;

  v_coupon_disabled boolean:=false;

  v_table text;

begin

  perform public.giveaway_require_admin();
  -- Freeze the backed-up public rows until the atomic transition finishes.
  for v_table in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and c.relname<>'giveaway_telegram_scheduler_health' order by c.relname loop
    execute format('lock table public.%I in share row exclusive mode',v_table);
  end loop;
  if not exists(select 1 from public.giveaway_backup_receipts_v1 b
    where b.backup_sha256=p_backup_sha256 and b.season_id=p_expected_season_id
    and b.created_at>now()-interval '30 minutes'
    and (b.manifest #- '{tables,giveaway_telegram_scheduler_health}')=(public.admin_season_backup_plan_v1(p_expected_season_id) #- '{tables,giveaway_telegram_scheduler_health}')) then
    raise exception 'Required complete verified backup is missing or stale. Update Manager and create a new backup.';
  end if;


  if char_length(btrim(coalesce(p_name,'')))<2 then raise exception 'Не указано название нового сезона.'; end if;

  if char_length(btrim(coalesce(p_season_key,'')))<2 then raise exception 'Не указан уникальный код нового сезона.'; end if;

  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then raise exception 'Проверьте даты нового сезона.'; end if;

  if coalesce(p_winners_target,0)<1 then raise exception 'План победителей должен быть больше нуля.'; end if;

  if lower(btrim(coalesce(p_backup_sha256,''))) !~ '^[0-9a-f]{64}$' then

    raise exception 'Manager не подтвердил контрольную сумму резервной копии.';

  end if;

  if exists(select 1 from public.giveaway_seasons where lower(season_key)=lower(btrim(p_season_key))) then

    raise exception 'Код сезона уже используется.';

  end if;



  select * into v_old from public.giveaway_seasons where status='active' for update;

  if v_old.id is null then raise exception 'Активный сезон не найден.'; end if;

  if v_old.id is distinct from p_expected_season_id then raise exception 'Активный сезон изменился. Обновите данные.'; end if;

  if v_old.ends_at is not null and v_old.ends_at>now() then raise exception 'Текущий сезон ещё не завершён по времени.'; end if;



  select count(*) into v_pending_reports from public.giveaway_question_reports

  where season_id=v_old.id and status='new';

  if v_pending_reports>0 then raise exception 'Сначала обработайте новые жалобы: %.',v_pending_reports; end if;



  select count(*) into v_auth_before from auth.users;

  select count(*),count(user_id),count(u.id) filter(where u.email_confirmed_at is not null),

         coalesce(sum(p.points),0)

  into v_participants,v_linked,v_confirmed,v_total_points

  from public.participants p left join auth.users u on u.id=p.user_id

  where p.season_id=v_old.id;

  select count(*) into v_winners from public.winners where season_id=v_old.id;



  insert into public.giveaway_winner_archive

    (season_id,season_key,season_title,participant_id,name,game,points,place,won_at,selected_at)

  select w.season_id,v_old.season_key,v_old.name,w.participant_id,w.name,w.game,w.points,w.place,

         coalesce(w.selected_at,w.created_at,now()),coalesce(w.selected_at,w.created_at,now())

  from public.winners w where w.season_id=v_old.id

    and not exists(select 1 from public.giveaway_winner_archive a

      where a.season_id=w.season_id and a.name=w.name and a.game=w.game

        and a.participant_id is not distinct from w.participant_id);



  insert into public.giveaway_season_summaries(

    season_id,season_key,season_title,starts_at,ends_at,finished_at,

    participant_count,linked_auth_count,confirmed_email_count,winner_count,total_points,backup_sha256

  ) values(

    v_old.id,v_old.season_key,v_old.name,v_old.starts_at,v_old.ends_at,now(),

    v_participants,v_linked,v_confirmed,v_winners,v_total_points,lower(btrim(p_backup_sha256))

  ) on conflict(season_id) do update set

    participant_count=excluded.participant_count,linked_auth_count=excluded.linked_auth_count,

    confirmed_email_count=excluded.confirmed_email_count,winner_count=excluded.winner_count,

    total_points=excluded.total_points,backup_sha256=excluded.backup_sha256,finished_at=now();



  -- Preserve the reusable global TikTok identity before participant-linked rows are removed.

  insert into public.giveaway_tiktok_identities

    (user_id,participant_id,tiktok_open_id,display_name,avatar_url,linked_at,updated_at)

  select l.user_id,l.participant_id,l.tiktok_open_id,l.display_name,l.avatar_url,l.linked_at,now()

  from public.giveaway_tiktok_links l join public.participants p on p.id=l.participant_id

  where p.season_id=v_old.id

  on conflict(user_id) do update set

    participant_id=excluded.participant_id,tiktok_open_id=excluded.tiktok_open_id,

    display_name=excluded.display_name,avatar_url=excluded.avatar_url,updated_at=now();



  delete from public.giveaway_tiktok_rewards where season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  delete from public.giveaway_tiktok_watch_sessions s using public.participants p

  where s.participant_id=p.id and p.season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  delete from public.giveaway_tiktok_oauth_states s using public.participants p

  where s.participant_id=p.id and p.season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  delete from public.giveaway_tiktok_links l using public.participants p

  where l.participant_id=p.id and p.season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;



  foreach v_table in array array[

    'giveaway_quiz_challenges','giveaway_boost_log','giveaway_daily_chest_log',

    'giveaway_sponsor_chest_log','giveaway_tiktok_activity_days','giveaway_points_ledger',

    'giveaway_funnel_events','giveaway_participant_notes','giveaway_participant_notifications',

    'giveaway_question_reports','giveaway_guarantee_exceptions','giveaway_winner_receipts',

    'giveaway_admin_log'

  ] loop

    execute format('delete from public.%I where season_id=$1',v_table) using v_old.id;

    get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  end loop;



  delete from public.winners where season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  delete from public.giveaway_season_standings_archive where season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  -- Preserve rows in the verified encrypted backup, then remove FK children.
  delete from public.snake_product_sponsor_claims where season_id=v_old.id;
  delete from public.snake_product_attempts where season_id=v_old.id;
  delete from public.participants where season_id=v_old.id;

  get diagnostics v_rows=row_count; v_purged:=v_purged+v_rows;

  if v_rows<>v_participants then raise exception 'Удалено заявок %, ожидалось %.',v_rows,v_participants; end if;



  select count(*) into v_auth_after from auth.users;

  if v_auth_after<>v_auth_before then raise exception 'Количество Auth-аккаунтов изменилось. Операция отменена.'; end if;



  update public.giveaway_seasons set status='archived',form_enabled=false,finished_at=now(),archived_at=now()

  where id=v_old.id;

  insert into public.giveaway_seasons

    (name,season_key,starts_at,ends_at,status,form_enabled,winners_target,announcement,created_by)

  values(btrim(p_name),btrim(p_season_key),p_starts_at,p_ends_at,'active',true,

         p_winners_target,left(coalesce(p_announcement,''),2000),auth.uid()) returning id into v_new;

  update public.giveaway_settings set

    active_season_id=v_new,season_title=btrim(p_name),season_key=btrim(p_season_key),

    season_state='active',end_at=p_ends_at,form_enabled=true,winners_target=p_winners_target,

    announcement=left(coalesce(p_announcement,''),2000),updated_at=now() where id=1;



  select count(*) into v_available_keys from public.giveaway_game_keys where is_enabled and used_at is null;

  if p_disable_empty_coupons and v_available_keys=0

     and exists(select 1 from public.giveaway_coupon_settings where id=1 and enabled) then

    update public.giveaway_coupon_settings set enabled=false,updated_at=now() where id=1;

    v_coupon_disabled:=true;

  end if;



  update public.giveaway_season_summaries set purged_rows=v_purged where season_id=v_old.id;

  insert into public.giveaway_admin_audit_log

    (admin_user_id,admin_role,action,season_id,new_season_id,affected_rows,parameters,success)

  values(auth.uid(),auth.role(),'compact_season_rollover',v_old.id,v_new,v_purged,

    jsonb_build_object('deleted_applications',v_participants,'auth_users_deleted',0,

      'confirmed_emails_preserved',v_confirmed,'linked_auth_preserved',v_linked,

      'backup_sha256',lower(btrim(p_backup_sha256)),'coupon_disabled',v_coupon_disabled),true);



  return jsonb_build_object(

    'success',true,'old_season_id',v_old.id,'new_season_id',v_new,

    'deleted_applications',v_participants,'purged_rows',v_purged,

    'preserved_winners',v_winners,'auth_users_deleted',0,

    'auth_users_before',v_auth_before,'auth_users_after',v_auth_after,

    'confirmed_emails_preserved',v_confirmed,'linked_auth_preserved',v_linked,

    'coupon_disabled',v_coupon_disabled,'available_coupon_keys',v_available_keys

  );

exception when others then

  insert into public.giveaway_admin_audit_log

    (admin_user_id,admin_role,action,season_id,affected_rows,parameters,success,error_text)

  values(auth.uid(),auth.role(),'compact_season_rollover',p_expected_season_id,0,

    jsonb_build_object('requested_name',p_name,'requested_key',p_season_key),false,sqlerrm);

  return jsonb_build_object('success',false,'error',sqlerrm);

end;

$function$
;
CREATE OR REPLACE FUNCTION public.get_my_top10_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$

declare

  v_player public.participants%rowtype;

  v_email text;

  v_position bigint;

begin

  if auth.uid() is null then

    return jsonb_build_object('success',false,'status','not_authenticated');

  end if;



  v_email:=lower(btrim(coalesce(auth.jwt()->>'email','')));

  select * into v_player

  from public.participants

  where season_id=public.giveaway_active_season_id()

    and (user_id=auth.uid() or (user_id is null and lower(btrim(coalesce(email,'')))=v_email))

  order by user_id is not null desc

  limit 1;



  if v_player.id is null then

    return jsonb_build_object('success',false,'status','no_application');

  end if;



  if coalesce(v_player.is_test_account,false) then

    return jsonb_build_object('success',true,'in_top_10',false,'top_10_position',null,'test_mode',true);

  end if;



  select ranked.position into v_position

  from (

    select p.id,

      row_number() over(

        order by coalesce(p.points,0) desc,

          p.points_reached_at asc nulls last,

          p.created_at asc,

          p.id

      ) as position

    from public.participants p

    where p.season_id=v_player.season_id

      and coalesce(p.is_test_account,false)=false
      and not coalesce(p.globally_banned,false)
      and not public.giveaway_is_globally_banned(p.email,p.steamid,p.tiktok)

  ) ranked

  where ranked.id=v_player.id;



  return jsonb_build_object(

    'success',true,

    'in_top_10',coalesce(v_position<=10,false),

    'top_10_position',case when v_position<=10 then v_position else null end

  );

end;

$function$
;
revoke all on function public.admin_rollover_season_v21512(uuid,text,text,timestamptz,timestamptz,integer,text,boolean) from public,anon,authenticated,service_role;
commit;
