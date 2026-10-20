# Ranked 1 + 2 / Snake music V2 — 2026-10-20

## User-authorized scope

Both games: **1 ordinary ranked attempt + up to 2 sponsor credits**, existing rolling 24h semantics. Training unlimited. Snake ranking/attempts/sponsors are separate from Fly. Only Snake music replaced; all four Fly MP3 hashes remain unchanged. TEST-only frontend publication; Production manifest is protected.

The user explicitly authorized shared Supabase changes, then explicitly chose **NOT to extend the expired shared season**. Its end remains `2026-10-06T11:40:42Z`. Ranked is therefore closed until a valid new season; no auth/season bypass was added. Training remains playable.

## Backend

- Read-only inspection confirmed current Fly RPC definitions, shared setting `attempts_per_24h=3`, sponsor cap 2 and no Snake tables before rollout.
- Applied `migrations/snake_product_v1_candidate.sql`: separate tables, RLS, authenticated-only RPC grants, strict linked owner + existing season/ban checks, client-token hashing, participant locks, idempotent start/claim/finish, best finished single-attempt ranking, top 10.
- Applied `migrations/arcade_one_normal_attempt.sql`: Fly setting now **1**. No Fly score, attempt history, reward ledger or participant points changed.
- New Snake hub reports `season_closed` for a linked owner of the expired current season; this is shown explicitly, not as a fake leaderboard or successful ranked start.
- Normal hosted TEST uses `createHostedBackend` and a source/origin/channel-checked iframe gateway. Parent injects authenticated participant/token; credentials never cross into the Snake iframe. Four fixed Snake RPCs only, never arbitrary RPC dispatch.
- Immutable `snake-next-<sha12>` runtime identity is sent as release and explicitly allowlisted server-side. The generic application version alone is not a release identity.
- Explicit `mock`/`preview` and unhosted localhost remain memory-only QA. Missing host, expired season and network failures **never fall back to mock success**.
- Snake awards no application points (0), deliberately not borrowed from Fly's reward ledger. Existing Fly rewards unchanged.
- On a new season the host must supply a properly linked participant in that season, as with existing authenticated product ownership. No account rebinding/season rollover automation was added.

## Verification

- 64 unit tests: product/controller/gateway, expired-season Training, forged message rejection, music director, foundation and presentation determinism — PASS.
- 23 targeted browser assertions at desktop 1366×768 and mobile portrait→844×390: hosted authenticated-contract path, server seed, exactly one start, normal exhaustion, sponsor credit, record/rank refresh, unlimited Training without mutations — PASS. Browser transport mocked; no real player attempts spent.
- 48 desktop/mobile music browser checks — PASS. Fixed playback rate, chapter/stage switching, pause/resume, lifecycle source cleanup, loading/SFX preservation.
- Eight decoded audio files measured: unique, unclipped, correct duration/loop edges. Only four Snake compositions regenerated using `--snake-only`. No borrowed samples.
- Before schema apply, actual PostgreSQL transaction tests created candidate tables/functions, exercised 1 normal + 2 sponsor, retry idempotency, wrong token/owner, leaderboard update, then **ROLLBACK**. Expired season temporarily opened only inside this rolled-back test transaction. No real season change survived.
- Read-only post-apply verification: 3 RLS tables; authenticated RPC allowed; anon RPC and direct table access denied; 0 Snake attempt rows; 0 sponsor rows; shared season still expired; Fly quota 1; Snake quotas 1/2.
- Full public authenticated start/finish intentionally not exercised while season is closed. No claim of live ranked run acceptance.

Candidate: `2.15.33-c8619dc04aea`, immutable runtime `snake-next-2fbc81ae44ef` (explicitly enabled/allowlisted in the backend, with season gate still closed). Source and immutable-runtime browser flows both passed the 23 assertions. [Read-only database evidence](database-results.json).

## Published TEST acceptance

- Source checkpoint `86a6573`; immutable publication checkpoint `5ed8d67`.
- [Public TEST](https://rytni.live/testpodari): **21 live browser checks PASS** (desktop + mobile, both Training launches/music/pause/resume/exit, real hosted Snake adapter/release identity). No ranked/sponsor mutations attempted. No JS/game-resource errors; the pre-existing anonymous `/auth/v1/health` 401 remains a documented baseline.
- [Mirror evidence](../arcade-music/mirrors.json): Pages and S3 agree byte-for-byte on manifest SHA `aece15702070f4ffab68814ccae678e45b599387dfdcd81ffab497e7bb8d4614`, bundle, rollback and all 9 immutable music files.
- Production manifest SHA remains `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`. Shared database quota change was separately authorized; no Production frontend was published.
- Publication initially stopped because Windows had CRLF-normalized the local OLD rollback bundle. Mirror now recovers LF bytes **in memory only**, and only accepts them if both pinned SHA and size match. No immutable artifact was edited. Manifest uses canonical LF so both delivery surfaces match. Three mirror safety tests PASS.
- Live QA was rerun after Pages completed. Earlier rollout probes saw expected not-yet-published 404s; one subsequent cold mobile probe timed out without resource errors. The final fresh desktop/mobile run passed all 21 checks; no gameplay/audio workaround was introduced for the probe.
- Read-only verification after live QA still shows 0 Snake attempts and 0 sponsor claims, season unchanged/expired, quotas 1/2, correct RLS/grants and approved immutable release.

## New Snake soundtrack

**Fern Arcade → Velvet Mycelium → Moonlit Steps → Neon Canopy**. Different melodies, chords and instrumentation (muted strings, round mallets, airy organ, syncopated bass), not a speed/pitch change of the previous tracks. 104 BPM, stage/active-time chapters, 1.8s crossfade; simulation and Fly audio unchanged.

[Listening review](../arcade-music/review.html). [Browser evidence](browser-results.json). [Music measurements](../arcade-music/measurements.json).

## Repro

`node --test arcade/snake-next/product/backend.test.mjs arcade/snake-next/product/controller.test.mjs arcade/snake-next/product/host-bridge.test.mjs arcade/snake-next/product/ranked-gateway.test.mjs docs/qa/arcade-music/music.test.mjs`

`node docs/qa/arcade-ranked/run.cjs` (owned `rankedqa` Playwright CLI session + local server 8789).

`migrations/arcade_ranked_preflight.sql` and `arcade_ranked_verify.sql` are read-only. Fresh-schema candidate is already applied; do not reapply. Database helper requires explicit operation and the authorized linked CLI checkout; never run it implicitly from the frontend/build.
