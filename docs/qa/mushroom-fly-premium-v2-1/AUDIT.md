# Fly Premium V2.1 — audit before runtime edits

Base `22624f2`, TEST `2.15.33-3e5257288eb3`, presentation `premium-v2`, locked Snake `snake-next-78436309631c`. Serena navigation attempted first; ignored HTML cannot supply symbols, so targeted local selector/function ranges were used. Reviewed all five requested V2 documents and all 54 live/runtime PNGs via six labelled contact sheets; native low-landscape Main also inspected directly.

## P0: two separate causes, not guessed letterboxing

`diagnose.json` captures actual local and public-host ancestor rectangles before any runtime change. At 844×390 the local embedded stage is 844×474.75 plus 76px participant-header allocation; scrolling reaches 161px. Actual public embedded stage is 780×438.75 plus 76px header, within a 354px-tall popup: after browser interaction the stage top is -220.109px and the popup scroll clips its upper content. V2's unconditional 16:9 menu stage does not fit low landscape. Host ancestors also own unrelated progression content and scroll; they must not be globally changed.

Native fullscreen itself measures exactly `[0,0,844,390]`; no real fullscreen dead band was found. Old `live-main-844.png` was an element capture of `#msFlyWrap` while descendant stage was fixed/top-layer. The parent retained offscreen layout coordinates and that element screenshot captured a dark parent region instead of the viewport. This QA artifact must be retired, not used to alter camera or fullscreen semantics. Correct capture target is viewport or actual stage.

Fix scope: Fly-block CSS only, low-landscape selected Fly menu wrapper as viewport-bounded presentation grid, original shared header retained, stage takes the remaining aperture (not a blind 16:9 height). Native/pseudo fullscreen rules and gameplay canvas geometry stay locked. No edit to shared host file or Snake. Gate both actual viewport/stage ink and control containment; do not accept parent-box utilization.

## Other root causes

- P1: secondary buttons are generic flat gradients; Main TOP-3 uses the same bright opaque journal as major dialogs. Sponsor tokens reuse coin art at opacity .25/grayscale. Change only UI presentation/material/token.
- P2: ranking body owns rows AND summary, so summary can scroll away. All portrait dialogs force full stage height, leaving empty parchment with six rows. Summary styling is overridden by inherited low-opacity rules. Move summary to fixed footer, scroll rows only, adaptive non-Main portrait panel height; keep backend order/no fake players.
- P3: landscape celebration background uses centered cover in portrait, cropping the left-side hero out. Labels have bright text over bright clouds. New independent portrait scene + local warm readability backing; preserve result/share policy.
- P4: two-column Pause grid places the third secondary alone in an accidental half row. Center it deliberately or use three columns where space allows.
- P5: most Basics/Hazards cards are text-only; portrait full-height frame exaggerates blank space. Add vector/code-native explanatory diagrams and retain approved bonus raster icons; adaptive panel sizing.
- P6: range inputs use default web appearance with no designed filled rail/knob. Keep native input/real audio channels, style controls and update only presentation fill. Adaptive panel avoids excessive empty paper.
- P7: HUD inherits older dark-brown boxed styling. Only after P0–P6 gates: subtle compact translucent brass treatment, no gameplay changes.
- P8: shared header logic locked; test realistic populated values separately, not the previous anonymous empty profile. Report any shared limitation honestly.
- P9: six authored V2 PNGs need one bounded byte/dimension/load/decode audit; original untrimmed button is authoring source, not the preferred runtime button. Test opaque scene optimization only with native visual comparison.

No runtime changed at this audit checkpoint. No backend/SQL/Production operations. Protected source/hash gate runs against this base before and after implementation.

Later native LIVE finding: enlarging the Fly-only mobile wrapper to the full viewport moved its TEST badge beneath the existing external Tilda `applicationSearchClose`. Initial child-only header checks missed that external peer. Fix is a Fly-only 76px right-side presentation reservation at the same mobile media query; no header markup/logic/file changes and no Snake selector. Add explicit peer intersection QA. This is a consequence of the new Fly aperture, not a shared-header redesign.
