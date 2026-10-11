# Targeted QA

## Automated evidence

Final local total: 127 checks (85 layout/flows + 24 mocked contracts + 9 mechanics/lifecycle + 9 actual-host candidate), zero failures and zero new errors. Clipboard fallback is selected explicitly in the test; Russian locale non-breaking thousands separators are normalized only for the assertion, not changed in runtime.

- `protection.cjs`: 114 pre-existing non-presentation named functions unchanged against `a9aa81c`; Snake, chooser, original Fly game assets and Production paths unchanged. Inline JavaScript parses.
- `local.json`: 85 checks; four meaningful viewports (1920×1080, 1366×768, portrait 390×844, landscape/fullscreen 844×390), menu/ranking/guide/settings/result/record, touch targets, all sound controls inside visible body, no horizontal overflow, no Pause/Result body scroll, real Training/pause/resume/cancel flows, shared-header DOM identity and Snake smoke. Zero errors.
- `contracts.json`: actual current RPC paths exercised only with local mocks. One ranked start per double click; one canonical finish; hub refresh; Training makes no ranked start/finish; failed finish is honest; one sponsor claim; credit display; noopener; failed sponsor leaves normal attempts untouched; escaped player names; TOP-10 cap; #1 and own row. Large-value stress: 0 / 6 840 / 99 999 / 999 999 / 9 999 999 / 99 999 999; №1 / №99 / №999 / №3000 / №9999.
- `regression.json`: published-base and candidate mechanics diagnostics identical: PERFECT 3/best3/reward198, reset0, Ghost pass/normal hit, time scale .64, BONUS_DIMENSION and 8 bonus coins. Portrait/cancel spend no attempt; authoritative seed19123 reaches run after landscape gate; exactly one mobile ranked start; rotate-out clock freeze; resume without debt; pagehide stops run/audio.
- `candidate.json`: real TEST loader and locked host, not an invented replacement. Full-width Main, TOP-3, hidden technical note, immutable Snake runtime unchanged; Snake DOM geometry, images and fonts identical at desktop1920/1366 and portrait390. Existing anonymous host `/auth/v1/health` 401 is recorded separately, not a new game failure.

Mock contract tests rewrite preview gating only in the intercepted local browser response. Repository runtime has no mock/backend/auth changes. No real attempt, reward or database mutation occurred.

## Raster comparison disclosure

Initial whole-wrapper PNG equality was too strict: native before/after comparisons differed on 0.062–0.113% of pixels, predominantly edges/text; desktop1920 maximum RGB delta was 1. Raw PNG equality is reported, not claimed. No Snake file was changed to chase those differences. Both before/after native screenshots are retained. The authoritative immutable runtime descriptor is identical and all measured product DOM geometry/assets/font values are identical. This is a visual/code preservation check, not a false claim of zero raster differences.

## Corrected layout findings

Low landscape initially clipped the mute control and status labels. Targeted checks were strengthened from DOM visibility to full boundary containment; compact sound uses one-row label/slider/value, every range and mute target ≥44px. Button source transparent padding (y103…577) is removed offline; a true horizontal 3-slice preserves decorated cap proportions rather than vertically squashing a 9-slice.

## Scope / limitations

No gameplay tuning, benchmark, SQL or Production deploy. Authenticated participant/accounting behavior is preserved by protected source and local mocked contracts; anonymous preview does not prove a real user's balance. Native Web Share and real-device orientation lock still require human/device review; desktop clipboard fallback and existing mobile contracts are exercised locally.

TEST publication and fresh public Pages/S3/live evidence are recorded in `PUBLIC.md` after deployment. STOP for human visual review only after that gate.
