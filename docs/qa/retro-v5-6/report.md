# V5.6 — head / tail micro polish

## Changes only

- **Head:** exact existing 42px alpha mask and stepped oval eye footprints. Darker iris/eye coverage, restrained reflection and a tiny clearer mouth. The existing mushroom footprint is repainted predominantly red rather than white/orange; only **3 bright cap pixels** remain. Ivory and moss are preserved, with no enlarged head or mushroom.
- **Terminal:** exact 68px mask. Lower-edge dark values become warmer/lighter toward the end; the upper rim loses its blade-like bright stripe. Same texture positions, foliage and palette; no new terminal illustration or contour. First **8 canonical pixel columns**, including the entrance, remain byte-identical to V5.5.
- **Body:** no changes at all. All **96 body/neck/corner PNGs** are byte-identical to V5.5; micro-texture contrast was not altered. Existing moss density and deterministic selector unchanged.
- **All 33 non-Snake PNGs** unchanged. Only 4 head and 32 terminal rasters changed; no renderer, arena, HUD, object, gameplay, simulation, frame, mobile-layout or manifest edits.

## Locked foundation

Cell **68**, body **36**, head **42**, terminal **68px**. Every original 0/255 alpha mask unchanged. Geometry SHA-256: `6a3fc44525bdc51368823a12dc5be1060cfc752ab258aedf4bbd1c38557abba5`.

Existing geometry/art regression: **13/13 PASS**. Actual art alpha and canonical connector regression at **DPR 1 / 1.5 / 2**, **256 legal pairs each**, with gaps/mismatch/overlap=**0**. No new benchmark or gameplay test suite.

## Required captures / review

Fresh-context runtime captures: **1920×1080 desktop**, **844×390 mobile landscape**. Existing CSS gameplay cell is 69.923px / 31px respectively; geometry and layout unchanged. Mobile head is therefore approximately 19px across, and the unchanged cap footprint approximately 8px wide. Captures are inspected at actual size, not a 300% art view.

Captured JS errors, console warnings/errors, request failures and HTTP failures/404: **0**. `capture-results.json` contains evidence. No loading workaround or runtime modification.

`review.html` places V5.5 → V5.6 actual mobile/desktop captures and native head/neck, terminal, straight8/30 comparisons side by side without shrink-to-fit. Native baselines are composed from original V5.5 Git sprites in identical geometry/material locations; full baselines are archived V5.5 captures.

Gallery check at an 844px viewport: all 12 images decoded and stayed at their natural dimensions. All 32 terminal variants preserve the first 8 canonical entrance columns with RGBA mismatch=0; 129 locked assets preserve their complete PNG hashes.

**Human visual approval remains pending.** The tail is still geometrically pointed by the locked mask; only its RGB highlight/shadow distribution is softened. No claim that connector PASS settles artistic acceptance. STOP after one local checkpoint. No push, integration, TEST or Production deployment. ImageGen operations: **0**.

Reproduce:

```powershell
node arcade/snake-next/retro-v5/build-art.mjs
node arcade/snake-next/retro-v5/build-v56-review.mjs
node arcade/snake-next/retro-v5/build-v56-review.mjs --baseline
playwright-cli -s=retrokit run-code --filename=arcade/snake-next/retro-v5/browser-v56-captures.js
node arcade/snake-next/retro-v5/build-v56-gallery.mjs
node --test arcade/snake-next/retro-v5/geometry.test.mjs arcade/snake-next/retro-v5/art.test.mjs
```
