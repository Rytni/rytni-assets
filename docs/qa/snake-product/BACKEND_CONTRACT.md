# Snake local product backend contract

Status: local mock works; SQL is an **unapplied candidate**, ranked is disabled by default. No production RPC, database mutation, deployment or Fly source modification was performed. Audit date: 2026-10-06. This records local source evidence, not deployed database state.

## Adapter

`arcade/snake-next/product/backend.js` exports `createMockBackend(state = 'ready')` and optional `createRankedBackend(config)`.

Both expose `mode`, `sponsorUrl`, `calls` and async `hub()`, `start({release, requestId})`, `finish({attempt_id, score, release, duration_ms, ticks, audit})`, `claim({release, requestId})`. Results are JSON objects with `success` and `status`; callers must check both. `calls` is a local QA log of `{method,payload}`. The ranked log excludes participant credentials/client token. Request IDs remain stable for retries and change for a new user action; start and claim use separate ID namespaces. Release strings and request IDs must be nonempty and at most 128 characters. SQL stores request IDs as text, so UUIDs are suitable but not mandatory.

Hub returns `available`, `game`, `season_id`, `cycle`, `attempts_total`, `attempts_used`, `attempts_remaining`, `next_attempt_at`, `sponsor_attempt_limit`, `sponsor_attempts_used`, `sponsor_attempt_credits`, `sponsor_attempt_available`, `next_sponsor_attempt_at`, `reward_points`, `round_seconds`, `best_score`, `my_rank`, `leaderboard`. Rows contain `place`, `name`, `score`, `is_me`.

Start returns `attempt_id`, `seed`, `started_at`, `expires_at`, `sponsor_attempt`, current allowance fields and zero reward. Finish returns `score`, `best_score`, `record`, `points_awarded: 0`. Mock finish also includes current allowance and rank. Sponsor claim returns the credit/limit/availability fields. Duplicate finish returns the stored original result even if a retry sends a different score, after checking the same attempt/release binding; callers must refresh hub when current counters are needed. No sum of attempts is used as a leaderboard score.

Mock lifetime is one adapter instance: nothing is saved to localStorage, cookies, IndexedDB, or a remote backend. It has no fetch, Supabase, auth client, or Fly imports. `ready`, `one-attempt-left`, `no-attempts`, `sponsor-available`, `sponsor-credit`, `not-authenticated`, `arcade-paused`, `network-error`, `leaderboard-empty`, `record-result` are deterministic fixtures. Fixed future timestamps are screenshot fixtures; the mock does not advance or expire its cycle with the wall clock. Ordinary fixtures have a ten-player board led by score 12480, personal best 6840 and own rank 7, with three players below the personal row. Ties are deterministic, with existing other players before the current player. `leaderboard-empty` has no rows and best 0. `record-result` starts with best score 900; complete a greater score to show a record. `no-attempts` has exhausted regular and sponsor allowances. `sponsor-credit` starts with one banked sponsor credit. `network-error` returns `success:false,status:'network_error'`. Paused hub is `success:true,status:'disabled',available:false`, while paused mutations fail.

Mock scores are trusted only for local interaction QA. The mock's score range check is not anti-cheat and must never be described as a validated ranked result.

Ranked requires explicit `{transport, participantId, clientToken}`. `transport(rpcName, params)` must be injected by a separately authorized host, with an authenticated session and account lifecycle. There is no automatic production discovery or fallback. Participant ID is fixed by config, not overridden by method input. Only named parameters are forwarded; `audit` is a structured aggregate object, never a credential container. Existing controller fields `active_ticks`, `foods`, `length`, `max_combo`, `portal_uses`, `expansions`, `stage`, `bonuses`, `seed`, `final_hash` are normalized to `p_ticks` and `p_audit`; callers may also supply `ticks` and an explicit audit object. No replay data is required. The adapter catches transport failures as `network_error`, and rejects malformed transport responses as `invalid_response`; the host may return precise auth status objects. `backend.js` alone cannot authenticate, publish, or apply SQL.

| Method | Candidate RPC |
| --- | --- |
| hub | `get_snake_product_hub_v1` |
| start | `start_snake_product_attempt_v1` |
| finish | `finish_snake_product_attempt_v1` |
| claim | `claim_snake_product_sponsor_v1` |

## Audited current Fly evidence

The supplied current reference is `tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html`. Its RPC calls are at lines 964, 1004, 1020, 1257; its sponsor URL is line 890: `https://t.me/astra_net_bot?start=ryt`. Sponsor credit is committed by the claim RPC before a Telegram tab is navigated. This is an action-based credit flow, not proof that the external sponsor task was completed. The Snake mock mirrors that interaction without opening or contacting Telegram itself.

Supporting account/transport source: `tilda-test/blocks/05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html`, `getClientToken()` at line 135 and `callSupabaseRpc()` at line 1531. Fly's client token is a season-scoped browser-local generated token; it is not authentication. Authenticated RPC transport independently requires a verified access session. No credentials were copied into Snake.

Actual SQL was found under the documented sibling root `C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт/04_Supabase_SQL/`:

- `64_Browser_Arcade_2.15.33.sql`: Fly settings, attempt tables, RLS and initial RPC definitions. Default regular allowance is three; default reward is 100, but local defaults do not prove current live settings.
- `65_Browser_Arcade_Endless_2.15.35.sql`: replaces start/finish with endless 12-hour attempt expiry and plausibility checks. Finish hashes client token with participant ID, checks ownership/season, and adds reward points to `participants.points`; it then tags the ledger row from that transaction as `browser_arcade`/Mushroom Fly. Duplicate finish returns the stored score/reward. Start has no client request ID.
- `66_Browser_Arcade_Sponsor_Attempt_2.15.36.sql`: sponsor predecessor. It is superseded for current credit semantics by SQL67.
- `67_Browser_Arcade_Sponsor_Credits_2.15.37.sql`: replaces hub/start/claim. Regular attempts use `started_at > now() - interval '24 hours'`; sponsor claims use `claimed_at > now() - interval '24 hours'`. Next availability is oldest qualifying start/claim plus 24 hours, not a midnight reset. Failed/abandoned starts still count. Two sponsor claims can be banked and later consumed; normal starts are consumed first. Claim becomes available after regular quota exhaustion. Claim/start lock the participant row but do not have request idempotency.
- `68_Mushroom_Fly_Daily_Challenge_2.15.38.sql`: separately defines Minsk-midnight daily challenges and a different RPC family. The supplied current 2.15.34 reference does not call that family, so it was not used to infer the Snake reset cycle.
- `31_One_Click_Season_Rollover_2.15.12.sql`, lines 8–39: newest local override of `giveaway_can_access_player`. It checks active season status, actual starts/ends, linked auth user or matching authenticated JWT email for unlinked participants, and global bans. Its admin branch bypasses participant bans. SQL02's permissive historical helper is not the current local contract.
- `16_Private_Progress_Ledger_Onboarding_2.12.sql`, lines 115–136: points changes trigger a ledger insert; SQL65 then retags the latest ledger row with matching participant and transaction. This is a shared reward mechanism, not an independently verified Snake reward API.

SHA-256 audit anchors:

| Source | SHA-256 |
| --- | --- |
| current Fly HTML | `1c76cc728a16ab87ff0c7f122884154f7fa63edc27630b0e1930cc949681e506` |
| SQL31 | `630fa23c36eb8963e755eeac3006b22f6ddf8fc8c37285a081e24b6df7154a6c` |
| SQL65 | `e92beb4c5e0f36a56e951eda985bc05fc3d7229f72faf85592feba0620d6b1b9` |
| SQL67 | `2fb43af6fb57757773c2b8677b71b9d710b9116e8ef5788181b5a7f3576f66df` |

## Candidate security and isolation

`migrations/snake_product_v1_candidate.sql` creates only Snake-specific settings, attempts, sponsor claims and RPC/helper names. It never alters existing Fly SQL objects or writes participant points/ledger rows. Every allowance/board query is scoped to Snake, current season and participant. No training session is submitted to this contract. The leaderboard selects a participant's maximum individual finished score, with earliest finish and participant UUID as deterministic tie breakers.

New tables have RLS enabled, no client policies, and no direct public/anonymous/authenticated/service-role table access. Only four public RPCs are granted to authenticated callers; the private access helper is revoked from clients. Each RPC checks `auth.uid()` and strict `participants.user_id = auth.uid()` ownership, the audited shared season/ban helper, and current season. This deliberately refuses legacy email-only or arbitrary admin participant access until those application-link semantics receive specific integration verification. Tokens are required, hashed with user and participant, and checked before retry results are returned. No empty-token fallback to auth.uid exists.

Participant row locking serializes competing quota mutations; unique game/season/participant request IDs protect start/claim against duplicate consumption. Start stores its original response for retries; finish stores its accepted original result. Sponsor credit consumption and start insertion occur in one transaction. Token, user and release must match retry records. Attempts expire after 12 hours. The rolling cycle is three normal starts in 24 hours plus at most two sponsor claims in 24 hours, matching SQL67. A banked credit expires with its claim window, including after normal allowance has reopened.

The settings seed has `enabled=false`, an empty approved-release allowlist and a constraint fixing `reward_points=0`. Admission follows the audited Fly aggregate model, without introducing a server replay subsystem. Finish requires integer duration 0–12 hours, at most server elapsed time plus five seconds; integer active ticks 0–2592000 with the controller's 60Hz tick/duration relationship within one tick of rounding; and integer score 0–10000000. The broad score envelope is `ticks * 400 + 2000`, or zero when ticks are zero. This deliberately allows ample headroom for canonical food/combo, harvest, spore and portal bonuses. Canonical movement has minimum cadence five ticks (`forest-training/session.js`); aggregate food count, when supplied, is bounded by `floor(ticks / 5) + 1`. Combo is capped at 8, length at 8192, other supplied counters are nonnegative integers with conservative tick bounds, audit is an object at most 64KiB, an echoed seed must match the immutable stored seed, and an optional final hash is a string at most 128 characters. SQL requires explicit supplied token length 16–512; the existing generated UUID-style Fly token fits that bound.

These bounds reject malformed, grossly impossible or misbound submissions; they do **not** reconstruct gameplay or prove an honest score. A modified client can fabricate aggregate counters and a score inside the envelope. The client final hash is untrusted metadata, not a signature or server validation. This is the same class of client-trust limitation as current Fly's plausibility admission. No authoritative replay verification is claimed or required for this candidate. Approved-release integration tests must confirm the envelope admits real scoring before enabling the setting.

## Remaining ranked rollout prerequisites

These are blockers for activating ranked, not blockers for the delivered local mock:

1. Verify the actually deployed schema, helper definitions, privileges, role ownership and season settings against these local audit anchors in an authorized environment. No live schema was inspected.
2. Test aggregate admission with real approved-release summaries, maximum legitimate combo/food/bonus/portal scoring and early collisions. Test grossly oversized scores, missing/null duration/ticks/audit, fractional/negative audit counters, seed mismatch, server-time inflation, tick/duration disagreement and oversized audit. Record the accepted client-trust limits explicitly; no heavyweight replay implementation is a prerequisite.
3. Execute the candidate in an isolated PostgreSQL/Supabase test database and test actual concurrent sessions, rollback, RLS/direct-table denial, cross-user/season/attempt/token/release spoofing, quota boundary/expiry, duplicate requests/submissions, and stable board ties. No PostgreSQL executable was found locally and SQL was not executed or parser-validated in this work.
4. Verify the host's linked-account mapping and stale-request/session-switch handling. The optional adapter must receive the authorized participant and authenticated transport explicitly.
5. Independently design and verify a Snake reward ledger integration with exactly-once award semantics before changing the zero-reward constraint. Do not retag an arbitrary last ledger row or borrow the Fly label/reward table.
6. Keep application/deployment authorization separate. This local candidate is neither an applied migration nor approval to publish or enable ranked.

Verification: `node --test arcade/snake-next/product/backend.test.mjs` exercises allowance spending, concurrent duplicate starts, claim retries and limits, credit consumption, attempt/release binding, immutable finish retries, single-best ranking, invalid results, deterministic states, representative own-rank board, isolated memory, explicit transport payload filtering and controller aggregate normalization. Nine tests pass. SQL security/transaction/admission behavior still requires the isolated database checks above.
