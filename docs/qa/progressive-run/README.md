# Progressive single-run architecture — DEV / NOT balanced

Motion foundation: Smooth V4 `fa8c3d1`, byte-identical. Base feel B; Forest cabinet/HUD/floor and existing red mushroom retained. No publication/backend/attempts. No ImageGen or final biome/music polish.

Playable URL: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html

Default: progressive Forest, balance B + Smooth V4. `Forest / Caves / Swamp / Late Game` start fresh previews. `Expand world` records a DEV command, processed on the next canonical tick; it does not teleport/restart the Snake. Pressure/frequency/density/caps/threshold settings apply with the existing Apply/restart button. Camera debug changes presentation only. Previous static A/B/C + density comparison remains available under Run model. No GAME FEEL/balance approval declared.

## 1. Progression and dimensions

Chosen model, reported before threshold tuning: **RunProgress = collected standard mushrooms**. No idle-time contribution; no score or length double counting. Harvest/spores/portal-prize scores do not advance progress. Thresholds below are provisional DEV constants, editable in Lab/config, not a balance decision.

| Mushrooms | Stage | Active logical world | Base target speed range | Biome score multiplier |
|---:|---|---|---|---:|
| 0 | Forest | 28×12 | B 4.2 → cap6 | ×1.00 |
| 12 | Forest growth | 36×18 | B → cap6 | ×1.00 |
| 30 | Caves | 48×24 | floor5.5 → cap7 | ×1.20 |
| 65 | Swamp | 64×32 | floor6.5 → cap8 | ×1.45 |
| 110 | Endless1 (Forest variant) | 80×40 | floor7.5 → cap8.5 | ×1.60 |
| 160 / 210 / 260 / 310 | Endless2/3/4/5 | 88×44 / 96×48 / 104×52 / 112×56 | bounded cap8.5 | ×1.68 / 1.76 / 1.84 / 1.92 |

Then every50 mushrooms cycles Forest → Caves → Swamp variants; world remains112×56, multiplier caps×2.00, pressure caps1 and speed remains bounded. Endless interval is a config constant. Announcements are nonmodal, 2.5s maximum; length30/100/250 also gets a short banner. Threshold-crossing mushroom is awarded under the outgoing biome; later mushrooms use the new multiplier.

### World / viewport separation

Backing coordinates are fixed-stride112×56 (6,272 bounded cells); active world begins28×12, outside territory is blocked. Expansion opens east/south territory without changing any cell id. Body/occupancy arrays, growth, motion history, moves/material phase, food, pickups, effects, combo and input queue remain in place. Only topology/hash and stage/director configuration change. Newly revealed terrain receives a small deterministic obstacle set; existing territory/entities are never rerolled.

Viewport remains28×12, interior26×10. Desktop1920×1080 cell66.47px; mobile844×390 cell30.03px, unchanged across all preview worlds. No continuous shrinking. World bounds/camera do not enter gameplay hash. Progressive desktop/mobile use identical topology/state: unlike the prior static comparison, D-pad is an overlay, not a logical blocked plinth.

Dead zone relative to viewport: desktop x7–20/y3–8; mobile x8–19/y4–7. Camera stays still within that zone, follows the same interpolated head when it crosses the zone, clamps to active world, and freezes on pause. Portal atomic transfer repositions the camera immediately; no map-crossing pan. HUD/cabinet stay fixed. World reveal is immediate legal territory with a short banner; floor biome changes blend over120 simulation ticks, no abrupt one-frame replacement. New camera bounds enable further travel without changing scale.

## 2. Extended B cadence

Natural Forest preserves the existing B target curve during its early first minute: grace12s, target starts4.2, exponential approach toward7.5. Progressive Forest clamps at6. Later stages add `min(1.8, max(0, mushrooms − CavesThreshold) ×0.012)` and use the stage floors/caps above. Cadence is an integer60Hz ticks/cell: `max(ceil(60/stageCap), round(60/target))`. Effective caps therefore quantize: Forest6.00, Caves6.67, Swamp/Endless7.50 at default settings. The Lab reports actual effective speed, not just target.

Existing Focus/Rush cadence arithmetic remains: Focus `ceil(base×1.25)`; Rush `max(5, round(current×0.8))`. With allowed base caps≤9, the strongest temporary Rush is bounded at10 cells/s, not infinite acceleration. Higher stage floor can intentionally increase speed on chapter entry; this needs human tuning. Preview buttons use the relevant floor immediately, but create no earned score/mushrooms.

## 3. Deterministic Content Director

One director runs from canonical session ticks, no new timer/RAF owner. Separate seeded director state and all schedules/warnings/counters are hashed. Standard food still uses the existing atomic one-mushroom spawn/replacement procedure, with B preferred5–12 cells and initial4-cell exception. Director adds modifiers/opportunities without replacing standard food.

Auto pressure = `min(1, 0.12 + RunProgress/180 ×0.88)`. DEV can override0–1 (`-1`=auto). Base intervals positive10s / negative18s / portal45s. Each next opportunity uses `max(minimum, base ×(1−0.45×pressure) ×biomeFactor)`: minima4/8/24s; Caves portal factor0.85; Swamp negative factor0.85. First portal stays30s, window10s, existing transfer FSM/cooldown20s. No catch-up bursts. Missed/cap-suppressed pickup attempts schedule the next interval, not a backlog.

Field pickups≤3, one of each kind. Active slots2 positive +1 negative; same kind refreshes duration/charge, not intensity. Field lifetime20→14s with pressure. Early Forest weights Focus/Harvest (Harvest duplicated); first expansion unlocks Anchor/Guard/Corruption/Combo−; Caves unlocks all candidates. Above pressure0.45, Spores/Portal-prize and Roots/Corruption get extra choice weight; Swamp also biases Roots/Corruption. The candidate switch disables all new kinds. Difficulty does not spawn every event indefinitely faster.

Obstacles: initial one stone (density0 disables it); expansion adds sparse roots (Forest), three-cell crystal formations (Caves), stumps (Swamp), in newly revealed territory only. Density0–6 controls additions, not art scale. These are simple placeholder families, not approved final biome designs. Avoid claiming recolor alone completes mechanic identity: Caves changes passage formations/portal opportunity, Swamp changes negative-event mix/temporary hazards and scoring risk.

## 4. Bonuses/debuffs — DEV candidates

| Effect | Definition |
|---|---|
| Focus / Harvest / Rush | Existing10s slower-control /12s ×2 mushroom score /7s acceleration; unchanged mechanics |
| Anchor | 8s combo clock freeze; no movement/score/progress modification |
| Spores | 10s activation; each mushroom releases up to2 optional +25×biome spores near the route, lifetime5s, field cap4; never replaces standard food or advances RunProgress |
| Guard | One environmental impact absorbed, charge expires20s. Body holds position for a cell interval to allow a turn; obstacle stays solid. Never permits self collision or walking through a wall/stone. Original queued input remains intact. |
| Portal prize | One successful transfer within18s awards300×biome and +2 combo (cap8), refreshes combo clock, consumes charge. Rejection gives no award. |
| Corruption | Mushroom award ×0.6 for8s, no movement/input effects |
| Combo− | Combo timeout7s for8s, no input changes |
| Roots | Up to2 hazard cells: visible2s warning, then6s solid lifetime; 20s scheduling cooldown. Revalidate at activation; skip unsafe warning cells. |
| Mist | 6s edge-only12% veil, center remains unobscured; no reversed/delayed controls |

Hazards exclude body/food/portal/pickups/spores/warnings, stay≥4 Manhattan cells from body/portals and≥3 from food, need four free neighbours. Validate connected terrain and preserve dynamic reachable area/food access before commit. Recheck after warning; cleanup restores topology on expiry/death. Never random immediate placement/death. Guard self-collision exclusion and warning invalidation are tested separately.

Candidates use distinct native pixel symbols, HUD timer/charge, individually pitched short180ms DEV cues and ≤350ms pickup pop. These are temporary functional assets, not a final art/SFX commission. Music uses the existing Forest track plus separately composed placeholder Caves (low resonant sine/harmonic melody) and Swamp (pulse/bass melody) loops, same mixer/context, 2s crossfade. No slowed/recolored copies of Forest music; no final music production. At most two music voices during natural crossfade; pause/restart/dispose stop all owned sources.

## 5. Scoring and ranked boundary

Mushroom award = existing rounded base/speed/combo award × Harvest, then biome multiplier and optional Corruption, rounded deterministically. Speed reward uses initial B cadence14 against current base cadence; no idle survival score. Optional spores and charged portal reward are the only new score paths. Combo remains cap8, step0.15, standard timeout12s. Later biome multipliers are DEV constants, capped×2.

Future ranked contract: `docs/mushroom-snake-ranked-contract-draft.md`. Separate Snake namespace; server-authoritative rules/score verification; 3 regular +2 verified sponsor attempts; source-audited rolling24h policy resolved by server, not client; reservation/start commit/finalize separated; operation-id deduplication, opaque token finalizes once; identical retry returns receipt, conflicting duplicate rejected; replay/evidence hooks; season best single-run score. No DB/auth/backend integration here.

## 6. Verification and limits

Targeted unit tests: progression/config bounds and early B cadence; moving expansion entity/array preservation; replay/hash parity desktop/mobile; camera/render read neutrality; 2+1 slots/refresh; Anchor/Corruption/Combo−; Guard versus environment/self; warning safety/expiry/death cleanup; spores/one food; successful portal prize/camera snap; byte comparison of locked V4/core/Forest/B files.

Browser checks: actual keyboard/mobile D-pad, all four chapter previews at1920×1080 and844×390/DPR2, unchanged cell size, live250+ body, portal in follow mode, pause alpha/hash/camera/audio/timer freeze, resume, restart; errors/network recorded in `browser.json`. Two screenshots only. Offline natural long-run evidence is `long-run.json`, not a benchmark or human-fun metric. No privileged controller is imported by the playable game.

Food QA separates unsafe occupied/blocked/forbidden placement, unreachable-at-spawn, and topology-induced invalidation from transient reachability as a long body curls around existing food. The latter can happen in classic Snake without bad spawning. It is recorded, not hidden: conservative planners can loop/stall. Natural long runs show actual chapter transitions and250+ growth; parity does not prove balance/fun. No full final visuals, no claim that portal/event mix is tuned or every candidate is production-ready. Stop for human play review.

### Checkpoint evidence

- Targeted Node suites: **30/30 pass** (progressive, Lab, prior static design, live Ribbon V4).
- Lifecycle/browser fixture: **18 checks pass**, desktop1920×1080/DPR1 and mobile844×390/DPR2, **0 console errors /0 network failures**. Includes two expansions during motion, crossfade settling,250+ length, portal in camera-follow mode,2+1 effects, pause/resume, restart and death cleanup.
- Handoff controls: **12 checks pass**, both viewports; accurate stage speed/biome score readouts, active-world versus backing dimensions, three render modes preserving paused hash, previous static model and Forest restoration. Pointer focus prevention is checked through a cancellable pointerdown event; this is not a claim of uninterrupted play while scrolling the page to an offscreen expansion button.
- Natural successful witness: seed56103, **755.37 active seconds**,260 mushrooms, **length268**, Forest→Forest growth→Caves→Swamp→Endless4, final world104×52. Desktop/mobile command replay hashes both **`b37adb8c`**. Unsafe food0, unreachable-at-spawn0, expansion invalidation0. Temporary dynamic food-unreachability14605 ticks is separately recorded.
- Censored planner witness: seed17 reached every chapter but ended at132 mushrooms/length140 after289s with the existing **`no-legal-food`** reason. Do not interpret the successful witness as universal survivability; this failure is retained in the same JSON.
- Natural successful witness exercised82positive/39negative/27portal opportunities and7bonus spores, but no Roots hazards. Hazard safety/activation/cleanup has separate targeted tests; do not claim natural play exercised every candidate.
- Locked core, motion geometry/material, B constants and Forest source checks pass. Production/TEST manifests and immutable release bundles are untouched.

Reproduce with a local repository server on8775:

```powershell
node --test arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/tuning-lab/lab.test.mjs arcade/snake-next/tuning-lab/design.test.mjs arcade/snake-next/forest-training/ribbon-live.test.mjs
node arcade/snake-next/progressive-run/long-run.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/progressive-run/browser-qa.js
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/progressive-run/handoff-qa.js
```

The two browser scripts require an already open Playwright CLI session. Natural planner commands are offline test fixtures, not a playable autopilot. These checks measure correctness, not performance, balance, visual approval or final music quality. The Playwright CLI verification workflow informed the desktop/mobile lifecycle and control checks; it made no changes to locked character/cabinet artwork.
