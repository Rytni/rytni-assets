-- Additive, participant-only social leaderboard snapshots. Existing balances/formulas untouched.
begin;
create table if not exists public.giveaway_social_snapshots_v1 (
  channel text primary key check (channel in ('test','main')),
  season_id uuid not null references public.giveaway_seasons(id),
  payload jsonb not null,
  previous_payload jsonb,
  published_at timestamptz not null default now()
);
alter table public.giveaway_social_snapshots_v1 enable row level security;
revoke all on public.giveaway_social_snapshots_v1 from public,anon,authenticated;
grant select,insert,update on public.giveaway_social_snapshots_v1 to service_role;

create or replace function public.giveaway_social_handle_v1(p_value text)
returns text language sql immutable set search_path='' as $$
  select case when btrim(p_value) ~* '^https://(www\.)?tiktok\.com/@[a-z0-9_.]{1,24}/?$'
    then lower(regexp_replace(regexp_replace(btrim(p_value),'^https://(www\.)?tiktok\.com/@','','i'),'/$',''))
    when btrim(p_value) ~ '^@?[A-Za-z0-9_.]{1,24}$' then lower(ltrim(btrim(p_value),'@')) else null end
$$;
revoke all on function public.giveaway_social_handle_v1(text) from public,anon,authenticated;

create or replace function public.giveaway_social_members_v1(p_season uuid)
returns table(handle text) language sql stable security definer set search_path='' as $$
  select public.giveaway_social_handle_v1(p.tiktok) from public.participants p where p.season_id=p_season
  group by public.giveaway_social_handle_v1(p.tiktok)
  having count(*)=1 and public.giveaway_social_handle_v1(p.tiktok) is not null
    and public.giveaway_social_handle_v1(p.tiktok) not in ('rytni.tv','rytni.blic')
    and not bool_or(coalesce(p.globally_banned,false) or coalesce(p.is_test_account,false)
      or coalesce(p.progression_blocked,false))
$$;
revoke all on function public.giveaway_social_members_v1(uuid) from public,anon,authenticated;

create or replace function public.admin_social_context_v1()
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('season_id',public.giveaway_active_season_id(),
    'revision',md5(coalesce(jsonb_agg(jsonb_build_object('id',p.id,'tiktok',p.tiktok,
      'globally_banned',p.globally_banned,'is_test_account',p.is_test_account,
      'progression_blocked',p.progression_blocked) order by p.id)::text,'[]')),
    'participants',coalesce(jsonb_agg(jsonb_build_object('tiktok',p.tiktok,
      'globally_banned',p.globally_banned,'is_test_account',p.is_test_account,
      'progression_blocked',p.progression_blocked) order by p.id),'[]'::jsonb))
  from public.participants p where p.season_id=public.giveaway_active_season_id()
$$;
revoke all on function public.admin_social_context_v1() from public,anon,authenticated;
grant execute on function public.admin_social_context_v1() to service_role;

create or replace function public.admin_publish_social_v1(p_channel text,p_revision text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb; period jsonb; scope_key text; kind text; r jsonb; c jsonb; eligible text[];
  metric text; seen text[]; previous_metric bigint; previous_days bigint; previous_handle text;
begin
  if p_channel not in ('test','main') or p_channel is null then raise exception 'Invalid channel'; end if;
  perform pg_advisory_xact_lock(hashtext('giveaway-social-'||p_channel));
  context:=public.admin_social_context_v1();
  select coalesce(array_agg(m.handle),array[]::text[]) into eligible from public.giveaway_social_members_v1((context->>'season_id')::uuid) m;
  if context->>'season_id' is null or p_payload->>'season_id' is distinct from context->>'season_id'
    or p_revision is distinct from context->>'revision' then raise exception 'Season/membership changed'; end if;
  if octet_length(p_payload::text)>500000 or p_payload->>'schema' is distinct from '1'
    or p_payload->>'algorithm' is distinct from 'social_activity_v1'
    or (select array_agg(k order by k) from jsonb_object_keys(p_payload) k)
      is distinct from array['algorithm','coverage','generated_at','periods','schema','season_id']::text[]
    or abs(extract(epoch from ((p_payload->>'generated_at')::timestamptz-now())))>3600
    or jsonb_typeof(p_payload->'periods') is distinct from 'array'
    or (select jsonb_agg(v->'days') from jsonb_array_elements(p_payload->'periods') v) is distinct from '[7,14,30]'::jsonb
    then raise exception 'Invalid snapshot contract'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p_payload->'coverage') k) is distinct from array['gaming','tech']::text[] then raise exception 'Invalid coverage'; end if;
  foreach scope_key in array array['gaming','tech'] loop
    c:=p_payload->'coverage'->scope_key;
    if (select array_agg(k order by k) from jsonb_object_keys(c) k) is distinct from array['comments','comments_asof','likes','likes_asof','username']::text[]
      or c->>'username' is distinct from (case scope_key when 'gaming' then 'rytni.tv' else 'rytni.blic' end)
      or c->>'comments' not in ('PARTIAL','COMPLETE') or c->>'likes' is distinct from 'OBSERVED_PARTIAL'
      then raise exception 'Invalid account source'; end if;
    if c->>'comments_asof' is not null then perform (c->>'comments_asof')::timestamptz; end if;
    if c->>'likes_asof' is not null then perform (c->>'likes_asof')::timestamptz; end if;
  end loop;
  for period in select value from jsonb_array_elements(p_payload->'periods') loop
    if (select array_agg(k order by k) from jsonb_object_keys(period) k) is distinct from array['days','end','scopes','start']::text[]
      or period->>'end' is distinct from p_payload->>'generated_at'
      or (period->>'end')::timestamptz-(period->>'start')::timestamptz is distinct from make_interval(days=>(period->>'days')::int)
      or (select array_agg(k order by k) from jsonb_object_keys(period->'scopes') k) is distinct from array['all','gaming','tech']::text[] then raise exception 'Invalid period'; end if;
    foreach scope_key in array array['all','gaming','tech'] loop
      if (select array_agg(k order by k) from jsonb_object_keys(period->'scopes'->scope_key) k) is distinct from array['activity','comments','likes']::text[] then raise exception 'Invalid categories'; end if;
      foreach kind in array array['comments','likes','activity'] loop
        c:=period->'scopes'->scope_key->kind;
        if jsonb_typeof(c) is distinct from 'array' or jsonb_array_length(c)>50 then raise exception 'Invalid board'; end if;
        seen:=array[]::text[];previous_metric:=null;previous_days:=null;previous_handle:=null;
        metric:=case kind when 'comments' then 'comments' when 'likes' then 'liked_posts' else 'score' end;
        for r in select value from jsonb_array_elements(c) loop
          if (select array_agg(k order by k) from jsonb_object_keys(r) k) is distinct from array['active_days','commented_posts','comments','handle','liked_posts','score']::text[]
            or public.giveaway_social_handle_v1(r->>'handle') is distinct from r->>'handle'
            or not (r->>'handle'=any(eligible))
            or r->>'handle'=any(seen) then raise exception 'Invalid public member row'; end if;
          if exists(select 1 from jsonb_each(r) e where e.key<>'handle' and (jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[0-9]{1,8}$' or e.value::text::bigint>10000000))
            or (r->>'commented_posts')::int>(r->>'comments')::int
            or (r->>'active_days')::int>(period->>'days')::int+1
            or (r->>'score')::int<>3*(r->>'commented_posts')::int+(r->>'liked_posts')::int+2*(r->>'active_days')::int
            or (r->>metric)::int<=0 then raise exception 'Invalid public counts'; end if;
          if previous_metric is not null and ((r->>metric)::bigint>previous_metric or
            ((r->>metric)::bigint=previous_metric and (r->>'active_days')::bigint>previous_days) or
            ((r->>metric)::bigint=previous_metric and (r->>'active_days')::bigint=previous_days and (r->>'handle') collate "C" < previous_handle collate "C")) then raise exception 'Invalid rank order'; end if;
          seen:=array_append(seen,r->>'handle');previous_metric:=(r->>metric)::bigint;previous_days:=(r->>'active_days')::bigint;previous_handle:=r->>'handle';
        end loop;
      end loop;
    end loop;
  end loop;
  insert into public.giveaway_social_snapshots_v1(channel,season_id,payload)
    values(p_channel,(context->>'season_id')::uuid,p_payload)
    on conflict(channel) do update set season_id=excluded.season_id,previous_payload=giveaway_social_snapshots_v1.payload,
      payload=excluded.payload,published_at=now();
  return jsonb_build_object('status','PUBLISHED','channel',p_channel,'generated_at',p_payload->>'generated_at');
end
$$;
revoke all on function public.admin_publish_social_v1(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_publish_social_v1(text,text,jsonb) to service_role;

create or replace function public.giveaway_social_rankings_v1(p_channel text default 'test')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb; i integer; scope_key text; kind text; rows jsonb; eligible text[];
begin
  if p_channel not in ('test','main') or p_channel is null then raise exception 'Invalid channel'; end if;
  select s.payload into payload from public.giveaway_social_snapshots_v1 s
    where s.channel=p_channel and s.season_id=public.giveaway_active_season_id();
  if payload is null then return jsonb_build_object('status','NOT_PUBLISHED'); end if;
  select coalesce(array_agg(m.handle),array[]::text[]) into eligible from public.giveaway_social_members_v1(public.giveaway_active_season_id()) m;
  -- Apply current membership/bans on every read, including after publication.
  for i in 0..2 loop
    foreach scope_key in array array['all','gaming','tech'] loop
      foreach kind in array array['comments','likes','activity'] loop
        select coalesce(jsonb_agg(r order by ordinal),'[]'::jsonb) into rows
          from jsonb_array_elements(payload->'periods'->i->'scopes'->scope_key->kind) with ordinality v(r,ordinal)
          where r->>'handle'=any(eligible);
        payload:=jsonb_set(payload,array['periods',i::text,'scopes',scope_key,kind],rows);
      end loop;
    end loop;
  end loop;
  return jsonb_build_object('status','READY','snapshot',payload);
end
$$;
revoke all on function public.giveaway_social_rankings_v1(text) from public;
grant execute on function public.giveaway_social_rankings_v1(text) to anon,authenticated,service_role;
commit;
