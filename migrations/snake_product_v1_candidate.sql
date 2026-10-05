-- UNAPPLIED CANDIDATE. Do not run on a live project without a separate reviewed rollout.
-- Depends on audited Fly account/season helpers; modifies no Fly table/function.
-- Ranked stays disabled until the aggregate-admission candidate is tested in isolation.
-- Client counters are untrusted; this uses the current Fly aggregate admission model.
begin;

do $$ begin
  if to_regclass('public.participants') is null
    or to_regclass('public.giveaway_seasons') is null
    or to_regprocedure('public.giveaway_active_season_id()') is null
    or to_regprocedure('public.giveaway_can_access_player(public.participants)') is null
    or to_regprocedure('extensions.digest(text,text)') is null
    or to_regprocedure('gen_random_uuid()') is null then
    raise exception 'Snake prerequisite missing: audited participants/seasons/access helpers required';
  end if;
end $$;

create table public.snake_product_settings (
  id smallint primary key default 1 check(id=1),
  enabled boolean not null default false,
  normal_limit integer not null default 3 check(normal_limit=3),
  sponsor_limit integer not null default 2 check(sponsor_limit=2),
  reward_points integer not null default 0 check(reward_points=0),
  max_score integer not null default 10000000 check(max_score between 1 and 10000000),
  approved_releases text[] not null default '{}'
);
insert into public.snake_product_settings(id) values(1);

create table public.snake_product_attempts (
  id uuid primary key default gen_random_uuid(),
  game text not null default 'snake' check(game='snake'),
  season_id uuid not null references public.giveaway_seasons(id),
  participant_id uuid not null references public.participants(id),
  owner_user_id uuid not null,
  request_id text not null check(length(request_id) between 1 and 128),
  seed integer not null check(seed between 1 and 2147483646),
  client_token_hash text not null,
  release_version text not null check(length(release_version) between 1 and 128),
  is_sponsor boolean not null default false,
  status text not null default 'started' check(status in ('started','finished','expired','rejected')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '12 hours',
  finished_at timestamptz,
  duration_ms integer,
  ticks integer,
  score integer check(score between 0 and 10000000),
  audit jsonb,
  start_result jsonb,
  result jsonb,
  unique(game,season_id,participant_id,request_id),
  check((status='finished' and finished_at is not null and result is not null and score is not null)
    or status<>'finished')
);
create index snake_product_window on public.snake_product_attempts(game,season_id,participant_id,started_at);
create index snake_product_board on public.snake_product_attempts(game,season_id,score desc,finished_at)
  where status='finished';

create table public.snake_product_sponsor_claims (
  id uuid primary key default gen_random_uuid(),
  game text not null default 'snake' check(game='snake'),
  season_id uuid not null references public.giveaway_seasons(id),
  participant_id uuid not null references public.participants(id),
  owner_user_id uuid not null,
  request_id text not null check(length(request_id) between 1 and 128),
  client_token_hash text not null,
  release_version text not null check(length(release_version) between 1 and 128),
  claimed_at timestamptz not null default now(),
  attempt_id uuid unique references public.snake_product_attempts(id),
  consumed_at timestamptz,
  result jsonb not null,
  unique(game,season_id,participant_id,request_id),
  check((attempt_id is null and consumed_at is null) or (attempt_id is not null and consumed_at is not null))
);
create index snake_product_sponsor_window on public.snake_product_sponsor_claims(game,season_id,participant_id,claimed_at);

alter table public.snake_product_settings enable row level security;
alter table public.snake_product_attempts enable row level security;
alter table public.snake_product_sponsor_claims enable row level security;
revoke all on public.snake_product_settings,public.snake_product_attempts,public.snake_product_sponsor_claims
  from public,anon,authenticated,service_role;

-- Private helper. Strict linked ownership in addition to current season/ban policy.
create function public.snake_product_can_access_v1(p public.participants)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
  select auth.uid() is not null and p.user_id=auth.uid()
    and p.season_id=public.giveaway_active_season_id()
    and coalesce(public.giveaway_can_access_player(p),false)
$$;

create function public.get_snake_product_hub_v1(p_participant_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare
  v_p public.participants%rowtype; v_s public.snake_product_settings%rowtype;
  v_used integer; v_claims integer; v_credits integer; v_best integer; v_rank integer;
  v_reset timestamptz; v_sponsor_reset timestamptz; v_board jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('success',false,'status','not_authenticated'); end if;
  select * into v_p from public.participants p where p.id=p_participant_id;
  if v_p.id is null or not coalesce(public.snake_product_can_access_v1(v_p),false) then
    return jsonb_build_object('success',false,'status','forbidden'); end if;
  select * into v_s from public.snake_product_settings where id=1;
  if v_s.id is null or not v_s.enabled then
    return jsonb_build_object('success',true,'status','disabled','available',false,'reward_points',0); end if;
  select count(*)::integer,min(started_at)+interval '24 hours' into v_used,v_reset
    from public.snake_product_attempts where game='snake' and season_id=v_p.season_id
      and participant_id=v_p.id and not is_sponsor and started_at>now()-interval '24 hours';
  select count(*)::integer,count(*) filter(where attempt_id is null)::integer,min(claimed_at)+interval '24 hours'
    into v_claims,v_credits,v_sponsor_reset from public.snake_product_sponsor_claims
    where game='snake' and season_id=v_p.season_id and participant_id=v_p.id and claimed_at>now()-interval '24 hours';
  with best as (
    select distinct on(participant_id) participant_id,score,finished_at
      from public.snake_product_attempts where game='snake' and season_id=v_p.season_id and status='finished'
      order by participant_id,score desc,finished_at,id
  ), ranked as (
    select *,row_number() over(order by score desc,finished_at,participant_id)::integer place from best
  ) select coalesce(jsonb_agg(jsonb_build_object('place',r.place,'name',left(coalesce(nullif(btrim(p.name),''),'Игрок'),40),
       'score',r.score,'is_me',r.participant_id=v_p.id) order by r.place) filter(where r.place<=20),'[]'::jsonb),
       coalesce(max(r.score) filter(where r.participant_id=v_p.id),0),max(r.place) filter(where r.participant_id=v_p.id)
       into v_board,v_best,v_rank from ranked r join public.participants p on p.id=r.participant_id;
  return jsonb_build_object('success',true,'status','ready','available',true,'game','snake','season_id',v_p.season_id,
    'cycle','rolling_24h','attempts_total',3,'attempts_used',least(v_used,3),'attempts_remaining',greatest(3-v_used,0),
    'next_attempt_at',case when v_used>=3 then v_reset else null end,
    'sponsor_attempt_limit',2,'sponsor_attempts_used',least(v_claims,2),'sponsor_attempt_credits',v_credits,
    'sponsor_attempt_available',v_used>=3 and v_claims<2,
    'next_sponsor_attempt_at',case when v_claims>=2 then v_sponsor_reset else null end,
    'reward_points',0,'round_seconds',0,'best_score',v_best,'my_rank',v_rank,'leaderboard',v_board);
end $$;

create function public.start_snake_product_attempt_v1(
  p_participant_id uuid,p_client_token text,p_release text,p_request_id text
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth,extensions as $$
declare
  v_p public.participants%rowtype; v_s public.snake_product_settings%rowtype;
  v_a public.snake_product_attempts%rowtype; v_claim uuid; v_used integer; v_credits integer;
  v_reset timestamptz; v_hash text; v_result jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('success',false,'status','not_authenticated'); end if;
  select * into v_p from public.participants p where p.id=p_participant_id for update;
  if v_p.id is null or not coalesce(public.snake_product_can_access_v1(v_p),false) then
    return jsonb_build_object('success',false,'status','forbidden'); end if;
  if p_request_id is null or length(p_request_id) not between 1 and 128
    or p_release is null or length(p_release) not between 1 and 128
    or p_client_token is null or length(p_client_token) not between 16 and 512 then
    return jsonb_build_object('success',false,'status','invalid_request'); end if;
  v_hash:=encode(extensions.digest(p_client_token||':'||auth.uid()::text||':'||v_p.id::text,'sha256'),'hex');
  select * into v_a from public.snake_product_attempts where game='snake' and season_id=v_p.season_id
    and participant_id=v_p.id and request_id=p_request_id;
  if v_a.id is not null then
    if v_a.client_token_hash<>v_hash or v_a.release_version<>p_release or v_a.owner_user_id<>auth.uid() then
      return jsonb_build_object('success',false,'status','idempotency_conflict'); end if;
    return v_a.start_result;
  end if;
  select * into v_s from public.snake_product_settings where id=1;
  if v_s.id is null or not v_s.enabled then return jsonb_build_object('success',false,'status','disabled'); end if;
  if not (p_release=any(v_s.approved_releases)) then return jsonb_build_object('success',false,'status','release_not_approved'); end if;
  update public.snake_product_attempts set status='expired' where participant_id=v_p.id
    and season_id=v_p.season_id and status='started' and expires_at<now();
  select count(*)::integer,min(started_at)+interval '24 hours' into v_used,v_reset
    from public.snake_product_attempts where game='snake' and season_id=v_p.season_id and participant_id=v_p.id
      and not is_sponsor and started_at>now()-interval '24 hours';
  if v_used>=3 then
    select id into v_claim from public.snake_product_sponsor_claims where game='snake' and season_id=v_p.season_id
      and participant_id=v_p.id and attempt_id is null and claimed_at>now()-interval '24 hours' order by claimed_at,id limit 1 for update;
    if v_claim is null then return jsonb_build_object('success',false,'status','limit','attempts_remaining',0,'next_attempt_at',v_reset); end if;
  end if;
  insert into public.snake_product_attempts(season_id,participant_id,owner_user_id,request_id,seed,client_token_hash,release_version,is_sponsor)
    values(v_p.season_id,v_p.id,auth.uid(),p_request_id,(floor(random()*2147483646)+1)::integer,v_hash,p_release,v_claim is not null)
    returning * into v_a;
  if v_claim is not null then update public.snake_product_sponsor_claims set attempt_id=v_a.id,consumed_at=now() where id=v_claim; end if;
  select count(*)::integer into v_credits from public.snake_product_sponsor_claims where game='snake'
    and season_id=v_p.season_id and participant_id=v_p.id and attempt_id is null and claimed_at>now()-interval '24 hours';
  v_result:=jsonb_build_object('success',true,'status','started','attempt_id',v_a.id,'seed',v_a.seed,
    'started_at',v_a.started_at,'expires_at',v_a.expires_at,'sponsor_attempt',v_a.is_sponsor,
    'sponsor_attempt_credits',v_credits,'reward_points',0,'round_seconds',0,
    'attempts_remaining',greatest(3-v_used-case when v_a.is_sponsor then 0 else 1 end,0));
  update public.snake_product_attempts set start_result=v_result where id=v_a.id;
  return v_result;
end $$;

create function public.claim_snake_product_sponsor_v1(
  p_participant_id uuid,p_client_token text,p_release text,p_request_id text
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth,extensions as $$
declare
  v_p public.participants%rowtype; v_s public.snake_product_settings%rowtype;
  v_c public.snake_product_sponsor_claims%rowtype; v_used integer; v_claims integer; v_credits integer;
  v_hash text; v_reset timestamptz; v_result jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('success',false,'status','not_authenticated'); end if;
  select * into v_p from public.participants p where p.id=p_participant_id for update;
  if v_p.id is null or not coalesce(public.snake_product_can_access_v1(v_p),false) then
    return jsonb_build_object('success',false,'status','forbidden'); end if;
  if p_request_id is null or length(p_request_id) not between 1 and 128
    or p_release is null or length(p_release) not between 1 and 128
    or p_client_token is null or length(p_client_token) not between 16 and 512 then
    return jsonb_build_object('success',false,'status','invalid_request'); end if;
  v_hash:=encode(extensions.digest(p_client_token||':'||auth.uid()::text||':'||v_p.id::text,'sha256'),'hex');
  select * into v_c from public.snake_product_sponsor_claims where game='snake' and season_id=v_p.season_id
    and participant_id=v_p.id and request_id=p_request_id;
  if v_c.id is not null then
    if v_c.client_token_hash<>v_hash or v_c.release_version<>p_release or v_c.owner_user_id<>auth.uid() then
      return jsonb_build_object('success',false,'status','idempotency_conflict'); end if;
    return v_c.result;
  end if;
  select * into v_s from public.snake_product_settings where id=1;
  if v_s.id is null or not v_s.enabled then return jsonb_build_object('success',false,'status','disabled'); end if;
  if not (p_release=any(v_s.approved_releases)) then return jsonb_build_object('success',false,'status','release_not_approved'); end if;
  select count(*)::integer into v_used from public.snake_product_attempts where game='snake' and season_id=v_p.season_id
    and participant_id=v_p.id and not is_sponsor and started_at>now()-interval '24 hours';
  if v_used<3 then return jsonb_build_object('success',false,'status','regular_attempts_available'); end if;
  select count(*)::integer,count(*) filter(where attempt_id is null)::integer,min(claimed_at)+interval '24 hours'
    into v_claims,v_credits,v_reset from public.snake_product_sponsor_claims where game='snake'
      and season_id=v_p.season_id and participant_id=v_p.id and claimed_at>now()-interval '24 hours';
  if v_claims>=2 then return jsonb_build_object('success',false,'status','cooldown','next_sponsor_attempt_at',v_reset); end if;
  v_result:=jsonb_build_object('success',true,'status','credited','sponsor_attempt_credits',v_credits+1,
    'sponsor_attempts_used',v_claims+1,'sponsor_attempt_limit',2,'sponsor_attempt_available',v_claims+1<2);
  insert into public.snake_product_sponsor_claims(season_id,participant_id,owner_user_id,request_id,client_token_hash,release_version,result)
    values(v_p.season_id,v_p.id,auth.uid(),p_request_id,v_hash,p_release,v_result);
  return v_result;
end $$;

create function public.finish_snake_product_attempt_v1(
  p_participant_id uuid,p_client_token text,p_attempt_id uuid,p_release text,
  p_duration_ms integer,p_ticks integer,p_score integer,p_audit jsonb
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth,extensions as $$
declare
  v_p public.participants%rowtype; v_s public.snake_product_settings%rowtype;
  v_a public.snake_product_attempts%rowtype; v_hash text; v_best integer; v_result jsonb;
  v_key text; v_value jsonb; v_invalid boolean:=false; v_counter numeric; v_max_score bigint;
begin
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
end $$;

revoke all on function public.snake_product_can_access_v1(public.participants) from public,anon,authenticated,service_role;
revoke all on function public.get_snake_product_hub_v1(uuid) from public,anon,service_role;
revoke all on function public.start_snake_product_attempt_v1(uuid,text,text,text) from public,anon,service_role;
revoke all on function public.claim_snake_product_sponsor_v1(uuid,text,text,text) from public,anon,service_role;
revoke all on function public.finish_snake_product_attempt_v1(uuid,text,uuid,text,integer,integer,integer,jsonb) from public,anon,service_role;
grant execute on function public.get_snake_product_hub_v1(uuid) to authenticated;
grant execute on function public.start_snake_product_attempt_v1(uuid,text,text,text) to authenticated;
grant execute on function public.claim_snake_product_sponsor_v1(uuid,text,text,text) to authenticated;
grant execute on function public.finish_snake_product_attempt_v1(uuid,text,uuid,text,integer,integer,integer,jsonb) to authenticated;

commit;
