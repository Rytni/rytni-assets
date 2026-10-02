# Retro V2 production kit — local proof and stop gate

Review gallery: <http://127.0.0.1:8773/docs/qa/retro-kit/index.html>

Interactive asset/anatomy controls: <http://127.0.0.1:8773/arcade/snake-next/retro-kit-review.html>

Viewport-only static renderer: <http://127.0.0.1:8773/arcade/snake-next/retro-kit-review.html?proof=1>

Kit: `grib/mushroom-snake-retro-v2/`; complete inventory, assembly contract and generation prompts are there. Screenshot captures here are **evidence only**, never asset sources.

## Implemented

Independent PNG Snake tile kit, emerald floor variants and deterministic 256² ground atlas, newly generated wood/gold/moss nine-slice frame, five independent ImageGen object sprites, text-free HUD pieces, compact normal/pressed D-pad and eight-row bounded VFX atlas. One isolated Canvas2D renderer reads connected occupied-cell fixtures without simulation/interpolation/gameplay hooks.

The renderer chooses head/body/corner/taper/tail using cardinal neighbors; the terminal cell never has an underlying body sprite. Source 36² spans one 32-unit cell plus 2-unit overhang on both sides. Penultimate corners have narrowed outgoing ports. Stable-ID accent selection is invariant to translation. No separately moving shadow.

## Verification

- `node --test arcade/snake-next/tests/retro-kit.test.js arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js`: **27/27 PASS**.
- Playwright CLI: `run-code --filename=arcade/snake-next/tests/retro-kit-browser-qa.js` against the local server.
- 23 captures: anatomy 4 directions/straight/every corner/taper/U/S/8/22/100, object color/grayscale, checkerboard frame, D-pad states, VFX sheet, embedded 1366×768, real fullscreen 1920×1080, 250/1200 parallel lanes, DPR 1/1.5/2, touch mobile 844×390 / 915×412 and mobile grayscale.
- Exhaustive matching-port alpha checks: **6984 cases, 382152 samples, zero gaps**; includes rotated reverse tapers, three cell sizes and fractional origins. Unit selection checks independently verify opposing diameters.
- Transparent 44px touch bounds, actual tap normal-state restoration, no duplicate asset requests, no manufacturing master loaded.
- Application JS errors / warnings / failed requests / HTTP errors: **0**.

## Render measurements

Headless Edge 154, 1366×768 DPR1. One actual render per RAF; 30 warmup + 180 measured frames per case. JS render duration, not GPU/presentation FPS. No simulation cadence is involved in this static proof.

| Length | Desktop p50 / p95 / max ms | CPU×4 p50 / p95 / max ms |
|---:|---|---|
| 8 | 0.3 / 0.5 / 0.7 | 0.3 / 3.3 / 6.5 |
| 100 | 0.4 / 0.8 / 1.7 | 0.4 / 4.0 / 6.2 |
| 250 | 0.6 / 1.1 / 2.7 | 0.7 / 4.7 / 10.5 |
| 500 | 1.1 / 1.7 / 2.5 | 1.2 / 7.2 / 11.3 |
| 1200 | 2.1 / 3.0 / 3.9 | 4.8 / 10.1 / 17.3 |

Initial 1200 full render p95 30.8ms / max 33ms. Profiling isolated 3990 ground calls at p95 28ms; Snake p95 2.3ms; frame p95 0.2ms. Replacing that ground draw loop with an immutable pre-manufactured 8×8 floor atlas and one pattern fill removed the bottleneck. Pattern setup measured ~0.1ms. There is no viewport-sized ground cache or hidden Snake cache; all 1200 tiles are actually drawn in each measured render.

Do not report performance as unconditionally safe: CPU×4 had a 17.3ms maximum, slightly over 16.7ms. No architecture switch was attempted. The previous D.2 2ms/4ms targets are **not met at 1200** by this uncached Snake draw proof. Preserve this evidence at the review gate rather than changing approved art or simulation to conceal it.

## Tracked raster memory

62 kit PNGs would decode to 0.777 MiB. Runtime loads 61 (0.768 MiB); the optional corner ornament is not needed by this nine-slice frame. The manufacturing master is not loaded. No duplicate requests/resources, extra ground backing or retained atlas copies are created by application code.

Main canvas plus loaded image rasters: ~4.77 MiB desktop DPR1; ~16.78 MiB desktop DPR2; ~5.79 MiB mobile 844×390 DPR2; ~6.52 MiB mobile 915×412 DPR2. Gallery-only canvases add memory outside the viewport-only proof. Browser-internal decoded/GPU duplication, transient screenshots and GC are not included in these tracked estimates.

## Explicit limits / STOP

No existing renderer or game was replaced. D-pad controls in the proof only demonstrate pressed states; no gameplay mechanics are copied. The no-spawn predicate is demonstrated/tested here, not installed in the existing spawner. HUD values and active-effect timer are fixture text. VFX are delivered as bounded frame sequences, not a complete effects system.

The kit intentionally keeps the character simple; manual cream head/body shading and minimal UI typography are not a pixel-for-pixel promise of the reference illustration. Artistic quality/readability at actual small size remains a human approval decision. Physical mobile, real GPU memory, thermal throttling and moving game integration remain unverified.

STOP FOR HUMAN REVIEW. No TEST/Production publication, no Phase 3B, no gameplay/simulation/grid/collision/ranked/backend/legacy Snake/Fly/Hub/manifest changes.
