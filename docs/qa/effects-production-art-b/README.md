# Production Effect Art Pass B — DEV candidates

Base `9a99036`. Pickup/food art remains HUMAN LOCKED. VFX are **internal visual-gate candidates**, not final human approval or VFX ART LOCK.

Review: <http://127.0.0.1:8775/docs/qa/effects-production-art-b/review.html>

Playground: <http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=desktop-30>

Mobile: use the existing Mobile 30×12 / 40×16 / 50×20 fixture buttons. Select NORMAL RUN to leave the paused art fixture; Space resumes. Immediate nine effect buttons and CLEAR EFFECTS remain.

## Exact authored inventory

Delivery root: `grib/mushroom-snake-effects-v1/assets/vfx/`. RGBA horizontal sheets, transparent edges, no gutters, center anchor `(frameWidth/2, frameHeight/2)`. Existing machine-readable contract is byte-identical. See `inventory.json` for per-frame bounds, filenames and hashes.

| Exact PNG filename | Frame | Frames | Sheet |
|---|---:|---:|---:|
| harvest-sparkle.png | 32×32 | 4 | 128×32 |
| harvest-third-burst.png | 64×64 | 6 | 384×64 |
| focus-wisp.png | 32×32 | 4 | 128×32 |
| spore-idle.png | 24×24 | 4 | 96×24 |
| spore-trail.png | 32×16 | 4 | 128×16 |
| spore-burst.png | 48×48 | 6 | 288×48 |
| guard-plate.png | 40×40 | 4 | 160×40 |
| guard-charged.png | 48×48 | 4 | 192×48 |
| guard-break.png | 64×64 | 6 | 384×64 |
| portal-charged-ring.png | 68×68 | 4 | 272×68 |
| portal-body-trail.png | 32×32 | 4 | 128×32 |
| rush-ember.png | 32×32 | 4 | 128×32 |
| rush-thorn.png | 32×32 | 4 | 128×32 |
| corruption-particle.png | 32×32 | 4 | 128×32 |
| roots-crack.png | 68×68 | 4 | 272×68 |
| roots-sprout.png | 68×68 | 4 | 272×68 |
| roots-root.png | 68×68 | 4 | 272×68 |
| roots-decay.png | 68×68 | 6 | 408×68 |
| mist-puff.png | 96×64 | 4 | 384×64 |

19 sheets / 84 native frames. Offline integer polygon/cluster raster authoring in `author.py`; no ImageGen, noise, gradient, antialiasing or reference extraction. The author only exports VFX, not locked production pickups.

## Internal visual gate and integration

Native sheets inspected before enabling DEV. Combined scenes then inspected at 60px desktop / 25px mobile cells. Final combined previews call the **same live VFX painter and sizing** rather than enlarging effects for an art gallery. The review page shows all nine scenes, each with desktop and 844×390 mobile canvases, plus every sheet at native / ×4 / animated / field-use sizes. Collection dropdown also demonstrates ordinary red food and max-combo presentation.

Focus: exactly three crystal/leaf/flame wisps in asymmetric front-body positions; not a circular orbit. Cyan HUD pulse. Spore: bright mint/ivory seed with cyan petals, authored curved trail and six-frame fragments. Guard: filled moss/gold plates and leaf core, displaced behind/to sides of the face. Portal: broken rune rails/crystal marks and five route-point motes, not a recolored portal. Rush: alternating flame/fang silhouettes. Corruption: fungal flakes, approved food, reduced-reward glyph and front flicker. Roots: warning cracks → sprout → existing hazard → drying fragments. Mist: stepped irregular lobes from all four edges, original density and 4.5-cell head-clear disk, goals redrawn for readability.

Every effect changes at least world/food/Snake presentation **and** its existing HUD slot. No major shape is built from new runtime primitives. Procedural fallbacks remain, and default AssetBank still refuses VFX. Only isolated DEV adapters explicitly admit the exact 19 `DEV_VFX_CANDIDATES`; `APPROVED_ASSETS` stays at 40 human-approved pickup/food keys. Future/missing assets are not automatically admitted.

Ordinary food uses unchanged red mushroom art: 5-tick squash, 18-tick authored fungal burst, score glyph under 350ms. A bounded 3.5% post-raster normal squash affects only the front cap for 18 ticks, draws one final unified image and leaves original V4 field/mask/material code unchanged. No separate geometry/head/connector. Unchanged existing pickup/combo SFX and combo pitch rise are reused. No new music, clock, mixer or gameplay pause. Combo burst/glyph strength and brief existing MAX COMBO/HUD pulse are presentation only.

## Targeted verification

```powershell
python docs/qa/effects-production-art-b/validate.py
node --test arcade/snake-next/effect-playground/production-vfx.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/production-art.test.mjs arcade/snake-next/effect-playground/effects.test.mjs
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b/art-gate.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b/browser-qa.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b/portal-qa.js
```

28 tests PASS. 19 sheet dimensions / RGBA / stable contract anchors / transparent edges / limited palettes PASS; all 40 locked pickup/food PNGs unchanged. Frame cadence tested at 60/90/120/144Hz sample schedules. Mechanics, speed/capacity, input, portal/tunnel, V4 geometry, world sizes, cabinet and D-pad source invariants unchanged.

Live checks: desktop 30×12, mobile 30×12 and mobile 50×20; nine effects draw exact PNG keys; 59 ready / zero loading errors; pixel-identical final effect raster on pause, expiry, clean restart, render/mode hash parity, keyboard/touch input pass. Mobile targets remain 48×48. One-shot fixtures exercise all four event sheets and the actual cap reaction. Zero console/network failures. Captures hide the pause card and reveal unchanged touch controls only while taking frozen diagnostics; no runtime pause/input change.

Actual tunnel witness: 1 transfer, 1 reward, 9 split route frames, both authored portal ring/body-trail keys drawn; render hash unchanged at all 12 sampled steps. `browser.json` and `portal.json` hold results.

The standalone review page has one shared scrubbable preview clock, never imported into gameplay. Live VFX inherit canonical active ticks / interpolation freeze; no independent timers/RAF or random clock. No benchmark, soak, TEST/Production publication or backend changes.

STOP for human visual + gameplay review. No final VFX ART LOCK claimed.
