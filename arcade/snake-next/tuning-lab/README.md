# DEV Game Feel Tuning Lab

Review URL: http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html

Use the existing local static server on port 8773. Select A/B/C to start a clean
Training run. Arrow keys/WASD steer; Space pauses/resumes. Mobile uses the existing
D-pad. Controls and telemetry live outside the game iframe, below it on mobile.
Fullscreen shows only the game; exit fullscreen to return to the lab controls.
Focusing the external controls can pause the game through its existing blur
ownership. Resume in-game or apply/restart. A choice made during loading or in
portrait is queued until the game is ready in landscape.

Edit values and press `Применить / перезапуск`; invalid values do not start a run.
Profile changes, config changes and in-game restarts archive the previous summary.
`Скопировать результаты` copies the current run/config; denied clipboard access
reveals selected text for manual copying. Reload clears the in-memory history.
No preset is approved as the most fun: that decision requires human play.

## Exact initial profiles

| Parameter | A | B | C |
| --- | ---: | ---: | ---: |
| Start target, cells/s | 3.7 | 4.2 | 4.8 |
| Initial integer cadence, ticks/cell | 16 | 14 | 13 |
| Actual initial speed, cells/s | 3.75 | 4.285714 | 4.615385 |
| Max base target, cells/s | 6 | 7.5 | 8.6 |
| Actual max base cadence speed, cells/s | 6 | 7.5 | 8.571429 |
| Acceleration initial slope, cells/s per second | 0.012 | 0.035 | 0.055 |
| Calm grace, seconds | 15 | 12 | 10 |
| Preferred reachable food Manhattan distance, cells | 3–8 | 5–12 | 6–18 |
| Positive spawn interval, seconds | 14 | 10 | 7 |
| Negative spawn interval, seconds | 26 | 18 | 12 |
| First portal window, seconds | 45 | 30 | 24 |
| Portal window interval, seconds | 60 | 45 | 35 |
| Portal available window, seconds | 8 | 10 | 10 |
| Portal cooldown, seconds | 25 | 20 | 15 |
| Combo timeout, seconds | 16 | 12 | 10 |
| Combo reward step | 0.12 | 0.15 | 0.20 |
| Food replacement delay, ticks | 0 | 0 | 0 |

With `dt = max(0, activeSeconds - grace)` and `span = maxSpeed - startSpeed`:
`target = startSpeed + span * (1 - exp(-acceleration * dt / span))`.
Equal start/max uses that constant. Cadence is
`max(ceil(60 / maxSpeed), round(60 / target))` at the existing 60 Hz fixed clock.
Thus the target is smooth but effective motion is integer-cadence quantized.
Focus/Rush modifiers remain unchanged; the max is a **base** cap, not an effect cap.

The first mushroom retains the normal runway placement. Subsequent atomic food
replacement prefers legal reachable cells in the distance band, falling back to
all legal reachable cells if necessary. Delay is intentionally read-only: waiting
would violate the one-standard-mushroom invariant. There are no guaranteed event
quotas. Existing effect durations/refresh rules, maximum 2 positive + 1 negative,
and at most 3 field pickups remain intact. Harvest still doubles food value.
Profile combo reward step and existing cadence speed bonus determine score;
the multiplier toggle affects only external DEV telemetry, never game HUD.

Portal visibility/entry is gated by periodic windows and cooldown. Entering,
teleport, exit-grace and transfer safety remain the existing FSM; a window closing
never interrupts a transfer already in progress. Cooldown can suppress a window.

## Telemetry semantics

- Active simulation time excludes pauses; graph is time → effective cadence speed.
- Average speed is the time-weighted **effective cadence** including Focus/Rush,
  not displacement divided by wall time; portal animation is not subtracted.
- Food interval and travelled move count average successive pickups, excluding
  the initial run-to-first-pickup interval. Portal teleport is not counted as
  travelled grid steps. Replacement latency is measured in simulation ticks.
- Combo: maximum, time-weighted mean (including zero), break count/reason:
  timeout, death, restart, preset-change or config-change.
- Positive/negative spawn and collection counts; portal appearances, successful
  uses, unsafe rejects, configured and remaining cooldown.
- Death: wall/self/obstacle/other, cadence at death, duration, length, score,
  effects present immediately before death.
- Graph retains 1800 one-second samples; event log retains 100 events; history
  retains 30 summaries. No persistence, bots or autopilot.

The DEV wrapper observes Session.advance; it does not write telemetry back into
simulation. Normal Training selects no pacing policy and retains its previous
hashes. Core simulation/grid/collision, art, cabinet geometry, audio, manifests,
Fly/Hub/backend and release channels are unchanged.

## Targeted verification — 2026-10-03

```powershell
node --test arcade/snake-next/tuning-lab/lab.test.mjs arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js arcade/snake-next/forest-training/session.test.js arcade/snake-next/forest-training/objects.test.mjs arcade/snake-next/forest-training/final-v3.test.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/tuning-lab/browser-qa.js
git diff --check
```

51/51 Node regressions PASS. Fresh-context Edge browser QA PASS: A/B/C clean
restart/config validation, keyboard arrows/WASD, mobile 844×390 D-pad and ≥44px
targets, pause/resume, atomic food replacement (0 ticks), stopped previous session,
history, clipboard, and multiplier visibility. Paused game RAF/timers/audio sources
all 0. Normal Training hash parity with c6587d3 and all 165 approved V5.6 asset
bytes verified. Console errors/warnings 0; request failures/HTTP errors/404 0 in
the fresh QA contexts. Physical mobile and subjective multi-minute fun/fairness
remain for human review. No benchmark or deployment performed.

Exactly four captures (desktop full-page lab; mobile actual game iframe at native
844×390 to avoid full-page viewport expansion triggering portrait/pause):

- [A DEV](../../../docs/qa/game-feel-lab/A-dev.png)
- [B DEV](../../../docs/qa/game-feel-lab/B-dev.png)
- [C DEV](../../../docs/qa/game-feel-lab/C-dev.png)
- [Mobile DEV](../../../docs/qa/game-feel-lab/mobile-dev.png)

Raw browser evidence: [results.json](../../../docs/qa/game-feel-lab/results.json).

STOP for human A/B/C play review. No TEST/Production publication.
