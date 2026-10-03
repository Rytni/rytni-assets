# Forest — pickup visual language + red mushroom food

Approved composition baseline: `764e180b62737783ffdbe3a4118e6daf5b362779`.

## Root cause / correction

Forest's gameplay sprite helper forced every asset into a square destination. Positive source was **88×54**, aspect **1.6296**, but was displayed as **1:1**. Old seed was **44×64**, aspect **0.6875**, also displayed as **1:1**. Source alpha bounds were tight: wrong transparent padding/source bounds were not the cause.

All gameplay categories now use centered contain fitting: one uniform scale, explicit per-object `visualScale`, anchor `(0.5,0.5)`, offset `(0,0)`. Destination X/Y positions are rounded; destination width/height are not independently rounded, avoiding mobile aspect distortion. Nearest-neighbor sampling remains enabled. The scales below deliberately keep sprite envelopes within one owned cell, with different category sizes. Collision cells/hitboxes unchanged. Existing positive, negative, stone and portal artwork remains byte-identical. HUD images already used `object-fit:contain`; HUD is unchanged.

## Object dimensions

Rendered dimensions are CSS px, rounded here only for reporting. Real canvas draws retain the full-precision single scale. Desktop cell **66.4654 px**, mobile cell **30.0287 px**. Raw evidence also contains 1366×768 (cell **47.0706 px**).

| Object | Intrinsic / tight alpha bounds | Aspect | `visualScale` | 1920×1080 rendered | 844×390 rendered |
|---|---:|---:|---:|---:|---:|
| Red mushroom | 48×43 | 1.1163 | 0.70 | 46.526×41.679 | 21.020×18.830 |
| Golden mushroom | 48×43 | 1.1163 | 0.70 | 46.526×41.679 | 21.020×18.830 |
| Positive — Focus / Harvest | 88×54 | 1.6296 | 0.96 | 63.807×39.154 | 28.828×17.690 |
| Negative — Rush | 72×72 | 1.0000 | 0.86 | 57.160×57.160 | 25.825×25.825 |
| Stone | 64×64 | 1.0000 | 0.94 | 62.477×62.477 | 28.227×28.227 |
| Portal | 128×128 | 1.0000 | 1.00 | 66.465×66.465 | 30.029×30.029 |

Harvest's existing ×2 pickup badge remains. Positive artwork was not replaced: fixing destination aspect restores the authored open/winged silhouette. Negative retains spiked silhouette, stone solid square mass, portal round ring. Portal and negative scale reductions are presentation-only contain corrections, not FSM/collision edits.

## Food / animation

- Original manually authored compact red-cap/light-spotted pixel mushroom with warm ivory stem, no ImageGen/reference extraction. Golden variant has the exact same alpha mask and dimensions.
- Food's max extent is 70% of one cell. No glow or pulsing scale. Slow idle bob period ≈6.98s, ≤2px desktop / ≤1px mobile; follows the existing active tick and freezes on pause.
- Existing Harvest scoring semantics confirmed: award ×2. Only the food image changes to gold while Harvest is active; expiration returns red. Existing scoring/spawn/speed mechanics unchanged.
- Original `food-pop` atlas: 192×48, four 48×48 frames, six small spores, brief pixel cap pop. Animation lasts 180ms; score popup uses the actual award and disappears by 300ms. No following particles.
- Internal `food`, `seed` event and SFX identifiers are intentionally retained. Only player-facing references say mushroom now; menu layout unchanged.
- Three new images decode before DEV Training becomes visible; cached load promise prevents duplicate initialization. New decoded raster: 53,376 bytes, not a benchmark.

## Targeted QA

- **34/34 PASS**: object dimensions/alpha/aspect, DPR 1/1.5/2 uniform scale, mushroom idle/pop, Harvest award ×2, atomic growth/spawn, existing effects/portal/session regressions, V5.6 inventory/connectors and V3 floor/UI tests.
- Fresh public-local browser contexts via Playwright CLI: 1920×1080, 1366×768, 844×390. Actual canvas calls instrumented: `scaleX == scaleY` for every game object. Render calls do not mutate Session hash.
- Layout and all stage/HUD/stat/effect/button/D-pad bounding boxes exactly equal V3 baseline. Floor, cabinet, Snake, HUD, arena topology and mechanics untouched.
- Real Training start → first mushroom pickup: foods 1, length 8→9, score 100, one replacement food cell; pause/resume passed. Mobile D-pad input and ≥44px hitboxes passed.
- Application JS errors **0**, console warnings/errors **0**, failed network requests **0**, HTTP ≥400 / asset 404 **0** in the new QA contexts.
- Exactly six review images. Gameplay compositions are explicit frozen QA fixtures (length22 / score12400 / combo×3), not an earned session. Native mushroom and lineup samples use the same production `drawObject` helper, with separate desktop/mobile native scales and no zoom.

Raw evidence: `measurements.json`. Gallery: `review.html`.

```powershell
node --test arcade/snake-next/forest-training/objects.test.mjs arcade/snake-next/forest-training/session.test.js arcade/snake-next/retro-v5/geometry.test.mjs arcade/snake-next/retro-v5/art.test.mjs arcade/snake-next/forest-training/final-v3.test.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/objects-qa.js
```

No benchmark, TEST/Production deployment or push. One local checkpoint; STOP for human visual review.
