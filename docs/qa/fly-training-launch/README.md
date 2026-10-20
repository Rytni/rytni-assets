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
