# Targeted menu presentation QA

Local date: 2026-10-06. Base `9656138`. No deployment/database execution.

## Automated evidence

- Four new presentation tests were run against the old UI first: **4 expected
  failures** (physical token availability, podium treatment, result hierarchy,
  illustrated guide). After integration, all pass.
- Product/backend/controller/UI/material: **42 / 42** tests.
- Including unchanged foundation/presentation and the existing Lab test entry:
  **64 / 64** tests. No benchmark run.
- `flow-qa.js`: **54 checks**, all pass; no console/page errors, HTTP failures
  or external/production requests. Includes all 16 existing preview routes,
  normal/ranked/mock/training/sponsor/error, pause/restart/exit, seed identity,
  finish idempotency, persistence, lifecycle, portrait gate, D-pad, mobile50.
- `interaction-qa.js`: **10 checks**, all pass. Real Play/Pause/settings/back,
  confirmations, canonical natural wall death, clipboard Share, sponsor failure,
  desktop fullscreen, mobile actual worlds30/40/50.
- `visual-qa.js`: **61 checks**, all pass; native desktop1920/1366 and mobile844; Main no document scroll,
  controls inside viewport, touch targets at least44 px, loaded PNGs, separate
  mobile Rating. Pause/Record/Guide/Settings controls in bounds. Mobile tabs,
  settings/Rating/no-attempts/gate actions reachable (dialogs can scroll).
  Preview routes keep DEV chrome hidden unless `qa=1`. Delayed hero asset retains
  the exact layout height through reserved image dimensions.
- Seven concept captures and seven final screenshots inspected at native scale.
  Captures wait for image decode and220 ms entrance completion.

## Commands

```powershell
node --test arcade/snake-next/product/*.test.mjs arcade/snake-next/product/appearance/material.test.mjs arcade/snake-next/tests/foundation.test.js arcade/snake-next/tests/presentation.test.js arcade/snake-next/tests/lab.test.js
playwright-cli -s=productqa run-code --filename=docs/qa/snake-menu-concepts/flow-qa.js
playwright-cli -s=productqa run-code --filename=docs/qa/snake-menu-concepts/interaction-qa.js
playwright-cli -s=productqa run-code --filename=docs/qa/snake-menu-concepts/visual-qa.js
git diff --check
```

## Scope verification

Only existing product files `ui.js`, `product.css`, `index.html` change. New
menu art/tests/concepts/QA are additive. `app.js`, controller, backend, bridge,
SQL, gameplay, HUD, effects/skins, V4, FIT WORLD, scheduler, portal, scoring,
attempt/sponsor/rank semantics and Fly source/manifests remain unchanged.
Gameplay iframe sizing rules remain the previous product dimensions.

## Caveats

- Browser reports the existing Canvas2D `willReadFrequently` advisory from the
  unchanged ribbon asset readback. It is a warning, not a console error. No
  renderer change was made to suppress it.
- One early copied flow harness run read an undefined bridge game; rerun with
  explicit diagnostics passed. No product logic patch was made. The visual
  asset-delay test initially used an intentional aborted request, which itself
  generated a console error; replaced with a held-and-released successful
  request so the assertion checks layout stability without manufacturing an
  asset failure.
- Functional mocks only; backend remains **NOT APPLIED**. Mock record screenshot
  is a review fixture, not a real ranked record. Production auth/sponsor/payment
  flows were not called.
- This is targeted UI regression, not a fresh gameplay reliability or full
  repository suite. Previously documented food/hazard/source-lock failures are
  outside this unchanged gameplay scope.
- Automated landscape/touch/orientation checks do not substitute for a real
  device visual review. Human art approval remains pending.
