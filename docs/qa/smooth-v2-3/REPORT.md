# Smooth V2.3 diagnostic checkpoint

Awaiting human visual/play review. No deployment, performance benchmark,
ImageGen, gameplay/art changes, or automatic visual approval.

## Implementation

- Opt-in DEV URL: `/arcade/snake-next/game-feel-lab.html?turnAtlas=1`.
  Toggle cycles V2.3 → original V2 → GRID SNAP without resetting motion.
- Original `smooth-sprites.js`, `tube-path.js`, `motion.js` remain identical
  to approved `86379ba`. Ordinary Training/lab URLs remain original V2.
- One 16-phase native alpha master, stored as deterministic row RLE.
  Offline authoring preserves V2 contours and applies small authored socket
  rows; no Bezier, runtime curve authoring, or new artistic material.
- Canonical turn basis performs exact cardinal rotations/reflections.
  Continuous head position remains V2; alpha chooses the nearest atlas phase.
- Replacement sample is selected BEFORE normal-body material and head.
  It replaces the proximal body owner, not a second Canvas overlay.
  The cut is capped before the second bend in U/S geometry.
- Existing canonical V2 material distance/normal coordinates are retained
  wherever available. Newly covered socket pixels use body distance, never
  atlas phase as material identity. Opaque approved head renders last.
- BODY 36 px; head 42 px unchanged; socket offset 32 px; hidden underlap
  32–34 px; visible rear fill extends only 2 native pixels beyond the head.

## Targeted gate and measurement limits

- 216 raster frames: 8 turns × 16 phases, 16 tight-U phases, and U/S with
  lengths 8/30/250, growth/no-growth and intermediate alphas.
- Missing socket pixels: 0. Opaque head RGBA mismatches: 0.
  Straight V2-versus-V2.3 differing RGBA bytes: 0.
- Rear alpha aperture: 36 px. Sampled unoccluded canonical normal sections:
  35–37 px. Sections crossing the opaque 42 px head are not body-width tests.
- Independently, body-only alpha masters are checked by Euclidean distance
  to background BEFORE head occlusion. Maximum inscribed pixel-center
  contour diameter is 35.77 px, with one-pixel raster uncertainty.
  This detects hidden large contour bulges; it does NOT prove minimum width
  at every point or replace normal cross-section checks.
- A horizontal posterior projection previously reported ~48 px when capped
  at ±30 px. Extending the ray yields 118 px because it runs ALONG the incoming
  perpendicular arm. `maxRearSpan` is retained in raw output, but is not
  transverse thickness. It must not be reported as a 118 px neck or silently
  replaced with the 36 px head aperture. The independent contour check above
  was added specifically to avoid declaring width PASS from aperture alone.
- Worst local silhouette area delta: 550 px². Original V2: 478 px².
  Gate: V2 + 288 px² = 766 px², also capped at 1224 px² (quarter tile).
- Worst changed RGBA pixels: 4594. Original V2: 4522. Gate: 4810.
  These include rigid head orientation change and moving material, not only
  atlas silhouette changes; they do not certify absence of a material flash.
- All seven alpha1 → next-alpha0 boundaries: 0 changed RGBA pixels.
- Five atlas unit tests pass. Normal regression after targeted checks:
  76 tests pass, including all 165 approved V5.6 asset hashes.
- DEV three-mode smoke: no page/console/request errors.
- Live timer/RAF checks at lengths 8/30/250 (30 at 844×390/DPR2): pause/resume
  and restart pass; replay hash mismatches 0. Portal transfer then immediate
  turn: 481 ticks, hash mismatches 0, atomic reset true, no recovery/errors.

## Human gate remains required

The atlas is a small native socket correction, not a newly sculpted neck.
Early phases can still look like a lateral body attachment with a short flat
rear edge. Pixel coverage is not evidence that this looks natural.
No exhaustive proof of every visible cross-section, no physical-device
certification, and no automatic claim of the user's final visual PASS.
Please judge the native strips and live three-mode comparison, especially
early/middle phases and tight U. If the rear fill reads as a patch, or any
gap/bulge/material flash is visible, this diagnostic is rejected.

## Reproduce

From repository root, with the local server on port 8773:

```powershell
node --test arcade/snake-next/forest-training/turn-atlas.test.mjs
node arcade/snake-next/forest-training/turn-atlas-width-qa.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/turn-atlas-browser-qa.js
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/turn-atlas-boundary-browser-qa.js
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/turn-atlas-dev-smoke.js
```

QA uses the `playwright-cli` skill. Four review images only, at native CSS
size with horizontal overflow, no shrink-to-fit. STOP for human review.
