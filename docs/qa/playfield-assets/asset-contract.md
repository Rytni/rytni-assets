# Authored effects delivery contract

Status: **awaiting artwork** for every entry below. This pass creates no replacement artwork. The rejected procedural pickup, LOD, VFX and fog painters remain frozen fallback placeholders, not production-approved visuals.

Canonical machine-readable definitions: `arcade/snake-next/effect-playground/asset-contract.js`. Delivery root: `grib/mushroom-snake-effects-v1/assets/`. All PNGs use RGBA transparency, native pixel art, no baked arena/background. No reference extraction. Human approval is recorded per exact key in `asset-approvals.js`; currently the approval map is empty. Pending URLs are never requested.

## Nine pickups

Names below are relative to `assets/effects/`.

| Effect / runtime kind | Field @1x | Field LOD | HUD | Optional idle sheet |
|---|---|---|---|---|
| Harvest / harvest | harvest-field.png | harvest-lod.png | harvest-hud.png | harvest-idle.png |
| Focus / focus | focus-field.png | focus-lod.png | focus-hud.png | focus-idle.png |
| Spores / spores | spores-field.png | spores-lod.png | spores-hud.png | spores-idle.png |
| Guard / guard | guard-field.png | guard-lod.png | guard-hud.png | guard-idle.png |
| Portal+ / portalPrize | portal-plus-field.png | portal-plus-lod.png | portal-plus-hud.png | portal-plus-idle.png |
| Rush / rush | rush-field.png | rush-lod.png | rush-hud.png | rush-idle.png |
| Corruption / weak | corruption-field.png | corruption-lod.png | corruption-hud.png | corruption-idle.png |
| Roots / brambles | roots-field.png | roots-lod.png | roots-hud.png | roots-idle.png |
| Mist / mist | mist-field.png | mist-lod.png | mist-hud.png | mist-idle.png |

Every row uses these exact dimensions and anchors:

| Role | Frame / complete PNG | Content rectangle x,y,w,h | Anchor x,y |
|---|---|---|---|
| field@1x | 64×64 | 4,4,56,56 | 32,32 |
| field-lod | 24×24 | 2,2,20,20 | 12,12 |
| hud | 32×32 | 2,2,28,28 | 16,16 |
| idle | four 64×64 frames; sheet 256×64 | 4,4,56,56 in each frame | 32,32 in each frame |

Keep ink within the content rectangle and a stable center anchor across all animation frames. Idle loops every 15 active ticks/frame (1 second total). Optional idle falls back to the authored static field sprite. HUD is a static PNG, fitted uniformly in the existing icon element; no HUD layout changes.

Field rules: desktop visual box 0.68 cell; mobile 0.94 cell. The maximum ink-axis footprint is box × 56/64, floored at 21 CSS px desktop / 19 CSS px mobile. Below 28 CSS px natural ink footprint, use the authored LOD. If LOD has not arrived, use the authored regular image uniformly, not a regenerated procedural replacement. All source and target aspect ratios match. Hitboxes/cells remain unchanged. Anchor/offset come from the contract, not inferred per frame.

Positive pickup silhouettes should be open/friendly/winged and distinct from food. Negative silhouettes should be hostile/spiked/toxic; do not give all nine the same silhouette. Final artistic choices require human review; this contract does not approve any visual.

## Food variants

Under `assets/food/`: `golden-field.png`, `corrupted-field.png` are 48×48 with content 2,2,44,44, anchor 24,24. `golden-lod.png`, `corrupted-lod.png` are 24×24 with content 2,2,20,20, anchor 12,12. Static. Uniform 0.70-cell visual box; minimum maximum ink-axis footprint 15 desktop / 14 mobile CSS px; LOD threshold 28px. Keep the compact mushroom silhouette. Existing red/gold food and rejected corruption recolor remain fallback until delivery. Scoring, replacement logic and one-food ownership are unchanged.

## Major VFX

Names below are relative to `assets/vfx/`. Horizontal sheets only, no gutters between frames. Content rectangle is the entire native frame; center anchor is frameWidth/2, frameHeight/2. Transparent padding is part of the frame and must be consistent throughout the sheet. `C` means rendered CSS cell size. Max-axis fitting is uniform, even for non-square sheets. Runtime may position, clip and alpha-fade; the main shape comes from PNGs, never procedural vector construction.

| PNG | Native frame | Frames / full sheet | Active ticks/frame | Playback | Runtime maximum-axis size |
|---|---|---|---|---|---|
| harvest-sparkle.png | 32×32 | 4 / 128×32 | 6 | loop | food orbit max(7, .16C); cap accent max(12, .30C); secondary burst max(5, .10–.16C) |
| harvest-third-burst.png | 64×64 | 6 / 384×64 | 3 | one-shot | max(24, .95C), centered on collected mushroom |
| focus-wisp.png | 32×32 | 4 / 128×32 | 10 | loop | max(12, .34C); 3 independently positioned sprites, phase offsets 0/10/20 ticks |
| spore-idle.png | 24×24 | 4 / 96×24 | 12 | loop | max(14, .32C); existing restrained translucent echo 1.45× |
| spore-trail.png | 32×16 | 4 / 128×16 | 5 | loop | max(5, .12C); 3 deterministic attraction-trail positions |
| spore-burst.png | 48×48 | 6 / 288×48 | 3 | one-shot | max(24, .95C) |
| guard-plate.png | 40×40 | 4 / 160×40 | 12 | loop | max(13, .34C), two sides of head |
| guard-charged.png | 48×48 | 4 / 192×48 | 8 | loop | max(24, .52C), one charged head shield |
| guard-break.png | 64×64 | 6 / 384×64 | 3 | one-shot | .96C, one centered break sheet |
| portal-charged-ring.png | 68×68 | 4 / 272×68 | 10 | loop | 1C, overlay existing portal ring |
| portal-body-trail.png | 32×32 | 4 / 128×32 | 6 | loop | max(10, .25C), first five traversing route points |
| rush-ember.png | 32×32 | 4 / 128×32 | 6 | loop | max(10, .30C), alternating route trail |
| rush-thorn.png | 32×32 | 4 / 128×32 | 10 | loop | max(10, .30C), alternating route trail |
| corruption-particle.png | 32×32 | 4 / 128×32 | 10 | loop | max(7, .16C) food orbit; max(14, .35C) acquisition |
| roots-crack.png | 68×68 | 4 / 272×68 | 9 | one-shot | .90C at warned cell |
| roots-sprout.png | 68×68 | 4 / 272×68 | 9 | one-shot | .85C at warned cell |
| roots-root.png | 68×68 | 4 / 272×68 | 15 | loop | .96C at active hazard cell |
| roots-decay.png | 68×68 | 6 / 408×68 | 3 | one-shot | .96C at decaying cell |
| mist-puff.png | 96×64 | 4 / 384×64 | 20 | loop | (3.1–3.9)C max axis; ratio 1.5:1 preserved |

One-shots use event/warning start ticks and clamp at the final frame; feedback ends under 350ms as before. Loop phases derive from active tick plus stable index offsets. Pause freezes tick/alpha. No Date.now, new RAF owner, random visual clock or blur. Fog retains deterministic edge/layer/index positions, density, and the 4.5-cell clear disk. Roots retain warning → activation → expiry mechanics. Small secondary particles and score glyphs remain permitted.

## Loading / acceptance

`AssetBank` caches one load/decode promise per approved key, validates full-sheet dimensions, records failures, and draws sheet subrectangles without per-frame generation. Invalid/unavailable art falls back; it is not silently accepted as production art. HUD refreshes when cache version changes. Unknown/pending keys trigger no HTTP request. The bank and rendering are read-only to canonical gameplay state.

Delivery checks before approval: declared dimensions, alpha padding/content box, consistent anchors, no clipped ink, aspect ratio, readable field/LOD/HUD, all idle and event frames, native desktop/mobile review. Real new artwork cannot be visually validated in this pass because it has not been provided. Routing/loader tests use in-memory metadata fixtures only; no synthetic replacement PNGs are created.
