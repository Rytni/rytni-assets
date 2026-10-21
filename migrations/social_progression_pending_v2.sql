-- Presentation-only waiting cards. Never alter eligibility, points or winner selection.
begin;
create or replace function public.giveaway_social_progression_pending_v2(p_channel text default 'test')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare published jsonb; snapshot jsonb; board jsonb; pending jsonb; slots integer;
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
  return jsonb_build_object('status','READY','season_id',snapshot->>'season_id',
    'generated_at',snapshot->>'generated_at','participants',pending);
end $$;
revoke all on function public.giveaway_social_progression_pending_v2(text) from public;
grant execute on function public.giveaway_social_progression_pending_v2(text) to anon,authenticated,service_role;
commit;
