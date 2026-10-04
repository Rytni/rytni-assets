# Unified Ribbon V4 — DIAGNOSTIC FAIL / HARD STOP

Standalone rendering proof only. No game imports this new renderer.
Simulation, B balance, canonical history/input/hash, food/effects, portal,
Forest visuals/HUD, V5.6 sources and legacy renderers are unchanged.
No ImageGen, benchmark, full regression or TEST/Production publication.

## Architecture attempted

- Canonical historical grid centers provide the entire head-to-tail path.
  Fixture interpolation advances one scalar start distance; all visual
  geometry samples the same path. No independent cell positions/clocks.
- Approved V2 rounded path calculation is read-only, with one negative-
  distance leading domain and one width profile from leading cap to tail.
  BODY 36 px; leading ellipse closes over 24 px forward / nominal 48 px
  front region; terminal taper is 0.9 cell / 61.2 px.
- One complete alpha mask is calculated before material. There is no old
  head sprite, socket, connector, neck atlas, tail sprite or cell owner in V4.
  Spatial bins are acceleration only. Exactly one final RGBA per mask pixel.
- Approved ivory palette and V5.6 micro-material samples are mapped using
  head-relative body distance and signed transverse coordinate, not atlas
  phase or grid-cell masks. Sparse variants remain non-periodic.
- Cardinal eyes/mouth/red mushroom overlays are clipped to final mask and
  cannot create silhouette pixels. No arbitrary runtime sprite rotation.
- No shadow added. Rendering is native 68 px/cell, nearest neighbour,
  with continuous scalar positional progress, no blur/CSS scale workaround.

## Observed hard failure

Targeted raster samples: eight fixtures × twelve alpha values = 96 frames.
All masks were one four-connected silhouette. There is no separate
head/body seam to measure; head and tail are domains of that single mask.
Straight transverse width is 36 px; sampled full-body sections across all
fixtures span 35–45 px (normal raster uncertainty applies).

FAIL: tight U and rapid alternating turns, alpha 2/11 = 0.181818:
straight-section normal at canonical d=2.213636, native position
(903.4727,306), intersects 45 opaque pixels. This is near the early leading
turn; the negative-distance cap extends the transverse silhouette into the
neighboring incoming limb. It is not claimed as a harmless projection or
excluded from the gate. Removing separate head geometry did not itself
guarantee constant-width visible contours.

Geometry changes STOPPED immediately after this result. No connector added,
no altered QA threshold, no further motion acceptance/regression/optimization.
Temporal material stability/full-cell flash absence is NOT certified.
Growth/length30 and other paths remain synthetic inspection fixtures, not
gameplay or integration evidence. Six-second review playback is diagnostic
only, and does not establish accepted smoothness or physical-device quality.

## Review

`http://127.0.0.1:8774/arcade/snake-next/smooth-v4-proof/review.html`

Explicit Play runs once for six seconds; no hidden loop reset. Pause freezes
presentation. Select: straight, up/down, U, S, alternating, growth, length30.
Captures are native with overflow scrolling, no shrink-to-fit.

- `straight.png`: native close-up on actual locked Forest V3 floor.
- `turn.png`, `U.png`, `S.png`: twelve native alpha frames.
- `comparison.png`: cell68 everywhere; actual V2, prior V3 static concept
  (not gameplay, its original flat background is intentionally preserved),
  then V4 on Forest floor. Character designs differ; their pixel scale does not.
- `geometry.json`: raw measured cross-sections and continuity results,
  INCLUDING the failures. No automatic visual approval.

The local Python server on port8773 returned empty responses. A separate
server was started on8774; the old process was not killed or changed.
Browser capture/targeted verification used the `playwright-cli` skill.

STOP for human review. This checkpoint is NOT a successful renderer proof.
