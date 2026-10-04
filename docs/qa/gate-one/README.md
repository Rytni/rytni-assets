# Gate 1 — progressive tunnel / world awareness

Local DEV only. Foundation: `5bd0c0c`. Human gameplay approval is pending.

Playable: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html

Use Progressive run / Preset B / SMOOTH V4. Forest, Caves, Swamp and Late Game
buttons remain preview controls. The existing Expand world DEV command previews
the opening event. The optional world-awareness checkbox toggles bounds,
viewport and head point; it does not affect gameplay.

## Scope and behavior

- Core step, input acceptance/reversal rules, B, thresholds/world sizes, food
  reliability, effect definitions, scoring formulas and art/audio assets are
  unchanged. No pickup redesign or EatEvent work was included.
- `TunnelSession` replaces only the old DEV progressive portal orchestration.
  A normal core move shifts/grows the body once onto entry A; only the new head
  is mapped to B. Every older body cell remains unchanged. Occupancy covers
  both sides. Exit collisions use normal terrain/occupied-cell checks, including
  the normal non-growing retired-tail exception. No immunity or whole-body
  transfer is used.
- One canonical zero-distance history edge records move, A/B and cardinal
  directions. Exit facing is fixed for the opportunity; at opening both portals
  require three legal, unoccupied forward cells. Unsafe opportunities are not
  offered. Relative queued-turn intent is rotated into the exit's cardinal
  frame without clearing the queue. New inputs retain normal acceptance rules.
- At committed move M, the cut is at body distance `M - edge.move`. The older
  span uses virtual A and the newer span B. Shared Smooth V4 alpha samples them
  independently; there is never an A-to-B line. Growth retains this edge and
  naturally delays the terminal's passage. Completion/reward is emitted only
  after the full terminal has passed. Both rings remain visible through that
  passage even if the original entry window expires.
- Normal uninterrupted frames delegate to the locked renderer unchanged.
  Discontinuous frames reuse the locked V4 tube primitives, radius field,
  taper, leading cap, overlays and material tables with global body distance.
  The same split adapter protects V2 and GRID SNAP from drawing a world bridge
  during a tunnel; their ordinary comparison rendering is unchanged.
- Terrain rebuilds validate the entire unique/legal body, permitting only
  exact history-marked discontinuities. Static connectedness and food/hazard
  reachability safeguards remain in force.
- Directional look-ahead biases horizontal forward visibility; the short
  vertical viewport targets 7–8 cells and enforces 5 where world bounds permit.
  Camera easing uses canonical time; visibility rails and portal snaps prevent
  lag. Biome root/crystal/water borders fringe the actual blocked outer cells.
  Offscreen walls within nine cells have small environmental edge cues.
- Expansion is logically atomic as before, with a 60-active-tick (1 s) boundary
  retraction/reveal wave and МИР РАСШИРЕН banner while gameplay continues. No
  temporary collision mask or modal is introduced. Portal activity uses paired
  A/B labels, native pixel vortex/suction/burst/ripples, the existing portal SFX
  with an exit stereo pan, and existing buff cue for expansion. Mixer ownership
  is unchanged.

## Verification

52 targeted/regression tests passed:

```powershell
node --test arcade/snake-next/gate-one/gate.test.mjs arcade/snake-next/progressive-run/food.test.mjs arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/tuning-lab/lab.test.mjs arcade/snake-next/tuning-lab/design.test.mjs arcade/snake-next/forest-training/ribbon-live.test.mjs
```

Coverage includes lengths 8/30/250, approximately half-body occupancy on each
side, tail-last completion, every cardinal entry/exit combination, repeated
portals, growth, occupied/solid exit rejection, collision with pre/post-portal
body, exact pause/resume, death/result/restart cleanup, and renderer-independent
replay/hash parity. The corrected local validator passes BODY sections at
35–38 raster px (analytic width 36); no separate-branch overlap. Single-span
adapter raster/material is byte-identical to the original V4 proof for
straight/U/S. Locked source comparison uses `5bd0c0c`.

18 browser checks passed in fresh desktop 1920×1080/DPR 1 and mobile
844×390/DPR 2 contexts: real keyboard/D-pad input (44 px+ targets), live tunnel,
mode/hash parity, frozen pause/camera, resume, live expansion/settling, live
250-segment portal, restart and result cleanup. See `browser.json`.
Console errors: 0. Failed/HTTP-error requests: 0. Existing Canvas2D readback
optimization advisory only; no new runtime warning was introduced.

The supplemental live-250 check initially exposed scheduler-lag recovery in the
new split raster. It was corrected without touching V4 geometry/material: bins
now stay aligned to world-art pixels, reuse the existing bounded constant-radius
field cache, and avoid allocating a material subarray for each pixel. Final
live-250 desktop/mobile checks remain running through four committed moves
before the explicit QA pause. This was a targeted regression check, not a
performance benchmark or fun/balance claim.

Only three captures:

- `desktop-tunnel.png`: frozen live 30-segment split, pause panel hidden only
  for the diagnostic capture; canonical cells were not rearranged for the image.
- `desktop-expansion.png`: live one-second opening event.
- `mobile.png`: same live tunnel on 844×390, with original D-pad.

No TEST/Production manifest, release, public entry point or backend changes.
No publication. Stop for human review before Gate 2 pickup artwork/mechanics.
