# Mushroom Snake D.2 — real renderer proof

Local review: <http://127.0.0.1:8773/arcade/snake-next/d2-review.html>

Status: technical Forest proof complete; **Direction D visual-quality acceptance NOT claimed**. STOP for human review. No TEST/Production publication, Phase 3B, other biomes or public integration.

## Implemented

Isolated playable Canvas2D Forest on unchanged Snake Next state/step/rules/collision/input/camera. The only existing-runtime change is an optional renderer factory; its default remains DevRenderer. Length/speed/track controls configure valid existing foundation APIs. Keyboard/D-pad input takes ownership away from auto cycle. Positive/negative/portal are visual representations, not newly implemented mechanics.

Anatomy: one cardinal interpolated ContinuousBody path; conservative .68-cell cream contour with rounded corners; head/neck union; final three-cell taper (short-body cap40%); one pointed tip. Every part uses the same alpha and camera transform, with no separately rounded endpoints or body sprite under the head/tail. Outline command reduction removes only collinear points:1200-cell outline2399→<150 commands; all bends/taper points retained.

Material: stable accumulated authoritative travel, captured every simulation move, including moves without a render frame. Deterministic jitter/thinning in material coordinates; 48/96 bounded accent records for small/large LOD. Sparse mushrooms, not fixed-interval stamps. Head-side priority prevents long-body budget starvation. Small LOD excludes tiny flowers/markings; both LODs share geometry. Four world-NW-lit head variants fade their neck base into the cream surface.

Shadow: one low-opacity copy of the unified contour at(.045,.07)world offset, no blur/disc chain/separate interpolation. Forest: deterministic visual-only clusters, shared world-space tonal patches,48×192² bounded cached ground canvases, alpha-muted flat foliage; collider art maps only to immutable blocked cells and fits the physical cell footprint. Six restrained leaf ambient specks, no full VFX system.

Four independently generated proof-only ImageGen PNGs: heads, category objects (selected pointed asymmetrical Magical Seed/open positive/closed negative/rooted portal/rock/stump/root/fern), ground, accents. Prompts, native dimensions, source provenance and SHA256 are under `grib/mushroom-snake-d2-proof/{provenance,manifest}.json`. No D/D.1/legacy extraction. Atlas cell sampling is of these new assets only.

## Browser evidence

Playwright CLI / Edge.52/52 Node tests passed (foundation/presentation/production/D2). Browser raster assertions sample the **actual Canvas2D mask**: no centerline holes or filled pixels outside swept occupied-cell corridor in all four facings, straight/90°/tight one-cell U/S/parallel, length8/30/100/250/500/1200, growth8→9 and growth at a turn. Fractional alpha.125/.5/.875 captured for head→neck/taper→tail;12 live moving frames supplement paused fractional poses.

Viewports:1366×768 embedded/fullscreen;844×390 and915×412 mobile touch;DPR1/1.5/2. Pause/resume, keyboard, ≥44px D-pad, resize, scene switch, stop/reopen; one timer/RAF owner, both0 after stop; scene backing/ground/variants released. Normal/grayscale category captures. No application JS errors, failed game requests or unexpected game404s. Intentional injected head404 verified readable error, hidden canvas and zero clocks; this expected failure is separate from normal network acceptance.

Decode gate: main canvas hidden through all four image decodes, no placeholder substitute. Clean desktop sample: critical decode183.6ms; first draw7.9ms; ready197.3ms; repeat8.6ms and0 new asset requests. First-frame preparation is not included in warm render percentiles.

Captures: `C:/GitHub/rytni-assets/.playwright-cli/d2-proof/` (105 PNGs, local QA artifacts, not production assets). Key files: `stress-normal.png`, `stress-grayscale.png`, `mobile-844-dpr2.png`, `mobile-915-dpr2.png`, `desktop-fullscreen.png`, `growth-turn-head-a0.125.png`, `growth-turn-tail-a0.5.png`, `length-1200.png`, `moving-0.png`..`moving-11.png`, `loading.png`, `expected-decode-error.png`.

## Render timing

Real RAF,120 warmup+600 measured frames per length/case, existing60Hz timer simulation, exact requested length (QA food outside auto cycle; no growth drift). Canvas2D paint wall time, not simulation-only numbers or GPU completion time. CPU throttling restored to×1. Raw cases in `mushroom-snake-d2-measurements.json`.

| Length | Desktop p50 / p95 / max ms | Mobile DPR2 CPU×4 p50 / p95 / max ms |
|---|---|---|
|8|.2 / .3 / .5|.8 /1.1 /1.5|
|100|.2 / .3 / .5|.9 /1.3 /1.7|
|250|.2 / .4 / .5|1.2 /1.6 /2.1|
|500|.4 / .7 / .9|1.4 /1.9 /2.6|
|1200|.5 / .7 /1.1|1.7 /2.4 /3.0|

All final warm cases: >4/>8/>16.7ms counts0. Before path-command simplification,1200 mobile p954.1ms/max7.6ms/>4ms38; exact geometry command redundancy was demonstrated by a RED test (2399 commands). No gameplay fidelity or visual contour was reduced.

Cold ground preparation: desktop28 initial inserts .7–1.4ms total, individual insert≤.2ms. CPU×4 mobile27 initial inserts5.8–8.4ms total, individual insert≤1.2ms. These synchronous costs occur during first prepared paint; travel samples separately record cache insertion counts/costs. No claim of a universal no-spike guarantee outside the measured route/hardware.

## Raster memory

Owned inventory, retained downsampled ImageBitmaps only, no retained source HTMLImage references:

| Resource | MiB |
|---|---:|
|Decoded four atlases/material (1024²,1024×512,1024×683,1024²)|12.668|
|Four cached faded head variants|.563|
|Mobile stage backing max tested (915×412 DPR2)|3.340|
|Ground cache measured mobile max|5.625|
|Ground cache hard owned bound48×192²|6.750|
|Mobile measured resident maximum|22.195|
|Largest sequential source decode transient|6.003|

Duplicate retained resource identities0; repeated open asset requests0. Under56MiB preferred/64MiB hard **tracked raster** ceiling. Conservative duplicate CPU/GPU copies of worst owned bound (48chunks)+single decode transient ≈52.6MiB; browser HTTP/decoded-image caches, driver copies and GC reclamation are not directly observable and are not asserted as measured GPU memory. Temporary QA-only rasterProbe mask6MiB is released immediately and is not a live gameplay layer.

## Known deviations / review decision

The body is still more uniformly shaded and pipe-like than Direction D's rich living material; head detail is richer than body detail. Forest reads as a restrained ground/decor proof rather than the concept's premium environmental depth/compositions. Fine character personality animation and authored material richness are not proven by these captures. Readability/continuity/memory/timing PASS does **not** establish premium art-direction PASS. Human one-second category recognition, moving-character quality and physical-device feel remain unverified.

No renderer migration is authorized or made. Do not start Caves/Swamp/ranked/full VFX/Phase3B. Review this real frame before deciding a further scoped correction.

## Rulings made

- Retained approved existing rebuild checkout instead of a new worktree; weaker local isolation, exact staging protects unrelated work.
- Latest D.2 overrides old D.1 review-only/unselected food/80MiB text: selected Seed and56/64MiB.
- Ground bound48 rather than12; RED self-eviction test proved32 visible chunks; cost up to6.75MiB counted.
- Purpose-built new production atlases may be grid-sampled; not concept extraction. Alpha/pivots inspected; source provenance retained.
- Narrow optional DEV renderer factory preserves runtime ownership/default renderer; risk covered by opt-in and lifecycle tests.

Checkpoint commits: Task1 `0803491`, Task2 `ef889b2`, Task3 `751df51`; Task4 is the commit containing this report. Branch remains local `mushroom-snake-rebuild`; protected paths/manifests unchanged.
