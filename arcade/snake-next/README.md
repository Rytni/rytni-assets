# Snake Next — deterministic core + isolated DEV Training

Independent ES modules with JSDoc data interfaces, zero runtime dependencies. No legacy imports, production assets/audio/backend/Hub registration. `entry.js` exposes data APIs; `dev.html` is a standalone playable **DEV-only Training**, not a public game entry.

- `simulation/`: uint32 PRNG, version/config rules key, canonical cell ring + bit occupancy, atomic move/eat/death, tick event stream, semantic FNV hash, fixed accumulator/main-thread timer driver.
- `world/`: immutable private collision mask + validation; decor/theme separate. 96×64 is the initial rules candidate, configurable (80×48 also tested). Sparse spaced obstacles; connected area, runway, cardinal body, initial trap/free-area checks.
- `input/`: four canonical directions; last accepted/queued direction decides reversal; queue2, one turn per boundary, repeat/duplicate-sequence rejection. Keyboard/D-pad submit the same data; no DOM handlers yet.
- `tests/`: replay, property/scenario/long-session tests, standalone DEV browser/Node simulation benchmark.
- `presentation/`: read-only snapshots, distance-parametrized cardinal centerline, shared silhouette/shadow, bounded camera, full-frame Canvas renderer. No simulation writes.
- `runtime/`: isolated Training lifecycle, timer-owned simulation, separately owned RAF presentation, keyboard/D-pad commands, pause/recovery/result/disposal.

```powershell
node --test arcade/snake-next/tests/foundation.test.js
node --test arcade/snake-next/tests/presentation.test.js
node arcade/snake-next/tests/run-benchmark.js
```

Browser perf: serve repository locally on 8771 and use Playwright CLI `run-code --filename=tools/qa/phase2a-simulation-perf.js`; real Edge CDP CPU×4, no game assets/backend requests. `tests/perf.html` is a DEV-only fixture, never a release entry.

DEV route: `http://127.0.0.1:8771/arcade/snake-next/dev.html` (serve repository with `python -m http.server 8771 --bind 127.0.0.1`). Main→Training→Pause/Resume→Result→Restart/Main. Desktop WASD/arrows; landscape touch D-pad. Portrait pauses and requires explicit landscape resume. No forced orientation lock. Shell controls are static inline navigation; all installed session listeners/observers/RAF/timers are disposed on Result/Main.

Explicit `?qa=1` loads test-only helpers (synthetic geometry/collision/long-body/food planner). They are not enabled by the normal DEV entry. CLI scripts: `tools/qa/phase2b-ui.js`, `phase2b-responsive.js`, `phase2b-geometry.js`, `phase2b-perf.js`. Create `.playwright-cli/phase2b/geometry` before screenshot runs. Perf uses real CDP CPU×4; reports CPU work, not GPU/compositor time. `phase2b-long-finish.js` asserts 600+ wall seconds and 36,000+ active ticks after `snakeDev.qa.startAutoplay(); window.phase2bLongStart=performance.now()` in its own browser session.

## Contracts

`createRules` fixes a version + full config key; changing constants requires a new rules version before ranked. `generateArena(seed,rules)` → validated arena; `createState({seed,rules,arena})` → structured-cloneable simulation data. Arena topology is separate and exported/reconstructed for a possible later Worker. Its private collision buffer has no mutable public reference.

`step(state,arena,rules,commands)` advances exactly one active tick. Commands must be delivered in canonical tick/sequence order; the replay harness dispatches by tick. Queue is bounded; directions rejected against the last queued turn. State/body never use wall/RAF timestamps. The cell ring is the only body path; no independent head/tail/shadow coordinates. `events` is a per-tick bounded-by-work semantic stream; consume synchronously after each tick, retain copies outside the state if needed. No move event flood; food/death/terminal events have monotonic sequence ids.

`food` is one cell id or -1 only in explicit terminal state. BFS over current reachable free space (with legally vacating tail traversal, no initial reverse) selects one deterministic legal cell. On consume: grow1/score100, clear old food, choose new food in the same tick. No timer/refill/render spawn. Full physical occupancy ends `full/arena-filled`; no reachable legal cell ends `full/no-legal-food` (not a false claim that every cell is occupied). Current-snapshot reachability is not a future-route AI guarantee.

`stateHash` is a diagnostic/replay FNV32 semantic hash, **not cryptographic anti-cheat**. Physical unused ring slots/scratch/event buffer are excluded; body order/occupancy/rules/arena/rng/turn queue/active counters are included. Tests compare event streams separately.

Training rules version `snake-next-training-2`: start4cells/s (15ticks); first10s calm. 45s or10foods →6 (10ticks), 120s or20foods →7.5 (8ticks), 240s or35foods →10 (6ticks). Food-driven tiers cannot bypass the calm interval. Cadence changes only at cell boundaries, is stored/hashed, and never uses frame time. First food is validated five cells along the runway; all later food uses the accepted deterministic BFS. Combo stays×1, +100/+1.

Presentation stores previous/current completed-move snapshots and one shared alpha from the simulation interval/subtick debt. It buffers one cell interval, with no independently delayed head/tail/shadow. Current cardinal route plus vacating previous tail is sampled by distance; growth extends the leading distance while terminal point remains fixed. The single displayed food id comes from the same buffered snapshot interval, so consumed food does not vanish before the visible head reaches it. This is presentation buffering, never gameplay food ownership. Pause retains fractional debt; resize/DPR (cap2)/fullscreen never touch state. Renderer uses `CanvasRenderingContext2D.reset()` (tested Edge154); a fault clears/reset state and repaints next frame without stopping simulation.

`FixedClock.advance(monotonicMs)` feeds pure ticks, never renderer callbacks in the runtime driver. Five ticks max catch-up; excess enters explicit `recovery/scheduler-lag`, no further ticks until resume. Wall time during pause/recovery is not simulated; no speed adjustment. `startMainThreadClock` takes injected now/schedule/cancel, uses timers, returns owned disposer. Caller stops/pauses on terminal/host lifecycle; new UI integration belongs to later phases. Do not silently resume a ranked session after recovery without a future reviewed policy.

Fixture body/food overrides allow edge-state tests, not future ranked configuration. Benchmarks use a legal fixed loop, every tick moves (higher cadence than intended gameplay), and food outside that loop to keep exact tested lengths. Separate actual consumption tick samples include grow/score/full food selection; setup/clone is excluded. Browser zeros in tiny movement samples mean timer quantization, not zero cost. No rendering is measured in Phase 2A.

Default runtime stays **main thread**; no Worker runtime/SAB introduced. Later integration must follow `docs/arcade-host-phase2a-contract.md`. Production art/audio/biomes/effects/ranked/Hub integration require separate review; do not advance automatically.
