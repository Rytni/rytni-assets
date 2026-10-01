# Snake Next — Phase 2A foundation

Independent ES modules with JSDoc data interfaces, zero runtime dependencies. No legacy imports, renderer/UI/art/audio/backend/Hub registration. `entry.js` exposes data APIs, not a playable production game yet.

- `simulation/`: uint32 PRNG, version/config rules key, canonical cell ring + bit occupancy, atomic move/eat/death, tick event stream, semantic FNV hash, fixed accumulator/main-thread timer driver.
- `world/`: immutable private collision mask + validation; decor/theme separate. 96×64 is the initial rules candidate, configurable (80×48 also tested). Sparse spaced obstacles; connected area, runway, cardinal body, initial trap/free-area checks.
- `input/`: four canonical directions; last accepted/queued direction decides reversal; queue2, one turn per boundary, repeat/duplicate-sequence rejection. Keyboard/D-pad submit the same data; no DOM handlers yet.
- `tests/`: replay, property/scenario/long-session tests, standalone DEV browser/Node simulation benchmark.

```powershell
node --test arcade/snake-next/tests/foundation.test.js
node arcade/snake-next/tests/run-benchmark.js
```

Browser perf: serve repository locally on 8771 and use Playwright CLI `run-code --filename=tools/qa/phase2a-simulation-perf.js`; real Edge CDP CPU×4, no game assets/backend requests. `tests/perf.html` is a DEV-only fixture, never a release entry.

## Contracts

`createRules` fixes a version + full config key; changing constants requires a new rules version before ranked. `generateArena(seed,rules)` → validated arena; `createState({seed,rules,arena})` → structured-cloneable simulation data. Arena topology is separate and exported/reconstructed for a possible later Worker. Its private collision buffer has no mutable public reference.

`step(state,arena,rules,commands)` advances exactly one active tick. Commands must be delivered in canonical tick/sequence order; the replay harness dispatches by tick. Queue is bounded; directions rejected against the last queued turn. State/body never use wall/RAF timestamps. The cell ring is the only body path; no independent head/tail/shadow coordinates. `events` is a per-tick bounded-by-work semantic stream; consume synchronously after each tick, retain copies outside the state if needed. No move event flood; food/death/terminal events have monotonic sequence ids.

`food` is one cell id or -1 only in explicit terminal state. BFS over current reachable free space (with legally vacating tail traversal, no initial reverse) selects one deterministic legal cell. On consume: grow1/score100, clear old food, choose new food in the same tick. No timer/refill/render spawn. Full physical occupancy ends `full/arena-filled`; no reachable legal cell ends `full/no-legal-food` (not a false claim that every cell is occupied). Current-snapshot reachability is not a future-route AI guarantee.

`stateHash` is a diagnostic/replay FNV32 semantic hash, **not cryptographic anti-cheat**. Physical unused ring slots/scratch/event buffer are excluded; body order/occupancy/rules/arena/rng/turn queue/active counters are included. Tests compare event streams separately.

`FixedClock.advance(monotonicMs)` feeds pure ticks, never renderer callbacks in the runtime driver. Five ticks max catch-up; excess enters explicit `recovery/scheduler-lag`, no further ticks until resume. Wall time during pause/recovery is not simulated; no speed adjustment. `startMainThreadClock` takes injected now/schedule/cancel, uses timers, returns owned disposer. Caller stops/pauses on terminal/host lifecycle; new UI integration belongs to later phases. Do not silently resume a ranked session after recovery without a future reviewed policy.

Fixture body/food overrides allow edge-state tests, not future ranked configuration. Benchmarks use a legal fixed loop, every tick moves (higher cadence than intended gameplay), and food outside that loop to keep exact tested lengths. Separate actual consumption tick samples include grow/score/full food selection; setup/clone is excluded. Browser zeros in tiny movement samples mean timer quantization, not zero cost. No rendering is measured in Phase 2A.

Default runtime stays **main thread**; no Worker runtime/SAB introduced. Later integration must follow `docs/arcade-host-phase2a-contract.md`. Phase 2B requires review.
