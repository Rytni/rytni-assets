# Forest visual finalization V3 — STOP for human review

Composition baseline: `31efcd46d01a1aba10dff47e718304d08595fd2e`.

## Change boundary

- Six original 68×68 floor surfaces: two quiet bases, darker, lighter, patina, wear. Removed shared stepped horizontal bands. Top/left/bottom/right internal bevel uses 70% of the old edge-to-center RGB delta; outer seam pixels unchanged. Stable world-coordinate hash selection, patina/wear each 1% bucket. No runtime noise or animation.
- Three compact, fixed effect slots inside the existing area. Names/category icons, remaining seconds, progress, quiet empty slots. Mobile retains names beside icons; mobile seconds round up for readability only. Effect mechanics/ticks untouched.
- Pause/fullscreen bars/brackets thickened by one source pixel in original 32px UI art. Same CSS size/hitboxes.
- D-pad palette and inset finish only. Original alpha and 44px footprint preserved. Stronger held press shading; original input handlers unchanged.
- No ImageGen, new dependencies, renderer architecture edits, gameplay tuning, deployment or benchmark.

## Evidence

Only five review PNGs, shown at native CSS-pixel size in `review.html`.

- Desktop 1920×1080, 1366×768 and mobile 844×390: canonical layout and all stage/HUD/stat/effect/button/D-pad bounding boxes compared with captured V2 baseline. Same positions/sizes for all 0/1/2/2+1 effect states.
- Progress and countdown update when the same effect identity is retained. Three slots stay within the existing region; bitmap text fits. Pause/resume smoke passed at all three viewports.
- Real D-pad pointerdown/pointerup submits the correct command and clears pressed state. All mobile hitboxes remain 44×44.
- Fresh QA contexts: application JS errors 0; console warnings/errors 0; failed requests 0; HTTP ≥400/404 0.
- 47 existing foundation/presentation/connector/art/session regressions passed, including byte-identical inventory of all 165 approved assets and DPR 1/1.5/2 geometry checks. Four V3 surface/UI checks passed.
- QA composition is a frozen fixture (22-cell body, score 12400, combo ×3), not an earned gameplay session.
- Raw baseline and V3 measurements are retained in `baseline.json` and `measurements.json`.

## Repeat targeted QA

Serve this checkout at `http://127.0.0.1:8773`. From repository root:

```powershell
node --test arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js arcade/snake-next/retro-v5/geometry.test.mjs arcade/snake-next/retro-v5/art.test.mjs arcade/snake-next/forest-training/session.test.js arcade/snake-next/forest-training/final-v3.test.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/final-v3-qa.js
```

The asset generator is `build-final-v3.cjs` in `forest-training/`. The baseline capture script requires original V2 assets and refuses V3; do not overwrite approved baseline data.

## Protected state / review gate

V5.6 Snake, renderer geometry, arena topology, cabinet/frame, logo, object art/scale, simulation, effects/portal/scoring/audio, Fly/Hub/backend/ranked and channel manifests remain unchanged. TEST/Production were not published. No push.

STOP. Final `FOREST CABINET + ARENA + HUD = VISUAL LOCK` awaits explicit human visual approval.
