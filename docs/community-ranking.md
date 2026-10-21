# Participant TikTok activity ranking

TEST opens «Рейтинг участников» from the hero button in a separate shared-style
popup, like the personal account. Comments, active progression and the activity index
show only the combined two-channel rolling 30-day dataset. There are no channel
or period filters. The backend retains its other datasets for compatibility.
The popup reuses the site's personal-room cosmic background, 3D icons and medals.
Readable desktop/mobile text, top3, top50, local handle lookup, keyboard tabs,
capture time, coverage notes and honest empty/error states are supported. The
calculation explanation links to both @rytni.tv and @rytni.blic and explicitly
states that activity is combined across both channels. The separate likes category
has been replaced; observed likes still contribute to the unchanged activity index.

Active progression requires both social top50 lists, 12 comments on five distinct
channel/posts, eight UTC comment dates and three ISO weeks within the rolling 30
days. Private points determine order, with reached-at time then handle as tie-breaks.
Neither amounts nor timestamps enter public JSON/HTML. Short eligible lists retain
only confirmed places. When fewer than ten are confirmed, separate muted waiting
cards fill the presentation up to ten members. These have no place, medal or private
amount and do not join the ranked board. Current data yields three eligible participants. The site's existing
guaranteed-place rules and application balances are unchanged.

The public category subtitle is «Очки заявки + активность». Public selection,
calculation and rules copy is brief: upgrade the application and regularly engage
with daily videos on both channels. Numeric thresholds, weights and tie-breaks
are documented internally here, not repeated in visitor-facing explanatory text.

`migrations/social_progression_pending_v2.sql` adds a separate anonymous-safe
read-only projection. It selects up to `10 - confirmed_count` other valid current
members in private-points order. Its only per-person fields are `handle` and
`winner_selected`; no comments, balances, IDs or timestamps are projected.
The existing v2 snapshot contract and Studio 1.5.0 publisher remain unchanged.
Waiting cards say «Нет активности на каналах» / «Дисквалификация», with a clear
note that regular activity is not yet confirmed. This is a reversible public-board
state, not a ban, disqualification from the giveaway, or proof of no interaction.
After normal one-button sync confirms eligibility, the same read excludes the
member from waiting automatically. A failed/mismatched waiting response cannot
replace or break the confirmed ranking. No update to the portable EXE is required.

Waiting projection QA: three confirmed and seven waiting members, exact hidden
points order and winner flags, anonymous read, disjoint boards, channel guards
and unchanged snapshots pass. Rolled-back SQL tests cover promotion and capacities
zero/ten; targeted browser fixtures cover promotion, private-field rejection and
isolated waiting failures. Four viewport sizes and shared modal/search flows pass.
Run the SQL fixture `migrations/tests/social_progression_pending_v2.sql` only after
its migration; it requires an existing TEST publication and rolls back all writes.

Gold highlighting and the branded badge reflect an actual organizer winner record,
not local gift-sent status or presumed receipt. The public getter refreshes winner
flags on every request; the open popup polls each minute. Cross-season linkage uses
the same non-null authenticated user ID or the exact winning participant ID only.
`migrations/social_winner_identity_v2.sql` preserves this private link on archive
insertion, before compact rollover removes old participants. It uses an RLS-protected
registry; no authenticated identity or archive ID enters the public response.
Seven archived links were recovered from verified DPAPI-encrypted Manager backups;
five of these users currently have applications. Seven older archive rows have no
participant ID and cannot receive an inferred badge from a display-name match.
Future winner selections and rollovers preserve exact identity automatically.
New transparent 3D artwork and final prompts are documented in
[community-ranking-v2-art.md](community-ranking-v2-art.md).

Data comes from the existing RYTNI Studio daily private SQLite collectors. Original
participant TikTok handles are matched exactly; nickname/fuzzy matches, duplicate
claims, conflicting actor IDs, organizers and test/banned accounts are excluded.
Only registered handles and aggregate counts enter the public snapshot. No comments,
email, Steam IDs, participant/native IDs, private balances or credentials are sent.
Media Kit remains aggregate-only and its Golden presentation is unchanged.

The activity index is `3 × distinct commented channel/posts + observed liked
channel/posts + 2 × active UTC dates`. Repeated comments on one post do not inflate
its contribution. Likes use first-observation time and partial named notification
coverage. Reposts and later unlike actions are not included. This index does not
change Giveaway balances/rewards or automatically select winners.

`migrations/social_participant_rankings_v2.sql` adds isolated v2 storage/functions;
the old v1 migration, data and APIs remain available for old application builds.
The new public contract has only the combined 30-day dataset. The server also
independently verifies sustained eligibility and private-points ordering.
The original `migrations/social_participant_rankings_v1.sql` was an additive migration against the
existing backend, with a current/previous snapshot per `test`/`main` channel. Context
and publication RPCs are service-only; the public RPC projects current eligible
members only and checks the active season. Validation is transactional and rejects
changed membership revisions, unexpected private fields, period/identity/count and
ordering errors. Main snapshot remains separate and unpublished pending review.

One desktop button collects, matches, validates, publishes and reads back. Page code
polls every minute while the popup is open and the document visible, and on return. It needs no Tilda
or file work for subsequent data updates. A failed collection leaves the last valid
publication; stale loaded snapshots are labelled. No new browser/auth UI is added.

Canonical frontend source is `tilda-test/blocks/10_T123_COMMUNITY_RANKING.html`, with
the popup mount/hero button in block 04. `tools/build_tilda_test.ps1` includes the new block.
The Snake runtime is unchanged. MAIN is prepared only from its own hash-verified
immutable release via `tools/build-community-main-candidate.py`, adding the mount,
hero button and this block. No unrelated TEST game features are copied to MAIN.
The candidate builder requires an external output directory and never changes a manifest.

## v2 verification, 2026-10-21

The new migration was first executed inside a rolled-back transaction. Commit
preserved the v1 TEST payload hash `33842a9707c40f10ce697706ff7ed828`; v2 MAIN
remains unpublished. Server QA passes 12 negative/role checks, real private-order
comparison, actual winner flags, anonymous public read and last-good preservation.
Public boards contain 50 comments, 50 activity and three progression members;
after archived identity recovery, nine selected winners appear in each social
top50 and one in progression. Archive-trigger capture and reassignment guards
passed inside a rolled-back transaction. Anonymous registry access is denied;
actual archive and selection records, and v1 data, remain unchanged.

Initial v2 TEST release `2.15.33-574d26c31308` was published with byte-identical Pages/S3
manifests, app SHA-256 `574d26c3130810c7e574774e97d5db55a7a4f1f9bf8d3c07944d101126fceb9c`,
1,277,980 bytes, and both committed art assets. Unmocked live TEST browser checks
pass at widths 320/390/844/1366: modal lifecycle, top50/search/keyboard, winner marks,
hidden points, empty/error states and the existing personal account. Final positive
checks report no page errors or ranking/art request failures. The existing unrelated
auth health probe can return 401. Snake runtime remains `snake-next-2fbc81ae44ef`
byte-identical; Production manifest remains protected.

Studio 1.5.0 passed 202 affected Python/Qt/collector/publisher/privacy/portable tests,
compiled self-check and a portable archive scan (5,097 hashed files, zero privacy or
hash violations). The desktop shortcut opens the new EXE. Native shared-window
Giveaway overview and activity page load 1,904 participants without a second window.

## Legacy v1 integration evidence

Initial data integration validation on 2026-10-20: 167 affected Python/Qt/publisher/privacy/portable tests PASS;
27 real public category/channel/period combinations PASS; widths320/390/768/1440 PASS;
top50/search/keyboard and empty/error handling PASS. Native source collection and
backend publish/read-back PASS for both accounts. Server privacy/role/membership/
account/period/score rejection checks PASS without changing last good data.

Local screenshot and native evidence stays untracked. Existing live health-probe401
is reproducible before this change. Public ranking code introduces no new API error.

Popup revision candidate: `2.15.33-c3a99bc9b9e5`. Local browser QA passes all three
combined 30-day categories against the public snapshot, top50/search, keyboard
navigation, focus trapping/return, Escape/backdrop close, scroll locking and
320/390/844/1366 viewport checks. Empty/error states and the existing personal-account
popup also pass. The two reused icons have an exact committed-byte TEST mirror
allowlist, immutable upload/read-back and idempotence checks; 11 targeted mirror
tests pass. MAIN remains unchanged. Deployment acceptance additionally requires
matching Pages/S3 manifests and the same checks on the actual TEST page.
