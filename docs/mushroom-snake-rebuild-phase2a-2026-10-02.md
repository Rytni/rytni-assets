# Mushroom Snake rebuild — Phase 2A acceptance

Date: 2026-10-02. Branch: `mushroom-snake-rebuild`.
Scope: host blockers + independent simulation foundation only; stop for review before Phase 2B.
Accepted baseline: `910495aaf80b36b76e57186f516f6347d61f04e7`, retained by local tag `codex/snake-next-phase2a-base`.

## 1–4. Host repairs

1. **Escape ownership:** Fly's bubble key handler previously also handled the fullscreen Escape and resumed paused gameplay. Hub now consumes it in window capture (`preventDefault` + `stopImmediatePropagation`), exits fullscreen only, and ignores held-key repeats. Fly defensively checks `ownsFullscreenEscape(event)`; the same host contract is available to future Next adapters. Local Playwright: Main/Playing/Paused preserved after first Escape, popup/game selection preserved; second distinct Escape closes popup. Paused elapsed remained exactly 0.05 seconds across the first Escape.
2. **Focus order:** focus was restored after popup hide/`aria-hidden`, and a delayed focus callback could focus a hidden popup. Focus now moves synchronously outside the closing layer before hiding; stale callbacks check visibility. Playwright observes focus at the actual `aria-hidden=true` assignment: outside in all three cases; close-all also outside; focus/aria-hidden warnings = 0.
3. **TEST deploy safety:** canonical `tools/deploy_tilda_test.ps1` defaults to no actions; explicit `-Publish`, main branch and empty index required for publication. Allowlist is TEST manifest + selected immutable app only. Rejects modified/staged Production and unexpected tracked/index targets; compares Production byte snapshot during preparation; validates candidate path/hash/size; stages exact paths. Existing reproducible build/test scripts unchanged. Throwaway Git fixtures PASS for allowlist, modified Production, staged Production. No deploy run. The dangerous sibling deploy script was replaced locally with a bridge; sibling is not a Git repo, so that external replacement is **not** captured by this commit. Its versioned bridge template and all authoritative checks are here.
4. **Host commit:** `e20f5271b8f3fd8d9ae7b092c366bb193386c8c2`.

Host contract: [arcade-host-phase2a-contract.md](arcade-host-phase2a-contract.md).
Host QA uses anonymous preview/training, blocks write RPCs, and assembles a local fixture only. No real attempts.
JS page errors = 0; failed/HTTP-error Fly assets = 0. Expected anonymous auth401/TikTok fixture noise is separate.
An initial QA fixture lacked charset (mojibake); UTF-8 meta was added and QA rerun. This was not an application defect.

Local screenshots (not release artifacts), visually inspected:

- `C:\GitHub\rytni-assets\.playwright-cli\phase2a\fly-main-after-first-escape.png`
- `C:\GitHub\rytni-assets\.playwright-cli\phase2a\fly-playing-after-first-escape.png`
- `C:\GitHub\rytni-assets\.playwright-cli\phase2a\fly-paused-after-first-escape.png`

## 5–11. Independent foundation

5. **Source:** [arcade/snake-next/README.md](../arcade/snake-next/README.md); entry exports data APIs, not a production playable game. `simulation/`, `world/`, `input/`, `tests/`. Dependency-free ES modules/JSDoc; no legacy imports or Hub registration.
6. **Arena:** configurable 96×64 benchmark candidate (80×48 also tested); private immutable collision mask, separate decor/theme, topology export/reconstruction. Snake occupancy uses bit words. Validator checks cardinal unique body, valid direction, runway, initial one-cell trap, connected/free region and minimum free area. 100 seeds reproduce topology; copied masks/decor/theme do not mutate collision.
7. **PRNG:** independent uint32 xorshift32, rejection-sampled range; zero seed maps to `0x6d2b79f5`. Known seed1 vector: `270369,67634689,2647435461,307599695,2398689233`; seed42: `11355432,2836018348,476557059,3648046016,3759983556`.
8. **Input:** four directions, max two queued future turns, one per cell boundary, reversal checked against last queued/current direction, repeat/duplicate-sequence rejection. RIGHT→DOWN→LEFT, RIGHT→LEFT, DOWN→UP, repeated DOWN and four-command burst tested. Keyboard and future D-pad use the same command data.
9. **Clock:** pure fixed 60Hz ticks; provisional 15ticks/cell. Main-thread timer driver with injected scheduler/monotonic clock, no RAF dependency. Max five catch-up ticks; greater lag explicitly enters recovery and freezes until reviewed resume. Owned timer disposer tested.
10. **Body/collision:** one authoritative integer-cell typed ring with bit occupancy; O(1) move/growth. Obstacle/self death is deterministic with no partial body move; current tail entry legal only if it actually vacates. No renderer positions/interpolation. Provisional versioned score100/growth1 per food, no passive score.
11. **Food:** exactly one simulation-owned cell while playing; consume removes old and selects new atomically. Bounded reusable BFS workspace, deterministic reachable free selection, no obstacle/body overlap, no initial reversal, legal vacating-tail traversal. No legal location produces explicit terminal reason. Reachability is current-snapshot safety, not an AI guarantee of all future routes.

## 12–14. Determinism and CPU delay

12. **Replay:** seed + version/full-config rules key + tick/sequence input log reproduce state hashes and event stream; state is structured-cloneable and topology reconstructs. Diagnostic semantic FNV32 is not cryptographic anti-cheat. Straight/U/S/turns/growth/death/food replacement all PASS. Five 25,000tick exact-length sessions (125,000 total) plus 8seeds × 20 real food pickups (160) PASS.
13. **FPS equivalence:** 30/60/90/120/144 FPS × normal/artificial delay; identical hashes at every one of 3,600 active ticks, including consumption/growth. Artificial delay adds 28ms every seventh scheduler call; excessive-lag recovery tested separately.
14. **Real CPU×4:** Edge154 CDP throttling, main thread, no Worker/render. Native timer smoke runs 60ticks at both CPU rates with same hash `752cb322`. See performance below. This is desktop throttling, not physical mobile acceptance.

## 15. Performance gate

Raw measurements: [qa/snake-next-phase2a-perf.json](qa/snake-next-phase2a-perf.json).
Units ms; triples **p50 / p95 / max**. Every measured ordinary tick moves (stress cadence), 15,000samples/length/rate. Consumption ticks include growth/score/new-food selection, 200samples; setup/cloning excluded. Separate food-selection p95: desktop0.3–0.4ms, CPU×4 1.1–1.3ms.

| Length | Desktop move | CPU×4 move | Desktop consume | CPU×4 consume |
|---:|---:|---:|---:|---:|
| 8 | <0.1 / <0.1 / 0.2 | <0.1 / <0.1 / 2.5 | 0.2 / 0.3 / 1.0 | 1.0 / 1.3 / 1.4 |
| 100 | <0.1 / <0.1 / 0.1 | <0.1 / <0.1 / 0.3 | 0.2 / 0.3 / 0.5 | 1.0 / 1.4 / 1.6 |
| 250 | <0.1 / <0.1 / 0.1 | <0.1 / <0.1 / 0.2 | 0.2 / 0.3 / 0.4 | 1.0 / 1.2 / 1.3 |
| 500 | <0.1 / <0.1 / 0.1 | <0.1 / <0.1 / 0.4 | 0.2 / 0.3 / 0.6 | 1.0 / 1.2 / 1.4 |
| 1200 | <0.1 / <0.1 / 0.1 | <0.1 / <0.1 / 0.2 | 0.2 / 0.3 / 0.3 | 0.8 / 1.1 / 1.3 |

Browser zero samples mean ~0.1ms timer quantization, not zero work. Node high-resolution sanity check measured ordinary p95 ~0.0002–0.0004ms and consumption p95 ~0.22–0.30ms. Browser consumption p95≤0.3ms desktop; CPU×4≤1.4ms; max observed simulation sample2.5ms. No future renderer costs are included.

## 16–19. Acceptance and remaining scope

16. **Near-full:** 63/64 occupied consumes final legal food → length64, score100, food=-1, explicit `full/arena-filled`. Separate `full/no-legal-food` test distinguishes no reachable location from physical arena fill. PASS.
17. **MAIN THREAD ACCEPTED** for Phase2A simulation foundation. Ordinary p95 satisfies≤1ms; consumption and CPU×4 stay well below16.7ms. Worker runtime/SAB not justified or implemented; state/topology remain compatible with a later transport.
18. **Foundation commit:** the commit containing this report and `arcade/snake-next/`; obtain exact id with `git log -1 --format=%H -- arcade/snake-next/entry.js`. Exact hash is also returned in the final handoff; kept separate from host commit.
19. **Remaining confirmed issues:** legacy cold UI flash/residual eager DOM images, Fly failure-open readiness and non-idempotent start/sponsor contracts from accepted Phase1 remain out of scope. Host repair is unpublished; public TEST has not received it. No observed failing Phase2A foundation tests. Physical-device fullscreen/audio/visibility, final renderer/gamefeel/mobile/ranked acceptance are not performed or claimed.

## Verification and safety

- `node --test arcade/snake-next/tests/foundation.test.js`: 16/16 PASS.
- `& .\tools\test-test-deploy-guard.ps1`: PASS in throwaway Git fixture.
- Playwright CLI local host fixture: three Escape states + focus close-layer/close-all PASS.
- Playwright CLI simulation DEV fixture: real CPU1/4 benchmark + timer smoke PASS.
- Syntax/diff checks and post-commit read-only deploy `-CheckOnly` recorded in final handoff.
- Both channel manifests and Production tree unchanged; legacy Snake core/controller/UI/assembler unchanged. Only allowed Hub ownership + narrow Fly key guard/page focus edits.
- No release/candidate build, push, TEST/Production/manifest publication, DB mutation, or real attempt. External sibling bridge change disclosed above. Unrelated untracked files preserved.
- No Phase2B renderer/UI/art/audio/biomes/effects/portals/bonuses/ranked/backend integration. Stop for review.
