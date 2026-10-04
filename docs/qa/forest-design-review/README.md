# Forest gameplay design review — Smooth V4 locked

Approved motion foundation: `fa8c3d1`. Balance: B. This checkpoint adds only DEV topology choices and read-only measurements to the existing Game Feel Lab. No winner, production/default change, art change, mechanic redesign, benchmark or deployment.

DEV URL: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html

## Design assessment

Current is a plausible early/mid-game arena, not demonstrably oversized. At length 8 it intentionally has substantial room; by length 100 the body occupies 39–42% of traversable space. Length 250 is nearly full on desktop and exceeds mobile capacity. Mobile is mechanically tighter because the existing D-pad plinth blocks 20 logical cells, not just visually smaller.

Do not pick an arena from these measurements alone. Compact raises routing pressure; Expanded provides capacity but makes objects smaller on mobile. Human should compare all three with balance B + Smooth V4, initially MEDIUM stones, then LOW/HIGH. Arena A/B/C is independent of the existing balance A/B/C buttons. Selection starts a clean run; existing balance selection is retained. Default remains Current + MEDIUM + B + Smooth V4.

First-minute food pacing is reasonable in the legal-input models: about 23–29 mushrooms/minute and 1.94–2.56 seconds per collected trip. Combo is easy for these planners early. Later route safety/detours cause much longer gaps; this is not evidence that the food RNG routinely chooses impossible distances. Stones currently provide little shortest-route pressure. Portal utility and effect comprehension remain the largest unanswered human-design questions.

## Arena measurements

Logical dimensions include the blocked perimeter. Effective traversable count excludes walls, stones and the existing mobile plinth, but not the Snake/items/portal endpoints. Vacant means traversable minus current Snake length only, not spawn-eligible/reachable cells.

| DEV arena | Logical | Interior | Interior cells | Traversable desktop / mobile | Initial vacant desktop / mobile |
|---|---|---|---:|---:|---:|
| A Compact | 24×11 | 22×9 | 198 | 195 / 180 | 187 / 172 |
| B Current | 28×12 | 26×10 | 260 | 257 / 237 | 249 / 229 |
| C Expanded | 34×14 | 32×12 | 384 | 381 / 361 | 373 / 353 |

Counts above use MEDIUM (3 stones). LOW/MEDIUM/HIGH contain 1/3/6 stones. Current logical aspect is 2.333; interior aspect is 2.600. Current stones occupy 3/260 = 1.154% of interior cells. Mobile Compact trims the existing plinth at the smaller arena boundary (15 blocked cells); other arenas retain 20.

| Current Snake length | Occupancy desktop | Occupancy mobile | Capacity implication |
|---:|---:|---:|---|
| 8 | 3.11% | 3.38% | Wide early routing freedom |
| 30 | 11.67% | 12.66% | Still ample total space |
| 100 | 38.91% | 42.19% | Body layout becomes important |
| 250 | 97.28% | 105.49% | 7 spare desktop cells; impossible on mobile |

Total capacity does not guarantee safe routing or successful food placement. Compact cannot contain length 250 on either device. Expanded can (65.62% desktop / 69.25% mobile).

### Responsive presentation

Measured in the existing cabinet at desktop 1920×1080 and mobile 844×390. Values are CSS pixels; art retains 36/68 body/cell proportion. Logical worlds actually differ; this is not a Snake-only scaling trick.

| Arena | Desktop cell / body | Mobile cell / body |
|---|---:|---:|
| Compact | 78.55 / 41.59 | 33.83 / 17.91 |
| Current | 66.47 / 35.19 | 30.03 / 15.90 |
| Expanded | 54.00 / 28.59 | 24.88 / 13.17 |

Desktop stage remains shrink-wrapped (unused space <0.01px). Mobile retains four ≥44px D-pad targets inside the arena. Expanded mobile readability needs human review. Only the DEV host adapts dimensions; Forest's default renderer/runtime/styles are untouched.

### Cross-arena travel at balance B

Unobstructed, effect-free, instantaneous effective speed; these are not measured human trip times. Current interior extremes are 25 horizontal / 9 vertical / 34 corner-to-corner Manhattan cells.

| Active time | Target cells/s | Ticks/cell | Effective cells/s | Horizontal | Vertical | Opposite corners |
|---:|---:|---:|---:|---:|---:|---:|
| 0s | 4.200 | 14 | 4.286 | 5.83s | 2.10s | 7.93s |
| 60s | 5.517 | 11 | 5.455 | 4.58s | 1.65s | 6.23s |
| 120s | 6.450 | 9 | 6.667 | 3.75s | 1.35s | 5.10s |
| 300s | 7.344 | 8 | 7.500 | 3.33s | 1.20s | 4.53s |

## Food and obstacles

Exactly one standard red mushroom while a legal food cell exists. Initial food is an intentional exception: 4 cells directly ahead. Replacement prefers reachable candidates 5–12 Manhattan cells away, falling back to other legal reachable candidates when necessary. The range is not a hard guarantee. Replacement remains atomic (0 ticks); food/growth/scoring code is unchanged.

Across first-minute models, mean replacement distance is 7.97–8.56 cells desktop and 7.93–9.31 mobile. Mean travelled trip is 8.92–10.52 / 9.22–11.57 cells respectively; body-safe detours explain the difference. Seven replacement fallbacks across all probes were closer (1–4), not farther. Later mean collected trips can approach 20 cells despite roughly 8-cell spawn distance. Telemetry displays spawn Manhattan/terrain distances, elapsed seconds, travelled cells, pickup/minute and mushroom stalls separately.

Current stones: (5,2), (23,3), (14,9), using logical coordinates. Minimum pair Manhattan spacing 15; minimum distance to initial Snake 3, initial food 5, portal endpoints 5. Narrowest stone-to-wall corridor is one free cell row. Terrain is connected, with at least two exits per static free cell; no sealed/dead-end static spawn trap in all 18 DEV combinations. Dynamic body enclosure is a separate issue.

Food and pickups can legally appear one cell from a stone; there is no extra clearance guarantee. Only 4/785 food spawns (0.51%) in these models required a stone-induced terrain detour, maximum 2 extra cells. This compares shortest terrain paths with/without stones and ignores Snake occupancy. Stone approaches count entry into cardinal adjacency, not collisions or proof of an interesting choice. Current obstacles are sparse and weak at forcing direct-food reroutes; this does not establish that HIGH is better or that stones are annoying.

## Exact current mechanics

Definitions are from unchanged `forest-training/session.js` and B tuning configuration.

| Mechanic | Actual behavior | Design implication / comprehension |
|---|---|---|
| Focus | 10s; cadence `ceil(base×1.25)` | Roughly 20–22% slower. More control/safety, but costs timed-combo and detour pace. Cyan/open pickup and HUD timer announce an effect; exact benefit still needs uninstructed human review. |
| Golden Harvest | 12s; doubles the already-rounded mushroom award; no speed change | Encourages food collection now. Gold mushroom and ×2 badge communicate the link better than the shared positive-pickup silhouette alone. |
| Rush | 7s; cadence `max(5, round(current×0.8))`, after Focus | Base14→11 gives +27.3% speed; base8→6 gives +33.3%. It is a risk, not pure punishment: skilled players can collect faster. No direct Rush score multiplier. Whether control pressure is fun remains unproven. |

Positive spawn attempts every 10s total, randomly choosing eligible Focus/Harvest, not each kind every 10s. Negative attempts every 18s. Field lifetime 20s; at most three field pickups and one field pickup per kind. Active slots allow two positive + one negative. Same kind refreshes duration, not intensity. Capacity/eligibility can suppress attempts; actual counts are not guaranteed. Focus/Rush approximately cancel by their cadence arithmetic, so that pairing can be mechanically redundant. Harvest is the strongest explicit incentive; Focus is situational rather than universally beneficial. No redesign performed.

Combo timeout 12s; reward step 0.15; maximum combo 8 → multiplier 2.05. Score also includes the existing base-cadence speed factor, then Harvest doubles the rounded award. First-minute average combo is 6.79–7.03 and maximum 8 in all models. Early routes leave a large margin under 12s; pressure mostly emerges with longer body-safe detours. Later breaks are timeout/death, not evidence of distant-food RNG alone.

Portal: first window 30s, period 45s, visible window 10s, cooldown 20s. Enter dissolve 12 ticks, atomic transfer on the next tick, exit-grace 36 ticks. Destination is one cell beyond the paired exit in the incoming direction; the whole body translates rigidly. Blocked/out-of-bounds placement rejects. No scoring reward is added: utility is a positional shortcut/escape. Both circular endpoints identify one category, but destination/safety understanding needs human testing. All 12 models used it zero times, including the opportunity planner. Local food distances and conservative whole-body transfer checks often offer little benefit; this flags underuse, not proof that portals are useless.

## Event density: modelled, not typical human runs

Two deterministic legal-input policies (food-first and opportunity-aware), seeds 56103/17/777, desktop/mobile: 12 runs at 60/120/300s horizons. No forced spawns, restarts, length caps or simulation overrides. Policies seek body/tail-safe routes, avoid Rush, and the opportunity policy only takes a portal when estimated route cost improves. This biases portal/negative use downward and can produce artificial looping. These probes cannot measure fun, frustration, understandable icons, or the absence of meaningful human choices.

Ranges below include only runs completing the requested horizon. Pickups are collected items, not field spawn attempts.

| Device / horizon | Completed | Mushrooms | Positive | Negative | Portal appearances / uses | Stone approaches | Combo breaks |
|---|---:|---:|---:|---:|---:|---:|---:|
| Desktop 60s | 6/6 | 25–29 | 2–4 | 0 | 1 / 0 | 7–18 | 0 |
| Desktop 120s | 6/6 | 35–52 | 2–9 | 0–1 | 3 / 0 | 21–37 | 0–1 |
| Desktop 300s | 5/6 | 35–91 | 2–24 | 0–2 | 7 / 0 | 69–96 | 1–2 |
| Mobile 60s | 6/6 | 23–29 | 0–5 | 0–1 | 1 / 0 | 4–16 | 0 |
| Mobile 120s | 6/6 | 41–58 | 2–10 | 0–1 | 3 / 0 | 21–35 | 0–1 |
| Mobile 300s | 4/6 | 41–96 | 3–14 | 0–1 | 7 / 0 | 81–149 | 1 |

Successful field spawns: 60s positive5–6/negative2; 120s positive9–12/negative3–4; completed300s positive22–30/negative8–9. Mean bonus spawn distance: first minute 8.00–14.57 cells; completed300s 7.55–11.44. Average vacant cells: first minute desktop234–237/mobile214–217; completed300s desktop201–219/mobile172–194. Vacant cells can be far from the head or enclosed by the body.

No event-quiet proxy interval >8s in the first minute. Later maxima 9.03s desktop / 9.60s mobile are flagged. This proxy resets on field spawns, portal appearances, collected events, combo breaks and stone approaches; it must not be interpreted as proof that the player never idles. Separate mushroom-gap telemetry reveals stalls up to 219s in conservative loops. They require human review, not a forced-spawn solution: the models may decline reachable-but-risky routes. No claim of human satisfaction or no-idle guarantee.

Censored outcomes, excluded from completed300s ranges:

- Desktop food-first seed777: wall death at201.73s, length47.
- Mobile opportunity seed56103: self collision at182.08s, length61.
- Mobile opportunity seed17: core `full / no-legal-food` at142.87s, length64, despite173 globally vacant traversable cells. The body enclosed the reachable legal food region. This is a reachability/terminal-state design edge case, not true whole-board capacity exhaustion; reported without changing locked rules.

## Focused verification and review handoff

Targeted Node suite: design, existing tuning lab, ribbon-live. Topology/runway/food/portal safety checks cover all 18 combinations; B/MEDIUM retains baseline hashes. Read-only measurements/telemetry preserve hashes. Approved V4/core/Forest/effects/scoring/portal files compare unchanged to `fa8c3d1`; existing V4/V2/GRID replay parity remains covered at8/30/250.

Browser checks cover all 18 combinations at1920×1080 and844×390/DPR2, using real keyboard/D-pad input. Inspect `browser.json` for current results; console/network errors0 in the final run. Desktop shrink-wrap and mobile ≥44px controls verified. Rapid native select/focus/layout transitions initially exposed scheduler-recovery pauses. The DEV host now coalesces clean restarts after two animation frames, before starting the unchanged clock; it also avoids redundant invalidation of an already-sized board. No clock, cadence, V4 geometry or simulation changes.

Artifacts: `measurements.json` (all static combinations, travel calculations, horizon snapshots and detailed trips), `browser.json` (responsive control checks), `desktop-current.png`, `mobile-current.png`. Snapshot summaries are cloned at each horizon so later combo breaks cannot leak backward.

Human review priorities: food/combo pressure versus monotony; stone detours versus clutter; Focus usefulness; deliberately exploiting Rush; understanding Harvest/portal endpoints without instructions; mobile Expanded readability. Keep arena and density distinct from balance, and copy run results before comparing. No arena winner or GAME FEEL LOCK declared. Stop here for human gameplay review.
