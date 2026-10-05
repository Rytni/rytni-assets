# Positional dead-zone camera — human review

DEV: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html

Default is `STABLE CAMERA`; temporary `OLD LOOK-AHEAD` A/B toggle is in the
isolated Lab, not the Forest HUD or a production entry.

Old: head-direction target offsets ±4.5 cells X / ±2.5 cells Y, exponential
target chasing, direction-dependent vertical visibility rails.

New: 28×12 viewport. Desktop safe zone X 7..20 / Y 3..8; mobile X 8..19 /
Y 3..8. Camera stays exactly fixed inside the zone. A positional crossing
translates just the affected axis by the minimum required amount, bounded by
world limits. No direction bias, return glide, or independent easing clock.
Normal motion uses the existing interpolated head position. Expansion does not
recenter a stationary head. Pause/resume retains position. Restart clears it.
Each portal rebases once when the visual head crosses the canonical portal
edge, not at the earlier committed transfer or later tail exit.

Direction-only 30-second fixtures (total absolute movement, cells):

| Fixture | Old look-ahead | Stable |
| --- | ---: | ---: |
| RIGHT → DOWN → RIGHT | 602.223 | 0 |
| RIGHT → DOWN → LEFT | 907.769 | 0 |
| DOWN → RIGHT → UP → RIGHT | 814.186 | 0 |
| tight S | 814.293 | 0 |
| repeated square | 899.410 | 0 |

These are camera-only deterministic direction fixtures at a stationary head,
not simulated illegal turns, net displacement, benchmarks, or fun claims.
Position-only S/loop fixtures also stay at zero inside the zone. Explicit
crossings verify exact minimal displacement and zero cross-axis leakage.

Targeted command:

```text
node --test arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/gate.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/gate-one/stable-camera-qa.js
```

25 tests pass, including canonical 30-second loop hash parity across stable,
old, and no-camera readers; visual portal crossing; world clamp; expansion;
pause/resume; and existing tunnel/collision/growth/width checks.

Browser details are in `browser.json`. Its live 30-second loops use real keyboard
or touch input, Preset B + Smooth V4, and a QA-only clear loop fixture with event
spawns deferred to avoid unrelated interruptions. This is usability-path QA,
not a normal-run/autopilot claim. No screenshot gallery or benchmark.

Gate 1.1 environment remains unchanged from the preceding local review pass
(normalized SHA-256 `1c02aa395013c6fd6b5ae4aa43c52ce33245c9e4b4a54e3464d280bf7ac7c51f`).
It is included in the local checkpoint because that review pass was uncommitted.
No Gate 2, simulation, input, balance, speed, food, bonus, portal architecture,
Smooth V4, or world-size changes. No deployment. Await human gameplay review.
