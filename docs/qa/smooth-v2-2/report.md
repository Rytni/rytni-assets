# Smooth V2.2 — NOT PASS

This checkpoint preserves an isolated **failed diagnostic**, not a completed
fix or an approved renderer. Normal Training and the ordinary game-feel lab
continue to use approved Smooth V2 (`86379ba`). No deployment.

## Measurements

- Native cell: 68 px. BODY: 36 px; hard sampling half-width: 18 px.
- Approved rigid head: unchanged. Socket offset: 32 px; hidden underlap: 2 px.
- All 8 cardinal turns × all 12 requested alpha samples: 96 frames.
- Tight U: 12 additional frames. Total: 108; 25 fail the combined gate.
- Rear attachment: missing pixels = 0; socket sections = exactly 36 px.
- Normal single-turn sections: 34–37 px. Tight-U sections: **31–37 px**.
- Largest head-proximal silhouette area step: **2808 native pixels** between
  alpha 0 and .05, versus a 68×36 = 2448-pixel body tile. This is a FAIL,
  not acceptable gradual motion. The crops also expose an unwanted rear loop.
- Straight comparison at all 12 alpha states: **0 differing RGBA bytes**.

`targeted.json` contains the raw section positions/normals, socket counts,
area measurements and failures. Width is the contiguous opaque transverse
interval containing the centerline, not unrelated pixels in a separate lane.
Analytic arc tangents are used; sampling secant normals would mismeasure bends.
The 12-state strip is native 100%, scrollable, never shrink-to-fit.

## What was investigated

`fixed-socket.js` cuts the original proximal interval at a stable line anchor.
The original body never renders in the replaced canonical-distance interval.
An analytic line / circular-elbow / line bridge uses a single bounded inverse
sampler, not the rejected V2.1 Hermite displacement or a connector overlay.
The hidden socket underlap is covered by the unchanged head drawn last.
Canonical material coordinates end exactly at the retained V2 join distance.

That is insufficient: preserving the rigid head's immediate turn and rear
tangent still produces an excessive return bend at early alpha. Constraining
the socket envelope can additionally pinch an oblique visible body section.
No result here proves that all legal neck cross-sections satisfy 35–37 px.
This is evidence against **this candidate**, not a proof that the task is
mathematically impossible. No head/art, cadence or simulation change was made
to conceal the failure.

The approved `tube-path.js`, `smooth-sprites.js`, and `motion.js` are identical
to `86379ba`; art, simulation, tail, preset B, Forest, food, bonuses, portal,
audio, legacy, Hub, Fly, backend and manifests are untouched. The only existing
source edit is an explicit opt-in diagnostic loader in the DEV tuning lab.

## Gate / remaining verification

Targeted gate failed, so full regression was **not** run. Length 30/250,
growth-before-turn, S/opposite-turn, pause/resume, dense temporal sampling,
DPR and replay/hash tests of the candidate are **not certified**. There are
no benchmark results. Do not integrate or mark Smooth V2.2 approved.

- [Four native review images](review.html)
- [Playable failed diagnostic](http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html?fixedSocketProof=1)
- [Unchanged approved Smooth V2](http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html)

DEV diagnostic toggle: `SMOOTH V2.2 | GRID SNAP`. An explicit QA FAIL warning
appears before and after starting a run. The flag is opt-in; no public entry,
production renderer import or release manifest was changed.
