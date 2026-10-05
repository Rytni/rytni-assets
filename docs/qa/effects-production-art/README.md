# Production Effect Pickup Art Pass A — pending human review

Base checkpoint: `398ee52`. This is asset creation only. No live renderer,
gameplay, HUD, world fit, effect duration, approval flags or deployment changed.

Local review: <http://127.0.0.1:8775/docs/qa/effects-production-art/review.html>

## Delivery

40 RGBA PNGs: nine effect families × field/LOD/HUD/idle, plus golden/corrupted
food × field/LOD. See [inventory.md](inventory.md) for all exact filenames.
Delivery root: `grib/mushroom-snake-effects-v1/assets/`.

FIELD 64×64, LOD 24×24, HUD 32×32, IDLE 256×64 with four 64×64 frames.
Food FIELD 48×48, LOD 24×24. Contract dimensions/content boxes are unchanged.
Canvas anchors remain fixed at the contract centers. Local satellite, root-tip,
spore and mist-tail movement is intentionally at most one native pixel; it does
not translate the entire object or change the anchor.

Original masters were generated with built-in imagegen, then exported offline
with binary alpha, uniform contain-fit and limited palettes. Every LOD is a
separate native pixel drawing with no master image input. Prompt set and masters
are retained in `authoring/`. These tools are never imported by gameplay.

## Review evidence

- `review.html`: eleven previews per effect, transparency checkerboards,
  four-frame idle playback, native/4×, simulated desktop/mobile, actual Forest floor.
- `silhouettes.png`: nine white FIELD alpha masks on black.
- `grayscale.png`: native FIELD and LOD grayscale comparison.
- `mobile-lod.png` and `mobile-lod-grayscale.png`: unlabelled native mobile lineup.
- `validation.json`: file dimensions, content bounds, hashes, fixed anchors,
  independent LOD verification, animation changes and stationary core checks.
- `browser-validation.json`: isolated page structure/loading, idle playback/pause,
  desktop/mobile review checks, console and network results.

Runtime examples use the existing FIT WORLD V2 initial 30×12 world, measured
cell 60.170829 CSS px at desktop 1920×1080 and 24.998322 CSS px at mobile
844×390, with the existing pickup rules. Desktop visible ink is 34.52–35.80 px;
mobile LOD visible ink footprint is 19.83–20.56 px. Static lineup rounds the
footprint to the nearest raster pixel; the page preserves fractional CSS sizes.
This is a size simulation, not gameplay integration.

## Ambiguity assessment — not approval

- Focus / Portal+: diamond eye/pupil versus annulus with large empty hole.
- Harvest / Corruption: closest family resemblance, intentionally both mushrooms;
  upright crown/balanced gold cap versus broken cap/large crack/heavy spore.
- Spores / Mist: flower and exactly three detached satellites versus connected
  heavy ghostly masses and trailing tails.
- Guard / Roots: filled pointed shield versus open thorned root knot.

No identical broad silhouette found among these pairs in native/grayscale
inspection. Instant mobile recognition and production quality still require
human approval. All entries remain pending; **ART PASS is not claimed**.

## Targeted checks only

```powershell
python docs/qa/effects-production-art/authoring/validate.py
python docs/qa/effects-production-art/authoring/test_validate.py
playwright-cli -s=forestqa --raw run-code --filename=docs/qa/effects-production-art/authoring/browser-qa.js
```

Six validator tests: real delivery; wrong dimensions; opaque background; ink
outside content; duplicate idle frame; whole-sprite translation. No gameplay
regression, benchmark, soak/replay stress, Pass B VFX, or publication performed.

STOP for individual sprite human approval/rejection.
