# Green Forest visual reset — local checkpoint

Status: technical checkpoint, **not final visual acceptance or a publishable release**. No TEST/Production publication. Existing art is retained. The default assembler deliberately rejects release builds until visual approval; the preview alone uses `allowIncomplete`.

## Scope

- Preserved cardinal simulation, turn queue/reversal guard, fixed timestep, ring buffer, interpolation, input and fullscreen/orientation lifecycle. Fly and Hub source are unchanged.
- Forest-only opt-in world profile: irregular isolated obstacles with two-cell clearance, five art families, one nearby food, no timed bonuses. Legacy core behavior remains available outside this profile.
- Camera scale: `max(canvasHeight / 12, canvasWidth / 30)` CSS pixels per simulation cell. At the tested sizes: embedded 50.42, desktop fullscreen 86, mobile landscape 31.33. Resizing changes presentation, not cell coordinates or physics.
- Character uses cardinal head/tail, straight variants and neighbor-selected elbows. Interior junctions stay on logical cells; endpoints interpolate. No painted body strip. Atlas alpha bounds and port registration are computed once.
- Ground/decor are cached by visible chunk. Obstacles occupy their existing grid cells. HUD is one wood plaque; frame uses fixed nine-slice corners outside the canvas.

## Reproduce locally

From the repository root, with Node and the existing sibling source checkout:

```powershell
node arcade/preview-snake.cjs
```

Open `http://127.0.0.1:8825/?arcade_preview=1`, choose Snake, then training. `RYTNI_SOURCE_ROOT` can override the sibling site directory. Add `snake_geometry=1` for the geometry preview.

```powershell
node arcade/test-snake-core.cjs
node arcade/test-snake-forest.cjs
playwright-cli -s=forest open http://127.0.0.1:8825/?arcade_preview=1 --browser=msedge
playwright-cli --raw -s=forest run-code --filename=C:/GitHub/rytni-assets/arcade/qa-forest-slice.js
playwright-cli --raw -s=forest run-code --filename=C:/GitHub/rytni-assets/arcade/qa-forest-character.js
playwright-cli --raw -s=forest run-code --filename=C:/GitHub/rytni-assets/arcade/qa-forest-presentation.js
```

QA scripts currently use this machine's absolute screenshot directory: `C:/Users/rytni/.codex/visualizations/snake-reset/`. They are local diagnostics, not a deployment pipeline. Geometry/lifecycle scripts retain the pre-art checkpoints.

## Verification — 2026-09-20

- Core and forest unit tests pass: deterministic replay at 30/60/144 FPS, cardinal topology, fixed elbow registration, one food/no bonuses, bounded 25 simulation chunks. All five obstacle families reject entry from four directions.
- Edge through Playwright CLI: embedded 1366×768; fullscreen 1920×1080; touch/mobile 915×412 with DPR 2 (render cap 1.5); pause/resume; keyboard and D-pad queue input; resize; portrait 412×915; landscape return; fullscreen exit safe pause. No observed page/console errors, failed requests or HTTP errors in the local flow.
- Density screenshots: `density-after-desktop-early.png`, `density-after-desktop-long-250.png`, `density-after-fullscreen.png`, `density-after-mobile.png`, and `density-after-boundary-{0,16,32,48}.png`. Earlier character/lifecycle screenshots remain available.
- Warm-cache synchronous renderer p95 before/after for 100/250/500/1200 segments: `0.4/0.4/0.4/0.6 ms` → `0.3/0.3/0.5/0.5 ms`; four render chunks, 25 simulation chunks. These are 120-call browser microbenchmarks, **not device FPS, GPU/compositing cost or sustained gameplay performance**. Screenshots/performance use deterministic frozen fixtures; interactive lifecycle/input paths are tested separately.
- Presentation screenshots cover straight, all four elbow geometries in one path, U/S paths, length 100/250, fullscreen, mobile landscape, and camera positions 0/16/32/48: `presentation-*.png`. No duplicated head, open joint, wrong tail, console error, failed request or HTTP error was observed.
- Presentation-pass p95 for 100/250/500/1200 segments is `0.5/0.4/0.5/0.7 ms`, versus its density-pass baseline `0.3/0.3/0.5/0.5 ms`. The largest measured change is 0.2 ms; static composition remains chunk-cached and the Snake shadow emits canvas segments only inside the visible region.

## Art provenance and prompt specifications

Seven new candidate PNGs reside in `grib/mushroom-snake-v2/`. Built-in image generation was used, not CLI/API fallback. They were copied without raster editing from generated outputs; concepts were style references only, never extracted. Atlas slicing is runtime access to newly generated art.

Below are condensed prompt specifications, not verbatim generation transcripts. Common direction: premium top-down pixel art, cream/olive/moss palette, consistent lighting, no labels/watermarks; real transparent backgrounds for isolated sprites/UI.

| Saved asset | Prompt specification | Generated source ID |
| --- | --- | --- |
| `forest-snake-atlas-v1.png` | Transparent 4×4 atlas: four normal fantasy-snake heads up/right/down/left, horizontal/vertical body variants, four elbows, four tails. Cream scales, moss, tiny red mushrooms; solid living body, no holes or extra heads. | `ac60c367-7478-4404-b690-62e4e901a60b` |
| `forest-ground-v1.png` | Seamless calm dark grass/moss/soil texture; low-contrast olive leaf detail, 128-pixel logical scale; no objects, paths, borders or crystals. | `afa70d6d-7356-4970-8838-31056fa0c48f` |
| `forest-decor-v1.png` | Four isolated decorations in one row: purple flowers, cream mushroom pair, fern/brown leaves, rare cyan plant; muted palette, crisp 32-pixel logical detail, no scenery or halo. | `dd052e17-7b28-406f-a74e-46df3e052499` |
| `forest-objects-v1.png` | Transparent 3×2 atlas: mossy rock, stump, bush, large red mushroom, root knot, golden food spore. Compact one-cell footprints, 64-pixel logical detail; no floor/checkerboard. | `ded7eda0-cfd5-47fa-9c35-05dd721b84a9` |
| `forest-food-spore-v1.png` | One transparent enchanted forest spore-seed: cream pod, warm amber core, moss-green leaflets, compact top-down silhouette; no sparkles, gem facets, scenery or baked shadow. | `67a1800d-8b1a-4a10-92fa-45ee723d4a82` |
| `forest-frame-v1.png` | Square nine-slice walnut/gold frame; moss/leaves at four corners, two tiny mushrooms; corners about 18%, rail about 7%, transparent center; no scene or text. | `47b149f0-f0fb-46d6-8a63-bb161f842624` |
| `forest-hud-v1.png` | Blank 3:1 walnut plaque, quiet dark face for HTML ivory numbers, gold inlay and two moss corners, 96×32 logical detail, nine-slice; no labels/icons. | `47b51032-c280-4178-98a8-14ef9d6c7261` |

Generated originals: `C:/Users/rytni/.codex/generated_images/01a08321-eab4-7933-939d-19e5a820a209/exec-<ID>.png`. Rejected hollow-body and baked-checkerboard candidates were not integrated. Actual alpha was inspected; colored RGB under alpha zero is not an opaque background.

## Remaining acceptance work

- The density/presentation passes add seam-safe macro ground zones, clustered decor, rare cached fireflies, obstacle micro-compositions/contact shadows, a dynamic reading zone, tapered segment profiles, and one dedicated main-food sprite. Final visual approval still gates release assembly.
- Grid collision tests prove occupied-cell behavior, not pixel-exact silhouette collision. Art fits one cell; transparent corners are not separately collidable geometry.
- Menus/help retain legacy content outside this gameplay-focused pass; old bonus explanations do not describe the forest-only slice. Review before eventual release without adding features.
- Mobile checks are emulation only; physical mobile browser, sustained frame pacing and cold-start memory/loading acceptance remain unverified.
- No remote release QA was performed or authorized. Do not remove the build guard or publish either channel as part of this checkpoint.
