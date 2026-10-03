# V5.4 — manual Snake-art candidate

V5.3 is not visually approved. Its existing material reference was observed only as art direction; no reference pixels were cropped, extracted, traced or sampled. **ImageGen operations in this pass: 0.**

## What changed

132 independently painted Snake sprite variants replace the rejected surface, within exactly the same masks and existing asset keys. All anatomy shares one finite ivory/cream palette, bright top-facing pixel bands, visible warm beige underside and a 2px contact edge. Authored highlight interruptions and small stepped material clusters replace the near-solid center. No gradients, blur, antialiasing, runtime outline, stroke or noise.

Authored motif library: single leaf, two-leaf cluster, short moss strip and wrapping patch. Measured examples: straight leaf **13×9 / 75 green pixels**, moss strip **14×8 / 72 pixels**, corner strip **10×10 / 70 pixels**. Islands use the existing material coordinate convention; a corner motif is placed on the broad bending surface rather than compressed at the inner radius. No fixed every-N cadence. Existing deterministic art selector remains unchanged: approximately **19.86%** accented body cells over 8000 stable ids (about 20%), plus the intentionally stronger head/neck identity.

Head: original 42px mask, stronger 9×9 eye regions, readable mouth and one **17×10px red cap** with a short pale stem. Head and neck share a wrap patch across their joint; another smaller neck island carries the head's material into the body. Tail retains the same band palette, short terminal geometry and optional leaf before taper.

Existing asset-library compatibility retained: 8 visual variants for each straight/corner/neck/terminal orientation, plus four head orientations. The unchanged renderer still uses neck variant0; other neck variants are available artwork, not a new selection mechanism. No renderer edit was made to choose variants differently.

## Geometry and protected scope

- Cell **68px**, body **36px**, head **42px**, complete terminal **68px**.
- Geometry SHA-256 `6a3fc44525bdc51368823a12dc5be1060cfc752ab258aedf4bbd1c38557abba5` unchanged.
- Every sprite's alpha remains exactly its original 0/255 mask. No thickness, connector or contour changes.
- All **33 non-Snake raster assets** byte-identical to the approved foundation.
- Geometry, simulation, renderer, runtime, arena, HUD, frame, objects, VFX, mobile layout, Fly, Hub, backend and channel manifests untouched. No TEST/Production publication or push.

## QA

**20/20 tests PASS**, including all previous geometry/art tests, protected-resource byte comparison, common palette and mobile head-pixel checks. A mobile pixel-count test is evidence that features survive downsampling, not proof of human recognition.

Actual PNG alpha connector audit at **DPR 1 / 1.5 / 2**: **256 legal pairs each; gaps=0, connector mismatch=0, overlap=0, disconnected pairs=0**. Existing 2px raster-corner tolerance remains unchanged.

Fresh browser contexts captured:

| Viewport | Existing CSS gameplay cell |
| --- | ---: |
| 1920×1080 | 69.923px |
| 1366×768 | 48.769px |
| 844×390 mobile landscape | 31px |
| 915×412 mobile landscape | 33.731px |

Mobile captures were inspected at actual size, not just magnified anatomy. Cap/eyes, lower band and green islands survive; tiny internal marks intentionally recede. Desktop and mobile grayscale captures are included. Grayscale is a screenshot-only diagnostic, not a runtime change. **JS errors=0, warnings/errors=0, failed requests=0, HTTP failures/404=0** in the clean QA contexts. No performance benchmark or gameplay integration work.

## Human review gate

`review.html`: V5.3 → V5.4 head/neck and body; straight8/30; four corners and connected bend; U; S; terminal; variant catalog; all four runtime sizes; grayscale; explicitly labeled 300% nearest-neighbor head/neck close-up. Native images are never shrink-to-fit. Baseline anatomy is composed from original V5.3 Git sprites with the same geometry/material locations; baseline full compositions are archived V5.3 captures.

**Technical PASS only. Human artistic acceptance is pending.** The contour remains deliberately smooth because geometry is locked. Whether the stronger internal artwork now sufficiently removes the cream-tube impression and meets the reference richness is the review decision, not inferred from connector tests. STOP here.

Reproduce locally:

```powershell
node arcade/snake-next/retro-v5/build-art.mjs
node arcade/snake-next/retro-v5/build-v54-review.mjs
node arcade/snake-next/retro-v5/build-v54-review.mjs --baseline
playwright-cli -s=retrokit run-code --filename=arcade/snake-next/retro-v5/browser-v54-qa.js
node arcade/snake-next/retro-v5/build-v54-gallery.mjs
node --test arcade/snake-next/retro-v5/geometry.test.mjs arcade/snake-next/retro-v5/art.test.mjs arcade/snake-next/retro-v5/v53-art.test.mjs arcade/snake-next/retro-v5/v54-art.test.mjs
```
