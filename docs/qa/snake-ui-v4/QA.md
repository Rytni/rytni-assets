# Targeted UI V4 QA

## Prepublication candidate

Candidate `2.15.33-a4a833b79202`; runtime `snake-next-325e9e5de225`. Rollback remains the actual published start `2.15.33-a67c23267bc6`, never an unpublished draft.

| Gate | Result |
| --- | --- |
| Product + appearance Node tests | 55 passed,0 failed |
| Native UI browser checks | 457 passed;1920×1080,720×405,436×245,844×390 |
| Real TEST container, local candidate desktop | 211 passed |
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

## Visual review

Clean native and actual TEST-container stills were inspected, including compact Main, mobile Pause, Settings, Guide, New Record and fullscreen. This supports a TEST visual-review candidate only; commercial quality and final approval are human decisions.

## Publication/LIVE

Pending canonical TEST build verification / safety check / publication / dual-CDN bytes and fresh LIVE desktop-mobile QA. No Production or SQL actions authorized.
