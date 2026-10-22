# RYTNI Telegram public bot 2.33

Canonical tracked source of the existing `telegram-public-bot` function. The
original external project and its deployment copy are synchronized from these
three runtime files: `index.ts`, `secret_mission_content.ts`,
`restored-notifications.js`. No bot token, webhook/cron secret, chat identity or
service-role key belongs here. Those remain in existing server secrets/DPAPI.

## New reminders

- Sponsor chest: the actual `sponsor_chest_claimed_at` plus the current configured
  cooldown, only while the chest feature is enabled.
- Fly and Snake regular attempts: real attempt start + rolling 24 hours. An
  available attempt with no previous use does not generate an initial reminder.
- Sponsor attempts: an old claim has expired, the normal attempt is exhausted,
  fewer than two claims remain in the rolling window, and there is no unspent
  sponsor credit. Copy says the player can **obtain** the bonus, not that credit
  has already been granted. A regular reminder takes precedence for that game.

`notify_sponsor_chest` and `notify_arcade` are independent bot settings. The
former initially inherits existing daily-chest opt-outs; existing overall pause
and quiet hours are respected. New subscriptions use defaults. Both games are
controlled by the single Arcade toggle. The website can safely ignore the two
additional profile fields. No Studio EXE or page rebuild is necessary.

## Queue and eligibility

Migration: `migrations/telegram_restored_opportunities_v2330.sql`. The existing
service-only scheduler RPC and minute cron are retained. Unique subscription +
event key binds kind, participant, opportunity and exact restored timestamp.
No blanket announcement, daily repeating nag, points award or attempt creation
is added by this feature. Winner/video/question/daily-chest behavior is retained.

Only active subscriptions with eligible non-test participants in the currently
open season are considered. Banned/blocked accounts, disabled games, events
before Telegram linking and never-used opportunities are excluded. Pending
restore reminders are cancelled if consumed, disabled or opted out while queued
or during quiet hours. Repeated ticks reuse the same event; existing retry cap,
blocked-chat handling, per-kind throttle and row locks are retained. Reenabling
an opted-out reminder does not resurrect a cancelled event for the same cycle.

`giveaway_telegram_opportunity_config.enabled` is initially false. Migration can
precede bot deployment safely; turn it on only after bot 2.33 health and existing
scheduler-secret checks pass. To pause this feature, set it false; leave the
new bot deployed so pending jobs are invalidated safely. Do not remove sent
history or restore an older bot while new kinds are queued.

The existing webhook-secret and cron-secret authentication are preserved. This
Telegram webhook already runs without gateway JWT verification; this change
does not disable JWT checks on other functions (including Arcade verifier).

## Tests and production evidence, 22 October 2026

```powershell
node --test server/telegram-public-bot/*.test.mjs
```

9 Node tests cover captions/media, the actual sender/receipt path, independent
callback preference updates, blocked Telegram handling, empty queue and webhook
guards. Tests stub every HTTP call; no real participant receives test messages.

For live database integration, concatenate the migration **without its final
commit** and `database-tests.sql` and execute in one transaction. All 23 checks
passed with final ROLLBACK: configured chest timer, both games, sponsor slots,
unspent credits, exact time boundaries, initial-spam prevention, quiet hours,
unique events, stale reminders, preferences, bans/test/blocked/paused accounts,
closed seasons, feature gate and private-role grants. The first fixture run
omitted a required Snake result JSON; fixed only the fixture and reran PASS.

Before migration: encrypted DPAPI backup of 448 subscriptions / 29,949 deliveries
and current function definitions, full decrypt/read-back verified. It remains
in ignored local QA storage. The additive migration preserves all records and
existing preference values, except initializing the new chest preference from
its existing counterpart once.

Bot 2.33 deployed through the existing linked project, source/deployment copies
match, unauthenticated webhook 403 and authenticated scheduler health PASS.
The unchanged automatic minute scheduler delivered the first **10 sponsor chest
reminders**, zero delivery errors. Game restoration is proven transactionally;
no real 24-hour game reset was forced. Delivery aggregates and health are stored
locally under `O:/TikTokAgent/data/qa-season4/telegram-restore-*`; private payloads
and encrypted backup are never staged.
