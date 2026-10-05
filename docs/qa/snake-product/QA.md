# Local product QA — 2026-10-06

Status: frontend/mock candidate verified for local review. **Not release or live
backend acceptance. BACKEND NOT APPLIED.** No benchmark or random screenshot sweep.

## Commands and results

```powershell
node --test arcade/snake-next/product/*.test.mjs arcade/snake-next/product/appearance/material.test.mjs arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js arcade/snake-next/tuning-lab/lab.test.mjs
playwright-cli -s=productqa run-code --filename=docs/qa/snake-product/browser-qa.js
playwright-cli -s=productqa run-code --filename=docs/qa/snake-product/interaction-qa.js
playwright-cli -s=skin-review run-code --filename=arcade/snake-next/product/appearance/browser-qa.js
node tools/stamp-snake-dev.cjs --check
```

- Node targeted set: 68 tests, zero failures (38 product/material + 30 existing
  foundation/presentation/Lab tests).
- Product browser script: 54 assertions; fresh isolated desktop and touch/mobile
  contexts, all sixteen direct preview states, zero console/page errors, zero
  failed asset requests and zero external/production requests.
- Interaction script: 11 assertions; real buttons, fullscreen, canonical natural
  wall-collision Result, clipboard share, sponsor failure, confirmed exit and
  actual mobile 30×12/40×16/50×20 sessions. Zero page errors.
- Material browser gate: nine distinct mobile50 skins, all eight requested pairs,
  four triples, frozen pause, byte-exact onset/base expiry, portal split, and
  desktop30/mobile30/40/50/60 native-scale fixtures.
- Additional existing ribbon/tunnel suite: 19/21 pass. Corrected local BODY-width
  gate, portal spans, tunnel lengths8/30/250, cardinal entry/exit, growth, repeated
  portals and replay/render-mode parity pass. Two historical source-byte locks
  fail; see below. Those tests were not weakened.

## Targeted contract coverage

| Area | Verified |
| --- | --- |
| Ranked | Single start under concurrent clicks; server seed reaches canonical state; new lifecycle has unique request namespace; retry uses same request; last-attempt lost-response recovery; idempotent immutable finish; refreshed confirmed record/rank; failed finish stays unaccepted |
| Async races | Slow post-start hub cannot drop terminal result; stale hub reads fenced; gate lost during start holds allocated identity; pending fullscreen cancellation cannot spend late; Training preserves unresolved ranked recovery |
| Training | Offline/auth-paused/network-error Training works; no ranked start/finish; restart/replay unlimited; separate Result copy |
| Sponsor | Serialized claim; maximum2 credits; normal counter preserved on failure; credit before Play; credit consumed by start; cooldown contract; safe explicit noopener/noreferrer link |
| Routes | Main→Rules→Main; Pause→Settings→Pause; restart/exit cancel retains run; ranked restart retains seed/attempt with zero debit; confirmed exit no incomplete score; Result cannot resume or route to Pause |
| Ranking | Top10 only; leader #1 badge; own-row highlight; escaped hostile names; backend ordering retained; empty state; best single attempt |
| Device | Embedded desktop, desktop fullscreen; portrait no debit/cancel; touch landscape fullscreen gate; D-pad command; rotation safe pause and frozen ticks; audio persists; pagehide disposes timer/RAF/audio |
| Appearance | Nine effects/eight pairs/four triples; original alpha and head/eye alpha; default material bytes; canonical hash/replay unaffected; 250ms tick fade; pause stable; tunnel gap retained |
| Protected scope | Diff against f1d2519 empty for current Fly, both channel manifests, simulation/input, V4 geometry, TunnelSession, Director and food policy |

## Measured product-only readability decision

At 844×390, BODY=36 native px and the same FIT WORLD square-cell geometry:

| World | Body CSS px |
| --- | ---: |
| 30×12 | 13.234 |
| 40×16 | 9.879 |
| 50×20 | 7.881 |
| 60×24 | 6.555 |

Product explicitly uses `maxWorldStage:2`; natural progression ends at50×20.
Default/DEV config has no added cap field and still reaches60×24. The natural
15% rule, cell positions and collision are unchanged. No independent Snake scale.

## Meaningful captures inspected

- [Desktop Main](main-desktop.png), [mobile Main](main-mobile.png).
- [Desktop live30](live-desktop30.png), [mobile live50](live-mobile50.png).
- [Mobile Pause](pause-mobile.png), [record fixture](result-record-desktop.png).
- [Desktop combo](effects-desktop30-combo.png), [mobile palette combo](effects-mobile50-combo.png), [mobile pattern combo](effects-mobile50-patterns.png).

Menu review loads one state at a time, not a giant gallery. Preview record stats
are synthetic and identified as local fixtures. Natural collision was tested
separately against canonical final hash and exactly one finish.

## Known failures, not hidden

1. `progressive-run/food.test.mjs` passes5/6: its50-seed hazard warning-cycle test
   reports `1 !== 0` at line66. Reproduced exactly from an independently extracted
   **f1d2519** source+food fixtures, so this predates product work. Food/Director
   code is untouched. This reliability discrepancy still needs dedicated triage
   before production; it is not claimed fixed by this package.
2. Historical immutable-source tests in `tuning-lab/design.test.mjs` and
   `forest-training/ribbon-live.test.mjs` compare against old motion source before
   the approved fixed-point scheduler. They fail on that historical difference.
3. `gate-one/gate.test.mjs` source-lock compares old progressive config before
   FIT WORLD V2, and also cannot accept the new optional cap/RGB hooks as exact
   bytes. Runtime field/mask/default-byte/hash checks pass; no historical lock was
   edited to manufacture a PASS.

## Remaining product/rollout limitations

- Human visual/gameplay acceptance is still pending; no autopilot-fun claim.
- Physical iOS/Android fullscreen/orientation safe-area and audible mixer quality
  require real-device review. Edge touch emulation is not proof of browser chrome
  or hardware behavior. Fullscreen fallback is explicitly presentation-only.
- Actual Tilda host leave/re-entry/session ownership must be verified with the
  host. Standalone hides Other Game; no hardcoded navigation is used.
- No production network/database queried. SQL has not been run or parsed against
  PostgreSQL. Isolated SQL concurrency/RLS/privilege tests are required before
  activation. Schema/helper/account-link compatibility remains a rollout blocker.
- Rewards are intentionally zero, not fake awards. Secure exactly-once generic
  ledger integration is unverified.
- Aggregate result plausibility is not server replay/anti-cheat validation. The
  current Fly-class client-trust limitation is explicit in BACKEND_CONTRACT.
- Memory-only mocks reset attempts on reload. Live adapter activation and true
  session auth refresh require authorized host transport/configuration.

No TEST/Production deployment, database execution, Fly behavior/result change,
Daily Challenge, King, collision change or V4 geometry redesign was performed.
