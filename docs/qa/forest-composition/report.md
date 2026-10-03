# Forest Training composition checkpoint

Baseline: `e57acbdf1dd9d6329ea056f25e06c7572b604966`. Local-only repair; human visual approval pending.

## Root cause and scope

`#game` used `height:100dvh` and the renderer centered its square arena in the remaining height while drawing the cabinet around that entire remainder. At 1920×1080 the full 28×12 grid was 1824×781.7 at y=199, with 42.9 px above and 43.2 px below inside the frame. At 1920×1440 the same grid shifted to y=379, yielding 222.9 / 223.2 px dark bands. The visible blocked stone row also formed a competing inner frame.

Embedded stage now uses width-driven 16:9, 98% width, top-aligned non-stretch flow. Fullscreen aspect-fits and centers the tight cabinet, with letterbox outside it. The blocked perimeter remains in collision but is covered by the wooden cabinet; interior rocks remain. No square-cell distortion or topology edits.

One continuous existing HUD asset, correct 64px source nine-slice, uniform stat subdivisions; no separate stat/effect backgrounds. Removed `ЛЕС · ТРЕНИРОВКА`. Existing object silhouettes retained; seed scale .64→.8 cell and pickups .85→.98 cell for readability. Snake renderer/art remain byte-identical.

Eight independently authored original 68×68 board PNGs, reproducible via `node arcade/snake-next/forest-training/build-board.cjs`. Common base, subdued light/dark, 1% patina and 1% wear; coordinate-hash selection is stable, cached and time-independent. No reference pixels, runtime grid overlay, procedural animated decor, ImageGen, new props or audio.

## Measurements (CSS px)

| Viewport | Outer stage (x,y,w,h) | HUD (w,h) | Visible arena (x,y,w,h, relative to stage) | Cabinet (w,h) | Inside dead bands |
|---|---|---|---|---|---|
| 1920×1080 | 19.2,0,1881.6,1058.4 | 1880.9,109 | 57.6,137,1766.9,679.6 | 1880.9,882.6 | 0/0 |
| 1366×768 | 13.7,0,1338.7,753 | 1338.7,78 | 42.6,98.8,1253.9,482.3 | 1338.7,630.2 | 0/0 |
| 844×390 | 0,0,844,390 | 844,48 | 18.2,57.6,807.5,310.6 | 844,388.7 | 0/0 |
| 915×412 | 0,0,915,412 | 904.7,48 | 23.4,57,868.2,333.9 | 904.7,412 | 0/0 |

At desktop 1920, cabinet width is 98.0% of viewport. Within the actual cabinet composition, HUD=12.35%, arena=77.00%, borders=10.65%. Grid cell=67.957 square CSS px. Mobile cells=31.058 / 33.392 square CSS px. HUD is 48px, both action targets at least 44px high; D-pad targets exactly 44×44.

**Constraint / deviation:** locked 28×12 topology has a 26×10 passable interior (aspect 2.6). It cannot fill the target's taller arena while keeping square cells and unchanged topology. Desktop allocated 16:9 stage therefore has 175.8 px / 122.8 px unused space **outside** the tight cabinet; cabinet natural aspect is ~2.13. Fullscreen centers that outside letterbox. The arena is 64.2% of allocated desktop stage height, not 75–82%; the requested proportions are reached inside the actual cabinet. No claim of exact TARGET composition parity.

## Verification

Existing 47 regression tests PASS: foundation, presentation, V5 geometry/connectors at DPR 1/1.5/2, V5 material/art hashes, Forest session mechanics. All 165 approved V5.6 assets byte-identical. No benchmarks / soak / broad QA.

Playwright CLI targeted verification PASS: four requested viewports, tall 1920×1440 viewport, tall 1600px grid parent with normal page flow below, resize retains body, desktop fullscreen enter/exit, keyboard movement, pause frozen hash/resume, touch D-pad, mobile pause/resume. No application JS errors, console warnings, failed requests or HTTP ≥400 in this run. Earlier QA-only missing-clock fixture errors were corrected in the fixture, not production mechanics.

`measurements.json` contains raw stage/HUD/arena/frame/cabinet bounds, calculated inside gaps and target sizes. Frame geometry, not a hardcoded screenshot label, determines unusedInside. Pixel rounding <1 CSS px is expected.

## Review deliverables

Exactly seven PNGs in this directory, displayed at native size by `review.html`: whole TARGET/before, whole TARGET/after1920, after1366 with measured outlines, mobile844, mobile915, native floor, native HUD. Runtime-only crops for the two close-ups; TARGET is never cropped/extracted. Same explicitly prepared 22-cell canonical QA scene before/after; actual Training interaction separately smoke-tested.

Local DEV: http://127.0.0.1:8773/arcade/snake-next/forest-training.html

Gallery: http://127.0.0.1:8773/docs/qa/forest-composition/review.html

Protected art/simulation/session/audio, Fly/Hub/legacy/backend/ranked and both release manifests untouched. No publication/push. One local checkpoint; STOP for human visual review.
