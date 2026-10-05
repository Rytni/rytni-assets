# Gate 2.3.1 — zero-gap cabinet aperture

Base: `310faf0`. Presentation-only. No effect-art pass, new biome artwork, benchmark or deployment.

## Confirmed cause

The previous fit used a rectangle inset 8 desktop /4 mobile CSS px from the actual wood opening. Its logical blocked-cell edges then left another `14/68 × cell` transparent/unused exterior band, because the native wall extends only54px outward from the legal-cell edge. Thus a30×12 desktop wall started about20px away from wood, even though the old inset-relative utilization appeared to pass.

`before.json` reproduces actual alpha gaps against the physical aperture: 1920×1080 /30×12 L/R/T/B =19.05/19.05/19.17/19.87 CSSpx; mobile =8.15/8.15/8.24/8.28px. These are raster distances, not percentage estimates.

## Fix

`cabinetAperture` is the existing frame's actual inner rail rectangle: left=frame.x+57s, right=frame.right−57s, top=frame.y+66s, bottom=frame.bottom−66s. No extra aperture gutter. Outer cabinet dimensions, HUD geometry, frame assets and D-pad placement remain byte/numerically identical to the base.

The uniform cell scale fits `(worldWidth−2)` by `(worldHeight−2)` playable cells plus54/68 cell of native wall ink on each side. Non-limiting-axis space is reserved as environmental border space. Existing walls translate only along their normal to put their outer opaque54px edge on the aperture. Native motif dimensions, pixel palette and uniform scale remain unchanged. Existing side tiles also cover the blocked corner cells to prevent a one-row break where displaced top/bottom walls meet side walls.

The existing floor is underpainted behind the border's transparent interior fringe, using the same canonical tile positions/material. Those cells remain blocked; this does not add playable cells or move any canonical entity. No wall painting, effect art or floor art has been changed. Historical expansion/retraction walls and portal presentation remain unchanged.

## New gate: direct raster edge gaps

The old `playfieldUtilization()` metric is removed. `apertureEdgeGaps()` reads transparent-background environment rendering, scans every edge across its ink span, and reports worst L/R/T/B distances in CSSpx. Fully blank perpendicular strips are charged to their own edge rather than mislabeled as a whole-board side gap. Partial-pixel alpha counts as visible raster coverage. Empty renders, missing sides and full-bounds-but-broken-edge fixtures FAIL. Percentages are not a pass condition.

| Viewport | Aperture x,y,w,h CSSpx | Clipped visible border ink x,y,w,h CSSpx | L/R/T/B gaps |
|---|---|---|---|
| Desktop1920×1080 | 76.95,221.83,1766.10,716.04 | 76.95,221.83,1766.10,716.04 | 0/0/0/0 |
| Desktop1366×768 | 58.40,157.89,1249.21,509.28 | 58.40,157.89,1249.21,509.28 | 0/0/0/0 |
| Mobile844×390 | 54.85,63.76,734.30,298.52 | 54.85,63.76,734.30,298.52 | 0/0/0/0 |

All four worlds30×12 /40×16 /50×20 /60×24 pass at all three viewports. Real browser raster checks at DPR1/1.5/2:36 masks, all gaps0. These bounds refer to environmental ink clipped to the physical wood opening, not floor/background or arbitrary sprite canvas bounds. `after.json` retains all measurements and worst scanlines.

## Verification

6 targeted aperture/validator/lock tests pass first;36 scoped FIT, asset-regression, UX, camera and expansion tests pass after that. No full suite/benchmark. Tests cover rejected double inset, absent edge hidden by a full bounding box, empty image, raster tolerance, unchanged cabinet/HUD/controls geometry, all four square-cell grids/all three biome wall painters/DPRs, paused expansion, read-only rendering and locks.

Native wall painter, frame/floor art, pickup/VFX/asset contract/HUD effects, V4 geometry/material, objects, core/collision/input, fixed-point scheduler,15% capacity, world topology/progression, food and tunnel/portals remain unchanged. Seed17 /1200ticks hashes remain `ebe1e000` across V4/V2/GRID SNAP. Browser console/network failures:0.

Commands:

```powershell
node --test arcade/snake-next/effect-playground/aperture.test.mjs
node --test arcade/snake-next/effect-playground/fit-v2.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/ux.test.mjs arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/effect-playground/aperture-browser.js
```

## Human visual gate

[Native review](review.html): exactly one desktop diagnostic (red aperture; cyan visible wall ink), one clean desktop, one clean mobile. Images are not scaled down. Clean screenshots are live Forest30×12, frozen only for capture. Human visual approval is still required. STOP.
