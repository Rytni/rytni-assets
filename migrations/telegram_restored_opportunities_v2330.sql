-- Telegram 2.33: restored sponsor chest and rolling Arcade attempts.
-- Additive, service-only; feature remains disabled until the matching bot is deployed.
begin;
alter table public.giveaway_telegram_subscriptions
 add column if not exists notify_sponsor_chest boolean not null default true,
 add column if not exists notify_arcade boolean not null default true;
-- Preserve the existing chest opt-out on the first application only.
update public.giveaway_telegram_subscriptions set notify_sponsor_chest=notify_chest
 where not exists(select 1 from public.giveaway_schema_migrations where version='2.33.0');
alter table public.giveaway_telegram_deliveries drop constraint giveaway_telegram_deliveries_kind_check;
alter table public.giveaway_telegram_deliveries add constraint giveaway_telegram_deliveries_kind_check
 check(kind in ('chest','question','videos','winner','sponsor_chest','arcade_fly','arcade_snake'));
create table if not exists public.giveaway_telegram_opportunity_config(
 id boolean primary key default true check(id),enabled boolean not null default false
);
insert into public.giveaway_telegram_opportunity_config(id) values(true) on conflict(id) do nothing;
alter table public.giveaway_telegram_opportunity_config enable row level security;
revoke all on public.giveaway_telegram_opportunity_config from public,anon,authenticated;
grant all on public.giveaway_telegram_opportunity_config to service_role;

create or replace function public.telegram_restored_opportunities_v2330(p_now timestamptz default now())
returns table(subscription_id uuid,kind text,event_key text,payload jsonb)
language sql stable security definer set search_path=pg_catalog,public,auth as $$
 with players as materialized(
  select s.id subscription_id,s.linked_at,s.notify_sponsor_chest,s.notify_arcade,p.*
  from public.giveaway_telegram_subscriptions s join public.participants p on p.user_id=s.user_id
  join public.giveaway_seasons season on season.id=p.season_id
  where (select enabled from public.giveaway_telegram_opportunity_config where id=true)
   and s.active and p.season_id=public.giveaway_active_season_id()
   and season.status='active' and season.form_enabled and p_now between season.starts_at and season.ends_at
   and not coalesce(p.is_test_account,false) and not coalesce(p.progression_blocked,false)
   and not coalesce(p.globally_banned,false)
   and not public.giveaway_is_globally_banned(p.email,p.steamid,p.tiktok)
 ), chests as (
  select p.subscription_id,p.id participant_id,
   p.sponsor_chest_claimed_at+make_interval(mins=>coalesce(c.sponsor_chest_cooldown_minutes,1440)) ready_at
  from players p join public.giveaway_game_config c on c.id=1
  where p.notify_sponsor_chest and coalesce(c.sponsor_chest_enabled,true)
   and p.sponsor_chest_claimed_at is not null
 ), games as (
  select p.subscription_id,p.id participant_id,p.linked_at,g.game,g.normal_limit,
   normal.used,normal.restored_at,
   sponsor.used sponsor_used,sponsor.credits,sponsor.restored_at sponsor_restored_at
  from players p
  cross join lateral(
   select 'fly'::text game,fs.attempts_per_24h normal_limit from public.giveaway_arcade_settings fs where fs.id=1 and fs.enabled
   union all select 'snake',1 from public.snake_product_settings ss where ss.id=1 and ss.enabled
  ) g
  cross join lateral(
   select count(*) filter(where t.started_at>p_now-interval '24 hours') used,
    max(t.started_at+interval '24 hours') filter(where t.started_at<=p_now-interval '24 hours') restored_at
   from (
    select a.started_at from public.giveaway_arcade_attempts a
     where g.game='fly' and a.participant_id=p.id and a.season_id=p.season_id and not coalesce(a.is_sponsor,false)
    union all select a.started_at from public.snake_product_attempts a
     where g.game='snake' and a.game='snake' and a.participant_id=p.id and a.season_id=p.season_id and not a.is_sponsor
   ) t
  ) normal
  cross join lateral(
   select count(*) filter(where t.claimed_at>p_now-interval '24 hours') used,
    count(*) filter(where t.claimed_at>p_now-interval '24 hours' and t.attempt_id is null) credits,
    max(t.claimed_at+interval '24 hours') filter(where t.claimed_at<=p_now-interval '24 hours') restored_at
   from (
    select a.claimed_at,a.attempt_id from public.giveaway_arcade_sponsor_claims a
     where g.game='fly' and a.participant_id=p.id and a.season_id=p.season_id
    union all select a.claimed_at,a.attempt_id from public.snake_product_sponsor_claims a
     where g.game='snake' and a.game='snake' and a.participant_id=p.id and a.season_id=p.season_id
   ) t
  ) sponsor
  where p.notify_arcade
 ), events as (
  select c.subscription_id,'sponsor_chest'::text kind,c.participant_id,c.ready_at,'chest'::text opportunity
   from chests c join players p on p.id=c.participant_id
   where c.ready_at<=p_now and c.ready_at>=p.linked_at
  union all
  select g.subscription_id,'arcade_'||g.game,g.participant_id,
   case when g.used<g.normal_limit then g.restored_at else g.sponsor_restored_at end,
   case when g.used<g.normal_limit then 'regular' else 'sponsor' end
  from games g
  where (g.used<g.normal_limit and g.restored_at>=g.linked_at)
   or (g.used>=g.normal_limit and g.sponsor_used<2 and g.credits=0 and g.sponsor_restored_at>=g.linked_at)
 )
 select e.subscription_id,e.kind,e.kind||':'||e.participant_id::text||':'||e.opportunity||':'||extract(epoch from e.ready_at)::text,
  jsonb_build_object('participant_id',e.participant_id,'ready_at',e.ready_at,'opportunity',e.opportunity)
 from events e;
$$;
revoke all on function public.telegram_restored_opportunities_v2330(timestamptz) from public,anon,authenticated;
grant execute on function public.telegram_restored_opportunities_v2330(timestamptz) to service_role;

CREATE OR REPLACE FUNCTION public.telegram_claim_due_notifications_v2292(p_limit integer DEFAULT 100)
 RETURNS TABLE(delivery_id uuid, subscription_id uuid, telegram_chat_id bigint, kind text, payload jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode='42501',message='Service role required.';
  end if;

  delete from public.giveaway_telegram_link_codes where created_at<now()-interval '1 day';
  delete from public.giveaway_telegram_deliveries where created_at<now()-interval '90 days' and status in ('sent','error');
  update public.giveaway_telegram_deliveries set status='error',last_error='stale_processing',claimed_at=null
  where status='processing' and claimed_at<now()-interval '10 minutes' and attempts<3;

  insert into public.giveaway_telegram_deliveries(subscription_id,kind,event_key,payload)
  select s.id,'winner','winner:'||w.id::text,jsonb_build_object('winner_id',w.id,'game',coalesce(to_jsonb(w)->>'game',to_jsonb(w)->>'games',''))
  from public.giveaway_telegram_subscriptions s
  join public.participants p on p.user_id=s.user_id
  join public.winners w on w.participant_id=p.id and w.season_id=p.season_id
  where s.active and s.notify_winner and coalesce(w.selected_at,w.created_at)>=s.linked_at
  on conflict on constraint giveaway_telegram_deliveries_subscription_id_event_key_key do nothing;

  insert into public.giveaway_telegram_deliveries(subscription_id,kind,event_key,payload)
  select s.id,'chest','chest:'||p.id::text||':'||extract(epoch from (p.last_daily_chest_at+public.giveaway_chest_cooldown()))::bigint::text,
    jsonb_build_object('participant_id',p.id,'ready_at',p.last_daily_chest_at+public.giveaway_chest_cooldown())
  from public.giveaway_telegram_subscriptions s
  join public.participants p on p.user_id=s.user_id and p.season_id=public.giveaway_active_season_id()
  where s.active and s.notify_chest and not coalesce(p.is_test_account,false)
    and not coalesce(p.progression_blocked,false) and p.last_daily_chest_at is not null
    and p.last_daily_chest_at+public.giveaway_chest_cooldown()<=now()
  on conflict on constraint giveaway_telegram_deliveries_subscription_id_event_key_key do nothing;

  insert into public.giveaway_telegram_deliveries(subscription_id,kind,event_key,payload)
  select s.id,'question','question:'||p.id::text||':'||extract(epoch from (p.last_boost_at+public.giveaway_boost_cooldown()))::bigint::text,
    jsonb_build_object('participant_id',p.id,'ready_at',p.last_boost_at+public.giveaway_boost_cooldown())
  from public.giveaway_telegram_subscriptions s
  join public.participants p on p.user_id=s.user_id and p.season_id=public.giveaway_active_season_id()
  where s.active and s.notify_question and not coalesce(p.is_test_account,false)
    and not coalesce(p.progression_blocked,false) and p.last_boost_at is not null
    and p.last_boost_at+public.giveaway_boost_cooldown()<=now()
  on conflict on constraint giveaway_telegram_deliveries_subscription_id_event_key_key do nothing;

  insert into public.giveaway_telegram_deliveries(subscription_id,kind,event_key,payload)
  select s.id,'videos','videos:'||latest.id::text,
    jsonb_build_object('participant_id',p.id,'latest_video_id',latest.id,'count',unwatched.count,'title',latest.title)
  from public.giveaway_telegram_subscriptions s
  join public.participants p on p.user_id=s.user_id and p.season_id=public.giveaway_active_season_id()
  cross join lateral(
    select tv.id,tv.title from public.giveaway_tiktok_videos tv
    where tv.active and coalesce(tv.published_at,tv.created_at)>s.linked_at
    order by coalesce(tv.published_at,tv.created_at) desc,tv.id desc limit 1
  ) latest
  cross join lateral(
    select count(*)::integer from public.giveaway_tiktok_videos tv
    where tv.active and coalesce(tv.published_at,tv.created_at)>s.linked_at
      and not exists(select 1 from public.giveaway_tiktok_rewards tr where tr.participant_id=p.id and tr.video_id=tv.id)
  ) unwatched
  where s.active and s.notify_videos and unwatched.count>0 and not coalesce(p.progression_blocked,false)
  on conflict on constraint giveaway_telegram_deliveries_subscription_id_event_key_key do nothing;

  -- Cancel pending restore events if consumed/disabled/opted out while quiet or queued.
  update public.giveaway_telegram_deliveries d set status='error',attempts=3,
   last_error='opportunity_no_longer_available',claimed_at=null
  where d.kind in ('sponsor_chest','arcade_fly','arcade_snake') and d.status in ('pending','error') and d.attempts<3
   and not exists(select 1 from public.telegram_restored_opportunities_v2330() e
    where e.subscription_id=d.subscription_id and e.event_key=d.event_key);
  insert into public.giveaway_telegram_deliveries(subscription_id,kind,event_key,payload)
   select e.subscription_id,e.kind,e.event_key,e.payload from public.telegram_restored_opportunities_v2330() e
   on conflict on constraint giveaway_telegram_deliveries_subscription_id_event_key_key do nothing;

  return query
  with candidates as(
    select d.id,d.subscription_id,d.kind,d.created_at,
      row_number() over(partition by d.subscription_id order by case d.kind when 'winner' then 1 when 'chest' then 2 when 'question' then 3 else 4 end,d.created_at,d.id) subscription_order
    from public.giveaway_telegram_deliveries d
    join public.giveaway_telegram_subscriptions s on s.id=d.subscription_id and s.active
    where d.status in ('pending','error') and d.attempts<3
      and (d.kind not in ('sponsor_chest','arcade_fly','arcade_snake') or exists(
        select 1 from public.telegram_restored_opportunities_v2330() e where e.subscription_id=d.subscription_id and e.event_key=d.event_key))
      and not public.telegram_is_quiet_now_v2189(s.quiet_hours_enabled,s.timezone_offset_minutes,s.quiet_start_minutes,s.quiet_end_minutes,now())
      and (d.kind='winner' or not exists(
        select 1 from public.giveaway_telegram_deliveries recent
        where recent.subscription_id=d.subscription_id and recent.kind=d.kind and recent.status='sent' and recent.sent_at>now()-interval '10 minutes'
      ))
  ),picked as(
    select d.id from public.giveaway_telegram_deliveries d
    join candidates c on c.id=d.id and c.subscription_order=1
    order by case c.kind when 'winner' then 1 when 'chest' then 2 when 'question' then 3 else 4 end,c.created_at
    for update of d skip locked limit greatest(1,least(coalesce(p_limit,100),250))
  ),claimed as(
    update public.giveaway_telegram_deliveries d set status='processing',attempts=d.attempts+1,claimed_at=now(),last_error=null
    from picked where d.id=picked.id returning d.*
  )
  select c.id,c.subscription_id,s.telegram_chat_id,c.kind,c.payload
  from claimed c join public.giveaway_telegram_subscriptions s on s.id=c.subscription_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.get_my_telegram_settings_v2180()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select case when auth.uid() is null then
    jsonb_build_object('success',false,'status','auth_required')
  else coalesce((
    select jsonb_build_object(
      'success',true,
      'connected',true,
      'active',s.active,
      'telegram_username',s.telegram_username,
      'notify_chest',s.notify_chest,
      'notify_sponsor_chest',s.notify_sponsor_chest,
      'notify_arcade',s.notify_arcade,
      'notify_question',s.notify_question,
      'notify_videos',s.notify_videos,
      'notify_winner',s.notify_winner,
      'notify_secret_missions',s.notify_secret_missions,
      'quiet_hours_enabled',s.quiet_hours_enabled,
      'timezone_offset_minutes',s.timezone_offset_minutes,
      'quiet_start_minutes',s.quiet_start_minutes,
      'quiet_end_minutes',s.quiet_end_minutes,
      'linked_at',s.linked_at,
      'bot_username','Rytni_Give_BOT'
    )
    from public.giveaway_telegram_subscriptions s
    where s.user_id=auth.uid()
  ),jsonb_build_object(
    'success',true,
    'connected',false,
    'bot_username','Rytni_Give_BOT'
  )) end;
$function$
;
revoke all on function public.telegram_claim_due_notifications_v2292(integer) from public,anon,authenticated;
grant execute on function public.telegram_claim_due_notifications_v2292(integer) to service_role;
insert into public.giveaway_schema_migrations(version,description) values('2.33.0','Telegram sponsor chest and Arcade restored opportunities; gated activation')
 on conflict(version) do update set description=excluded.description;
commit;
