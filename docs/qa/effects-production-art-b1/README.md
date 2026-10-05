# Production VFX B.1 — runtime clarity review

Base: `723427d`. Human VFX approval remains pending. No publication.

## Scope

Exactly 11 revised native PNG sheets: Focus wisp; Spore idle/trail/burst;
Guard plate/charged/break; charged Portal ring/body trail; Rush ember/thorn.
See [inventory.json](inventory.json) for exact keys, files, dimensions, anchors,
frame bounds and SHA-256 values. No pickup/food, Harvest, Roots, Mist or
Corruption PNG changed. No future VFX key was approved.

Corruption food motes gain presence using the same sheet. Roots WARNING
contain-box floors are 28/24 CSS px, while solid Roots stay at .96 cell.
Mist retains the authored puff, density, clipping and 4.5-cell clear radius;
deterministic scale/mirror/phase/vertical offset/opacity break repeated poses.
Important effect floors are listed in review.html; they never apply to stone
or terrain and never alter hitboxes or world anchors.

Feedback has one latest ordinary-score lane, one grouped recent-spore lane,
and an upper MAX COMBO lane. Corruption uses a single combined score label.
Packing includes shadow extents, avoids the head envelope, and suppresses
glyphs when no safe lane exists. At most three glyphs. All placement depends
on canonical active tick / frozen interpolation, not wall clock or RNG.

DEV VFX STRESS uses a read-only session facade with a legal Focus/Guard/Rush
effect display and synthetic food/spore/break/portal feedback. This intentionally
tests visual overlap, not legal gameplay co-occurrence. It adds no canonical
events, effects, rewards or topology. CLEAR EFFECTS, single-effect buttons and
restart leave stress mode. Nine immediate buttons remain.

## Review

Serve repository locally on `127.0.0.1:8775`.

- `/docs/qa/effects-production-art-b1/review.html` — five families only,
  BEFORE/AFTER at desktop30 and mobile30/40/50, plus Mist/stress/Roots.
- `/arcade/snake-next/game-feel-lab.html?art-fixture=mobile-50` — actual playground;
  select normal/40/50 fixtures, Space resumes, NORMAL RUN restores spawning.

All before images are actual unchanged-base captures. After captures use the
same fixtures, pause alpha, tick and cell scale. Crops are native CSS scale.
BEFORE routing reads the exact four changed source modules and eleven PNGs
from `723427d`, without reverting the working checkout. Both sides hide the
pause panel via a QA-only CSS override to prevent fullscreen resize races.
Desktop comparison pairs intentionally scroll horizontally rather than shrink.
Full-cabinet QA composites are not an additional art gallery.

## Targeted verification

```powershell
python docs/qa/effects-production-art-b1/author.py
python docs/qa/effects-production-art-b1/baseline.py
python docs/qa/effects-production-art-b1/validate.py
node --test arcade/snake-next/effect-playground/production-vfx.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/production-art.test.mjs arcade/snake-next/effect-playground/vfx-clarity.test.mjs
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b1/browser-qa.js
playwright-cli -s=fxb --raw eval "window.capturePhase='before'"
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b1/capture.js
playwright-cli -s=fxb --raw eval "window.capturePhase='after'"
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b1/capture.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b1/extras.js
playwright-cli -s=fxb --raw run-code --filename=docs/qa/effects-production-art-b1/roots-live.js
python docs/qa/effects-production-art-b1/metrics.py
```

25 tests cover contract/admission/cadence/fallback, CSS floors, all-cardinal
Focus placement, sparse perpendicular Rush, deterministic Mist, feedback
packing, stress immutability, and locked core/art invariants. Structural export
gate: 11 sheets, transparent frame edges, limited palettes; 65 other tracked
assets/sources byte-identical to base.

Live browser gate: four requested scales, all 59 admitted assets, all nine
immediate controls, pause raster freeze, stress pause freeze/reset, expiry,
restart, desktop keyboard/mobile D-pad input, minimum 44px touch targets,
renderer-mode hash parity and render non-mutation. No console/network errors.

Roots lifecycle is sampled via the unchanged Director at canonical 60Hz ticks
in a paused QA fixture: warning (non-solid), activation at `starts`, decay at
`ends`, and one-shot cleanup. An additional mobile 50×20 live run uses the
real resume button, unchanged 60Hz clock and two legal D-pad turns through
tick 502 (8.37 active seconds). It observes crack, sprout, solid root and decay,
then zero remaining warnings/hazards. See roots-live.json. These are targeted
timing/flow checks, not human visual approval; play before final VFX lock.

No benchmark, broad game regression, deployment or final VFX lock.
