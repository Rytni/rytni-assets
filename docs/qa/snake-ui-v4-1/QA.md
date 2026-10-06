# V4.1 targeted QA

Base/current HEAD at start: `8d21f21`. Published V4: `2.15.33-ef53fa3846f5` / `snake-next-1cd377655276`. No rollback/checkouts.

## Composition

Main identity/hero stays primary. Play remains capped370px, Training secondary. Tagline has a narrow dark ribbon under logo. Attempts and record/rank occupy independent dark-wood components with separate safe boxes; controls form one ordered inset family. Desktop ranking is a27–31% scene-width TOP-3 plaque. Full TOP-10 stays on the dedicated ranking screen in backend order.

Guide is a light, authored open book with true page nine-slice, separate spine, botanical outer corners, dark type and bookmark tabs. Basics has four illustrated rules and keyboard/D-pad illustrations. Approved bonus/hazard PNGs remain64px desktop /48px mobile. Mobile guide content is checked not to disappear behind its footer.

Lower status rail is removed from DOM and CSS. One cabinet ends the gameplay presentation. Ambient forest appears beyond the approved frame's existing empty source padding. Canvas clipping affects only presentation outside cabinet ink; renderer layout, cell size, world/collision, movement and simulation remain unchanged.

## Prepublication gates

-58 product/appearance Node tests passed,0 failed.
-31 native targeted checks passed:1920×1080; mobile844×390; token final raster DPR1/1.5/2.
- Real TEST container, exact local candidate: desktop244 / touch mobile233 checks; no new page/console errors or failed assets.
-40 host functional checks passed, including attempts/sponsor, portrait/fullscreen gate, D-pad, pause, terminal result, host switching and lifecycle.
-972 protected source/art files unchanged from actual base. Fly source and Production digest unchanged.
- Existing anonymous `/auth/v1/health`401 logged as baseline, not a new Snake failure. No Fly ranked RPCs.
- Fly cover is byte-identical to historical `e4b203c` and both CDN originals; see ART.md for honest non-reproduction of reported toolbar corruption.

Candidate: `2.15.33-90eee5abff64`; runtime `snake-next-8d20d4ba2174`. Local build/strict TEST bundle validation passed:453 dependencies + runtime manifest =454 immutable files. Rollback points to actual published V4 `2.15.33-ef53fa3846f5`.

## Review and limitations

[BEFORE / AFTER](review.html) contains all eight requested screen comparisons plus token×8 at three DPRs. BEFORE source captures correspond to the actual V4 base; token BEFORE renders the immutable published V4 directly. AFTER snapshots use V4.1/current canonical game. No reference-image pixels enter runtime.

Desktop/mobile Main, all book tabs, token crops and one-cabinet gameplay were visually inspected. Human review still decides art quality. The reported Fly toolbar remains a non-reproduced observation, not a claimed verified corruption fix.

## Publication / LIVE

Canonical build → strict test → CheckOnly → Publish completed. Source checkpoint `2c4c69e`; TEST publication checkpoint `f0f8f78`.

- Published TEST: `2.15.33-90eee5abff64` / `snake-next-8d20d4ba2174`.
- GitHub Pages + S3 agree on current/rollback. All453 dependency files pass SHA-256, size and MIME on BOTH origins; plus runtime manifest =454 immutable files.
- Fresh LIVE contexts, no route overrides: desktop248 / touch mobile237 checks passed. All three guide tabs captured; both pages present. Dedicated TOP10 and no-lower-rail assertions pass.
- Selector explicitly verifies the Fly source URL is inside this exact immutable runtime and natural image width1536. Byte audit proves the PNG hash matches historical source; clean selector screenshot inspected.
- Fly Training/Pause/Result/Hub-return smoke passes, no Fly ranked RPCs.
- Required external LIVE tool: `TEST: OK, 2.15.33, участников=1904, S3=53, GitHub=0`.
- No new page/console errors or failed assets; anonymous auth health401 remains the known baseline.
- Final972-file lock/Production/Fly check passes. Production/SQL untouched.

Actual LIVE stills use `live-*.png`. Review defaults to LIVE for Main, Guide, fullscreen gameplay and selector; embedded gameplay pair remains explicitly labelled native/canonical fixture. Final QA-only checkpoint does not create another gameplay release. Human visual approval is PENDING.
