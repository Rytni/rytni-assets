# DEV Lab launch / source identity

Base: `c426cfb`. Local only; no deployment.

## Root cause and fix

The Lab installed its current session factory but only called `start()` when
`queued || artFixtures.selected`. A normal first load therefore retained the
standalone Training menu. Review buttons also returned without an existing
progressive session. This was launcher ambiguity, not evidence of old gameplay
source; caching remains independently checked.

After iframe readiness, V4 installation, progression installation and current
factory assignment, the Lab now always launches through its existing two-RAF
clean-start path. Review controls are already installed before this readiness
callback. The iframe stays hidden until validated gameplay is ready. Explicit
later Main Menu still works; reload starts a new progressive run. Portrait
retains the existing rotate-to-play safety path.

All three review buttons force the current factory, Progressive B, stage 0,
FIT WORLD V2 and Smooth V4, clear art-fixture selection, then apply the existing
review setup to a fresh session. No B.2 effect implementation changed.

Lab chrome carries the build badge and live implementation state. In compact
landscape the iframe reserves the badge's measured height, keeping the unchanged
game/D-pad visible. No standalone Training or production HUD changes.

## Honest stamp

`node tools/stamp-snake-dev.cjs` generates `tuning-lab/dev-build.js` from actual
Git HEAD and a normalized SHA-256 source fingerprint. Current generated identity:
`c426cfb+ / d1355eb212cf`. The `+` means edited sources at generation time; it is
not a fabricated commit ID. The eventual checkpoint contains this generated
stamp. `node tools/stamp-snake-dev.cjs --check` verifies those exact source bytes
without circularly requiring the generated file to contain its own commit hash.
Regenerate after changing the listed DEV sources. Metadata is exposed as
`window.tuningLab.build`; live state as `window.tuningLab.implementation`.

Visuals, VFX presentation and Director each export the literal expected
`vfx-b2-c426cfb` stamp. Missing/different exports block launch and show
**STALE DEV MODULES — HARD RELOAD**. A Lab-only dynamic-import boundary also
catches older dependencies missing required exports. This detects mixed versions
of the checked modules, not arbitrary corruption or a wholly cached old launcher.

## Targeted evidence

URL: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html

- Fresh isolated contexts: desktop 1920×1080 DPR1; mobile 844×390 DPR2.
- No clicks: exactly one start; TunnelSession playing; 30×12; B; FIT WORLD V2;
  Smooth V4; current factory; B.2 stamps match; menu hidden; badge visible.
- Direct Rush/Roots/Mist clicks after reload each create a clean second session.
- Explicit menu, static mode and 50×20 art fixture all recover through review
  buttons. Menu followed by reload auto-starts again.
- Each missing module stamp blocks automatic and button launch. Missing
  ROOT_LIFECYCLE export is caught and shown visibly, without an uncaught error.
- Standalone Training still opens its own menu, without a session.
- Console/page errors: **0**; failed network/HTTP requests: **0** for live checks.
- **36 targeted tests pass**, including locked art/gameplay/geometry checks.

Proof: `browser.json`, `zero-click-desktop.png`, `zero-click-mobile.png`,
`stale-warning.png` in this directory.

Reproduce:

```powershell
node tools/stamp-snake-dev.cjs --check
playwright-cli -s=fxb --raw run-code --filename=docs/qa/dev-launch/browser-qa.js
node --test arcade/snake-next/effect-playground/behavior.test.mjs arcade/snake-next/effect-playground/vfx-clarity.test.mjs arcade/snake-next/effect-playground/production-vfx.test.mjs arcade/snake-next/effect-playground/playfield-assets.test.mjs arcade/snake-next/effect-playground/production-art.test.mjs
```

No full regression, benchmark or deployment. Stop for human review.
