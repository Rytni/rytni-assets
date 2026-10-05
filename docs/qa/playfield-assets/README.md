# Full playfield / authored-effect readiness

Base: `e097fe2`. Local diagnostic only. No new production art, benchmark, TEST/Production manifest update or deployment.

## Presentation change

FIT uses a new `playfieldRect` from the measured native inner rail edges: side 57px, top/bottom 66px. Cabinet window aspect is 2.5:1, independently of legacy cell counts, `base.arena`, or its height-fit calibration. Existing frame/HUD assets and style are retained. Deliberate interior gutter: 8 CSS px desktop / 4 mobile. Embedded stage shrink-wraps the new cabinet; fullscreen may have space outside it. Mobile D-pad keeps its former absolute placement and four 48×48 targets.

Square cells use `min(playfieldRect.w/world.width, playfieldRect.h/world.height)`. The four requested worlds have logical fit 100% on both axes. Neither Snake proportions nor game coordinates are changed.

## Native fullscreen measurements

Desktop available playfield: **1750.10×700.04 CSS px** inside 1920×1080. Mobile available playfield: **726.30×290.52 CSS px** inside 844×390. The mobile cabinet is 782.18px wide, centered with 30.91px outside it on each side because height is limiting; those are outside-cabinet margins, not a second inset around the map.

Visible figures below conservatively measure the straight environmental-wall envelope, excluding the 14/68-cell empty exterior fringe at each side. The full wall, including corner/tangential ink, is also independently raster-measured in `browser.json`; no assumption that logical world bounds equal opaque artwork is used.

| World | Desktop visible world+border px | Mobile visible world+border px | Conservative utilization W / H | Desktop body px | Mobile body px |
|---|---|---|---|---|---|
| 30×12 | 1726.08×676.02 | 716.33×280.55 | 98.63% / 96.57% | 30.88 | 12.82 |
| 40×16 | 1732.08×682.02 | 718.82×283.04 | 98.97% / 97.43% | 23.16 | 9.61 |
| 50×20 | 1735.69×685.63 | 720.32×284.54 | 99.18% / 97.94% | 18.53 | 7.69 |
| 60×24 | 1738.09×688.03 | 721.32×285.54 | 99.31% / 98.28% | 15.44 | 6.41 |

Full environmental raster bounds (CSS-pixel alpha extents): desktop 1752×677 / 1752×683 / 1752×686 / 1752×689; mobile 728×282 / 728×284 / 728×286 / 728×286. Fractional-edge raster coverage can include partial pixels and thus exceed the continuous width by under 2px. The conservative analytic figures avoid calling that over 100% utilization. Both metrics exceed the 95% target; images show the complete wall close to the existing wood rail, not a large internal gutter.

**60×24 is unsuitable for production at this mobile scale (6.41px body <~8px).** 50×20 is marginal at 7.69px and needs human readability judgment; no production maximum is selected in code. Four measurement worlds remain unchanged. No independent Snake enlargement or fifth world.

## Asset readiness

[Exact nine-effect delivery contract](asset-contract.md) covers 36 pickup field/LOD/HUD/optional-idle entries, 19 VFX sheets, and 4 golden/corrupted food entries. All 59 entries await artwork. No replacement PNG has been fabricated. The approval map is empty; therefore pending asset HTTP requests = 0.

Runtime now supports cached approved-image loading, sheet-dimension checks, deterministic active-tick loop/one-shot frames, uniform content-box fitting/anchors, authored LOD and HUD, and authored major effect routing. Missing/invalid assets remain the unchanged procedural fallback. Art cannot be production-approved or visually tested before it arrives. In-memory metadata fixtures test routing; they do not create art.

## Verification

76/76 targeted tests pass across playfield/assets, FIT V2, UX, effect mechanics, progression, food, tunnel, stable camera and expansion UX. New tests cover rail-derived rect independent of legacy geometry, gutters, square-cell fitting, >95% conservative utilization, contract completeness, pending/no-network, load deduplication, invalid dimensions, LOD/idle source frames, uniform aspect, pause-stable deterministic phases and every major authored route without a procedural main drawing path.

Locks are byte-identical to `e097fe2`: canonical core/collision/input timing, fixed-point scheduler/speed model, 15% capacity model, tunnel history/motion, Smooth V4 geometry/material, effect durations/scoring/director, food policy, world topology and mobile touch styles. Fallback pickup/VFX paint definitions and LOD file are byte-identical too.

Seed17 /1200 ticks: V4 / V2 / GRID SNAP all hash **ebe1e000**. Real browser renderer switching preserves hash. Trusted fullscreen button verified actual fullscreen at 1920×1080 and 844×390; all four sizes measured on both. Keyboard and mobile D-pad input pass. Pause freezes alpha; rendering preserves hash. Console errors = 0; failed/network >=400 responses = 0. No pending-art 404s.

Reproduce tests:

```powershell
node --test arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/fit-v2.test.mjs arcade/snake-next/effect-playground/ux.test.mjs arcade/snake-next/effect-playground/effects.test.mjs arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/progressive-run/food.test.mjs arcade/snake-next/gate-one/gate.test.mjs arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/effect-playground/playfield-assets-browser.js
```

## Human review

[Five-image native-scale review](review.html): fullscreen desktop30×12 /50×20; mobile40×16 /50×20; fallback-only placement/LOD (all nine categories with legal2+1 active effects). Captures freeze canonical play state for comparison; they are not claims about fun or completed live art. [Raw browser measurements](browser.json).

Local DEV: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html

STOP for human review. No further art iteration or deployment.
