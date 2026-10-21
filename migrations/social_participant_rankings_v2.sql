-- Additive TEST-compatible community ranking. No changes to v1 or gift delivery status.
begin;
create table if not exists public.giveaway_social_snapshots_v2 (
  channel text primary key check (channel in ('test','main')),
  season_id uuid not null references public.giveaway_seasons(id),
  payload jsonb not null, previous_payload jsonb,
  published_at timestamptz not null default now()
);
alter table public.giveaway_social_snapshots_v2 enable row level security;
revoke all on public.giveaway_social_snapshots_v2 from public,anon,authenticated;
grant select,insert,update on public.giveaway_social_snapshots_v2 to service_role;

create or replace function public.giveaway_social_people_v2()
returns table(handle text,points bigint,points_reached_at timestamptz,winner_selected boolean)
language sql stable security definer set search_path='' as $$
  select public.giveaway_social_handle_v1(p.tiktok),p.points,p.points_reached_at,
    exists(select 1 from public.winners w left join public.participants previous on previous.id=w.participant_id
      where w.participant_id=p.id or (p.user_id is not null and previous.user_id=p.user_id))
  from public.participants p
  join public.giveaway_social_members_v1(public.giveaway_active_season_id()) m
    on m.handle=public.giveaway_social_handle_v1(p.tiktok)
  where p.season_id=public.giveaway_active_season_id()
$$;
revoke all on function public.giveaway_social_people_v2() from public,anon,authenticated;

create or replace function public.admin_social_context_v2()
returns jsonb language sql stable security definer set search_path='' as $$
  with people as (
    select coalesce(jsonb_agg(jsonb_build_object('tiktok',p.tiktok,'points',p.points,
      'points_reached_at',p.points_reached_at,'winner_selected',coalesce(s.winner_selected,false),
      'globally_banned',p.globally_banned,'is_test_account',p.is_test_account,
      'progression_blocked',p.progression_blocked) order by p.id),'[]'::jsonb) value
    from public.participants p left join public.giveaway_social_people_v2() s
      on s.handle=public.giveaway_social_handle_v1(p.tiktok)
    where p.season_id=public.giveaway_active_season_id()
  ) select jsonb_build_object('season_id',public.giveaway_active_season_id(),
      'revision',md5(value::text),'participants',value) from people
$$;
revoke all on function public.admin_social_context_v2() from public,anon,authenticated;
grant execute on function public.admin_social_context_v2() to service_role;

create or replace function public.admin_publish_social_v2(p_channel text,p_revision text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb; period jsonb; boards jsonb; r jsonb; c jsonb; kind text; metric text;
  seen text[]; previous_metric bigint; previous_days bigint; previous_handle text;
  eligible text[]; winners text[]; expected_progression jsonb; expected_policy jsonb:=
    '{"social_top":50,"minimum_comments":12,"minimum_commented_posts":5,"minimum_comment_days":8,"minimum_comment_weeks":3}';
begin
  if p_channel is null or p_channel not in ('test','main') then raise exception 'Invalid channel'; end if;
  perform pg_advisory_xact_lock(hashtext('giveaway-social-v2-'||p_channel));
  context:=public.admin_social_context_v2();
  if p_revision is distinct from context->>'revision' then raise exception 'Community context changed; retry'; end if;
  select coalesce(array_agg(s.handle),array[]::text[]),coalesce(array_agg(s.handle) filter(where s.winner_selected),array[]::text[])
    into eligible,winners from public.giveaway_social_people_v2() s;
  if (select array_agg(k order by k) from jsonb_object_keys(p_payload) k) is distinct from
      array['algorithm','coverage','eligibility','generated_at','periods','schema','season_id']::text[]
    or p_payload->>'schema' is distinct from '2' or p_payload->>'algorithm' is distinct from 'active_community_v2'
    or p_payload->>'season_id' is distinct from context->>'season_id'
    or p_payload->'eligibility' is distinct from expected_policy
    or abs(extract(epoch from ((p_payload->>'generated_at')::timestamptz-now())))>3600
    or jsonb_typeof(p_payload->'periods') is distinct from 'array' or jsonb_array_length(p_payload->'periods')<>1
    then raise exception 'Invalid community contract'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p_payload->'coverage') k) is distinct from array['gaming','tech']::text[]
    then raise exception 'Invalid coverage'; end if;
  foreach kind in array array['gaming','tech'] loop
    c:=p_payload->'coverage'->kind;
    if (select array_agg(k order by k) from jsonb_object_keys(c) k) is distinct from array['comments','comments_asof','likes','likes_asof','username']::text[]
      or c->>'username' is distinct from (case kind when 'gaming' then 'rytni.tv' else 'rytni.blic' end)
      or c->>'comments' not in ('PARTIAL','COMPLETE') or c->>'likes' is distinct from 'OBSERVED_PARTIAL'
      then raise exception 'Invalid community source'; end if;
    if c->>'comments_asof' is not null then perform (c->>'comments_asof')::timestamptz; end if;
    if c->>'likes_asof' is not null then perform (c->>'likes_asof')::timestamptz; end if;
  end loop;
  period:=p_payload->'periods'->0;
  if (select array_agg(k order by k) from jsonb_object_keys(period) k) is distinct from array['days','end','scopes','start']::text[]
    or period->>'days' is distinct from '30' or period->>'end' is distinct from p_payload->>'generated_at'
    or (period->>'end')::timestamptz-(period->>'start')::timestamptz is distinct from interval '30 days'
    or (select array_agg(k order by k) from jsonb_object_keys(period->'scopes') k) is distinct from array['all']::text[]
    then raise exception 'Invalid community period'; end if;
  boards:=period->'scopes'->'all';
  if (select array_agg(k order by k) from jsonb_object_keys(boards) k) is distinct from array['activity','comments','progression']::text[]
    then raise exception 'Invalid community categories'; end if;
  foreach kind in array array['comments','activity','progression'] loop
    c:=boards->kind;
    if jsonb_typeof(c) is distinct from 'array' or jsonb_array_length(c)>50 then raise exception 'Invalid community board'; end if;
    seen:=array[]::text[];previous_metric:=null;previous_days:=null;previous_handle:=null;
    metric:=case kind when 'comments' then 'comments' else 'score' end;
    for r in select value from jsonb_array_elements(c) loop
      if (select array_agg(k order by k) from jsonb_object_keys(r) k) is distinct from
          array['active_days','comment_days','comment_weeks','commented_posts','comments','handle','liked_posts','score','winner_selected']::text[]
        or public.giveaway_social_handle_v1(r->>'handle') is distinct from r->>'handle'
        or not(r->>'handle'=any(eligible)) or r->>'handle'=any(seen)
        or jsonb_typeof(r->'winner_selected') is distinct from 'boolean'
        or (r->>'winner_selected')::boolean is distinct from (r->>'handle'=any(winners))
        then raise exception 'Invalid community public member'; end if;
      if exists(select 1 from jsonb_each(r) e where e.key not in ('handle','winner_selected')
          and (jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[0-9]{1,8}$' or e.value::text::bigint>10000000))
        or (r->>'commented_posts')::int>(r->>'comments')::int or (r->>'active_days')::int>31
        or (r->>'comment_days')::int>least((r->>'active_days')::int,(r->>'comments')::int)
        or (r->>'comment_weeks')::int>least(6,(r->>'comment_days')::int)
        or (r->>'score')::int<>3*(r->>'commented_posts')::int+(r->>'liked_posts')::int+2*(r->>'active_days')::int
        or (kind<>'progression' and (r->>metric)::int<=0) then raise exception 'Invalid community counts'; end if;
      if kind<>'progression' and previous_metric is not null and ((r->>metric)::bigint>previous_metric or
        ((r->>metric)::bigint=previous_metric and (r->>'active_days')::bigint>previous_days) or
        ((r->>metric)::bigint=previous_metric and (r->>'active_days')::bigint=previous_days and (r->>'handle') collate "C"<previous_handle collate "C"))
        then raise exception 'Invalid community social order'; end if;
      seen:=array_append(seen,r->>'handle');previous_metric:=(r->>metric)::bigint;
      previous_days:=(r->>'active_days')::bigint;previous_handle:=r->>'handle';
    end loop;
  end loop;
  if exists(select 1 from jsonb_array_elements(boards->'comments') as cr(comment_row)
      join jsonb_array_elements(boards->'activity') as ar(activity_row)
        on ar.activity_row->>'handle'=cr.comment_row->>'handle' where ar.activity_row<>cr.comment_row)
    then raise exception 'Community category evidence differs'; end if;
  -- Recompute selection AND private-points order server-side. Amounts never enter payload.
  select coalesce(jsonb_agg(ar.activity_row order by s.points desc,s.points_reached_at asc,(ar.activity_row->>'handle') collate "C"),'[]'::jsonb)
    into expected_progression from jsonb_array_elements(boards->'activity') as ar(activity_row)
    join public.giveaway_social_people_v2() s on s.handle=ar.activity_row->>'handle'
    where s.points>0 and s.points_reached_at is not null
      and exists(select 1 from jsonb_array_elements(boards->'comments') as cr(comment_row)
        where cr.comment_row->>'handle'=ar.activity_row->>'handle')
      and (ar.activity_row->>'comments')::int>=12 and (ar.activity_row->>'commented_posts')::int>=5
      and (ar.activity_row->>'comment_days')::int>=8 and (ar.activity_row->>'comment_weeks')::int>=3;
  if boards->'progression' is distinct from expected_progression then raise exception 'Invalid active progression selection/order'; end if;
  insert into public.giveaway_social_snapshots_v2(channel,season_id,payload)
    values(p_channel,(context->>'season_id')::uuid,p_payload)
    on conflict(channel) do update set season_id=excluded.season_id,previous_payload=giveaway_social_snapshots_v2.payload,
      payload=excluded.payload,published_at=now();
  return jsonb_build_object('status','PUBLISHED','channel',p_channel,'generated_at',p_payload->>'generated_at');
end
$$;
revoke all on function public.admin_publish_social_v2(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_publish_social_v2(text,text,jsonb) to service_role;

create or replace function public.giveaway_social_rankings_v2(p_channel text default 'test')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb; kind text; rows jsonb;
begin
  if p_channel is null or p_channel not in ('test','main') then raise exception 'Invalid channel'; end if;
  select s.payload into payload from public.giveaway_social_snapshots_v2 s
    where s.channel=p_channel and s.season_id=public.giveaway_active_season_id();
  if payload is null then return jsonb_build_object('status','NOT_PUBLISHED'); end if;
  foreach kind in array array['comments','activity','progression'] loop
    select coalesce(jsonb_agg(r||jsonb_build_object('winner_selected',s.winner_selected) order by ordinal),'[]'::jsonb)
      into rows from jsonb_array_elements(payload->'periods'->0->'scopes'->'all'->kind) with ordinality v(r,ordinal)
      join public.giveaway_social_people_v2() s on s.handle=r->>'handle';
    payload:=jsonb_set(payload,array['periods','0','scopes','all',kind],rows);
  end loop;
  return jsonb_build_object('status','READY','snapshot',payload);
end
$$;
revoke all on function public.giveaway_social_rankings_v2(text) from public;
grant execute on function public.giveaway_social_rankings_v2(text) to anon,authenticated,service_role;
commit;
