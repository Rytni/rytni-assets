-- Winner badge season semantics. Snapshot/publisher v2 remains byte-compatible.
-- Private identity proof is reused; public projections expose only booleans for already visible handles.
begin;
create or replace function public.giveaway_social_winner_scopes_v1()
returns table(handle text,current_season boolean,past_seasons boolean)
language sql stable security definer set search_path='' as $$
 select public.giveaway_social_handle_v1(p.tiktok),
  exists(select 1 from public.winners w left join public.participants previous on previous.id=w.participant_id
   where w.season_id=p.season_id and (w.participant_id=p.id or (p.user_id is not null and previous.user_id=p.user_id)))
  or exists(select 1 from public.giveaway_winner_archive a
   left join public.giveaway_social_winner_identity_v2 i on i.archive_id=a.id and i.participant_id=a.participant_id
   where a.season_id=p.season_id and (a.participant_id=p.id or (p.user_id is not null and i.user_id=p.user_id))),
  exists(select 1 from public.winners w left join public.participants previous on previous.id=w.participant_id
   where w.season_id<>p.season_id and (w.participant_id=p.id or (p.user_id is not null and previous.user_id=p.user_id)))
  or exists(select 1 from public.giveaway_winner_archive a
   left join public.giveaway_social_winner_identity_v2 i on i.archive_id=a.id and i.participant_id=a.participant_id
   where a.season_id<>p.season_id and (a.participant_id=p.id or (p.user_id is not null and i.user_id=p.user_id)))
 from public.participants p join public.giveaway_social_members_v1(public.giveaway_active_season_id()) m
  on m.handle=public.giveaway_social_handle_v1(p.tiktok)
 where p.season_id=public.giveaway_active_season_id();
$$;
revoke all on function public.giveaway_social_winner_scopes_v1() from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.giveaway_social_rankings_v2(p_channel text DEFAULT 'test'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$

declare payload jsonb; kind text; rows jsonb; badges jsonb;

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

  select coalesce(jsonb_object_agg(s.handle,jsonb_build_object('current_season',s.current_season,'past_seasons',s.past_seasons)),'{}'::jsonb)
   into badges from public.giveaway_social_winner_scopes_v1() s
   where exists(select 1 from jsonb_each(payload->'periods'->0->'scopes'->'all') b,
     lateral jsonb_array_elements(b.value) r where r->>'handle'=s.handle);
  return jsonb_build_object('status','READY','snapshot',payload,'winner_badges',badges);

end

$function$
;
CREATE OR REPLACE FUNCTION public.giveaway_social_progression_pending_v2(p_channel text DEFAULT 'test'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$

declare published jsonb; snapshot jsonb; board jsonb; pending jsonb; slots integer; badges jsonb;

begin

  published:=public.giveaway_social_rankings_v2(p_channel);

  if published->>'status' is distinct from 'READY' then

    return jsonb_build_object('status','NOT_PUBLISHED');

  end if;

  snapshot:=published->'snapshot';

  board:=snapshot->'periods'->0->'scopes'->'all'->'progression';

  slots:=greatest(0,10-jsonb_array_length(board));

  select coalesce(jsonb_agg(jsonb_build_object('handle',p.handle,

      'winner_selected',p.winner_selected) order by p.points desc,

      p.points_reached_at asc nulls last,p.handle collate "C"),'[]'::jsonb)

    into pending from (

      select s.* from public.giveaway_social_people_v2() s

      where s.points>0 and s.points_reached_at is not null

        and not exists(select 1 from jsonb_array_elements(board) r where r->>'handle'=s.handle)

      order by s.points desc,s.points_reached_at asc nulls last,s.handle collate "C"

      limit slots

    ) p;

  select coalesce(jsonb_object_agg(s.handle,jsonb_build_object('current_season',s.current_season,'past_seasons',s.past_seasons)),'{}'::jsonb)
   into badges from public.giveaway_social_winner_scopes_v1() s
   where exists(select 1 from jsonb_array_elements(pending) r where r->>'handle'=s.handle);
  return jsonb_build_object('status','READY','winner_badges',badges,'season_id',snapshot->>'season_id',

    'generated_at',snapshot->>'generated_at','participants',pending);

end $function$
;
grant execute on function public.giveaway_social_rankings_v2(text) to anon,authenticated,service_role;
grant execute on function public.giveaway_social_progression_pending_v2(text) to anon,authenticated,service_role;
commit;
