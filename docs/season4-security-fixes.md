# Season 4 security fixes — 2026-10-21

Scope: shared backend hardening and TEST frontend only. MAIN promotion and the
actual Season 4 transition remain the owner's separate actions. TikTok ownership
verification is intentionally deferred; handle disputes remain manual.

## Authoritative game results

`server/arcade-verifier/index.ts` authenticates the actual Auth user, loads the
owned attempt/seed from a service-only RPC, replays the canonical simulation, and
commits the recomputed result. It never trusts client counters, physics or seed.
The body is limited to 512 KiB; logs have bounded ticks, events and events/tick.
Elapsed server time is checked before simulation and again at atomic commit.

- Fly uses generated canonical fixed-step functions and the alpha masks of the
  existing production artwork. Its crash delay now advances in simulation ticks.
  Geometry must load before spending a ranked attempt.
- Snake uses the same deterministic `TunnelSession` and progression settings as
  ProductBridge; its input log includes canonical command ticks and sequences.
- Auth credentials remain in the parent. The Snake iframe sends only game data.
- Private receipts bind game, attempt, participant, Auth owner, release, seed-derived
  summary and replay digest. Duplicate submission is idempotent; a changed digest
  is rejected. All old public finish RPCs require a matching private receipt.
- The unused legacy Daily Fly finalizer fails closed with `verification_required`.
  It has no compatible replay adapter and must not be exposed as a playable ranked
  mode until one is implemented. Endless Fly and Snake remain supported.
- Local Training remains unlimited and never writes a ranked result.

This prevents fabricated counters and time claims. It does **not** prove that a
human supplied the inputs: a bot can generate a valid replay. Sponsor credits
remain a bounded bonus for opening the sponsor link (at most two), not proof of a
subscription, purchase or other externally verified sponsor action.

## Database and rollover

`server/arcade-verifier/migration.sql` is the canonical migration. An encrypted,
read-back-verified snapshot of the previous function definitions, ACLs and policies
was taken locally before applying it. No production participant rows were purged.

- Internal daily creation/archive helpers are no longer executable by public roles.
- Public winner archive reads are restricted to the five columns used by the UI.
  Points and participant IDs remain private; full archived standings are private.
- The old Top-10 status query excludes globally banned identities while retaining
  its existing score order and tie rules.
- Manager 1.5.1 discovers all public tables and captures season-filtered rows where
  appropriate, including Arcade, Snake, partners, contracts and global settings.
- A per-table row-version fingerprint detects concurrent insert/update/delete,
  including changes that preserve row counts. Pages use stable physical tuple
  ordering; changed tables are recaptured up to a bounded limit without reloading
  stable tables. Schema changes or continued business activity block cleanup.
- The continually updated Telegram scheduler heartbeat is still backed up and
  preserved live, but is the sole exception to revision equality. It is never purged.
- The full payload is encrypted with current-user Windows DPAPI and completely
  read back before the encrypted file's hash is registered on the server.
- Rollover requires a fresh matching receipt, locks the business tables, rechecks
  the backup revision and deletes Snake FK children before old participants.
  The older backup-free rollover RPC is no longer executable by the service client.
- Auth accounts are not deleted; their metadata is included in the local backup.

Raw participant/backup material stays outside this public repository and portable
archives. A backup receipt is not permission to start a season automatically.

## Verification

- Python full suite: 637 PASS; subsequent focused backup tests: 6 PASS.
- Node simulation/product/verifier suite: 135 PASS. Eight obsolete UI assertions
  reproduced identically on baseline `bca650e` and were updated to the existing
  approved markup and one-plus-two attempt rules; no UI redesign was performed.
- Live SQL checks: 24 PASS, all fixture writes and synthetic rollover rolled back.
  Includes valid awards, duplicate retry, changed proof, wrong owner/token,
  legacy forgery rejection, private archive fields and rollover with Snake rows.
- Real browser Fly replays: no input, holding and taps match server simulation.
  A longer canonical replay covers gates, spores and a bonus.
- Real browser Snake Training matches the canonical terminal hash and active ticks.
- Deployed Edge Function is ACTIVE with `verify_jwt=true`; a public API key is
  rejected as a user session (401), and an unrelated browser origin is rejected (403).

A full real ranked HTTP award cannot be exercised while the shared season is
expired. It was not reopened for testing. Authentication/transport, browser replay
parity and transactional database award/rollback paths are verified separately.

## Rebuild / deployment

```powershell
node tools/build-fly-verifier.cjs
node --test server/arcade-verifier/*.test.js
node tools/package-arcade-verifier.cjs ABSOLUTE_SUPABASE_FUNCTION_FOLDER
# From the existing linked Supabase CLI workspace:
supabase functions deploy arcade-verifier --use-api
```

The Fly generator resolves installed `sharp` or the bundled workspace runtime;
`RYTNI_SHARP_MODULE` may specify an explicit local module path. The packager copies
only the transitive simulation modules. Do not disable JWT verification or include
credentials in this source. Apply SQL through the existing authenticated admin
workflow, approve the exact immutable Snake runtime, then use the canonical TEST
build/deployment/mirror checks. Keep the previous published frontend as rollback;
never restore the vulnerable finish functions when rolling back HTML.

## Real backup and portable verification

The complete encrypted backup passed on the real database: **79 tables / 316,037
rows / 1,904 participants / 17 Fly attempts**, including the previously omitted
partner/contract/game data. Full decrypt/read-back and server receipt verification
passed in 113.77 seconds. A new backup is always required at the actual rollover;
later legitimate activity invalidates an older receipt.

Portable 1.5.1 compiled self-check and archive privacy/hash scan passed (5,097
manifest files; no private-data violations). The EXE's embedded backup module was
checked for the final bounded recapture logic and heartbeat exception. The user's
RYTNI Studio shortcut points to that verified build.

TEST candidate: `2.15.33-bf7d83ae558e`; Snake: `snake-next-1fe6d7e9e37e`.
Live desktop menus, rules, rankings, Training, pause/resume and exit passed for
both games without asset failures or game exceptions. Community ranking passed
at 320/390/844/1366 widths, including winner badges, hidden progression amounts,
unranked waiting cards, search, keyboard and unavailable-data states.

GitHub Pages deployment and the S3 mirror both expose the exact candidate manifest,
SHA-256 and size. MAIN manifest SHA-256 remains
`0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`.
Final DB checks: 1,904 participants, 20 winners, 17 Fly attempts, no Snake or
verification fixtures; the original season end is unchanged. No Season 4 launch
or real participant purge was performed.

Touch emulation additionally verified Snake portrait gating/cancel, landscape
fullscreen Training, four real D-pad controls and the portrait `mobile-gate`
orientation prompt with a frozen canonical tick counter. The initial harness
expected a generic pause screen and was corrected to the actual orientation flow;
no gameplay change was needed. This is browser emulation, not physical-phone QA.
