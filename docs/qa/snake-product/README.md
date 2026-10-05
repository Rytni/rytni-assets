# Mushroom Snake local product candidate

**BACKEND NOT APPLIED. Local preview only; no deployment or live database writes.**

Open with the existing local static server at `http://127.0.0.1:8775`:

- [Product](http://127.0.0.1:8775/arcade/snake-next/product/index.html) — starts at Main Menu.
- [DEV Lab](http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html) — current progressive DEV run, separate tooling.
- [Menu review](http://127.0.0.1:8775/docs/qa/snake-product/review.html).
- [Skin review](http://127.0.0.1:8775/arcade/snake-next/product/appearance/review.html).
- [Interactive effects in product](http://127.0.0.1:8775/arcade/snake-next/product/index.html?qa=1) — LOCAL controls beneath cabinet; no production options.

## Delivered

Separate Snake cabinet shell, Russian Main/Pause/confirmations, tabbed guide and
settings, local ranked/training lifecycle, result/record/share, escaped TOP–10,
leader badge and highlighted player, normal/sponsor counters, reset messages,
mobile landscape/fullscreen gate, and host `RytniArcadeHub.leave()` routing when
provided. Daily Challenge and King are explicitly excluded.

The product bridge uses the existing TrainingGame clock/input/audio and current
TunnelSession, FIT WORLD V2 and Smooth V4. It does not duplicate gameplay. Food,
collision, portals, input queue, production pickup assets and canonical scoring
remain unchanged. The only progression option added is an explicit product cap:
natural 15% capacity expansion ends at 50×20. DEV remains 60×24. Native mobile
844×390 body measurements are 13.23 / 9.88 / 7.88 / 6.55 CSS px for 30/40/50/60;
the Snake is never independently enlarged. See `effect-scale-metrics.json`.

Effect appearance is tick-deterministic RGB material inside the original ribbon
mask, with a 250ms transition and bounded material table. It composes two positive
and one negative effect. Current V4 product/Lab uses skins instead of floating
Focus/Guard active objects or the discrete Rush wake. World items, Roots, Mist,
HUD icons, portal mechanics and one-shot bursts remain. See [EFFECT_SKINS](EFFECT_SKINS.md).

## Attempts and backend

Three normal starts per rolling 24 hours; up to two sponsor claims, credited before
a separate Play; unlimited Training without ranked start/finish. Mock counters
are memory-only and reset on reload. Ranked start supplies the seed and immutable
identity. Restart explicitly discards the current score but retains the same
identity/seed, mirroring current Fly. Exit never submits an incomplete result.
Finish is immutable/idempotent and refreshes confirmed best/rank; failure remains
unaccepted and retryable. No arbitrary localStorage attempt debit.

All preview URLs use deterministic mocks. No query can enable live RPCs. The
optional real adapter requires explicit authenticated transport injection. The
unapplied migration creates Snake-only tables/RPCs and is disabled by default.
Current Fly sponsor RPC is Fly-specific and is not called. Rewards remain zero:
the shared ledger hook cannot yet be safely mirrored without independent review.
See [BACKEND_CONTRACT](BACKEND_CONTRACT.md) for prerequisites and aggregate
admission limitations. SQL has not been executed or parser-validated.

## Review states

`?mock=` supports ready, one-attempt-left, no-attempts, sponsor-available,
sponsor-credit, not-authenticated, arcade-paused, network-error,
leaderboard-empty, record-result. `?preview=` supports the sixteen named menu
states in `review.html`. Preview Result stats are clearly synthetic review
fixtures; normal gameplay derives them from the canonical run.

## Evidence and limitations

[FLY_PARITY](FLY_PARITY.md) audits the current Fly, not historical removed features.
[QA](QA.md) records targeted gates, screenshots, baseline failures and remaining
live backend/device/host validation. Visual acceptance remains a human decision.
The candidate is ready for local human review, **not production activation**.

Milestones: `2fe6a0e` audit/shell; `8360ed3` controller; `622fe10` result/board;
`7f98d28` backend contract; `2ed3583` effect skins. Later integration/QA checkpoints
are recorded in Git and the final handoff. Exact touched files: [FILES](FILES.md).
