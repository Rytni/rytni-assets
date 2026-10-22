# Season 4 launch — 22 October 2026

Owner-approved launch: **22 October 2026 13:36:10 Minsk**, ending
**20 January 2027 13:36:10 Minsk** (90 days), 20 planned winners.
The form is open at https://rytni.live/rytni-gift.

Initial MAIN `2.15.33-d76687b45878` was published on Pages and S3 with its previous
version retained for HTML rollback. Complete verified encrypted backup and a
matching server receipt preceded the single atomic rollover. All 4,571 original
Auth users were preserved; 20 winners and Season 3 summary archived. Fresh both-channel
Studio sync and MAIN community snapshot read-back passed. No historical crawl.

## Snake sponsor link hotfix

The previous click credited the attempt but only added another link after the
request; it did not open Telegram. `sponsor-link.js` now opens exactly
`https://t.me/astra_net_bot?start=ryt` synchronously within the eligible ranked
click, before audio/network waits, with `noopener,noreferrer`. Offline mock,
pending/exhausted/unavailable states and active gameplay do not navigate.
An explicit retry link remains on desktop and mobile. Sponsor credit can be
claimed in portrait; fullscreen/orientation gates still protect gameplay starts.
This is a link-opening bonus, not proof of Telegram subscription or a purchase.

Current MAIN: **2.15.33-12e7765d801c**.
Current TEST: **2.15.33-08545d50aac9**.
Runtime: **snake-next-6aa3220dae34**, 529 files. Old runtime remains approved for
open sessions/rollback. Exact closure diff: `product/app.js`, `controller.js`, new
`sponsor-link.js`; simulation, scoring, physics, art and backend limits unchanged.

Verification: 106 product/package tests PASS. Desktop and mobile-emulated real
clicks opened an intercepted Telegram tab with active user activation and null
opener, before one claim; normal attempts unchanged, no gameplay started.
Browser fixtures used local mock transport and never credited production attempts.
The existing authenticated HTTP launch smoke independently confirmed real Fly
and Snake replay/result persistence and idempotent retries. QA participant and
game rows were removed by exact newly-created IDs; QA Auth remains disabled.
No existing user's Auth data was deleted.

Published immutable dependencies first, manifests last on S3; Pages contains the
same content-addressed artifacts and rollback. Live verification must compare
both manifest values and decoded app/runtime bytes, including gzip handling.
Website rollback must never restore old vulnerable backend finish functions.
