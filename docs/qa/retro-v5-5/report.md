# V5.5 — final character-art review candidate

V5.4 is NOT visually approved. This pass changes only original Snake RGB artwork. **No ImageGen.** No integration, renderer or simulation changes. No TEST/Production publication.

## Artwork

- Same ivory palette, but the long unbroken bands now carry irregular hand-authored 1–3px incomplete skin/plate clusters, small highlight interruptions and scattered warm underside pixels. Eight finite arrangements use the existing deterministic non-periodic variant selection. No random noise, cell borders, lattice, every-N cadence or new large moss patches.
- Same foliage families/density. Some islands now pass behind the upper rim, with lighter light-facing edges and small warm contact shadows on the ivory surface rather than uniformly dark sticker outlines. The shared head/neck island is retained.
- Repainted face within the existing 42px mask: stepped oval eyes with small glints/reflection, a three-pixel mouth and one red mushroom with three light spot clusters. No rectangular eye plaques. All four orientations share the same material.
- Same terminal mask and full 68px length. Shading bands narrow with the existing cross-section; the last small pixels carry cream/warm body values rather than becoming solid dark edging. The point remains the locked point, not a shorter or rounder silhouette. Texture and restrained foliage belong to the same body material.
- All four corners use the same path-coordinate skin language; foliage is selected only by the unchanged variant mechanism, not because the piece is a corner. The clean four-corner sheet deliberately shows variants0–3 without leaves.

## Locked geometry / protected scope

Cell **68**, body **36**, head **42**, terminal **68px**. All **132** original Snake masks unchanged, exactly 0/255 alpha. Geometry SHA-256 remains `6a3fc44525bdc51368823a12dc5be1060cfc752ab258aedf4bbd1c38557abba5`.

Renderer, runtime, variant selector, canonical simulation, arena/floor, HUD, objects, frame, VFX, mobile layout, Fly, Hub, backend and channel manifests are untouched. The 33 non-Snake resources are unchanged. Build-tool edits only select the new offline painter and label its inventory; the painter is not a new runtime architecture.

## Required verification

Existing geometry/art regression **13/13 PASS**. Actual PNG alpha connector QA at **DPR 1 / 1.5 / 2**: **256 legal pairs per DPR; gaps=0, connector mismatch=0, overlap=0, disconnected pairs=0**. Existing corner-width tolerance unchanged.

Runtime screenshots: **1920×1080**, **1366×768**, **844×390 mobile landscape**, **915×412 mobile landscape**. These use the unchanged gameplay cell sizes 69.923 / 48.769 / 31 / 33.731 CSS px respectively. Reviewed primarily at actual gameplay size. Mobile grayscale included as a screenshot diagnostic only. No benchmark or new gameplay QA suite.

Final clean-context pass: **application JS errors=0, console warnings/errors=0, failed requests=0, HTTP failures/404=0**. One initial auxiliary DPR run stalled on the unchanged loader. Immediate reload of that exact context became ready with no error/failed request; a complete subsequent clean run passed. Cause of the transient was not established and no runtime workaround was introduced. It is not claimed as a fixed bug.

## Gallery / human gate

`review.html` puts **TARGET → V5.4 → V5.5** side by side for all four gameplay viewports. TARGET is the whole reference image fitted uniformly to capture width, preserving aspect ratio. It is clearly labeled reference, not runtime; none of its pixels are cropped/extracted/reused. V5.4/V5.5 captures remain native 1:1.

Straight8/30, all four corners, U, S, head/neck, taper/tail, body and connected-corner native comparisons are also included. Baseline anatomy uses original V5.4 Git sprites in the same locked geometry/material locations. No shrink-to-fit or 300% beauty substitute.

Fresh-context gallery check at 844×390: all **31** images decoded; all **27** non-reference images retained their exact natural dimensions; four whole-reference presentations preserve their original aspect ratio. Gallery JS/network/404 failures: **0**.

**Technical PASS only; final artistic approval remains human.** Tiny material details recede on mobile by design; the smooth outer silhouette and pointed tip are still the exact locked masks. Whether the new surface rhythm, face and terminal now meet the approved Retro character standard is the human visual gate. STOP here, no further integration or deployment.

Reproduce locally:

```powershell
node arcade/snake-next/retro-v5/build-art.mjs
node arcade/snake-next/retro-v5/build-v55-review.mjs
node arcade/snake-next/retro-v5/build-v55-review.mjs --baseline
playwright-cli -s=retrokit run-code --filename=arcade/snake-next/retro-v5/browser-v55-qa.js
node arcade/snake-next/retro-v5/build-v55-gallery.mjs
node --test arcade/snake-next/retro-v5/geometry.test.mjs arcade/snake-next/retro-v5/art.test.mjs
```
