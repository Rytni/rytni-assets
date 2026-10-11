# TEST candidate delivery gate

Candidate prepared locally: `2.15.33-34c745c03987`; SHA256 `34c745c039873a943d05501b947d613abdbec1eb91089d1a7b64fb3173f7294b`; 1,240,942 bytes. Intermediate `b69d50373f30` is superseded before public acceptance: a targeted sponsor-label polish and corrected avatar-fixture viewport gate followed native inspection.

Fly presentation: `premium-v2-1`. Snake unchanged: `snake-next-78436309631c`, descriptor SHA256 `420b7b96adaeb01fba79f7a53b209baf1479d402bf21ff61f2d31eab89668855`, 521 immutable files. Rollback remains the previously published `2.15.33-3e5257288eb3`, not an unpublished local intermediate.

TEST delivery verified: `public.json` has 20 exact byte/hash checks, zero failures. Pages and S3 agree on manifest, selected app, rollback, unchanged Snake descriptor and all six runtime assets. Manifest LF formatting was synchronized to committed bytes before acceptance; data unchanged. Six new runtime assets were uploaded before the release manifest. Pages deployment `38183596835` completed successfully.

`live.json`: 174 checks, zero failures/new errors, four meaningful public viewports (1920×1080, 1366×768, 390×844, 844×390). No resource interception. Checks include actual selected release URL, decoded public scene assets, all menu/Guide/Settings/result/sponsor/error/orientation states, fixed ranking footer/last-row access, control containment, fullscreen, actual Training/HUD/Pause/Resume, nested Settings return and Arcade→Snake. Existing anonymous auth-health 401 is recorded separately. No real account balances/attempts claimed or changed.

Production manifest SHA256 remains `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`. Entire Production directory, Snake source/art, chooser, shared host and original Fly assets unchanged against `22624f2`. No backend/database/SQL operations. 114 protected named function hashes match.

Checkpoints: `26ba30c` audit; `3279a89` responsive candidate + assets/QA; `791c6e0` intermediate TEST; `caa5b3a` targeted viewport/ink refinement; `b95fb65` selected TEST release. Review evidence checkpoint follows in Git history; no gameplay source changes after this release.

URL: https://rytni.live/testpodari?arcade_preview=1

Review: https://rytni.github.io/rytni-assets/docs/qa/mushroom-fly-premium-v2-1/review.html
