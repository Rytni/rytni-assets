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
| Guard unit fixtures | Original Production/index/path guard, exact-runtime/tampering guard, 600-path stdin staging and exact TEST mirror/manifest-last regressions pass |
| Canonical deployment CheckOnly | PASS after source checkpoint `62a6d55` |
| Pages + S3 acceptance | Matching current/previous/runtime descriptors, app/runtime SHA and sampled module/art bytes; JS/MJS MIME correct; `mirror-results.txt` |
| Mandatory live site check | PASS: `TEST: OK, 2.15.33, участников=1903, S3=53, GitHub=0`; `live-deployment-results.txt` |
| Live desktop | 1366×768 / 1920×1080 / 2560×1440; native fullscreen/exit, menus, pause/resume, Hub close and Fly Training/Pause/Result; `live-desktop-results.txt` |
| Live browser zoom | Actual 125% at all three sizes, expected immutable runtime, no overflow/missing assets; `live-zoom-results.txt` |
| Live mobile | 844×390 landscape, native fullscreen + D-pad changes canonical direction; 390×844 portrait blocked; `live-mobile-results.txt` |

## Evidence limitations / historical failures

The unauthenticated real-page preview has an existing Supabase `/auth/v1/health` HTTP 401. It is logged separately as baseline, not suppressed or described as a new clean network response. Candidate modules and assets have no errors. The preview opens the real progression popup layout without authenticating or mutating any production account. Authenticated ranked Snake is not claimed: backend remains unapplied.

Two historical byte-lock assertions fail **identically in a clean snapshot of task base `2c7a6d4`**: `all 59 PNGs + unrelated Director/session source remain unchanged from base` (locks `0d45ffb`) and `locked core, B, Smooth V4, food policy, cabinet and HUD byte identical` (locks `5bd0c0c`). These assertions predate subsequent approved progression/timing changes. See `historical-baseline-results.txt` and `gameplay-invariants.txt`. They were not weakened or edited to manufacture a pass. The 25 behavior tests pass; the authoritative task-relative safety check separately proves locked sources and artwork unchanged from `2c7a6d4`.

Browser automation findings: an element screenshot larger than the viewport resets touch emulation in cross-origin frames; screenshots now capture the viewport. Native fullscreen screenshots at DPR 3 also alter subsequent automated input coordinates in Edge, so review captures occur after interactions. These test artifacts are not patched into game input. Actual 125% Edge zoom uses a dedicated temporary profile and Edge's default zoom preference, not CSS zoom or only viewport emulation.

A true resume integration failure was reproduced: product layout changed after starting the fixed clock, causing its unchanged >5-tick recovery guard to fire. A red/green controller test and real 100%/125% browser checks cover the corrected order and advancing canonical tick. Internal window blur with `document.hasFocus()===true` is ignored; real focus loss/visibility/pagehide still pauses/disposes.

Geometry and artwork are not redesigned. Review screenshots are fixtures where stated; physical phones/browser chrome remain a human review item. No performance benchmark or large new art gallery was run.

## Publication

**TEST publication accepted; STOP for human review.** GitHub Pages publication `f890a12` selects `2.15.33-eaf73478e2df`; Pages build 37444793840 succeeded. Runtime is `snake-next-6822599860b1`. Both mirrors select that exact release and preserve previous `2.15.33-451886dbbce4`. App SHA: `eaf73478e2dfb693ca6c4502ec9b40a77943eef48d5e4ae5b75cf4bf641a1a51`; runtime manifest SHA: `1a2e37a3845c7b9f2dcc3609ae40534ec13f7d676b9f37a004bde1945cecdff9`.

Source checkpoint `62a6d55`; Windows staging fix `8fa2fea`; canonical publication `f890a12`; TEST-only mirror infrastructure checkpoint `48a7f47` (local). The second canonical Publish resumed the already-committed candidate and synchronized S3: 377 immutable files uploaded/verified, manifest last. Source-only follow-up/QA commits are local; the deployed UI/game runtime remains the validated `f890a12` candidate. No manual candidate staging, publication commit or push was used.

First canonical Publish stopped before staging/push because the 376-file argument list exceeded Windows' command-line limit. The canonical staging helper now feeds the same validated literal paths through stdin; a 600-file regression proves no lost paths or Production admission.

S3 has a separate historical uploader, not an automatic mirror. Its media-only dependency discovery cannot mirror the new module runtime. Canonical Publish now calls an exact TEST-only sync helper: validate the current source closure and bytes; verify the deployed rollback; upload/verify only current immutable runtime/app files; promote `giveaway-test/manifest.json` last. Correct JS/MJS/CSS/HTML MIME is explicit. Existing immutable objects must match, never get silently overwritten. No generic asset, Fly, loader, vendor, Production or DB targets are written. Credentials use the existing local DPAPI loader, never committed or printed; absence fails closed. Mirror unit tests pass 3/3.

Live browser checks use **no local response overrides**. The public page loads from S3, Snake selects the expected content-addressed runtime, and Fly smoke passes unchanged. No new console/page errors or missing assets. The existing unauthenticated auth-health 401 remains documented. The final Production digest still equals the original task-start digest, and the Fly source hash and task-relative simulation/geometry/art locks pass. No database operation or Production deployment occurred.
