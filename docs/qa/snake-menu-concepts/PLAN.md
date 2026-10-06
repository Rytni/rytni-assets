# Menu art / presentation replacement

Base:9656138. User brief: pasted request b62e0446, 2026-10-06.

## Design

Forest title-screen composition, not cards. New menu-only forest backdrop and
ivory/moss/red-cap hero; authored physical button/plaque/ornament sprites.
Desktop centers hero + Play at left, scoreboard at right. Mobile dedicates38%
to identity/tokens/plaque and62% to actions; Rating is separate. Pause is a
compact physical overlay with gameplay visible. Result emphasizes trophy/score,
then three stats; secondary detail is subordinate. Manual uses large illustrations
and approved pickup art. Settings has icon-backed custom pixel sliders.

## Scope and execution

Native execution in this chat. User explicitly permits internal concept quality
review followed by integration; no extra approval pause. Product code remains
untouched until seven concepts have been rendered and inspected.

- [x] Generate original menu-only source artwork using built-in ImageGen; save
  sources and exact provenance. Reference art is direction, not crop material.
- [x] Offline export transparent runtime assets with fixed bounds/metadata.
- [x] Build independent concepts in this directory, render seven native PNGs;
  inspect commercial credibility, identity, hierarchy, celebration, physical
  panels, scoreboard and mobile composition. Revise any failing concept.
- [x] Replace only product/ui.js, product/product.css and minimal presentation
  markup/chrome hooks. Keep action/tab/setting contracts unchanged.
- [x] Targeted tests: existing product controllers/backend/skin tests unchanged;
  new UI checks for token states/top3/escapednames; desktop1366/1920/mobile844
  layout/touch44/noScroll; all current state routes; screenshot seven states.
- [x] Record asset inventory/art direction/QA, inspect diff, checkpoint; no deployment.

No edits to controller, backend, bridge, SQL, gameplay, HUD, VFX, effect skins,
V4 geometry, FIT WORLD, scheduler, scoring, attempt/sponsor/leaderboard semantics.

## Files

Create `grib/mushroom-snake-menu-v1/` source/export PNGs and manifest.
Create `docs/qa/snake-menu-concepts/` concept HTML/CSS/data/screens/review.
Modify `arcade/snake-next/product/ui.js`, `product.css`, `index.html` only for
presentation. Existing event delegation/selectors are preserved.

Five QA risks: all actions remain reachable on844×390;44px touch targets;
portrait gate does not spend; hostile/long names cannot inject/overflow;
loading fixed asset dimensions prevent layout shift. Existing controller tests
cover lifecycle/idempotency; new presentation tests cover the first/last risks.
