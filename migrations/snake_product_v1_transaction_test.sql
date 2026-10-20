-- Append to candidate with its final COMMIT removed. ALWAYS ROLLBACK.
-- Uses a linked active participant only inside this private transaction;
-- no actual attempts/results/points are committed or sent through the public client.
do $$
declare
 p public.participants%rowtype; a jsonb; b jsonb; h jsonb; c jsonb;
 token text:='rollback-only-client-token';
begin
 -- Test an OPEN season locally to this transaction only. No season configuration
 -- survives ROLLBACK (including when the real season is currently expired).
 update public.giveaway_seasons set ends_at=greatest(ends_at,now()+interval '1 hour')
  where id=public.giveaway_active_season_id();
 for p in select * from public.participants where user_id is not null
  and season_id=public.giveaway_active_season_id() and not coalesce(globally_banned,false) loop
  perform set_config('request.jwt.claim.sub',p.user_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id)::text,true);
  exit when public.snake_product_can_access_v1(p);
 end loop;
 if p.id is null then raise exception 'No eligible linked participant for rollback-only test'; end if;
 if not public.snake_product_can_access_v1(p) then raise exception 'Selected account is not eligible'; end if;
 update public.snake_product_settings set enabled=true,approved_releases=array['transaction-qa'] where id=1;
 h:=public.get_snake_product_hub_v1(p.id);
 if (h->>'attempts_remaining')::int<>1 or h->>'best_score'<>'0' then raise exception 'Initial hub invalid'; end if;
 c:=public.claim_snake_product_sponsor_v1(p.id,token,'transaction-qa','early');
 if c->>'status'<>'regular_attempts_available' then raise exception 'Sponsor before normal quota'; end if;
 a:=public.start_snake_product_attempt_v1(p.id,token,'transaction-qa','start-1');
 b:=public.start_snake_product_attempt_v1(p.id,token,'transaction-qa','start-1');
 if a<>b or not (a->>'success')::boolean then raise exception 'Start retry failure'; end if;
 b:=public.start_snake_product_attempt_v1(p.id,token,'transaction-qa','start-2');
 if b->>'status'<>'limit' then raise exception 'Second normal attempt admitted'; end if;
 b:=public.start_snake_product_attempt_v1(p.id,'another-rollback-token','transaction-qa','start-1');
 if b->>'status'<>'idempotency_conflict' then raise exception 'Token takeover'; end if;
 b:=public.finish_snake_product_attempt_v1(p.id,token,(a->>'attempt_id')::uuid,'transaction-qa',1000,60,120,jsonb_build_object('seed',(a->>'seed')::int,'length',8,'foods',1,'final_hash','deadbeef'));
 if not (b->>'success')::boolean then raise exception 'Finish rejected: %',b; end if;
 c:=public.finish_snake_product_attempt_v1(p.id,token,(a->>'attempt_id')::uuid,'transaction-qa',1000,60,999,'{}');
 if b<>c then raise exception 'Finish not idempotent'; end if;
 for n in 1..2 loop
  c:=public.claim_snake_product_sponsor_v1(p.id,token,'transaction-qa','credit-'||n);
  if not (c->>'success')::boolean then raise exception 'Credit failure'; end if;
  if c<>public.claim_snake_product_sponsor_v1(p.id,token,'transaction-qa','credit-'||n) then raise exception 'Claim not idempotent'; end if;
  a:=public.start_snake_product_attempt_v1(p.id,token,'transaction-qa','sponsor-'||n);
  if not (a->>'sponsor_attempt')::boolean then raise exception 'Not sponsor'; end if;
 end loop;
 c:=public.claim_snake_product_sponsor_v1(p.id,token,'transaction-qa','credit-3');
 if c->>'status'<>'cooldown' then raise exception 'Third sponsor admitted'; end if;
 h:=public.get_snake_product_hub_v1(p.id);
 if h->>'best_score'<>'120' or h->>'my_rank'<>'1' or jsonb_array_length(h->'leaderboard')<>1
  or h->>'attempts_used'<>'1' or h->>'sponsor_attempts_used'<>'2' or h->>'sponsor_attempt_credits'<>'0' then
  raise exception 'Final hub mismatch: %',h; end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 c:=public.get_snake_product_hub_v1(p.id);
 if c->>'status'<>'forbidden' then raise exception 'Ownership failure'; end if;
end $$;
select 'PASS: quota 1+2, start/claim/finish idempotency, token/owner isolation, best-score ranking; rolled back' as transaction_test;
rollback;
