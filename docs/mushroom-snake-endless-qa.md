# Competitive core local QA — 2026-09-22

Base: `6f547596716dfa6b56327e1de14cd77a330f7ef8`, branch `mushroom-snake-visual-reset`. No deployment; Fly, Hub, Snake segment geometry and both channel manifests unchanged.

## Evidence

- Core and Forest regression tests, endless tests, JS syntax checks and strict asset assembly pass.
- Flood-fill safety: 15 independent 96×96 regions across three seeds, positive/negative coordinates and early/late terrain; no enclosed free-space pockets. Regeneration matches after eviction; cache stays at 25 chunks.
- Accelerated one-hour simulation: 216,000 ticks, 37,437 steps, 11,623 generated chunks, all three biomes, alive. Additional five-minute runs start at lengths 28/100/250/500/1200; all survive real terrain with a deterministic forward-route planner. Planner avoids optional special pickups; individual effect semantics are covered separately.
- Difficulty samples early/medium/late/extreme: 0 / 0.257 / 0.652 / 0.932. Scoring, combo expiry/cap/milestones, Golden Harvest, event exclusion/expiry and pickup safety pass.
- Playwright CLI: desktop embedded/fullscreen, Forest/Cave/Swamp/transition, three events, combo20, 250/500/1200 render fixtures, real keyboard/D-pad, reverse rejection, pause/resume/settings/restart/menu, portrait gate, landscape, orientation and quality changes. Console errors, failed requests and HTTP errors: zero in the clean final session.
- Separate browser navigation: 1,200 real simulation moves, x=1178, all three biomes, alive; simulation cache25/render cache6. No collision override used for this travel test.

## Performance

Comparable warm desktop render loop (180 samples, DPR1), p95 milliseconds:

| Segments | Before | After |
|---|---:|---:|
| 8 | 0.2 | 0.2 |
| 250 | 0.3 | 0.3–0.4 |
| 500 | 0.3 | 0.3 |
| 1200 | 0.4 | 0.4–0.5 |

5×5 simulation streaming p95: 0.054ms before, 0.19–0.23ms after. New terrain does more work, but this remains sub-millisecond and runs on movement, not every render frame.

Mobile emulation, device DPR3 (runtime capped1/1.5), CPU×4, 1200 segments: warm render p95≈1.6ms. Cold travel p95 3.3–8.7ms, observed maxima 13.1–21.8ms after caching/downsampling (initial implementation reached70–92ms). Separate synchronous 1200-step browser travel: render p95 1.3ms, max31.9ms. These are CPU-call measurements, not GPU/presentation latency or physical-phone FPS.

## Screenshots

Directory: `C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт/artifacts/arcade-snake-competitive/`.

`forest.png`, `cave.png`, `swamp.png`, `transition.png`, `event-bloom.png`, `event-trail.png`, `event-grove.png`, `combo-20.png`, `desktop-fullscreen.png`, `desktop-250.png`, `desktop-500.png`, `desktop-1200.png`, `main-menu.png`, `mobile-portrait.png`, `mobile-forest.png`, `mobile-cave.png`, `mobile-swamp.png`, `mobile-effect-stack.png`, `mobile-dpr3-1200.png`, `continuous-travel.png`.

## Remaining limits

- Rare cold-chunk rendering outliers still exceed a 16.7ms frame budget under throttling; warm rendering is inexpensive. Further prewarming should be measured on actual target phones before a release.
- Mobile QA is emulation, not a physical Android/iOS device. Audio uses three playback-rate variants of the existing ambience, not three newly composed tracks.
- Balance is a local foundation, not validated competitive/ranked balancing. Terrain difficulty is spatial and immutable; score/time/length affect run speed/rewards/spawn mix but do not rewrite visited obstacles.
