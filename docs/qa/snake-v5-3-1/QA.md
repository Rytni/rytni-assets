# Targeted V5.3.1 QA

## Gates

| Evidence | Result | Limits |
| --- | --- | --- |
| `before-scheduler.json` | Old V5.3 touch + 150 ms stall opens scheduler-recovery Pause | Software witness only; physical cause pending |
| `input-stress.json` | 7 checks; 800/800 input receipts; 100 stall recoveries; no unexpected Pause/double enqueue/scroll/fullscreen loss | Emulated touch; first 600 taps isolate input receipt with stopped clock; resize/stall groups run real timers in fresh canonical Training fixtures |
| Replay | Actual/expected 600-command streams match; `defad4d9` / `defad4d9` | Same unchanged canonical session; not a physical-device performance claim |
| Recovery receipts | Hash/tick unchanged before future ticks, debt 0, playing | No synthetic score/time/movement ticks; no catch-up burst |
| `status-qa.json` | 24 checks, 0 collisions/overflow | 720×405, 1080×608, 1366×768, 1920×1080; six score/rank pairs each |
| `mobile-regression.json` | 36 checks, 0 horizontal overflow/errors | 390×844, 393×873, 412×915; Main, both Settings tabs, Ranking, all Guide tabs, gate, large values |
| `diagnostics.json` | 5 checks | Real touch + 150 ms stall; correlation; clipboard/persistent bounded journal; Copy and denied-clipboard manual fallback inside fullscreen owner; no normal UI diagnostics |
| `standalone.json` | 2 checks | Standalone remains standalone; one command/tap and old blur Pause policy retained |
| `fullscreen.json` | 3 checks | 1920×1080 four-column board; Space Pause/Resume, R confirmation/Cancel |
| `host.json` | 22 checks on exact final candidate | Real Tilda host, local immutable candidate routing; desktop + three mobile dimensions, fullscreen/D-pad |
| Unit tests | 27/27 | Product clock 100/150/250 ms recovery/cancel, controller, lifecycle and board contracts |
| `closure.json` | PASS | Runtime allowlist, protected hashes, Production/Fly/mobile unchanged |
| Bundle validator | PASS | Release c77364482deb; 1,187,280 bytes; runtime 3efbc8cbe51b; 517 immutable files |
| `public.json` | PASS on Pages and S3 | Exact current/previous IDs, app/runtime SHA256/size and all 13 changed runtime files; rollback is approved V5.3 |
| `live.json` | 22/22, 0 new errors | Published exact release c77364482deb / runtime 3efbc8cbe51b in real LIVE host; desktop + three mobile viewports, landscape fullscreen/input |
| `review-check.json` | 11 review images load | Focused review package, not an art gallery acceptance claim |

No new console errors or failed runtime assets. The actual anonymous Tilda host already emits `/auth/v1/health` 401; recorded separately as baseline, not falsely counted as a new Snake error. No production API writes are used in these preview tests.

## Reproduction

Serve repository read-only at `http://127.0.0.1:8776/` using the existing `docs/qa/snake-ui-v4/preview-server.cjs`. Owned Playwright CLI session: `snakev531`. Run browser phases serially:

```powershell
node docs/qa/snake-v5-3-1/run.cjs before-scheduler
node docs/qa/snake-v5-3-1/run.cjs input-stress
node docs/qa/snake-v5-3-1/run.cjs status-qa
node docs/qa/snake-v5-3-1/run.cjs mobile-regression
node docs/qa/snake-v5-3-1/run.cjs diagnostics
node docs/qa/snake-v5-3-1/run.cjs standalone
node docs/qa/snake-v5-3-1/run.cjs fullscreen
node docs/qa/snake-v5-3-1/run.cjs host
node docs/qa/snake-v5-3-1/closure.cjs
node --test arcade/snake-next/product/clock-driver.test.mjs arcade/snake-next/product/mobile-lifecycle.test.mjs arcade/snake-next/product/controller.test.mjs arcade/snake-next/product/ui-v5-3-1.test.mjs arcade/snake-next/product/ui-v5-2-1.test.mjs
& .\tools\test_tilda_test.ps1
# Only after authorized TEST publication:
node docs/qa/snake-v5-3-1/verify-public.cjs
node docs/qa/snake-v5-3-1/run.cjs live
```

No collision/invulnerability modifications are used by the new touch stress. Seeded fixtures prevent unrelated wall deaths from polluting input receipts. `COPY INPUT TRACE` remains the authoritative next diagnostic if Android/Yandex disagrees with emulation.
