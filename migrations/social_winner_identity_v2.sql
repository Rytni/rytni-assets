-- Preserve exact winner identity before compact rollover deletes old participants.
-- Additive: no edits to selection, receipt, progression or archived winner records.
begin;
create table if not exists public.giveaway_social_winner_identity_v2 (
  archive_id uuid primary key references public.giveaway_winner_archive(id) on delete cascade,
  participant_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  captured_at timestamptz not null default now()
);
alter table public.giveaway_social_winner_identity_v2 enable row level security;
revoke all on public.giveaway_social_winner_identity_v2 from public,anon,authenticated;
grant select,insert,update on public.giveaway_social_winner_identity_v2 to service_role;

create or replace function public.capture_social_winner_identity_v2()
returns trigger language plpgsql security definer set search_path='' as $$
declare linked_user uuid;
begin
  select p.user_id into linked_user from public.participants p where p.id=new.participant_id;
  if linked_user is not null then
    insert into public.giveaway_social_winner_identity_v2(archive_id,participant_id,user_id,source)
      values(new.id,new.participant_id,linked_user,'ARCHIVE_TRIGGER')
    on conflict(archive_id) do update set participant_id=excluded.participant_id,
      user_id=excluded.user_id,source=excluded.source,captured_at=now();
  elsif tg_op='UPDATE' then
    if new.participant_id is distinct from old.participant_id then
      delete from public.giveaway_social_winner_identity_v2 where archive_id=new.id;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.capture_social_winner_identity_v2() from public,anon,authenticated;
do $$ begin
  if not exists(select 1 from pg_catalog.pg_trigger
      where tgrelid='public.giveaway_winner_archive'::regclass
        and tgname='capture_social_winner_identity_v2') then
    create trigger capture_social_winner_identity_v2
      after insert or update of participant_id on public.giveaway_winner_archive
      for each row execute function public.capture_social_winner_identity_v2();
  end if;
end $$;

insert into public.giveaway_social_winner_identity_v2(archive_id,participant_id,user_id,source)
  select a.id,a.participant_id,p.user_id,'EXACT_LIVE_PARTICIPANT'
  from public.giveaway_winner_archive a join public.participants p on p.id=a.participant_id
  where p.user_id is not null
on conflict(archive_id) do nothing;

create or replace function public.giveaway_social_people_v2()
returns table(handle text,points bigint,points_reached_at timestamptz,winner_selected boolean)
language sql stable security definer set search_path='' as $$
  select public.giveaway_social_handle_v1(p.tiktok),p.points,p.points_reached_at,
    exists(select 1 from public.winners w left join public.participants previous on previous.id=w.participant_id
      where w.participant_id=p.id or (p.user_id is not null and previous.user_id=p.user_id))
    or exists(select 1 from public.giveaway_winner_archive a
      left join public.giveaway_social_winner_identity_v2 i
        on i.archive_id=a.id and i.participant_id=a.participant_id
      where a.participant_id=p.id or (p.user_id is not null and i.user_id=p.user_id))
  from public.participants p
  join public.giveaway_social_members_v1(public.giveaway_active_season_id()) m
    on m.handle=public.giveaway_social_handle_v1(p.tiktok)
  where p.season_id=public.giveaway_active_season_id()
$$;
revoke all on function public.giveaway_social_people_v2() from public,anon,authenticated;
commit;
