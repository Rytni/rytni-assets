# V5.6 Forest + Training — local human review candidate

DEV: <http://127.0.0.1:8773/arcade/snake-next/forest-training.html>

Gallery: <http://127.0.0.1:8773/docs/qa/forest-training/review.html>

No TEST/Production publication, push, Hub registration or backend work. V5.6 character, floor, frame and existing object assets are unchanged. All 165 inventory hashes verified; geometry/connector regression: gaps/mismatch/overlap = 0 at DPR 1 / 1.5 / 2.

## Implemented mechanics

- One bounded Forest arena, 28×12 canonical cells. Immutable topology, eight-cell start, three sparse collision rocks, visible perimeter. Touch sessions reserve a visible control plinth (5×4 cells); its immutable topology survives orientation/resize. D-pad is 2×2, four 44×44 hit targets with pressed states, inside the arena corner; hidden on mouse desktop.
- Existing deterministic core step, occupancy/ring body, collision, two-turn queue and fixed 60 Hz main-thread clock remain byte-unchanged. Approved raster piece selection/rendering remains unchanged. All body parts move on the same canonical cell boundary: no separate interpolation, shadow, camera or head/tail clock. This slice uses crisp discrete retro movement, not a newly invented smooth renderer.
- Session orchestration adds deterministic effects/portal/scoring above the core. `Session.hash()` includes core hash, active tick, effects, pickup PRNG, score, portal state and transit input. Replay records input arrival, including during portal entry. Core-only hash is not the complete slice replay contract.
- Exactly one Magical Seed while playing, replaced synchronously in the consume tick; core grows one cell per seed. No seed inside body, collision, control plinth, pickups or portal cells. The adapter repairs forbidden core candidates immediately. Saturation/no legal food becomes an explicit terminal result, not an indefinitely missing seed. Seed idle bob, four-frame authored burst, compact rising award, pickup/combo sound.
- Combo rises to 8 with successive seeds within 10 active seconds; otherwise resets. Award: `round(100 × (1 + (15−baseCadence)×0.08) × (1 + (combo−1)×0.15))`, doubled by Harvest. This is Training scoring only; canonical core seed score remains 100.
- Focus: 10 seconds, cadence ×1.25 rounded up (survival through calmer movement). Harvest: 12 seconds, ×2 seed award. Rush: 7 seconds, cadence ×0.8 rounded, minimum 5 ticks/cell (readable speed pressure, no inverted input). Max two positive + one negative. Duplicate refresh replaces expiry, never adds a slot. Full category cannot spawn; positive duplicates can appear while the category still has room. At most three field pickups; spawn attempt every 8 seconds after an initial 3 seconds, 20-second field lifetime. Positive wings, seed, negative spiked shape remain distinct; Harvest has ×2 badge. HUD cards contain timer and bounded progress.
- Cadence starts at 15 ticks/cell = 4 cells/s for 15 active seconds. Then `max(6, 15−floor(min(max((tick−900)/1800, foods/7), 1+(tick−900)/300)))`. Base cap 6 = 10 cells/s; time-only cap at 285 seconds. Integer cadence steps; food-driven acceleration is capped by a five-second progression envelope after the calm start. Effects deliberately alter speed with their explicit timer.
- Death: existing negative impact burst, coherent body fade/freeze for 27 fixed ticks (450 ms), then Result. No gameplay simulation during impact. Restart stops the old driver/RAF/sources, discards session/effects/portal/commands and constructs exactly one new session. Main retains decoded reusable art/audio and a static menu preview, but no active session/clock/RAF/audio sources.

## Portal

`inactive → armed → entering → teleport → exit-grace → cooldown → armed`

Pair at (10,3) / (18,8), armed after 10 active seconds. Entry 12 ticks (200 ms), one teleport tick, exit grace 36 ticks (600 ms), cooldown 90 ticks (1.5 s), re-arm only after leaving the portal cell. Grace prevents re-entry, not collision immunity.

Transfer translates the entire canonical body, validates bounds/collision/continuity through `createState`, preserves growth/score/tick/queue/PRNG/input counters, sets movement phase to zero and validates reachable food. Unsafe transfer changes no body state; cooldown plus compact “ВЫХОД ЗАНЯТ” feedback. No interpolation/camera across the jump. Entry/exit use one coherent sprite alpha dissolve/reassembly, existing portal burst and distinct cues. Transit inputs retain the same bounded canonical queue semantics. Pause cancels incomplete entry/teleport into cooldown; other phases freeze. Restart resets to inactive. No portal-owned async timers.

## Audio

Existing `production/audio.js` Master/Music/Effects mixer reused without importing or modifying Fly/legacy/Hub. Retained originals:

- `arcade/snake-next/assets/audio/forest-theme-v1.ogg`: original 32-bar melodic/rhythmic Forest theme, 96 BPM, decoded duration exactly 80 s; PCM loop edge delta ≈0.000285.
- `pickup-v1.wav`, `combo-v1.wav`, `death-v1.wav`, `result-v1.wav`, `click-v1.wav` and existing UI cue buffers in the same directory.
- Four original small new cues: `forest-training/audio/buff.wav`, `debuff.wav`, `portal-enter.wav`, `portal-exit.wav`; authored source `create-cues.cjs`, no external samples. Turn cue is intentionally not played on every turn to avoid constant noise.

Fifteen buffers decoded once. One music loop, total source ceiling eight. Added per-source headroom: music ×0.5 / cues ×0.16; measured buffer peaks ≤0.503, worst-case summed bound <0.814 even with sliders at 1. Music and sources stopped on pause/Main/restart. Physical-speaker/listening approval remains human QA; waveform/loop/headroom checks do not prove subjective music quality.

## Verification

47 Node tests PASS: foundation, presentation, locked art/geometry plus twelve slice tests. Full foundation files unchanged. Replay including portal-transit input agrees at every tick.

Playwright CLI, clean Edge contexts:

- Main → help/back → settings/volume → Training, real seed/growth, WASD/arrows, pause with unchanged hash, Settings from Pause, resume, impact/Result, Play Again, Main/reopen.
- Three effects collected via actual movement from explicitly arranged QA cells; refresh, legal 2+1, pause, three repeated cycles with **real 12.5-second active expiration**, no effects left. Mobile HUD progress stays inside cards.
- 30 alternating A↔B transfers: canonical legal starting arrangements, then real movement triggers the actual complete FSM, not a mocked teleport call. All successful, zero duplicate triggers/rejections. Pause/restart checked for every phase. Additional four natural portal transfers during soak.
- Desktop 1366×768 / 1920×1080; fullscreen enter/Escape exit, including Playing retention; resize leaves canonical body unchanged.
- Mobile 844×390 / 915×412 at DPR 2: actual D-pad turn/pressed capture, pause/resume, portrait 390×844 prompt and return to landscape, Main cleanup.
- 10-minute **automated Playwright keyboard-input** soak: 600,013 ms, 35,979 active ticks, 228 seeds, maximum length 73, three deaths/restarts across four sessions, four natural transfers, zero scheduler recovery. No forced seeds/effects/body edits in this soak. Sampled overlapping render windows p50/p95/max: 0.3 / 0.5 / 14.3 ms. It is automation, not a human assessment of fun.
- Application errors 0; game warnings 0; failed requests 0; HTTP/404 0; duplicate Snake art preload 0. Reopen asset/audio requests 0. Main counters: active sessions / RAF / timers / audio sources = **0 / 0 / 0 / 0**.
- One browser smoke blocker corrected locally: explicit fullscreen Escape ownership in the DEV input handler. Repeated public-channel code/deploy was not involved.

## Render measurements (milliseconds)

Whole `TrainingGame.render()` JS duration, including canvas submission + HUD, not GPU/frame presentation time. 30 warm-up / 180 measured RAF frames per fixture, 1366×768 DPR 1, same renderer/locked art. Length 500/1200 uses a canonical 96×64 fixture clipped to a 28×12 viewport; these lengths cannot fit the normal bounded Training arena.

| Length | Desktop p50 / p95 / max | CPU×4 initial p50 / p95 / max |
|---|---|---|
| 8 | 0.1 / 0.2 / 0.3 | 1.0 / 3.2 / 5.9 |
| 100 | 0.1 / 0.2 / 0.5 | 1.7 / 3.6 / 8.3 |
| 250 | 0.3 / 0.5 / 0.7 | 1.8 / 4.3 / 20.6 |
| 500 | 0.5 / 0.8 / 2.7 | 3.2 / 4.8 / 11.7 |
| 1200 | 0.6 / 1.1 / 1.5 | 4.5 / 7.4 / 10.4 |

Initial run overlapped the other browser soak. Targeted isolated **unprofiled** CPU×4 confirmation: 250 = 0.9 / 1.1 / 1.3; 1200 = 1.6 / 2.1 / 2.6. A separate sampled CPU profile at 1200 recorded 1.8 / 2.4 / 3.0, no >16 ms frame. Main sampled cost was native drawImage / raster render and existing canonical sprite selection/body collection; GC samples were present. The 20.6 ms spike did not recur. Exact original spike attribution is **not proven**; host contention/JIT/GC variance is possible. Both original and repeat results retained, no speculative renderer rewrite or gameplay fidelity reduction.

Raster: images 3,945,920 bytes (3.76 MiB); one canvas + one cached ground. Desktop 1366 total ≈11.77 MiB, 1920 DPR1 ≈19.58 MiB. Mobile DPR2: 844 ≈13.81 MiB; 915 ≈15.27 MiB. Decoded audio additionally ≈15.49 MiB, separate from raster; no duplicate atlases/resources needed on reopen.

## Limits / stop gate

- No physical touch device, hardware fullscreen/orientation-lock policy, Safari/WebKit, mobile GPU thermal or speaker/listening QA. Mobile dimensions/touch capability are browser emulation. Orientation asks the player to rotate; no claim of hardware orientation locking.
- Human fun/readability/visual approval is still pending. Approved character art has not been “improved” by integration.
- Fixed finite arena, no endless world, Caves/Swamp/ranked/sponsor/backend/public Hub integration. Long performance fixtures are not reachable lengths in this arena.
- Current retro movement is canonical discrete cell movement; no new interpolation design. Camera is stationary in the playable arena; long-body QA uses a fixed clipped viewport.
- Raw artifacts: `flow-results.json`, `effect-results.json`, `performance.json`, `performance-confirmation.json`, `profile.json`. Full overlapping soak samples retained locally in `soak-results.json` (not included in checkpoint to avoid a 7 MB duplicated sample log).

**STOP for human gameplay + visual review. One local checkpoint only; no deployment.**
