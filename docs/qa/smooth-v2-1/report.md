# Smooth V2.1 socket proof — QA FAIL, NOT APPROVED

2026-10-04. Accepted movement baseline: `86379ba`.

The requested fix is **not complete**. The bounded connector experiment closes
the rear gap but fails the no-width-pulse requirement in tight U. It is not
promoted to ordinary Training. Normal `tube-path.js`, `smooth-sprites.js`,
`motion.js` and GRID SNAP remain unchanged.

## Reproduction / measured socket

The accepted V2 tube starts its first bend essentially at the interpolated
head when alpha is small. The face turns cardinally while its rear lies
outside the tube. The body can touch the side of the face and still leave
the complete rear cross-section empty. Connected-component QA misses that.

All eight turn directions reproduce 72 missing native pixels: two whole
36px columns immediately behind the rear socket, worst alpha 0.01.
`baseline-socket.json` and `baseline-worst.png` preserve the pre-edit capture.

Approved head PNG: center `(34,34)`, rear edge `x=0`, rows `16..51` opaque.
Columns 0..5 are 36px wide; 6..11 are 38px, then 40px and the locked 42px face.
Socket offset is **32 native px**, with **2px hidden underlap**. Art/masks
are untouched. BODY remains 36, head 42, terminal 68, cell 68.

## Isolated experiment

`socket-prototype.js` adds a 6px straight rear lead, then a C1 Hermite
displacement of the existing tube toward a stable anchor 2.5 canonical cells
behind the head. Body material retains its head-relative path coordinate.
Correction is parameterized by geometric arclength; endpoints have matching
tangent planes. The correction vanishes on a straight. No circular patch,
art repaint, enlarged mask, head displacement, simulation change or tail
clock was introduced. Nothing past the anchor is replaced.

During development, QA caught an experiment-only floating-point remainder
wrapping the last curve node to the beginning of its range. That was fixed
and a monotonic-distance/exact-anchor regression was added. Wider and shorter
connector trials did not satisfy every visual constraint; they were not promoted.

## Results and remaining hard failure

- 808 native turn samples: rear attachment missing pixels 0, complete cuts 0.
- Max silhouette-area delta per 0.01 alpha step: 87 pixels, excluding the
  authoritative direction switch at alpha zero. This is not visual approval.
- 144 U/S/growth raster samples at DPR 1/1.5/2 and cell 68/24: **20 width
  failures**, all tight U. At native scale the union silhouette reaches
  **42px instead of 36px** near the socket because the neighbouring bend
  enters the attachment area. This violates the requested hard gate.
- Seven bracket-boundary RGBA comparisons: 0 changed pixels at identical pose.
- Real fixed-clock+RAF fixtures length 8/30/250: ~24.41 seconds total targeted
  run, per-tick hash mismatches 0, warm-up/active recoveries 0, pause/resume
  exact, restart resets history. These are short regression checks, not a
  benchmark, five-minute certification or physical-device/high-refresh claim.
- Normal Forest desktop and mobile 844×390: actual gameplay, two turns,
  mushroom growth, pause/resume, SMOOTH/GRID toggle; console/network failures 0.
- Actual portal transfer plus immediately queued exit turn: one atomic reset,
  481 ticks, hash mismatches 0, recoveries/errors/network failures 0.
- Existing foundation/B/geometry/asset regressions plus socket unit checks:
  62 tests. Unit continuity does **not** override the failing raster-width QA.

No hardware performance claim is made. No ImageGen, benchmark, TEST/Production
build/deploy, manifest edit or push. Simulation/B/food/effects/scoring/portal,
V5.6 artwork, Forest cabinet/floor/HUD, Fly/Hub/legacy/backend stay locked.

## Human review / STOP

Default accepted V2: <http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html>.

Unapproved proof only: <http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html?socketProof=1>.
This has `SMOOTH V2.1 | GRID SNAP` and an explicit QA FAIL warning.

Gallery: <http://127.0.0.1:8773/docs/qa/smooth-v2-1/review.html>.
Five requested captures plus one native socket detail, not shrink-to-fit.

One local diagnostic checkpoint. **STOP**: no visual PASS, no GAME FEEL LOCK.
Further connector work is required; no authorization to change head art,
head orientation/position policy or approved renderer architecture is inferred.
