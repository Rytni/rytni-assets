# Mushroom Snake Next — Retro Arcade Forest proof

2026-10-02. Local only, branch `mushroom-snake-rebuild`. Technical verification passed; artistic approval is reserved for human review. STOP here: no full game or Phase 3B.

## Review

- Playable: <http://127.0.0.1:8773/arcade/snake-next/retro-review.html>
- Compact gallery: <http://127.0.0.1:8773/docs/qa/snake-next-retro-review.html>
- Exactly ten screenshots: `.playwright-cli/retro-proof/01..10-*.png`, linked individually in the gallery. They are local QA artifacts, not production source assets.
- Start Training, arrows/WASD or D-pad; Pause/Resume/Restart/Main, Sound, Fullscreen. Review tools select lengths 8/30/100/250/500/1200 and straight/90/U/S/parallel tracks. Use Parallel for cycle autopilot.

## Implementation

Independent native Canvas artwork: four-way face, two straight tiles, four corner tiles, four stepped taper tiles (14 × 64²). Green/cream arcade identity with rare tiny mushroom accents. No reference pixels, traced art, illustrated body, ribbons or ImageGen assets.

Read-only renderer uses `BodySnapshots.current` for the entire Snake and current food; no movement interpolation anywhere. Occupied cell contour stays authoritative. One reusable presentation-only Snake canvas caches visible tiles plus a four-cell camera margin between canonical moves. Camera transform remains the existing `Camera`. Growth/head movement/length/viewport/LOD invalidate the cache. Portal/death animation use dedicated tiles directly. No simulation, collision, grid or fixed timestep changes.

Quiet native forest grid, sparse dark beveled obstacles, perimeter moss. Golden asymmetric Magical Seed, open diamond positive, solid spiked negative, larger ornamented circular portal. Eight square particles per actual pickup, pool capped at 24, brief pickup flash/score pop and compact external timer cards. No blur, debug circles or technical plus-sign effects.

Positive/negative are deliberately **feedback/timer representations** (6s/4s), not the full gameplay buff/debuff system. Combo is a proof-only pickup HUD counter; canonical food score/growth are unchanged.

Portal FSM: idle → entering → exiting → grace → idle. Segment-wise disappearance follows the existing path toward entry; translated validated state is created once, then segments emerge from destination. Original input/timer ownership is suspended during transit; pause freezes portal progress too. Exit grace 1.2s. Unsafe translation is rejected and resumes safely, not a world-geometry mutation.

Death: 90ms hit-stop, small shake and head impact, sequential disappearance over 650ms, then Result. One RAF owner only; result/main clear effects/timers/audio. Original procedural D-minor, 112bpm plucky Forest motif (8.57s native audio buffer), compact food/positive/negative/enter/exit/death/UI SFX. No ambient drone, asset preloading or audio scheduling timer.

## Verification

`node --test arcade/snake-next/tests/retro.test.js arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js`: **29/29**. Suspended audio resume is explicitly tested; asynchronous activation waits for the native context and is cancelled on stop.

Playwright CLI scripts: `retro-browser-qa.js`, `retro-invariants-qa.js`, `retro-performance-qa.js` (load using `run-code --filename=...` on the local server; `?qa=1` enables QA helpers). Actual food contact/growth, positive/negative contact, portal entry/transfer/exit/grace, pause/resume inside portal, death/result/restart/main, arrows/WASD, fullscreen enter/exit, D-pad touch, landscape→portrait pause→landscape resume. Geometry tests cover all directions and straight/90/U/S; 7056 native centerline pixel samples at DPR 1/1.5/2 found zero background gaps.

1366×768 and 1920×1080 desktop; 844×390 and 915×412 touch emulation. D-pad targets 58×46 CSS px, outside field. Application console errors, warnings, failed requests, 404: **0** in targeted browser run. After result/main: game RAF = 0, timer = 0, active audio sources = 0.

### Performance

Edge headless; 120 warm-up + 600 measured RAF frames/case. JS CPU duration around `Training.paint`, including HUD update, not GPU/presentation FPS. Raw rounded metrics in `snake-next-retro-measurements.json`.

| Length | Desktop p50 / p95 / max ms | CPU×4 p50 / p95 / max ms |
|---|---|---|
| 8 | 0.1 / 0.2 / 0.4 | 0.3 / 0.6 / 1.0 |
| 100 | 0.1 / 0.2 / 0.3 | 0.3 / 0.5 / 1.3 |
| 250 | 0.1 / 0.2 / 0.6 | 0.3 / 0.5 / 2.8 |
| 500 | 0.1 / 0.2 / 1.3 | 0.3 / 0.6 / 6.8 |
| 1200 | 0.1 / 0.2 / 2.2 | 0.3 / 0.6 / 12.1 |

Bare foundation renderer 1200 desktop p95 0.4ms; uncached Retro 1.1ms / CPU×4 4.7ms. Cache reduces warm work without lowering simulation cadence. Rebuilds are still measurable (CPU×4 maximum 12.1ms); no scheduler recovery. Simulation p95 desktop 0.1ms, CPU×4 0.2ms. Desktop tracked raster at 1200: 10,536,632 bytes (~10.05 MiB), including 6,893,568-byte Snake cache; zero decoded external images/atlases/duplicate resources. Audio buffers separately ~0.8–1 MiB after interactive SFX use.

## Known scope limits

- Human visual approval and perceived audio/game feel remain pending. No physical phone, speaker, GPU compositor or thermal/throttling test; browser touch/CPU emulation is not a hardware guarantee.
- Very long/U-shaped bodies may not fit the fixed proof portal destination. Transfer safely rejects rather than changing collision topology; large-body benchmarks deliberately disable interactive proof pickups/portals.
- Positive/negative mechanics and full bonus catalogue are not implemented. Portrait is a safe local launch/pause state, not a production Main Menu redesign.
- Rare 1200-segment cache rebuilds are more expensive than warm draws; retain measured max alongside p95 rather than claiming uniform frame cost.

## Exact added files

- `arcade/snake-next/retro-review.html`
- `arcade/snake-next/retro/audio.js`
- `arcade/snake-next/retro/effects.js`
- `arcade/snake-next/retro/fixtures.js`
- `arcade/snake-next/retro/portal.js`
- `arcade/snake-next/retro/renderer.js`
- `arcade/snake-next/retro/review.js`
- `arcade/snake-next/retro/tiles.js`
- `arcade/snake-next/tests/retro.test.js`
- `arcade/snake-next/tests/retro-browser-qa.js`
- `arcade/snake-next/tests/retro-invariants-qa.js`
- `arcade/snake-next/tests/retro-performance-qa.js`
- `docs/qa/snake-next-retro-proof.md`
- `docs/qa/snake-next-retro-measurements.json`
- `docs/qa/snake-next-retro-review.html`

No existing tracked source changed. Fly, legacy Snake, Hub, backend, manifests and all channels/releases unchanged. Untracked abandoned D.3 work preserved and excluded from this checkpoint. Local commit only; no push or publication.
