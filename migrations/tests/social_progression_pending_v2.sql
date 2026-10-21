-- Run after social_progression_pending_v2.sql. All fixture writes are rolled back.
-- No participants, points, actual selections or publication timestamps are changed.
begin;
do $$
declare saved_payload jsonb; board jsonb; waiting jsonb; chosen jsonb; member jsonb; filled jsonb;
begin
  select s.payload into saved_payload from public.giveaway_social_snapshots_v2 s
    where s.channel='test' and s.season_id=public.giveaway_active_season_id();
  if saved_payload is null then raise exception 'Requires an existing TEST publication'; end if;
  board:=saved_payload->'periods'->0->'scopes'->'all'->'progression';
  waiting:=public.giveaway_social_progression_pending_v2('test')->'participants';
  if jsonb_array_length(waiting)=0 then raise exception 'Requires at least one waiting member'; end if;
  chosen:=waiting->0;
  member:=coalesce(board->0,'{"active_days":0,"comment_days":0,"comment_weeks":0,"commented_posts":0,"comments":0,"liked_posts":0,"score":0}'::jsonb)||chosen;

  -- A newly confirmed member must disappear from waiting, without a second state write.
  update public.giveaway_social_snapshots_v2
    set payload=jsonb_set(saved_payload,array['periods','0','scopes','all','progression'],board||jsonb_build_array(member))
    where channel='test';
  waiting:=public.giveaway_social_progression_pending_v2('test')->'participants';
  if exists(select 1 from jsonb_array_elements(waiting) r where r->>'handle'=chosen->>'handle') then
    raise exception 'Confirmed member still disqualified';
  end if;

  -- Capacity is presentation-only: ten confirmed cards leave no waiting slots.
  select jsonb_agg(member) into filled from generate_series(1,10);
  update public.giveaway_social_snapshots_v2
    set payload=jsonb_set(saved_payload,array['periods','0','scopes','all','progression'],filled)
    where channel='test';
  if jsonb_array_length(public.giveaway_social_progression_pending_v2('test')->'participants')<>0 then
    raise exception 'Waiting cards exceed display capacity';
  end if;

  update public.giveaway_social_snapshots_v2
    set payload=jsonb_set(saved_payload,array['periods','0','scopes','all','progression'],'[]'::jsonb)
    where channel='test';
  if jsonb_array_length(public.giveaway_social_progression_pending_v2('test')->'participants')<>10 then
    raise exception 'Empty confirmed board should allow ten waiting cards';
  end if;
end $$;
select 'PENDING_PROMOTION_AND_CAPACITY_PASS' as status;
rollback;
