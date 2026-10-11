# FLY PREMIUM V2.1 CANDIDATE — QA

Base `22624f2`; no human approval implied.

| Gate | Checks | Result |
|---|---:|---|
| Responsive matrix | 561 | zero failures/errors; 126 state/viewport combinations |
| Participant fixture stress | 45 | zero failures; actual-size avatar + all required names/levels/points/titles; layout viewport explicitly equals requested viewport |
| Long ranking stress | 25 | zero failures; 12 source rows → TOP-10, escaped names, own row, 99 999 999 / №9999, last row accessible |
| Current mocked contracts + mechanics/lifecycle | 33 | zero failures/errors |
| Actual Training/HUD | 6 | zero failures; native ≥44px controls, actual pause |
| Actual TEST-host candidate/Snake | 9 | zero failures; three viewports, immutable runtime + DOM/assets/fonts identity |
| Actual host mobile/header gate | 17 | zero failures; no dead band, three realistic participant sets, fullscreen; external host Close included |
| Sponsor label ink | 12 | zero failures; native embedded/fullscreen/portrait label stays inside the central button ink |
| TEST mirror safety | 11 | zero failures; six exact candidate keys, default/Production/path traversal/immutable safeguards |

Matrix: 1920×1080, 1366×768, 1280×720; 390×844, 393×873, 360×800; 844×390, 873×393, 800×360. Main, Ranking, all three Guide tabs, both Settings tabs, Pause, Result, New Record, No Attempts, Sponsor, Error and orientation gate.

P0 gate distinguishes intentionally occupied participant header from UNUSED viewport area. Mobile embedded stage uses the complete remaining aperture (844×314 after the unchanged 76px header allocation); fullscreen stage exactly 844×390. No black dead strip and no outer menu scroll. Capture viewport/stage, never the old offscreen fixed-child parent screenshot.

Validator correction: original stress-avatar fixture had an unbounded 512px hidden source image, expanding the mobile layout viewport. It is now explicitly 36×36 and viewport width is asserted. Sponsor text also has its own central-ink height gate, not merely hitbox containment; the long primary label uses 17px type without changing claim/routing policy.

Ranking: only rows scroll. Summary and Main Menu remain fixed. Long-name cells wrap; score is not ellipsized; supplied ordering retained. Public preview has six real mock entries, never fake padding rows.

Contract QA intercepts LOCAL source/real current RPC paths with deterministic mocks. No real ranked start, finish, sponsor claim, reward or database mutation. One start per double click, one finish, failure honesty, sponsor credit/noopener, Training no ranked RPC. Protected PERFECT/Ghost/Time/Portal diagnostics match V2. Portrait/cancel spends nothing; server seed reaches run; rotate-out freezes clock; resume no debt; pagehide stops run/audio. Share policy is unchanged; explicit clipboard fallback passes.

Pause matrix captures are presentation fixtures on the actual renderer; `actual-pause-*` and lifecycle tests use actual Training. Portrait active-play behavior remains the existing safe orientation gate, not portrait gameplay.

`protection.json`: 114 protected named functions retain identical SHA256 before/after; Snake source/art, chooser, shared host, original Fly assets and entire Production directory unchanged. Snake raster raw equality is reported honestly in `candidate.json`; small browser raster differences are not silently declared zero. Source/runtime and measured DOM geometry/assets/fonts are identical.

Remaining human/device checks: native OS Share sheet, physical-device browser chrome/safe-area/orientation handling. Existing anonymous `/auth/v1/health` 401 is disclosed separately in actual-host/live evidence, not a newly introduced error.

TEST publication only after local and mirror safety gates; exact public evidence in `PUBLIC.md`. No Production/backend/SQL changes.

Public acceptance evidence is recorded in `PUBLIC.md` and `live.json` for the selected release, including external Close peer checks. Four primary public viewports; the full nine-viewport matrix remains local. Source/runtime/asset hashes, real menu flows and actual Training are checked independently. No native-OS Share or physical-device safe-area guarantee is inferred from desktop emulation.
