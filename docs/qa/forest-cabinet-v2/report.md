# Cabinet / arena visual match V2

Baseline `cdf1a30`. Local presentation-only checkpoint; not a visual approval claim.

## Changes

- Embedded `#game` no longer reserves 16:9 height. One width-driven cabinet formula computes its CSS height; page flow begins immediately below. Fullscreen uses the same complete cabinet at uniform aspect-fit with letterbox outside. Geometry retains square cells and unchanged 26×10 playable interior.
- Existing outer-frame assets uniformly scaled up: desktop scale up to 1.35 (previous 1), mobile nominal .42 (previous .32). Corners scale uniformly; rails scale only along their long axis. No second inner frame, new props or stone perimeter.
- New independently authored pixel module asset with wood rails, brass inner bevel, gold corner hardware and a near-black emerald inset. Score, length, combo, effects and square actions form physical modules on the common cabinet top rail. No thin table-divider system.
- Live bitmap text reads the existing DOM labels/values/timers; DOM/state logic remains intact and accessible. Reuses original 5×7 bitmap glyph utility, with independently authored missing Cyrillic glyphs. No font dependency/install or baked text. Labels/values render at integer pixel sizes: desktop1920 21/35px glyph height; desktop1366 14/28px; mobile 14/21px. Effect timer: desktop28px, mobile21px. Original pause/fullscreen pixel icons on square cabinet buttons.
- Eight original 68×68 static emerald tiles: restrained seams, raised pixel bevel, broad center value variation, authored small marks, coordinate-stable light/dark variants and rare patina/wear (1% each). No realtime texture/noise/fading/grass/random props.
- Only runtime object scales adjusted: stone .83→.94 cell; portal1.1→1.25; positive/negative .98→1.06. Seed remains .8. Logic, hitboxes, categories and original sprites unchanged.

Assets are reproducible with `node arcade/snake-next/forest-training/build-cabinet-v2.cjs`. No TARGET image inputs or pixel extraction/sampling. Existing V5.6 inventory (165 assets), Snake renderer, masks and connectors unchanged.

## Actual geometry, CSS px

| Viewport / mode | Stage | Cabinet | HUD | Arena | Embedded reserve below cabinet |
|---|---|---|---|---|---|
| 1920×1080 embedded | 1881.6×919.5 | 1882×919.6 | 1882×128 | 1728.1×664.7 | −0.007 (rounding, ≈0) |
| 1366×768 embedded | 1338.7×661.4 | 1338.3×661 | 1338.3×95.9 | 1223.8×470.7 | 0.36 (rounding, ≈0) |
| 1366×768 fullscreen | 1366×768 | 1366×672.8 | 1366×96 | 1249.2×480.5 | n/a; outside letterbox47.6 top/bottom |
| 844×390 mobile | 844×390 | 827.7×390 | 827.7×51 | 780.7×300.3 | 0 |

Compared with baseline, embedded reserved blank band is removed (1366:122.8px→0.36px; 1920:175.8px→≈0). Desktop square cells remain ~66.47px /47.07px; mobile ~30.03px. Frame/HUD gain depth while desktop arena cell size drops only ~2.2–2.4%. Browser subpixel and backing-store rounding is below1px. Normal website space below a shrink-wrapped stage is not component letterbox.

Locked topology remains26×10 interior; it is not the TARGET's taller board. Cabinet natural aspect stays~2.05/2.02, rather than forcing16:9 through empty space or altered topology. No assertion of pixel-identical TARGET match.

## Targeted verification

Playwright CLI: fresh contexts,1920/1366 embedded,844 mobile, parent grid height1600, real page flow below, resize canonical body unchanged, fullscreen enter/exit, short actual Training pause/resume and touch D-pad. Mobile square HUD actions44×≥44 and D-pad44×44. Legal2positive+1negative HUD stack fits the rail. A portrait resize safety smoke preserves the existing paused prompt and keeps HUD modules within the stage (no extra review image). Measurements wait for renderer dimensions to match current DOM dimensions (no stale-resize proof).

Application JS errors0, console warnings0, failed requests0, HTTP≥400/404 zero. Existing47 regression tests PASS (foundation, presentation, V5 art/geometry/connectors at DPR1/1.5/2, Forest session). No long benchmark, soak or broad gameplay QA.

Exactly6 review PNGs. Comparison panes have identical1920×1080 /1366×768 displayed dimensions; TARGET is displayed whole, scaled only for review. AFTER and own HUD/floor crops stay native runtime scale. Native gallery uses horizontal scrolling, not shrink-to-fit.

DEV: http://127.0.0.1:8773/arcade/snake-next/forest-training.html

Gallery: http://127.0.0.1:8773/docs/qa/forest-cabinet-v2/review.html

V5.6 assets/geometry, core simulation/topology, Training mechanics/FSM/speed/food/effects/scoring/audio, Fly/Hub/legacy/backend/ranked, and TEST/Production manifests untouched. No deployment/push. One local checkpoint; STOP for human visual review.
