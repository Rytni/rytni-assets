# TEST publication — Fly Premium V2

- Play: https://rytni.live/testpodari?arcade_preview=1
- Native review: https://rytni.github.io/rytni-assets/docs/qa/mushroom-fly-premium-v2/review.html
- TEST release: `2.15.33-3e5257288eb3`.
- App SHA256: `3e5257288eb3ad9f27b1751a330256824bf0827d2ad826877699e41f9635bd5b`; 1,221,711 bytes.
- Fly presentation build: `premium-v2` (`data-fly-build`). No new gameplay runtime.
- Snake runtime: unchanged `snake-next-78436309631c`; descriptor SHA256 `420b7b96adaeb01fba79f7a53b209baf1479d402bf21ff61f2d31eab89668855`; 521 immutable files.
- Rollback: approved `2.15.33-e56b72a011df`, same Snake runtime.

## Exact public file gate

`public.json`: 20 checks, zero failures. Both Pages and S3 manifest, selected app, runtime descriptor and rollback match local bytes; all six new PNGs on both mirrors match local SHA256. Pages deployment run `38177324210` completed successfully. Initial Pages lag/404s resolved before public acceptance.

The first LIVE pass caught the host loader rewriting GitHub asset URLs to the TEST S3 mirror, where the new family was missing. Six new PNGs were uploaded with `tools/sync-fly-premium-test.cjs`: exact committed-byte allowlist, TEST bucket only, immutable mismatch refuses overwrite. No existing/shared gameplay media is admitted. Seven mirror safety tests pass; the default Snake release signer remains closure-only. This fixes delivery, not gameplay or UI source. Public preview ranking contains six existing mock entries, all preserved; the 10-row cap and escaping are separately verified with 12 mocked entries locally.

The PowerShell-generated local manifest initially used CRLF, while Git/Pages used LF. JSON data was identical. Local manifest formatting was normalized to the committed LF bytes, and the TEST S3 manifest re-synchronized last. Final public hashes match exactly; no source, release payload or rollback changed for this correction.

## Checkpoints

- `3e4c885`: audit / authored concept gate.
- `65cbe5e`: Fly-only presentation integration + 127 passing local checks.
- `53eb8d2`: final contract capture.
- `cd20dff`: TEST release publication.

## Protection

Production manifest SHA256 remains `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`. Production directory, Snake source/art, chooser, shared participant header and original Fly gameplay art are unchanged against `a9aa81c`. 114 protected named functions are unchanged. No backend/SQL/database operations; no real ranked/sponsor attempt consumed by QA.

Public browser acceptance is recorded in `live.json`; preview uses existing anonymous QA helpers, not real participant accounting. Native Web Share and physical-device orientation remain human checks. See `QA.md` for raster comparison disclosure.

Final LIVE: 56 checks, zero failures and zero new console/network errors at desktop 1366×768, portrait 390×844 and landscape/fullscreen 844×390. Actual public loader and public PNGs, no resource interception. Existing anonymous `/auth/v1/health` 401 remains disclosed separately. Verified Main, all ranking entries, Guide hazards, Sound/Game settings, Result/New Record, fullscreen, real Training/Pause/Resume, settings-back routing, exit and Arcade→Snake. [Selected final LIVE captures](live-review.html).

STOP FOR HUMAN VISUAL REVIEW.
