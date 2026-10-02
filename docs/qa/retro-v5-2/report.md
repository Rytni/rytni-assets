# Retro V5.2 — local checkpoint / human review

## Assets and locked geometry

165 PNG entries in the new grib/mushroom-snake-retro-v5 namespace:

- 132 original manually authored Snake variants (all components painted through one material function).
- 10 original calm emerald floor tiles.
- 2 original tactile D-pad button states.
- 4 original compact four-frame VFX strips.
- 17 unchanged existing cabinet/HUD/logo/object rasters, copied from Retro V3 assets, not from concepts.

ImageGen operations actually used:0. All Snake alpha pixels are exactly identical to approved masks; geometry module SHA-256 unchanged:
6a3fc44525bdc51368823a12dc5be1060cfc752ab258aedf4bbd1c38557abba5.

Cell68 / body36 / body-cell52.9412% / head42 / head-body1.1667 / taper+tip68 (1cell). Native anatomy images never scale down.

## Visual changes

One ivory palette and pixel density across all anatomy. Small shared upper-left highlight and lower-right warm shade; tiny authored clean material variations, sparse moss/leaf/red-mushroom accents. Stable material coordinates follow retained body material, not world position or resize. Exact short tail and all four canonical bends. No continuous body stroke, painted tail, per-cell outline or arbitrary geometry.

Arena: deterministic calm emerald tilemap with baked seams/bevel, restrained marks and rare moss tiles. No procedural pixel noise or runtime grid overlay.

Object grammar: pointed gold seed / open cyan winged positive / angular purple negative / opaque neutral stone / circular cyan-violet portal. Distinction persists in grayscale, not color-only.

VFX:180ms compact contact burst, restrained pickup pulse, small score popup, portal internal moving pixels. No blur/halo/vector-ring/per-segment spam.

## Verification

- 35/35 Node foundation, presentation, locked geometry and art tests PASS.
- 256 ordered legal pairs at each DPR1 /1.5 /2, actual browser sprite alpha: gaps0 / mismatch0 / overlap0.
- Every material variant retains exact mask alpha; actual gallery CSS size equals natural PNG size.
- Desktop1366×768 and1920×1080, fullscreen enter/Escape exit, resize preserves canonical state.
- Mobile844×390 and915×412;44px touch targets, actual touch D-pad turn, pause/resume.
- Real initial gameplay: food at tick45, positive90, negative135, portal180. Growth8→9, score100. Keyboard turns, pause freeze, resume, canonical collision/result and restart reset passed.
- JS errors0; failed requests0; HTTP errors/game4040.

One isolated DEV issue fixed: explicit Escape fullscreen exit in the review page. First-look HUD logo clipping and missing Cyrillic glyphs were fixed only in V5, not old UI.

## Bounded render timing

64 measured RAF samples per length/rate, after12 warmup draws. JS Canvas render submission time, NOT GPU-completion or physical-device frame latency. Simulation clocks stopped during render benchmark; canonical snapshots used. No gameplay tick reduction.

|Length|Desktop p50/p95/max ms|CPU×4 p50/p95/max ms|
|---|---|---|
|8|0.4 /0.5 /0.5|1.8 /3.0 /4.7|
|100|0.5 /0.6 /0.7|1.9 /2.2 /2.6|
|250|0.4 /0.7 /0.7|2.0 /2.3 /2.6|
|500|0.5 /0.6 /0.9|2.2 /2.5 /3.0|
|1200|0.6 /0.7 /0.8|2.6 /2.9 /3.1|

No CPU×4 p95 exceeds16.7ms. Tracked decoded image raster3.763MiB;1366×724 DPR1 Canvas3.773MiB. No cached ground/full-world layer or retained biome atlases.

## Remaining differences / limits

- Material is deliberately very restrained; it is flatter and less richly authored than the TARGET concept. Tiny head/mushroom detail becomes minimal at mobile scale. Human approval is still required; no claim of visual parity.
- Floor is somewhat lighter/more uniform than the reference, though it has real per-cell material and stable seams.
- Object/cabinet assets retain the established Retro V3 look; full final asset harmonization is not attempted.
- Positive/negative effects are visual preview timers only. Portal triggers visual contact but does not teleport. No unapproved mechanics added.
- DEV control toolbar is outside embedded stage; hidden naturally in fullscreen. Menus/portrait orientation UX, physical mobile Safari/Chrome/GPU behavior and audio are not part of this pass.

Gallery: http://127.0.0.1:8773/docs/qa/retro-v5-2/review.html
Playable: http://127.0.0.1:8773/arcade/snake-next/retro-v5-review.html

One local checkpoint follows QA. TEST/Production not published; no manifests, database, Fly, ranked, Hub or legacy changes. STOP for human review.
