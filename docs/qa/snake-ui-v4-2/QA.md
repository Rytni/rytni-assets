# V4.2 targeted QA

Base `5810758` / published V4.1. Source and TEST checkpoints will be recorded after verification. Production forbidden.

## Causes and fixes

1. **Guide**: the old 90–96cqh panel did not subtract the host's safe padding, and its independent crest extended above the panel. `.panel-body {overflow:auto}` also scrolled the authored book edges. New budget uses both real menu height and container height, keeps header/bookmarks/frame/footer fixed, and scrolls only `.page-content` inside each page. Native corner/source proportions remain unchanged; no image crop/Y-only scale.
2. **Button rectangle**: source cap joining column equals all center columns, including alpha. V4.1 graded center and caps independently: wood center `.8` brightness vs ungraded caps; Play center `1.28 + saturation1.08` vs caps `1.1`. Now all three parts retain the same raster/color treatment; whole skin receives any brightness. No PNG redraw.
3. **Large values**: independently flexible value boxes, fixed icon columns/minimum gaps, nonwrapping numeric typography; extreme score class and small-host reduction floor16px. TOP-3 keeps its panel/composition, uses one flexible text/score region; long names ellipsize, never scores. TOP-10 keeps ordering/own-row/#1 and internal list scroll.
4. **Lower corners**: V4.1 stepped canvas clip polygon cut the residual backdrop in a straight line, while full-viewport/whole-cabinet opaque underpaint imposed another rectangular crop. Polygon removed; current product presentation clears residual canvas and paints only HUD/aperture backing. Unchanged ambient source/scale fills behind complete wood corners; host clipping/radius remains owned by host.
5. **Mode label**: normal product has no visible Training/Ranked label in gameplay. It is hidden without `qa`; optional QA badge is now outside the cabinet. Pause/Result Training distinction retained.
6. **Brick wall**: injected product-only FIT WORLD policy places the existing blocked row/column beneath wood. `perimeter:false` skips both current and historical expansion wall artwork; floor reveal and all portals/effects stay unchanged. DEV's default painter/layout is retained. No collision, capacity, world dimensions, simulation or Snake raster change.

## Measurements — cell / BODY in CSS px

| World | Desktop BEFORE | Desktop AFTER | Mobile BEFORE | Mobile AFTER |
|---|---:|---:|---:|---:|
|30×12|60.17 /31.86|63.27 /33.49|25.00 /13.23|28.49 /15.08|
|40×16|44.91 /23.78|46.31 /24.52|18.66 /9.88|20.85 /11.04|
|50×20|35.83 /18.97|36.02 /19.07|14.89 /7.88|16.22 /8.59|

At1920×1080: fixed aperture `(74.25,166.10,1771.50,648.30)`. At844×390: `(23.10,66.62,797.80,291.96)`.

Legal interior aspects differ:28/10,38/14,48/18. Fixed wood + square cells mathematically requires a centered remainder on one axis. Minimax aperture aspect≈2.73252 bounds it to≤2.4%; it is continuous floor, no wall reservation/black corridor. Desktop30 has7.81px vertical remainder per side,50 has21.35px horizontal remainder; mobile30 has3.52px,50 has9.61px. **These are honest grid aspect remainders, not falsely reported0px grid gaps.** Wood/floor visible adjacency uses measured existing rail trim.

## Passed local/candidate checks

-71/71 product/appearance/stable-camera Node tests, including the two final world tests; fresh final run passed before checkpoint.
-17 targeted portal/geometry/expansion tests: lengths8/30/250, all cardinal crossings, no world chord, corrected local-width gate, hash parity, pause/restart, reveal timing.
-5 targeted food tests: known seed17 topology, deterministic fallback tiers, real full board, expansion preservation, hazard-route articulation rejection.
-114 native composition/DPR checks; BEFORE reproduces49 failures including large values.
-480 numeric checks:8 scores ×6 ranks ×2 value boxes ×5 hosts; includes1920×1080,1366×768,844×390,720×405,608×342.
-18 game layout/render-read checks; all three world sizes desktop/mobile, no perimeter/clip, same seeded hashes `6cc90af3 /1fc4fe5a /e2e2d1fe` as V4.1 fixtures.
-40 host functional checks: ranked mock seed/attempt routing, training, pause/settings/confirm cancellation/result, sponsor/no-attempt/error, sharing fallback, desktop fullscreen, mobile portrait/fullscreen gate and real D-pad, switch/dispose.
-Real TEST page with exact candidate overrides: desktop254 /mobile243 checks; complete Guide checked inside embedded AND fullscreen host. No new console/page errors or failed assets; known anonymous `/auth/v1/health`401 recorded separately.
-1024 protected files equal actual base: Production, Fly, all prior art, gameplay/Smooth V4/skins, backend contracts. Environment diff is exactly two optional product-only perimeter conditions.
-Canonical local build/strict test:456 immutable dependencies, no publication implied by local build.

## Existing failures disclosed (not gameplay edits)

An expanded historical test invocation reported three old assertions, with their underlying files unchanged from actual base:

-`gate-one/expansion-ux.test.mjs`: whole-file lock against `a85a2ff` rejects **already approved effect-skin painter hooks** in `gate-one/ribbon.js`.
-`gate-one/gate.test.mjs`: whole-file lock against `5bd0c0c` rejects **already approved progression model additions** in `progressive-run/config.js`.
-`progressive-run/food.test.mjs`, “hazards cannot remove food routes; …50 seeded warning cycles”: assumes all roots vanish at tick480. Current B.2 root lifecycle can retain seed47's root from120 through840; the duration assertion is obsolete, not a reproduced food-route failure. Food/director source unchanged. No lifecycle retuning in a UI pass.

These are not counted as passes and were not silently rewritten. Current-base protected-source checks plus relevant behavioral tests replace historical all-file locks for this pass. The separate stable-camera art check was narrowly adjusted only to allow the requested optional wall suppression; native painter/reveal/portal comparison remains.

## Publication / LIVE

Pending canonical source checkpoint → TEST-only publication → final both-origin byte audit and fresh LIVE checks. Human visual review remains the final authority.
