# Smooth V2 — pending human play review

2026-10-04. Baseline: rejected `974b5ea`. No GAME FEEL LOCK.

## Root cause and repair

The old renderer selected neck/straight/corner material by route-cell ownership while the endpoints moved continuously. `alpha 1 → next alpha 0` changed 16–296 native RGB pixels in affected scenes despite identical silhouette/pose. Alpha connectivity alone missed this failure. The snapshot implementation is retained here only as a reproducible QA baseline.

Smooth V2 clips one canonical cardinal centerline at the shared presentation progress, then builds continuous straight strips and derived quarter turns. A future leading turn is excluded at alpha zero. The rigid V5.6 face, body surface and continuous 68px terminal all derive from this path/progress. There is no neck tile selection, `i===1` workaround, expanded mask, crossfade or independent terminal clock.

Approved ivory/moss pixels travel in stable head-relative material coordinates. Material variants are resolved once per identity, not per pixel or route index. A shared forward normal keeps head/body/tail shading coherent. Geometry UVs have a bounded cache; volatile endpoint UVs reuse scratch memory. Bins compose into one reusable backing-pixel raster with one Canvas upload per frame. Initial presentation is prepared before starting the fixed timer.

## Targeted verification

- 58 Node tests passed: foundation, presentation, B balance/replay, food/objects, Forest locks, motion and tube invariants. All 165 V5.6 asset hashes remain unchanged.
- 384 raster cases: one component, zero ownership overlaps, cardinal head samples; DPR 1 / 1.5 / 2, orientations, U/S, growth and vacated-tail entry. Long fixtures 8 / 30 / 250 / 1200 preserve hashes and terminal boundary silhouettes.
- Seven consecutive-frame diagnostics at `.80/.90/.95/1 → next 0/.05/.10/.20`: zero RGBA changes at the zero-motion bracket boundary, including two consecutive head turns and terminal turns. Full RGB is checked, not only alpha.
- Actual fixed-timer + RAF run: 18,035 active ticks / **300.58 active seconds** after warm-up, lengths 8 / 30 / 250, desktop and mobile 844×390. Scripted legal turns, repeated U/S, real growth, mid-cell pause/resume and restart; zero per-tick hash mismatches, zero active-window recoveries, JS errors 0, failed/404 requests 0.
- Actual normal Forest portal: armed → entering → teleport → exit-grace → cooldown; one transfer, atomic history reset, cardinal route, identical replay hash, zero recovery/errors/network failures.
- Synthetic 60 / 90 / 120 / 144 render-rate sampling preserves simulation hashes/collision outcomes. This is not physical display/device FPS certification. No long performance benchmark was run.
- Actual normal Forest B frame strips: ten ~100ms samples each, cell 47.07px at native runtime scale, head/neck through two turns, tail through those turns, mushroom growth 8→9. No zoom or artwork regeneration.

## Limits — do not hide these

Cold artificial 30/250 fixtures each triggered one `scheduler-lag` guard during the 1.5s warm-up, requiring ordinary resume. The final length-8 fixture had zero warm-up guards. These cold-start results are retained in `live-results.json`; the five-minute clean active window is **not** a cold-start pass. Clock thresholds were not relaxed. A fresh normal Forest portal succeeded without recovery; all normal Forest frame-strip samples were captured in `playing` state.

Presentation retains the previous/current authoritative interpolation window (up to one move interval); it does not predict gameplay. Head facing changes crisply to the canonical cardinal tangent. Derived endpoint bends and material warping need human inspection. Automated connectivity/RGB checks are not visual approval.

Simulation, input queue, B settings, scoring, food/effects/portal logic, audio, V5.6 assets, Forest floor/cabinet/HUD/geometry, GRID SNAP, legacy Snake, Fly, Hub, backend and manifests are unchanged. No TEST/Production build, publish or push.

## Review

- Playable: <http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html> — `SMOOTH V2 | GRID SNAP`.
- Gallery: <http://127.0.0.1:8773/docs/qa/smooth-v2/review.html>.
- Evidence: `before-temporal.json`, `after-temporal.json`, `results.json`, `live-results.json`, `portal-results.json` and native-scale frame strips.

One local checkpoint; **STOP for human play review**. No Phase 3B / Caves / Swamp / Ranked.
