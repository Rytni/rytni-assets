# Acceptance ledger — 2026-10-06

## Local gates

| Gate | Evidence / result |
|---|---|
| Product/controller/material/packaging | 55/55, `node-tests.txt` |
| Foundation/presentation | 22/22, `foundation-tests.txt` |
| UI state/viewport geometry | 90 cases; `parity-results.txt`, FLY_UI_PARITY.md |
| Hub lifecycle, attempts, sponsor, Training, error, reopen, record/share | 40 checks; `host-results.txt`; no console, failed assets or Fly RPCs |
| Real TEST layout, local response overrides | 1366×768, 1920×1080, 2560×1440; `site-desktop-results.txt` |
| Actual browser zoom | All three desktop sizes at 125%; measured CSS width and DPR 1.25; `site-zoom-results.txt` |
| Real-page mobile emulation | 844×390 landscape / 390×844 portrait at DPR 3; native fullscreen, D-pad, pause, cancel exit, no portrait play; `site-mobile-results.txt` |
| Existing portal/effect behavior | 25/25 behavioral tests; `gameplay-behavior-results.txt` |
| Production / locked code / artwork | `safety-check.cjs`; original Production aggregate `5003cfcd190b3e2071e422bf4b12ca597fcf0fdcb16c1109f9e4186e0fa356ed`; Fly SHA `1c76cc728a16ab87ff0c7f122884154f7fa63edc27630b0e1930cc949681e506` |
| Build/source/loader/runtime | `build_tilda_test.ps1` and `test_tilda_test.ps1` pass; 376 exact immutable runtime paths |
| Guard unit fixtures | Original Production/index/path guard and new exact-runtime/tampering guard pass |
| Canonical deployment CheckOnly | Pending source checkpoint |

## Evidence limitations / historical failures

The unauthenticated real-page preview has an existing Supabase `/auth/v1/health` HTTP 401. It is logged separately as baseline, not suppressed or described as a new clean network response. Candidate modules and assets have no errors. The preview opens the real progression popup layout without authenticating or mutating any production account. Authenticated ranked Snake is not claimed: backend remains unapplied.

Two historical byte-lock assertions fail **identically in a clean snapshot of task base `2c7a6d4`**: `all 59 PNGs + unrelated Director/session source remain unchanged from base` (locks `0d45ffb`) and `locked core, B, Smooth V4, food policy, cabinet and HUD byte identical` (locks `5bd0c0c`). These assertions predate subsequent approved progression/timing changes. See `historical-baseline-results.txt` and `gameplay-invariants.txt`. They were not weakened or edited to manufacture a pass. The 25 behavior tests pass; the authoritative task-relative safety check separately proves locked sources and artwork unchanged from `2c7a6d4`.

Browser automation findings: an element screenshot larger than the viewport resets touch emulation in cross-origin frames; screenshots now capture the viewport. Native fullscreen screenshots at DPR 3 also alter subsequent automated input coordinates in Edge, so review captures occur after interactions. These test artifacts are not patched into game input. Actual 125% Edge zoom uses a dedicated temporary profile and Edge's default zoom preference, not CSS zoom or only viewport emulation.

A true resume integration failure was reproduced: product layout changed after starting the fixed clock, causing its unchanged >5-tick recovery guard to fire. A red/green controller test and real 100%/125% browser checks cover the corrected order and advancing canonical tick. Internal window blur with `document.hasFocus()===true` is ignored; real focus loss/visibility/pagehide still pauses/disposes.

Geometry and artwork are not redesigned. Review screenshots are fixtures where stated; physical phones/browser chrome remain a human review item. No performance benchmark or large new art gallery was run.

## Publication

Not yet accepted. Required remaining evidence: canonical CheckOnly, Publish, matching Pages/S3 manifests/runtime hashes and MIME, mandatory live deployment check, then real unmodified TEST desktop/mobile/Fly smoke. Production snapshot must remain identical throughout.
