# Gate 2.3.2 — final composite visible seam

Base: `2372446`. Local-only presentation fix. Human visual approval is still required.

## Cause and fix

Production frame strips are 512×28 (horizontal) and 32×70 (vertical). Their
inner canvas edges are not their visible material edges. No completely
transparent top/bottom inner-edge row was found: the top's last two rows are
near-black RGB (typically 2–5, 0–1, 0), with alpha about 245–252. The bottom's
first row is visible gold, so its inner-edge trim is **zero**, not two rows.
The bottom strip's last two dark rows face OUTWARD and were not cropped.
Side strips likewise have two near-black inward columns. The joint ornaments
have inward-edge-connected, almost-opaque black matte, including small
indentations behind gold islands; this was covering the world wall.

There is also a five-native-pixel outer wall backing band (`-54..-49`). Its
Forest RGB is `24,37,27`; the first continuous material band starts at `-49`.
Aligning that backing's box to wood did not align visible wall material.

Changes are limited to source/destination presentation alignment:

- Explicit native strip trim: top bottom=2, bottom top=0, left right=2,
  right left=2. Cropped normal-axis dimensions stay at the same native scale.
- Aperture uses visible rail offsets **55 / 55 / 64 / 66**, not canvas offsets
  57 / 57 / 66 / 66. Outer frame, cabinet, HUD and D-pad geometry stay unchanged.
- Wall fit reserve uses visible outer extent 49 rather than backing extent 54;
  the existing painter is byte-identical. Backing outside the aperture is clipped,
  not drawn underneath the wood. Cells still use one uniform square scale.
- Top strip's existing 32-native-pixel decorative endpoints are retained at
  native scale under existing corner ornaments. Only its middle rail is stretched.
  Previously stretched endcap shadows caused another local horizontal gap.
- Joint source cache removes only inward-edge-connected non-material matte.
  Gold/wood RGB and enclosed artistic shadows are retained. Source PNGs unchanged.
- All non-FIT callers retain the old frame draw destinations and artwork.

No world/collision/scheduler/capacity/V4/portal/food/effect/HUD/touch change.
No new wall art, no large hidden wall overlap, no deployment.

## Authoritative measurement

`visible-seam-qa.js` checks actual final composite RGB plus wood/world raster
provenance at the real render DPR. It does not accept canvas alpha boxes.
Every raster column/row of the full straight rail spans is checked, including
mid-rail ornaments; fixed curved corner ornaments are inspected in clean images.
For overhanging ornaments, the next visible wall pixel inward of the innermost
wood pixel is used, rather than a pixel through an ornament cutout.

Material classification is alpha ≥128 and max RGB channel ≥40 in BOTH final
composite and its provenance. The cutoff separates measured near-black matte /
dark outer wall backing (max channel ≤37) from material; it is explicit and
auditable. This is not a claim that every opaque dark pixel is visible wood.
The report also retains sensitivity at 32 (includes dark backing) and 48
(rejects some legitimate dark wood edge pixels); 40 is the visual gate.

Gap formulas are the user's adjacent-pixel formulas, divided by actual DPR.
Corners are not used to artificially lower the straight rail maximum.
The previous aperture-alpha test remains **geometry QA only**.

Old captures use the original `2372446` presentation, frame and fit sources
in `baseline/`, with only import URLs rewritten for the local QA fixture.
They are rendered against the same paused live canonical state and actual
current production assets. No old fixture is imported into gameplay.

CSS pixels; maximum over the scanned rail, not averages:

| Viewport | DPR | OLD T/B | NEW L/R/T/B |
|---|---:|---|---|
|1920×1080|1|16 / 4|1 / 1 / 0 / 0|
|1920×1080|1.5|16 / 4|0.67 / 0.67 / 0 / 0|
|1920×1080|2|16.5 / 4.5|0.5 / 0.5 / 0.5 / 0|
|1366×768|1|12 / 3|1 / 1 / 0 / 0|
|1366×768|1.5|12 / 2.67|0 / 0 / 0 / 0|
|1366×768|2|12.5 / 2.5|0 / 0 / 0 / 0|
|844×390|1|5 / 1|0 / 0 / 0 / 0|
|844×390|1.5|5.33 / 1.33|0 / 0 / 0.67 / 0|
|844×390|2|5.5 / 2|0 / 0 / 0 / 0|

The first central-only diagnostic had desktop T/B=7/4. Expanding the scan to
the entire rail revealed the stretched endcap shadow and higher OLD maxima
above. Final acceptance uses the full rail, not the earlier central sample.

Final aperture x/y/w/h (CSS px, not itself the visual acceptance test):

- 1920×1080: 74.25 / 219.13 / 1771.50 / 718.74
- 1366×768: 56.3475 / 155.8441 / 1253.305 / 511.3318
- 844×390: 54.01 / 62.92 / 735.98 / 299.36

## Verification and review

- 9 live Forest viewport/DPR cases: PASS, all four visible gaps ≤1 CSS px.
- Browser console errors / failed network requests: **0 / 0** in completed run.
- Six targeted validator tests pass: opaque dark padding false-pass prevention,
  occluded wall, missing material, off-center faults, DPR normalization, frame
  lock/default drawing, and edge-connected matte vs enclosed shadow ownership.
- 42 existing targeted geometry/fit/assets/UX/camera/expansion tests pass.
- Replay: seed17 / 1200 ticks, all three readers `ebe1e000`.
- No benchmark or full application suite; no publication.

Review only `seam-x4.png` (red visible wood / cyan visible wall),
`desktop-clean.png`, and `mobile-clean.png`. `before-x4.png` and JSON reports
are retained as diagnostic evidence, not an additional art gallery.

Browser reproduction (local server on 8775):

```powershell
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/effect-playground/visible-seam-browser.js
```

For original baseline captures, set `window.seamCaptureBefore=true` in the
runner page; reset false for AFTER. The browser script saves metrics before
asserting and rejects any post-fix seam above2 CSS px, console/network error.

Targeted regression command:

```powershell
node --test arcade/snake-next/effect-playground/visible-seam.test.mjs arcade/snake-next/effect-playground/aperture.test.mjs arcade/snake-next/effect-playground/fit-v2.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/ux.test.mjs arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
```

STOP for human visual review; no Gate 2 effect-art work.
