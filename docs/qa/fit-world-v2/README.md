# FIT WORLD V2 — diagnostic, human review required

Base: `2e82822`. Local DEV only; no publication or benchmark.

[Play](http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html#effect-playground) · [Native captures](http://127.0.0.1:8775/docs/qa/fit-world-v2/review.html)

## Mobile stop condition

60×24 at 844×390 projects the locked 36px body to **6.45 CSS px**. The silhouette is trackable, but face/material detail is weak at 1×. This is a mobile readability concern, NOT visual approval. STOP here for the human decision on maximum dimensions; no fifth world or geometry enlargement was added.

## Square-cell measurements

Measurements are the runtime `cell × 36/68` projection, not a changed native mask. Full-arena captures use the actual embedded cabinet; no screenshot shrink-to-fit. Mobile DPR2 screenshots are exported at CSS scale.

| World | Desktop cell / body, px | Mobile cell / body, px |
|---|---:|---:|
| 30×12 | 54.72 / 28.97 | 24.36 / 12.89 |
| 40×16 | 41.04 / 21.73 | 18.27 / 9.67 |
| 50×20 | 32.83 / 17.38 | 14.61 / 7.74 |
| 60×24 | 27.36 / 14.49 | 12.18 / 6.45 |

All stages are 2.5:1, uniformly fit into the unchanged cabinet arena with 4px minimum inset. Desktop side inset is 43.23px (2.5% per side); mobile 25.01px (3.2% per side). The existing inner arena is 2.6:1; remaining inset is the unavoidable square-cell aspect difference, not reserved camera gutters. No follow/dead-zone/look-ahead in FIT mode. The existing 60-tick smooth zoom is retained; temporary extreme-territory clipping is accepted by the user.

## Capacity and timing

Capacity is `(width−2) × (height−2) − unique permanent interior solids`. Unique canonical occupied traversable cells consume capacity. Food/pickups/portals/warnings/temporary Roots and hazards do not. Expansion uses exact integer `free × 100 <= capacity × trigger`, once per stage, capped at 60×24.

Natural-route predictions at default permanent density 2:

| Expansion | Current world | Capacity | Predicted Snake length at 15% |
|---|---|---:|---:|
| 1 | 30×12 | 279 | 238 |
| 2 | 40×16 | 529 | 450 |
| 3 | 50×20 | 855 | 727 |

The targeted legal-body fixture observes expansion 1 at actual length **238**, predicted **238** (density0 has capacity280 and the same ceiling). Later predictions are calculated against the natural obstacle sequence; no claim that a human/autopilot completed those runs. Real runtime records predicted/actual length, free ratio and tick at every expansion. Forced DEV expansions are marked `devForced`; screenshots use forced/starting previews, not simulated human achievements. Starting directly at a later stage seeds different inherited terrain, so its preview capacity can differ slightly.

Curve: `u = clamp((occupied − stageEntryOccupied)/(ceil(capacity×(1−trigger)) − stageEntryOccupied), 0, 1)`.

Base microcells/sec = `start + floor((end−start) × u)`; knots:

- Stage0: **4.2 → 5.3**
- Stage1: **5.3 → 7.0**
- Stage2: **7.0 → 7.9**
- Stage3/max: **7.9 → 8.0**

Stage entry occupancy is captured at expansion, preserving the outgoing speed. Idle time adds no base speed. Preview/forced expansion is diagnostic and can jump to the next stage's base. Existing Focus/Rush factors remain 100/122 and 5/4; Rush's temporary boost is not a new base-speed cap. Scoring still uses the existing scoring cadence/formula—movement cadence no longer determines step timing.

Each fixed60Hz tick adds integer microcells/sec to `progress`; one cell is `60,000,000` units. On crossing, subtract exactly one unit and carry remainder. Smooth V4 uses this same accumulator for alpha, with its spatial/path/ribbon/tunnel implementation unchanged. New timing version: `fit-world-v2-fixed-point-v1`; progress/rate/version are hashed. Historical timing hashes are intentionally not compared.

Actual deterministic 60-second scheduler measurements (not a performance benchmark):

| Target cells/s | Committed cells | Measured cells/s | Interval ticks |
|---:|---:|---:|---|
| 4.2 | 252 | 4.2 | 14–15 |
| 4.75 | 285 | 4.75 | 12–13 |
| 5.3 | 318 | 5.3 | 11–12 |
| 6.15 | 369 | 6.15 | 9–10 |
| 7.0 | 420 | 7.0 | 8–9 |
| 7.45 | 447 | 7.45 | 8–9 |
| 7.9 | 474 | 7.9 | 7–8 |
| 8.0 | 480 | 8.0 | 7–8 |

## Readability / QA

Authored LOD sprites use 16px native masks, unique eye/shield/crown/lightning/cloud/root silhouettes and 2–3 color/value groups. LOD activates below a 28px natural ink footprint. Uniform aspect-preserving fitting uses alpha bounds, cell-center anchors and minimum maximum-axis ink footprint: desktop food15/pickup21/portal28; mobile food14/pickup19/portal26 CSS px. Stones are unchanged. A wide eye's height is smaller than its width by design; these numbers are not forced square bounds.

Mobile food/pickup/portal remain 14/19/26px at 40×16 through 60×24. At30×12 pickups naturally occupy 19.63–22.08px. Desktop uses detailed art at30×12; later stages progressively select LOD. Each size's native lineup and per-object rendered dimensions/LOD decision are in `review.html` / `browser.json`. Weak/golden food variants remain visually distinct. No floating production labels or giant halos.

68 targeted tests passed: capacity/threshold/max stage, actual first expansion, integer carry, smooth pressure/no idle acceleration, repeat/new hash parity, read-only renderer sampling, Guard, growth/tunnel traversal at8/30/250, pause/resume, restart, food reliability, locked effects/queue/body/geometry. The old byte-lock gates strip only explicit optional timing additions; unchanged collision and V4 spatial code still compare byte-for-byte.

Seed17 /1200 ticks: V4, V2 and snap read schedules yield **`ebe1e000`** each. Browser keyboard and real mobile touch tests pass; pause freezes alpha/hash; mobile targets remain48×48. Browser console errors0; failed/error network requests0. No final biome art, backend, TEST/Production or world beyond60×24 was changed.

```powershell
node --test arcade/snake-next/effect-playground/fit-v2.test.mjs arcade/snake-next/effect-playground/ux.test.mjs arcade/snake-next/effect-playground/effects.test.mjs arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/progressive-run/food.test.mjs arcade/snake-next/gate-one/gate.test.mjs arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/effect-playground/fit-v2-browser.js
```
