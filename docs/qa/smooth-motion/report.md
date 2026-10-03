# Smooth Motion — review checkpoint

Playable DEV: http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html

Human-selected B is the balance baseline. Click B, steer with arrows/WASD or the
existing mobile D-pad, and switch `SMOOTH ON / GRID SNAP` without restarting the
session. The toggle exists only in the external DEV lab toolbar. Normal isolated
Forest DEV Training also uses the presentation layer, with its existing balance;
no public entry or release was changed. GAME FEEL LOCK remains unset.

## Presentation architecture

The old Forest path sent only current occupied cells to the sprite renderer.
It therefore remained still for the entire 14-tick B cadence, then snapped.

`SnakeMotion` owns read-only previous/current canonical body snapshots, captured
after each fixed simulation tick. Movement brackets retain the previous tail
cell, plus the last two retired canonical cells as terminal bend context. Those
retired cells are **not** collision occupancy or a predicted future head path.

Alpha is shared by all parts: `(movePhase + accumulatorFraction) / cadence`.
The fraction comes from the existing fixed clock debt/last-tick timestamp. Alpha
is monotonic within a bracket, including a Focus cadence change. The existing
fixed timer and input queue are unchanged; RAF only reads presentation state.

Path start is `1 - alpha`; span is
`previousLength - 1 + (currentLength - previousLength) * alpha`. Sampling is
piecewise cardinal, not a direct old/new segment lerp. Growth increases the span
while holding the terminal endpoint. Head coordinates and face stay on the
exact sampled orthogonal path; there is no separate head, body or tail clock.

`SmoothSprites` samples the existing V5.6 sprite pixels. Interior straight/corner
tiles keep their authored shapes and grid ownership. Moving endpoint regions
share one path-distance parameterization: the face is rigid at the head sample;
terminal pixels follow the same tube through authored quarter bends. Each output
pixel has one tile owner and head pixel priority, so body cannot paint over the
face. No new artwork, strokes, generated textures, blur, or outline system.
Nearest-neighbor rendering and shared rounded tile edges are retained.

The two retired cells preserve the terminal's outgoing tangent when its short
taper crosses a turn at a bracket boundary. Initial/restart/portal resets use
straight terminal context from the canonical tail tangent; no stale world path
survives a transfer. Source sprite readbacks/UV maps warm during asset loading,
before the active fixed clock, and readback buffers are released on disposal.

Pause freezes alpha before clock cleanup. Resume keeps that exact phase as a
floor while the accumulator restarts; it cannot jump backwards. Restart creates
a fresh history atomically. Portal entering uses the existing dissolve duration;
the teleport frame is invisible. Atomic state replacement resets snapshots at
the exit, then existing exit-grace reassembly resumes normal motion. Portal FSM,
transfer/safety rules and timings were not edited.

The Forest camera is static; no new camera/shadow smoothing was added. All body
shading comes from the same sprite placement/path, not a detached shadow owner.

This is past/current interpolation, **not** future movement prediction. A
committed turn starts its visual turn in the next RAF; it does not wait for
another input queue boundary. The visual pose lies between the last two committed
grid poses (up to one movement interval behind authoritative state). Gameplay
food/score/effect events keep their original authoritative timing. Human review
must judge that presentation trade-off; no simulated outcome is anticipated.

## Targeted QA

```powershell
node --test arcade/snake-next/forest-training/motion.test.mjs arcade/snake-next/tuning-lab/lab.test.mjs arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js arcade/snake-next/forest-training/session.test.js arcade/snake-next/forest-training/objects.test.mjs arcade/snake-next/forest-training/final-v3.test.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/motion-browser-qa.js
git diff --check
```

- 55 Node tests: deterministic replay/collision, input legality, B unchanged,
  growth, shared path, mid-cell pause/resume, restart, real portal reset and
  cadence-change monotonicity. All 165 approved V5.6 assets remain byte-identical.
- Synthetic render sampling at 60/90/120/144 FPS retains the same simulation hash.
  This is not a physical 120/144 Hz monitor certification or a performance test.
- 384 raster cases: straight/four directions/four corners/U/S/growth/tail bends,
  parallel lanes and legal vacated-tail entry. DPR 1/1.5/2; native 68px plus
  representative desktop 47.06px and mobile 29.1px cells. Every rendered silhouette
  has one connected component; gaps and tile-ownership overlaps = 0.
- Browser sprite rendering at lengths 8/30/250/1200 matches a non-rendered B
  session hash on every tested tick. Tail silhouettes are compared across
  `old alpha=1 → next alpha=0`, including consecutive terminal turns.
- Actual desktop queued keyboard turns, mid-cell pause/resume, restart and instant
  toggle; mobile 844×390 / DPR2 D-pad. Fresh-context JS/network failures = 0.

No benchmarks, new biomes, Ranked/backend, Fly/Hub, production artwork or
TEST/Production manifests were changed. Physical mobile/high-refresh hardware
and subjective latency/smoothness approval remain human review.

## Exactly four captures

[Native-scale review gallery](http://127.0.0.1:8773/docs/qa/smooth-motion/review.html)

1. [Straight motion sequence](straight-sequence.png)
2. [90° turn sequence](turn-sequence.png)
3. [U/S close-up](u-s-close-up.png)
4. [Mobile gameplay](mobile-gameplay.png)

The first three are real renderer diagnostic fixture frames at specified alpha,
not screenshots masquerading as live gameplay. Mobile is a live Training capture.
Raw evidence is [results.json](results.json).

STOP for human play review. No TEST/Production deployment.
