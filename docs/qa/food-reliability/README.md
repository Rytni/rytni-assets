# Progressive food reliability — diagnostic / DEV only

Baseline: `c2ab616`. No progression, dimensions, intervals, multipliers, speed, art, music, ranked/backend or renderer tuning. Shared canonical core/input/collision and original static Forest Session remain unchanged. Reliability overrides live only in `progressive-run/session.js`, `food.js`, and hazard validation in `world.js`.

## Exact seed17 root cause (reported before the fix)

The immutable baseline reproduces **tick17340 /289s /132 mushrooms /length140 /hash `f4322411`**, world80×40. Head `(25,29)`, direction DOWN; tail `(26,29)`. All four head neighbours are occupied:

| Direction | Cell | Body index |
|---|---:|---:|
| Up (reverse /neck) |3161|1|
| Right (movable tail)|3274|139|
| Down|3385|137|
| Left|3272|125|

The exhaustive core flood-fill correctly returns **0 reachable vacant candidates**. It can traverse the tail while growth=0, but the tail is itself occupied and its other exits are also body cells. There are **2809 vacant terrain cells** elsewhere (2949 traversable−140 Snake), so this is not board-full.

The actual defect is **transient body topology misclassified as terminal spawn failure**: after consumption, `simulation/step.js` sets `full/no-legal-food`; inherited `Session.repairFood()` immediately returns because state is not `playing`, before trying a session fallback. The session then kills the run. No candidate retry-budget exhaustion, no5–12 restriction (failure precedes preference filtering), no forbidden-mask exhaustion, no active temporary hazards, no camera involvement, no active-world bounds bug. Static reachability is truthful for that instant, not proof that the moving Snake can never open a route.

`seed17-before.json` preserves exact body/obstacles/events. `food-reproduce.mjs` loads affected modules from immutable `c2ab616` using local Git objects, resolves remaining locked imports normally and asserts the original hash. No checkout reset or gameplay source replacement is needed.

## Algorithm / outcomes

The existing initial4-cell runway mushroom is unchanged. Subsequent placements preserve the normal seeded5–12 Manhattan preference and original BFS candidate ordering:

1. Legal reachable5–12 cells: seeded selection.
2. Wider legal reachable1–24 cells: seeded selection.
3. Any legal reachable active-world cell: seeded selection.
4. Independent exhaustive flood-fill with local buffers, row-major legal-cell enumeration, deterministic first legal cell. Also recovers primary-search exceptions/invalid counts/field disagreements, without placing an unverified candidate.

Before any placement, independently validate the selected cell against body occupancy, active-world bounds, solid topology and portal/pickup/spore/warning exclusions. Hazard cells are solid topology. No camera coordinates or random retry budgets are used. Reference traversal uses the same first-step reversal prohibition and nongrowing-tail traversal rule as the canonical core.

Outcomes are explicit:

- `spawned`: a legal reachable cell with recorded tier.
- `temporarily unreachable`: terrain has vacancy but no currently reachable legal spawn. Keep food=-1 rather than cheating with an isolated placement; restore only food-starvation `full` state to playing, preserve body/input/effects/combo, retry after canonical movement/topology change. Existing legal food is preserved even when body motion transiently closes its route.
- `board_full`: exhaustive physical active-world vacancy=0. A full-board terminal is not mislabeled as generator failure.
- `generator_error`: independent validation itself cannot establish safety. Report the exception separately and stop, not unsafe placement. Recoverable primary-search faults use tier4 instead.

The new food-policy identity is part of the progressive hash. Comparing a new hash to the older ruleset is not expected; parity within the new ruleset is required. Counters are diagnostics, not scoring/progression inputs. No new clocks, spawn delays, particles, UI geometry or render changes were introduced.

## Hazards / expansions

Before warning activation, independently check current and proposed food reachability. Reject a hazard if existing food is already transiently isolated or the placement removes its last route. If food is pending, retain at least one reachable legal spawn candidate. Existing distance/envelope/static-connectivity/dynamic-area checks remain. Activation revalidates each warning sequentially against prior accepted hazards; unsafe warnings are skipped deterministically, not moved onto food.

All four chapter expansion boundaries preserve the exact existing food cell, body arrays and effects. Expansion only opens territory/adds obstacles outside previous active territory; no biome-only respawn. Focused tests check reachable food before/after each boundary. Natural stress additionally checks food legality at every expansion. Hazard invalidation is compared before/after topology mutation with the same body state, so ordinary body enclosure is not falsely attributed to a hazard.

## Evidence / limitations

| Metric | Result |
|---|---:|
| Natural varied seeds |50|
| Reached Forest→expanded Forest→Caves→Swamp→Endless |39|
| Length≥100 /≥250 |41 /24|
| Checked replacement placements |9524|
| Unsafe /unreachable-at-spawn |0 /0|
| Expansion /hazard invalidation |0 /0|
| Terminal `no-legal-food` /generator errors |0 /0|
| Genuine board-full in natural runs |0|
| Temporary deferral attempts (not unique episodes) |58|
| Tier1 /2 /3 /4 natural use |9430 /94 /0 /0|
| Desktop/mobile command replay parity |50/50|
| Natural hazard activations |23|
| Supplementary seeded2+1 warning/expiry activations |100|

Tier3/4, primary-search faults, true full-board and sole-food-route hazard rejection are exercised by targeted fixtures, not claimed as naturally encountered. All natural runs use the prior conservative legal-input planner, unchanged config, effects/hazards enabled, and end at260 mushrooms or900 active seconds. No natural collision was triggered by this planner; slow/stalled runs remain in the evidence. `stress.json` contains every seed, stages, per-run counters and hashes. This is functional stress, not a timing/performance benchmark or a fun metric.

Fixed seed17: starvation begins17340, safe tier2 placement occurs17348 (one movement interval /8 ticks later), cell3498, legal+reachable. Eventually134 mushrooms/length142 at900s, still playing, hash **`7a30cc60`**, equal to its mobile replay. The planner then stalls; do not claim it completed250 growth. `seed17-after.json` verifies that recovery from the final sources matches the50-seed stress witness.

Targeted suites: **36/36 pass**, including six new food/hazard tests, original progressive/Lab/static design/live Ribbon tests. A4-cell genuinely full2×2 classifier fixture produces `board_full`; there was no genuine natural board-full at length140 or otherwise. No browser gallery, backend calls or publication.

## Reproduce

```powershell
node arcade/snake-next/progressive-run/food-reproduce.mjs
node --test arcade/snake-next/progressive-run/food.test.mjs arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/tuning-lab/lab.test.mjs arcade/snake-next/tuning-lab/design.test.mjs arcade/snake-next/forest-training/ribbon-live.test.mjs
node arcade/snake-next/progressive-run/food-stress.mjs
node arcade/snake-next/progressive-run/food-seed17-after.mjs
```

All scripts are offline diagnostics, never imported by the playable DEV Lab. No autoplay/bot feature was added. Stop for human review; no balance approval implied.
