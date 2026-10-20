# Participant TikTok activity ranking

TEST adds «Те, кто рядом» to the existing visual language: comments, observed likes
and an activity index, each with Gaming/Tech/both and rolling 7/14/30-day filters.
The top3 podium adapts to small screens; top50, local handle lookup, keyboard tabs,
capture date/time, coverage notes and honest empty/error states are supported.

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

`migrations/social_participant_rankings_v1.sql` is an additive migration against the
existing backend, with a current/previous snapshot per `test`/`main` channel. Context
and publication RPCs are service-only; the public RPC projects current eligible
members only and checks the active season. Validation is transactional and rejects
changed membership revisions, unexpected private fields, period/identity/count and
ordering errors. Main snapshot remains separate and unpublished pending review.

One desktop button collects, matches, validates, publishes and reads back. Page code
polls every minute while visible/near the viewport and on return. It needs no Tilda
or file work for subsequent data updates. A failed collection leaves the last valid
publication; stale loaded snapshots are labelled. No new browser/auth UI is added.

Canonical frontend source is `tilda-test/blocks/10_T123_COMMUNITY_RANKING.html`, with
the mount/hero link in block 04. `tools/build_tilda_test.ps1` includes the new block.
The Snake runtime is unchanged. MAIN is prepared only from its own hash-verified
immutable release via `tools/build-community-main-candidate.py`, adding the mount,
hero link and this block. No unrelated TEST game features are copied to MAIN.
The candidate builder requires an external output directory and never changes a manifest.

Validation on 2026-10-20: 167 affected Python/Qt/publisher/privacy/portable tests PASS;
27 real public category/channel/period combinations PASS; widths320/390/768/1440 PASS;
top50/search/keyboard and empty/error handling PASS. Native source collection and
backend publish/read-back PASS for both accounts. Server privacy/role/membership/
account/period/score rejection checks PASS without changing last good data.

Local screenshot and native evidence stays untracked. Existing live health-probe401
is reproducible before this change. Public ranking code introduces no new API error.

Final TEST deployment: `2.15.33-ca1cffcc40a4`; GitHub Pages and Hoster S3 agree,
and the actual `https://rytni.live/testpodari` passes all 27 live combinations and
responsive checks. The QA harness scrolls the lazily loaded block back into view
after each asynchronous Tilda reload. MAIN manifest remains unchanged; its independent
additive candidate is `2.15.32-ce1f6c8b1350`, prepared outside this checkout.
