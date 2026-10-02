# Retro V3 — isolated visual proof / human approval gate

2026-10-02. Baseline `47d17dd` is accepted **technically only**, not visually. V3 is a separate kit and route; visual approval remains pending.

## Review

Local gallery: http://127.0.0.1:8773/docs/qa/retro-v3/review.html

Animated stationary proof: http://127.0.0.1:8773/arcade/snake-next/retro-v3-proof.html

The two original targets are copied **whole and unchanged** to this review directory. Neither the builder nor renderer reads them. No target crop, trace, segmentation, extraction or upscaling was used.

## Matched target traits

- Large top-left gold/ivory mushroom wordmark; joined score/length/combo/effect cabinet HUD; matching pause/fullscreen.
- Heavy reddish wood, antique gold joints, corner moss/mushrooms; field directly under the rail. Corners and middle ornamental joints remain proportional; horizontal/vertical rails scale only on their own axis.
- Coarser 26-column dark emerald/teal field, subdued grid/texture, no detailed forest scene in the arena.
- New ivory classic grid-sprite family, expressive face/mushroom accent, square 90-degree bevels, restrained leaf patches and short pointed terminal replacement.
- Pointed golden seed, broad winged cyan positive, magenta spiked hazard, substantial dark-centered portal, squared stone. Category silhouettes do not depend only on color.
- Bounded independently generated food/positive/negative/dissolve/reassembly sequences, short score pop and material state cue samples. No realtime blur.
- Nearly full-width mobile field and four individual transparent-outside D-pad hit targets, each 44×44 CSS px. No backing panel or side column. Mobile sample tail is clear of D-pad; its HUD reports its actual 20-cell fixture. Desktop fixture is 22 cells.

## Still imperfect / not claimed complete

- Body is visibly thicker than the supplied target; exact face-to-body proportions, expression, cream grain density and bevel shading differ. Corners are more angular, and material lighting rotated with head sprites is not a full independent world-light system.
- Corner foliage is less dense; the logo is bolder and the HUD bitmap lettering differs. This is the same intended material language, not pixel-identical target art.
- Portal aperture/rim pixel density and animation are different: a generated substantial portal with small bounded rim motion, not a final authored multi-angle portal animation pack.
- Positive/negative state accents are minimal samples. Portal dissolve uses a schematic straight strip; it does not yet dissolve an actual moving Snake. VFX are review assets, not gameplay events.
- There is **no moving gameplay integration**, interpolation or new simulation. D-pad only previews its button state. No gameplay feel, physical mobile performance or real event timing was approved here.
- 1200-tile timing varies and does not meet an unconditional production performance gate; see measurements. No architecture change or speculative optimization was made.

## Technical contracts / QA

Canonical cell remains 32 units. Each new Snake raster is 72×72, corresponding to 36 world units with 2-unit end overhang. Nominal full/narrow connectors are 26/18 units, with one-unit raster-rounding guard; full visual thickness is 28. Taper replaces penultimate cell and tail replaces terminal cell; no ordinary body sprite beneath tail. Sprite selection comes solely from cardinal neighbor cells, and material variant is stable by cell id. There is no body interpolation or path-shaped renderer.

One opaque-shape contact shadow pass shares exact sprite placement; no per-segment circular shadows. One main canvas, one cached CanvasPattern floor, no retained ground canvas. Image loading has one decode-gated kit Promise and no duplicate repeat-load requests.

- Foundation + presentation + V3: **30/30 tests PASS**.
- Pixel joins: **8,352 compatible pairs; 614,592 samples; 0 alpha gaps**, DPR 1/1.5/2, integer/fractional origins and three projected cell sizes.
- Desktop 1920×1080, embedded 1366×768, mobile 844×390 and 915×412 captured and inspected. Touch-emulated contexts at DPR 1/1.5/2 pass; fullscreen presentation entry/exit and visual pause controls pass.
- Application JS errors / console warnings / failed requests / HTTP errors: **0 / 0 / 0 / 0**. Repeat kit load new requests: **0**.
- Rebuilding with identical masters produces identical raster and inventory hashes.

Runtime decoded art: **3.59 MiB** (83 rasters from 14 independently generated ImageGen masters). Mobile 844×390 DPR2 backing: **4.87 MiB**; tracked combined **8.47 MiB**. Working masters are never decoded by the proof runtime. Driver allocations, browser caches and compositor overhead are not included.

1200 submitted tiles, RAF-paced, 20 warmup + 120 samples, latest run:

| Render submission | p50 | p95 | max |
| --- | ---: | ---: | ---: |
| Desktop | 2.6 ms | 3.4 ms | 4.2 ms |
| CPU×4 | 5.0 ms | 12.8 ms | 19.2 ms |

Earlier runs ranged p95 1.3–3.5 ms desktop and 5.8–25 ms CPU×4; largest observed CPU×4 spike was 31.8 ms. Variance root cause is **not established**. Many of the 1200 submitted cells are outside viewport; this is not an all-visible 1200-cell stress acceptance, nor a live gameplay benchmark. Performance PASS is not claimed.

## Captures / assets

- `desktop-1920.png`, `embedded-1366.png`, `mobile-844.png`, `mobile-915.png`
- `anatomy.png`, `objects.png`, `hud.png`, `vfx.png`; extra `mobile-dpr2.png`
- Full source prompt sets and independent PNG masters: `grib/mushroom-snake-retro-v3/sources/`.
- Runtime kit: `grib/mushroom-snake-retro-v3/`; manufacture: `arcade/snake-next/retro-v3/build-assets.cjs`.

New art was generated with the **built-in ImageGen** tool. Source prompt sets include a corrective portal-strip generation: the initial organic strip was rejected and replaced with a classic straight grid strip. No previous V2 art is consumed.

Simulation, grid/collision code, Fly, legacy Snake, Hub, ranked/backend and both channel manifests remain untouched. No TEST/Production publication or remote push.

**STOP — human visual approval required before any moving-gameplay integration.**
