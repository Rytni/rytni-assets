# Production Effect Art Pass A.1 — DEV integration

Base: `8788006`. Human approved the reviewed forty pickup/food keys, with the
explicitly authorized Harvest LOD refinement. No future/missing VFX approved.

Playable DEV URL:
<http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=desktop-30>

Six captures and all five fixture links:
<http://127.0.0.1:8775/docs/qa/effects-production-art-a1/review.html>

## Changes

- Only delivery PNG changed: `effects/harvest-lod.png`. Wider symmetric crown,
  clear separation above a broad flatter cap; 24×24, 20×20 content, (12,12) anchor.
  Approved Harvest field/HUD/idle and all other 36 PNGs are byte-identical.
- Forty exact keys in `asset-approvals.js`: nine × four plus four food variants.
- Existing approval-gated AssetBank supplies FIELD/LOD/IDLE, food and HUD paths.
  Semantic zoom retains screen-space minima (desktop 21 px / mobile 19 px);
  uniform source/destination scaling preserves aspect ratio.
- Idle frame index uses canonical active tick / 15, modulo four. No new RAF,
  Date.now clock or gameplay state in the loader. Pause freezes; resume advances.
- Guard's existing active-shield fallback explicitly remains procedural; pickup
  approval does not accidentally replace that Pass B presentation.
- Five isolated DEV fixtures use existing canonical preview stages/world sizes.
  All nine pickups occupy unique legal cells, avoiding Snake, food, portals,
  obstacles and hazards. They start paused; Space resumes. NORMAL RUN clears
  fixture selection/Forest appearance override and restores natural spawning.
  Mobile fixtures select the existing touch presentation even on a desktop
  review browser; normal runs restore the hardware pointer mode. No D-pad
  handlers, layout, dimensions or style are changed.
- Forest comparison is a read-only world/stage rendering facade. The live
  session's biome, collision topology and mechanics are not changed.

## Targeted verification

```powershell
node --test arcade/snake-next/effect-playground/production-art.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs
python docs/qa/effects-production-art/authoring/validate.py
playwright-cli -s=forestqa --raw run-code --filename=docs/qa/effects-production-art-a1/browser-qa.js
```

13 Node tests pass: exact approval/file contract, one-time loading, rejected
VFX/bad dimensions, uniform LOD/source-sheet frames, tick frame selection,
legal fixture placement, 39 unchanged delivery PNGs, plus locked simulation,
timing, capacity, portal/tunnel, Smooth V4, mechanics and touch CSS invariants.
Asset dimensions/RGBA/content/anchors and independent LOD gate pass.

| Fixture | Cell CSS px | Pickup path | Minimum footprint |
|---|---:|---|---:|
| Desktop 30×12 | 60.171 | 64 px idle sheet | 35.802 px |
| Desktop 50×20 | 35.830 | 24 px LOD | 21.319 px |
| Mobile 30×12 | 24.998 | 24 px LOD | 20.561 px |
| Mobile 40×16 | 18.660 | 24 px LOD | 19 px |
| Mobile 50×20 | 14.886 | 24 px LOD | 19 px |

Browser: all nine production draws in every fixture; forty assets ready; zero
load/console/network errors; approved HUD 2+1 icons; golden/corrupted food PNGs;
pause tick stable, idle advances on resume; render and all three motion-mode
switches hash-stable; clean normal-run reset; live keyboard and D-pad input pass.
Mobile targets remain 48×48. Captures freeze canonical time and hide the pause
card; only those frozen screenshots reveal the normal-play D-pad. This does not
alter runtime pause or D-pad behavior.

No mechanics/duration/speed/scoring/world-size/expansion/cabinet/seam/Snake/
portal/D-pad/art changes beyond scope. No major VFX, benchmark, soak/replay
stress, TEST/Production deployment or publication.

STOP for human gameplay/art review.
