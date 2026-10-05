# Mushroom Snake local product implementation plan

Goal: a complete local menu-to-result arcade candidate using the current Snake
simulation, with safe mock ranking and composable effect material.

Architecture: separate `product/index.html` owns menus and ranked lifecycle. A
thin iframe bridge installs current TunnelSession / FIT WORLD / Smooth V4.
Backend adapters own attempt accounting; appearance owns color only. Fly stays
the audited reference, with its source and results untouched.

Tech stack: existing vanilla ES modules, Canvas, Node test runner, Playwright CLI.
Spec: the user's autonomous productization package, 2026-10-06.

Constraints: local only; no database execution/publication; no Daily Challenge or
King; no simulation/collision/V4 geometry edits; preserve production PNGs. Use
memory-only deterministic mock counters. Real RPC requires explicit injected
transport and unapplied migration/configuration readiness.

Review focus: concurrent clicks; ambiguous network timeout; portrait/fullscreen
before debit; terminal state returning to Pause; cross-game leaderboard leakage.

## Files and ownership

- `product/backend.js`, `migrations/`: isolated ranked contracts (parallel).
- `product/appearance/`: material composer and review (parallel).
- `docs/qa/snake-product/FLY_PARITY.md`: current Fly audit (parallel).
- `product/controller.js`: testable menu/attempt/terminal state machine.
- `product/bridge.js`, `frame.html`: current game integration; no copied core.
- `product/ui.js`, `product.css`, `index.html`, `app.js`: product presentation.
- `product/*.test.mjs`, `docs/qa/snake-product/browser-qa.js`: targeted gates.

## Milestones

1. [x] Audit Fly, record parity, create separate cabinet product shell.
2. [x] Test first: menu back routes, confirmation cancel, clean terminal routes;
   implement controller and tabbed UI.
3. [x] Audit SQL; test mock double clicks/idempotency/isolated counters; implement
   mock and fail-closed real adapter; prepare unapplied migration.
4. [x] Test result refresh/retry/new record/share/escaped top10; add result and
   attempt routing using canonical stats.
5. [x] Test identical masks/hash and pause-stable material; integrate nine skins
   with explicit channels and remove product floating active effects.
6. [x] Test landscape/fullscreen gate before spending, rotation pause, pagehide,
   audio persistence, restored D-pad; measure mobile50/60 body readability.
7. [x] Targeted desktop/mobile flows, meaningful captures and direct previews;
   complete README/BACKEND/EFFECT_SKINS/QA/review; final local checkpoint.

Interfaces: backend `hub/start/finish/claim` returns Fly-like values; bridge
`start(seed)`, `pause/resume/stop/dispose`, `stats()`; controller `action(name)`,
`start(mode)`, `finish(stats)`, `show(screen)`, `subscribe(listener)`.

Rulings: autonomous instruction replaces skill approval pauses. Existing feature
checkout reused and unrelated untracked files preserved. Ranked restart matches
current Fly accounting (same server identity/seed, zero new debit), with explicit
score-discard confirmation. Training works even if hub/auth/network is unavailable.
Product progression cap is conditional on actual mobile measurements and will
be documented before any product-only cap is enabled.
