# Targeted UI V4 QA

## Prepublication candidate

Initial verified/published candidate: `2.15.33-a4a833b79202` / `snake-next-325e9e5de225`. Final compact-cap follow-up candidate: `2.15.33-ef53fa3846f5` / `snake-next-1cd377655276`. Its rollback is the actually published first V4 `2.15.33-a4a833b79202`, not an unpublished draft.

| Gate | Result |
| --- | --- |
| Product + appearance Node tests | 55 passed,0 failed |
| Native UI browser checks | 470 passed;1920×1080,720×405,436×245,844×390, including cap ownership |
| Real TEST container, local candidate desktop | 212 passed (includes fullscreen resize settling gate) |
| Real TEST container, local candidate touch mobile | 204 passed |
| Host functional/lifecycle/sponsor/attempt checks | 40 passed |
| Touch modal/sound controls | 5 passed; all three channel bindings retained |
| Locked source/art byte comparison | 915 files unchanged |
| Fly source | Unchanged; Training/Pause/Result smoke passed |
| Production aggregate | `5003cfcd190b3e2071e422bf4b12ca597fcf0fdcb16c1109f9e4186e0fa356ed` unchanged |

Candidate browser QA substitutes only the immutable TEST closure, not application behavior. LIVE acceptance must rerun without route overrides. Native Record is an explicitly marked fixture; candidate Training Result follows the canonical collision/end path. No score was submitted to a production backend.

Checks cover Main, fullscreen, Training, Pause, Settings/back, confirmation/cancel, canonical Training Result, Guide, TOP-10, touch D-pad, host close/reopen, ranked mock seed, no duplicate attempt spend, sponsor/network states, hidden lifecycle, fullscreen fallback and Fly switching. Expanded master/music/SFX controls are44px high and reachable. Scrollable mobile modal content is checked for reachability, not falsely reported as simultaneously visible.

No new console/page errors or failed assets in passing candidate runs. Anonymous site preview returns the pre-existing `/auth/v1/health`401; logged separately, not hidden or called a new Snake error. No Fly ranked RPC calls.

## Issues caught before publication

-436×245 Main had Training outside the right viewport because an old `display:contents`/row rule survived. Restored two real columns and vertical action stack; added per-button horizontal bounds gate.
- Mobile crest clipped above safe area, then overlapped the kicker. Reduced independent ornament uniformly and reserved heading space; checked native still.
- Source button caps included adjacent atlas rows / near-transparent join columns. Export uses measured row boundaries and opaque join columns; alpha-ink tests supplement aspect tests.
- Trophy inherited an oversized generic image rule. Scoped exact trophy dimensions.
- Old local8775 preview server intermittently refused connections. Read-only no-store Node preview at8776 completed the targeted checks. Environment failure did not justify gameplay changes.
- Initial fullscreen Main screenshot was captured before the host iframe's resize completed. The fullscreen test now waits for iframe AND cabinet dimensions to match the outer viewport, then two presentation frames. Fresh LIVE confirms1920×1080 desktop /844×390 mobile; obsolete transient capture was replaced. No runtime/gameplay fix was needed.
- At436×245, Pause secondary buttons now use44px uniform-height caps and13px two-line labels. Caps fit within their own buttons, not over neighboring controls. Native and container QA check actual cap ownership as well as aspect.

## Visual review

Clean native and actual TEST-container stills were inspected, including compact Main, mobile Pause, Settings, Guide, New Record and fullscreen. This supports a TEST visual-review candidate only; commercial quality and final approval are human decisions.

## Publication/LIVE

Canonical `build_tilda_test.ps1`, `test_tilda_test.ps1`, `deploy_tilda_test.ps1 -CheckOnly`, `deploy_tilda_test.ps1 -Publish` completed.

- Source checkpoint: `ee10dde`.
- TEST publication checkpoint: `db2297e`.
- Published release: `2.15.33-a4a833b79202`.
- Runtime: `snake-next-325e9e5de225`.
- App SHA-256: `a4a833b79202cac26056d9cbb296c371f52108beb93ba725f7f408adf9fe9cc1`.
- Runtime manifest SHA-256: `efba81f6f50c977236ae54ac34c7e2ce125e73c2866c3f8e02e73b6e609271ce`.
- Pages and S3 agree on release, runtime and actual published rollback. All433 runtime dependencies match SHA-256/size/MIME on BOTH origins; plus runtime manifest =434 immutable files. GitHub Pages deployment of `db2297e` completed successfully.
- Fresh LIVE desktop context:212 checks; Main iframe settles at1920×1080, all subsequent dialogs also1920×1080.
- Fresh LIVE touch context:205 checks; fullscreen Main/game/dialogs844×390. Mobile D-pad is visible and sends a canonical turn.
- No new page/console errors or failed assets. Known anonymous auth health401 is separate baseline. No Fly ranked RPCs.
- Real LIVE Fly Training/Pause/Result/Hub-return smoke passes.
- Required external `test_live_deployment.js test`: `TEST: OK, 2.15.33, участников=1904, S3=53, GitHub=0`.
- Final915-file lock/Fly/Production safety check passes. Production and SQL untouched.

`live-*.png` are screenshots from the published site, with NO runtime/asset route overrides. Local New Record remains a clearly labelled fixture; LIVE Result is an actual canonical Training result. Final reports/screenshots are saved in a separate local review checkpoint; the published gameplay candidate remains `db2297e`. No production-readiness or human-art-approval claim.
