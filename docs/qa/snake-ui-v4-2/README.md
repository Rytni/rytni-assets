# Mushroom Snake UI V4.2

Base: `5810758`, TEST V4.1 `2.15.33-90eee5abff64` / `snake-next-8d20d4ba2174`. No rollback.

## Scope / verification plan

- Reproduce book bounds and center-seam filters in BEFORE. Pin failing local tests, then change only product composition.
- Keep the whole Guide within its real host budget; scroll only the text regions inside the two fixed pages.
- Grade button parts together; keep their already identical native source joins.
- Stress scores 0…99 999 999, ranks №1…№9999, long leaderboard names.
- Hide normal gameplay mode label; QA label lives outside the cabinet.
- Remove stepped clipping and opaque residual backing, without zooming/editing ambient PNGs.
- Product FIT WORLD policy: no second perimeter, legal blocked-cell band underneath wood; same canonical world/collision; one uniform cell scale. DEV defaults retained.
- Verify 30×12 / 40×16 / 50×20, expansion, portal, wall, food, pause, fullscreen/D-pad and host lifecycle. Protect source/art/backend/Production against actual base.
- Only after visual/functional gates: canonical TEST build → test → CheckOnly → Publish → both-origin byte audit → fresh real LIVE QA. Stop for human visual review.

## Important geometry fact

Canonical dimensions include an existing blocked outer row/column. Legal interiors are **28×10 / 38×14 / 48×18**; removing that collision band would be a gameplay change and is forbidden. Product maps that band beneath wood instead. The fixed frame uses the minimax aspect `sqrt((28/10)*(48/18))≈2.73252`. With fixed frame and square cells, the varying legal aspects cannot all fill both axes exactly. Their unavoidable centered remainder is ≤2.4% of one dimension, floor-filled, not a reserved stone wall or dark strip. Simulation is unchanged.

Review: [review.html](review.html). Human art acceptance remains pending.
