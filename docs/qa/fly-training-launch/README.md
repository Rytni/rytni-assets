# Fly Training launch hotfix — 2026-10-20

Base: `3b02954`, TEST `2.15.33-c3a99bc9b9e5`.

## Reproduction and cause

`start(true)` incorrectly shared the ranked hub/auth/availability gate. If hub loading
failed, returned not-authenticated/unavailable, or no participant existed, it invoked
`loadHub()` and returned without starting Training. The click handler had already
unlocked audio, explaining music with the main menu still visible.

Initial preview checks missed this because `arcade_preview=1` supplies a successful
mock hub. Reproduced in the real published non-preview TEST on desktop and mobile
using a fresh anonymous browser and revealing the existing host behind its login UI.
Both stayed on Main, `overlayHidden=false`, with no JS errors or mutation requests.
This isolates a client launch defect; the user's particular failed hub response was
not captured and no real participant credentials or ranked attempts were used.

## Fix

Only explicit Training bypasses the ranked hub gate. Assets, mobile fullscreen /
orientation, host lifecycle and normal run initialization remain mandatory.
Ranked auth, attempt RPCs, scoring, physics, collisions, Snake and Production are unchanged.

## Targeted local verification

`node docs/qa/fly-training-launch/run.cjs`

Non-preview source with local RPC mocks: ready, network failure, expired session,
paused ranked availability, missing profile, mobile network failure (844×390).
All six start, hide Main, pause/freeze/resume, and reach “Тренировка завершена”.
Training click does not fetch the hub, start/finish/claim an attempt, or send a score.
Zero page errors. Source scripts parse and `git diff --check` passes.

`live.js` exercises the actual published non-preview TEST without source replacement
or RPC mocks. Real start/finish/sponsor requests are blocked defensively and reported
as failures if attempted. Anonymous `/auth/v1/health` 401 is recorded separately.

Production manifest baseline SHA-256:
`0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`.

Snake runtime must remain `snake-next-78436309631c`.

## Publication / live gate

User explicitly authorized TEST-only publication. Source checkpoint `ab469d7`,
publication `ddaeb6d`, release `2.15.33-fada42efb84d` (1,264,231 bytes).
Build/loader/safety checks passed; all 521 Snake immutable dependencies reused.

`node docs/qa/fly-training-launch/run.cjs live`: desktop 1366×768 and mobile
844×390, actual public non-preview source, fresh anonymous contexts. Training
starts, pauses/resumes and finishes correctly; zero page errors or game asset
HTTP errors, zero ranked/sponsor mutation attempts. Both anonymous auth health
401 responses are pre-existing and do not block Training. Native result captures
were inspected. Live launch waits for asynchronous asset warm-up, not a fixed
250 ms deadline.

`node docs/qa/fly-training-launch/verify-mirrors.cjs` requires matching final
GitHub Pages / S3 manifest bytes, matching bundle SHA-256 and size, the fix in the
bundle, unchanged Snake identity, and unchanged Production manifest.

Final mirror gate PASS: both publish `2.15.33-fada42efb84d`, manifest SHA-256
`931b71f28bef1813ee754bd41c4adaffc8725aa4de86fa154c2928b47264086a`, bundle SHA-256
`fada42efb84ddf1430529884610f0a2075030014c6c39b215c38e24234a12f75`.
Production manifest and Snake runtime are unchanged. No database changes applied.
