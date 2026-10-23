# Community ranking: winner badges

Winner badges describe selection by the organizer, never delivery or receipt of a gift.

- Gold branded emblem: selected in the active season.
- Purple history emblem: selected in an earlier season.
- A participant selected in both receives both badges. Gold card emphasis takes precedence.
- Missing season metadata produces no badge; the legacy flag is not interpreted as a current-season win.

`giveaway_social_winner_scopes_v1()` privately matches eligible active-season participants to winner records and archived winner identity proofs. It compares explicit season IDs and uses participant/Auth identity, without guessing from display names. Unknown archive seasons are not classified as current or past.

`giveaway_social_rankings_v2` and `giveaway_social_progression_pending_v2` expose an envelope-level `winner_badges` map containing only `current_season` and `past_seasons` booleans for already visible handles. Private identity proofs and participant IDs remain private. Public access to the helper itself is denied.

The v2 snapshot, its legacy any-season `winner_selected` field, publisher validation, scores and ordering are unchanged. Existing Studio builds keep working; future syncs automatically receive the updated projection. No gift-sent status or winner selection is modified by this migration.

## Verification

- `migrations/social_winner_season_badges_v1_tests.sql`: 15 transaction-isolated database checks (all fixtures rolled back), including season separation, exact identity, archive preservation, public privacy and waiting cards.
- `tools/test-community-winner-seasons.cjs`: Playwright CLI fixture checks all three categories, current/past/both/neither, waiting cards, legacy fallback, invalid private metadata and widths 1366/768/390/320. RPC mutations are blocked.
- `tools/test-community-ranking.cjs`: existing live ranking flow with separate current/past assertions.
- Art/mirror/candidate/promotion tests: 12 passing checks.

2026-10-23 production audit: active season has zero selected winners. Six distinct winner-marked handles in the published MAIN ranking have past-season wins only. No archive records have an unknown season. The fix adds no new winners.
