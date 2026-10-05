# VFX behavior fixes — local human review

Base: `0d45ffb`. No deployment, benchmark, Caves/Swamp work or PNG changes.

## Causes and fixes

- **Rush:** `route[2..7]` anchors changed ownership at every canonical bracket. The new read-only `visualPath(frame)` adapter samples `makeSweep` / `tunnelSweep` directly: line or quarter-arc at `frame.start + d`. Six fixed head-relative distances: 0.8 / 1.45 / 2.1 / 2.75 / 3.4 / 4.05. Local tangents produce stable slot normals outside BODY/2; draw under Snake. At portal cuts a slot fades over 0.12 cell, never interpolating an entry→exit chord. No particle clock/history, geometry or gameplay mutation.
- **Roots:** unsafe warnings were omitted from `waiting` at activation and disappeared. Explicit canonical phases now preserve the telegraphed cell. 120-tick warning/sprout; unsafe activation remains pending for up to 90 ticks and rechecks every canonical tick. Safe activation gets all 360 ticks from `activatedAt`. Unsafe deadline triggers 18 ticks of approved decay/retract. Active expiry also has canonical decay. Cancellation retains the developed sprout under the first six decay ticks. `warnings`, `retracts`, deadlines, activation, expiry and lifecycle policy version enter `Director.snapshot()` / session hash. Safety excludes only the current warning; other reserved cells remain protected. Reset, terminal cleanup and DEV CLEAR clean pending/retract states.
- **Mist:** removed arena-minus-head-disk even-odd clip. Order: floor/environment/far stones and Roots → arena-rect-only Mist → nearby solid stones/Roots → Rush wake → Snake → portals/food/pickups/warnings/foreground effects. Nearby safety range is 5 cells from the shared visual head. Puff weighting varies smoothly from 0.45 to 1 across 3–6 cells; it never cuts a floor hole. Existing scales/mirrors/phases/opacity/drift remain canonical-tick driven.

## Review / DEV controls

Playable: <http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html>

Compact proofs: <http://127.0.0.1:8775/docs/qa/vfx-behavior/review.html>

RUSH MOTION and MIST are explicitly persistent **render-only** rehearsals. They do not extend actual effect durations or alter B speed. ROOT LIFECYCLE creates canonical DEV warnings at two fixed cells: one safe, one deliberately blocked by proximity to existing mandatory food. If that food is collected during grace, the original cell may activate once safe. Otherwise it retracts. No hidden relocation.

## Focused results

| Native run | Active ticks | Committed moves | Result |
|---|---:|---:|---|
| Rush desktop | 1815 (30.25 s) | 127 | straight/S/U; 1 real portal transfer; wake uses separate history spans |
| Roots desktop | 555 (9.25 s) | 38 | normal warning→sprout→active→decay; blocked warning→sprout→pending→retract |
| Mist mobile 844×390, DPR 2 | 1209 (20.15 s) | 84 | readable Snake/food; no hard circular boundary |

Native fixed clock and ordinary queued commands used throughout. Scripted legal turns are QA only, not autopilot-fun evidence. Native runs used unchanged effect art on Forest 30×12. No gameplay performance benchmark.

- Rush OLD alpha 1.00 vs NEW alpha 0.00: **0 CSS px** anchor difference. All eight cardinal/mirror transforms and line/arc sampling match approved V4 primitives. U/S and next-head-turn reindex tests also pass. Portal slots never form a world chord.
- Root phases captured from actual Director state, not a synthetic animation clock. Unsafe head/portal/food/blocked tests never activate. A safe telegraph that becomes unsafe while sprouting remains visible/pending at its original cell; releasing safety gives full lifetime.
- Real canonical replay: same seed + identical queued commands, with V4/V2/snap presentation sampling schedules, yields identical hashes and collision result at every tick. Hashes intentionally differ from historical pre-lifecycle hashes (new `rootPolicy=1`). Read-only presentation does not alter current hashes. UI three-mode toggles also preserve hash.
- Pause freezes final raster in all three modes. Restart clears stress modes, warnings, retracts and active hazards. Native mobile D-pad targets are ≥44 CSS px; a real DOWN tap enters the unchanged queue.
- Additional final-raster safety test uses the same stone near and far from the canonical head. Near opaque-material max RGB-channel delta = **2/255**, mean = **0.509/255**, due to approved source alpha max 254 and normal compositing; visibly fully readable. Far max delta = **74/255**, mean = **6.700/255**: real fog obscuration. This is not a box-only safety assertion.
- Console/page errors: **0**. Network failures/HTTP errors: **0** in native review runs.
- **36 targeted tests pass.** Live mode routing additionally confirms six Rush anchors in V4, V2 and GRID SNAP, each with identical hash `d75ee76c`; GRID SNAP receives an effect-only canonical frame and retains its old Snake draw branch.
- All **59** contracted PNG files byte-identical to base. V4/tunnel geometry, simulation/timing, balance, food/world/capacity, cabinet/touch CSS and unrelated Director/session sections locked by targeted tests. Only requested Root lifecycle/terminal cleanup changes canonical source.

## Reproduction

```powershell
node --test arcade/snake-next/effect-playground/behavior.test.mjs arcade/snake-next/effect-playground/vfx-clarity.test.mjs arcade/snake-next/effect-playground/production-vfx.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/production-art.test.mjs
playwright-cli -s=fxb --raw run-code --filename=docs/qa/vfx-behavior/browser-qa.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/vfx-behavior/proofs.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/vfx-behavior/safety-qa.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/vfx-behavior/modes-qa.js
```

Browser scripts require local server port 8775 and an open Playwright CLI session. Video uses the already-installed local FFmpeg binary. Native capture JSON contains complete traces, pause/restart assertions, mode hash checks and errors. Proof generation does not edit source art.

Two historical active lock tests were narrowed only for the explicitly authorized Director lifecycle and session terminal cleanup. New tests lock all their unrelated source sections and **all** PNGs including VFX. Historical full-suite lock assertions for old immutable checkpoints were not rewritten or run; QA is intentionally targeted.

**STOP for human gameplay/art review.** No visual approval claimed automatically.
