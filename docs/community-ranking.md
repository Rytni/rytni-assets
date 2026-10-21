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
Neither amounts nor timestamps enter public JSON/HTML. Short eligible lists stay
short. Current data yields three eligible participants. The site's existing
guaranteed-place rules and application balances are unchanged.

Gold highlighting and the branded badge reflect an actual organizer winner record,
not local gift-sent status or presumed receipt. The public getter refreshes winner
flags on every request; the open popup polls each minute. Cross-season linkage uses
the same non-null authenticated user ID or the exact winning participant ID only.
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
eight selected winners appear in each social top50 and one in progression.
Local browser QA uses the real v2 backend and routes only the new, unpublished art
bytes to local files. Desktop/mobile widths 320/390/844/1366, modal lifecycle,
top50/search/keyboard, winner marks, hidden points, empty/error states and the
existing personal account pass. Final publication additionally requires unmocked
live Pages/S3 agreement and the same browser checks. Snake runtime remains
`snake-next-2fbc81ae44ef` byte-identical; Production manifest remains protected.

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
