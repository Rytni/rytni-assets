# Mushroom Snake rebuild — Phase 2B review
Date: 2026-10-02. Branch: `mushroom-snake-rebuild`.
Baseline: host `e20f5271b8f3fd8d9ae7b092c366bb193386c8c2`, core `53874d0a4e54c6c89a4991163a2438a7be2d3075`; checkpoint tag `codex/snake-next-phase2b-base`.

## 1–8. Implementation

1. **Sources:** `arcade/snake-next/dev.html`, `runtime/training.js`, `presentation/{path,camera,renderer}.js`, `simulation/difficulty.js`, `tests/{browser-qa,presentation.test}.js`, targeted `tools/qa/phase2b-*.js`. See [README](../arcade/snake-next/README.md). Isolated DEV shapes/CSS only; no public Hub, legacy imports, production art/audio or backend.
2. **Narrow Phase2A changes:** rules accept/validate optional Training curve and first-food distance; state stores current interval cadence; hash includes it. Cadence changes only on successful movement boundaries. First food is simulation-validated on runway; later BFS unchanged. Deterministic turn-queued/turn-applied events support input diagnostics. Default fixed-cadence core tests remain PASS. Hash/event schema changed: no backward compatibility with Phase2A diagnostic hash values is claimed. Training rules use explicit new version.
3. **Starting speed:** 4cells/s, 15ticks/cell at60Hz. First food five cells ahead, normally consumed at1.25active seconds. Runway stays clear; no forced early turn. Readable instructions/food/head are present immediately; human <3s comprehension is not claimed as measured.
4. **Curve:** first600ticks (10s) calm. At2700ticks (45s) or10foods: 10ticks/cell =6cells/s. At7200ticks (120s) or20foods: 8ticks/cell =7.5cells/s. At14400ticks (240s) or35foods: 6ticks/cell =10cells/s cap. Food tiers cannot bypass calm. Combo stays×1 to prioritize feel; +100/growth1, no passive points.
5. **Snapshots:** two reusable authoritative completed-move cell buffers, one shared alpha from active move phase + fixed-clock fractional debt. One-cell presentation buffer, not independent head/tail clocks or prediction. Food id is sampled from the same buffered interval, avoiding food disappearing before visible contact. Simulation remains sole owner of food/score/collision/cadence.
6. **Path:** current cardinal route + vacating previous terminal point; distance clipping gives leading/trailing positions. No diagonal cell-to-cell lerp. Miter-limited single polygon, no per-segment overlapping sprites. Growth extends span while tail remains fixed. Typed workspace reused; snapshots copied on movement only.
7. **Head/body/taper/tail:** ellipse/eyes at leading distance, continuous body, last~3cells taper to zero-radius tip. Automated phases0/.25/.5/.75/.999/1 and visual close-ups show no gap/diagonal shortcut; consecutive-move endpoint continuity tested at8/100/250/500/1200.
8. **Shadow:** same silhouette and geometry, constant small vertical art offset; no separate interpolation. Normal subtle black; QA magenta makes alignment visible.

## 9–15. Functional / visual evidence

9. **Input latency:** real keyboard timestamps→mailbox 0.2–0.4ms, then 14.0–17.3ms until simulation accepts queue; applied at boundaries15/30, boundary wait 232.9–482.3ms for the two early queued commands. Mobile pointer→mailbox 6.0–11.6ms (includes dispatch), then 1.4–14.4ms until sim queue; boundary wait 183.1–448.5ms. These are separate, not a claim of500ms queue processing. WASD/arrows, two queued turns, held repeat and rapid D-pad taps PASS; pure reversal/burst tests retained. Full raw timestamps: [UI](qa/snake-next-phase2b-ui.json), [responsive](qa/snake-next-phase2b-responsive.json).
10. **Food:** first pickup +100/length9; one authoritative food, atomic replacement, reachability/body/obstacle/full terminal tests PASS. Actual growth straight/near-turn locks terminal position; food buffering never spawns food. Long browser run collects117 without starvation/burst.
11. **Pause/resume:** hash/ticks/food/difficulty frozen; fractional clock debt retained on resume, no small presentation rewind. Excess scheduler debt enters explicit recoverable pause; no silent speed adjustment.
12. **Death/restart:** authoritative obstacle/self death stops clocks before Result. Resources zero in Result/Main; nine restart cycles in targeted UI + long smoke, no duplicates. A reproduced portrait Restart bypass (playing in390×844) was fixed by central landscape guard in start(), not button-only validation. Before/after screenshots retained.
13. **Resize/DPR/fullscreen:** 1366×768,1920×1080,2560×1440,844×390,915×412 at DPR1/1.5/2 (15 contexts). Backing=rounded CSS×DPR, cap2; no per-frame backing resizes; resize/paused fullscreen Escape preserve hash. Landscape D-pad targets56×48; portrait auto-pause, landscape explicit resume, portrait restart cannot start simulation. Main portrait prompts remain intentionally DEV.
14. **Fault injection:** injected clip + throw; full canvas reset/clear, diagnostic frame, next complete repaint. Simulation continues, faults=1 expected, pageerrors=0; no permanent rectangle. Uses tested Edge154 Canvas reset(), no compatibility claim for untested browsers.
15. **Screenshots:** `C:/GitHub/rytni-assets/.playwright-cli/phase2b/geometry/*-length-*-alpha-*.png` =70 validated close-ups. Four turn directions, straight H/V,U/S, growth straight/turn, long lengths and all alphas. Viewport/fullscreen/fault/result/portrait restart/long screenshots in parent directory. Initial QA fixture redraw by ResizeObserver was fixed by disconnecting fixture observation; blank pre-fix frames are not acceptance evidence.

## 16–17. Performance

Main-thread CPU timings, milliseconds; each cell is rendered (no hidden-segment optimization). Triples **p50/p95/max**.
1000 measured moving/draw frames after200warm frames per length/rate; 100 real consumption+draw samples. Async QA yields; setup/clone excluded. Whole includes step + snapshot copy + geometry/camera/full draw; GPU/compositor excluded.
Raw [performance](qa/snake-next-phase2b-perf.json).

| Runtime | Length | Simulation move | Renderer + snapshot | Whole move | Whole consumption |
|---|---:|---:|---:|---:|---:|
| Desktop | 8 | <0.1/0.1/2.4 | 0.1/0.4/6.9 | 0.1/0.5/6.9 | 0.6/2.9/4.8 |
| Desktop | 100 | <0.1/0.1/1.4 | 0.1/0.5/3.7 | 0.1/0.5/3.7 | 0.6/3.3/5.4 |
| Desktop | 250 | <0.1/0.1/1.7 | 0.1/0.5/3.0 | 0.2/0.5/3.0 | 0.6/2.4/6.0 |
| Desktop | 500 | <0.1/0.1/2.7 | 0.2/1.4/3.6 | 0.2/1.5/3.6 | 0.6/2.6/3.1 |
| Desktop | 1200 | <0.1/0.1/1.9 | 0.3/2.1/7.1 | 0.3/2.1/7.1 | 0.7/2.6/3.2 |
| CPU×4 | 8 | <0.1/0.2/4.0 | 0.3/2.7/7.3 | 0.4/3.0/7.3 | 4.3/11.9/17.9 |
| CPU×4 | 100 | <0.1/0.4/9.7 | 0.4/2.4/6.6 | 0.5/2.7/11.8 | 4.3/10.7/14.6 |
| CPU×4 | 250 | <0.1/0.4/3.5 | 0.5/2.9/9.5 | 0.6/3.0/9.5 | 3.8/9.4/12.5 |
| CPU×4 | 500 | <0.1/0.2/2.8 | 0.7/3.5/10.3 | 0.8/3.7/10.3 | 3.6/8.7/15.2 |
| CPU×4 | 1200 | <0.1/0.3/3.6 | 1.3/5.0/9.3 | 1.4/5.0/11.2 | 4.3/9.0/12.1 |

16. **Desktop:** render p95≤2.1ms (target6); ordinary simulation p95~0.1ms. Node same Phase2A protocol: move p95~0.0002–0.0004ms, consumption p95~0.213–0.290ms, near previous baseline. Browser async clone-consumption p95 is higher/variable than Phase2A batch protocol; it is retained, not silently equated with Node or discarded.
17. **CPU×4:** at1200 whole move p95=5.0ms, whole consumption p95=9.0ms (target12); all p95 gates pass. **Max caveat:** one original length8 cloned-consumption+draw sample17.9ms exceeded16.7. Not traced at capture, so attribution to GC/OS is unknown. Follow-up trace20,779events: repeat max9.3ms, no >16.7 sample and no GC overlap recorded in consumption marks. [Trace summary](qa/snake-next-phase2b-spike-trace.json). Do not claim the original sample was fixed, GC-attributed, or max guard fully proven. No core optimization was made blindly.

## 18–21. Long run / handoff

18. **12m44s real browser Training:** 764.493wall seconds,45,869active ticks,117foods, length125,181,430presentation frames; recovery0, renderer faults0. QA-only BFS planner submits ordinary commands on seed7; no state/body/food teleport or simulated fast-forward. Then paused/resized/fullscreen/resumed, live1200cells (126ticks), three rapid-input restarts. This is automated browser play, not human feel approval. [Long evidence](qa/snake-next-phase2b-long.json).
19. **After leave:** session RAF0,timers0,listeners0,observers0,audio0. Static shell inline navigation remains usable to start again. Long metrics are separate rolling6000sample windows, not whole-run worst-case GPU/frame statistics. Console errors/warnings0 in long context; page errors, failed/HTTP404 requests0 in desktop/responsive QA.
20. **Commit:** commit containing this report; exact id returned in final handoff (`git log -1 --format=%H -- arcade/snake-next/runtime/training.js`).
21. **Remaining:** original unclassified17.9ms CPU×4 sample remains a max-budget caveat, despite clean trace repeat and passing p95. Physical-device touch/fullscreen/orientation/GPU behavior, other browsers and subjective game feel require review. No remaining reproduced functional failure in targeted scenarios. Legacy confirmed audit issues remain outside this isolated rebuild.

## Verification / safety

- `node --test arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js`:22/22PASS.
- New Training curve hashes match every one of15,000ticks at30/60/90/120/144FPS × normal/artificial CPU delay, through the cap. Existing near-full/tail rule/food/self/obstacle/long-body tests retained.
- Syntax, exact diff and protected-source checks; post-commit read-only TEST deploy CheckOnly.
- Both manifests, all legacy Snake/Fly/Hub/page sources, build/deploy source untouched in this phase. No DB, real attempts, push, candidate release, TEST/Production publication. Existing unrelated untracked files preserved.
- Stop here for review. No Phase3A / production art/audio/biomes/effects/ranked.
