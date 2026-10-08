# Premium V5.1 — typography / responsive fit only

Base: `6a729c8`, published Premium V5 runtime `snake-next-5259c7bef436`.
**Premium V5 art is locked.** No art/source PNG, forest, button material, hero,
book, Ranking board, gameplay shell or gameplay/backend implementation changes.

## Shared scale

Same approved families: Georgia for display titles/score, Trebuchet MS for UI,
existing Arial Narrow/Trebuchet fallback for compact numeric values. Fonts are
measured only after `document.fonts.ready`.

| Role | Spacious desktop | Compact / mobile |
|---|---|---|
| DISPLAY SCORE | 8.333cqw; wide numeric value 6cqw | 9.479cqw; wide 6.5cqw |
| SCREEN TITLE | clamp(23px, 2.083cqw, 40px) | clamp(19px, 2.725cqw, 23px) |
| SECTION TITLE | 18–23px | 16px |
| BUTTON LABEL | 16–20px; primary 22–30px | 16px; primary 23px |
| UI LABEL | 15–16px | 14px |
| VALUE | 16–26px; long value 14–20px | 16px; long value 14px |
| SECONDARY TEXT | 14–18px | 14px |
| MICROCOPY | 12px, non-critical book kicker only | 12px |

No meaningful runtime text below14px in the measured layouts. No global scene
transform, font-family replacement or blanket typography shrink. Long-value
variants are bounded, based on numeric length, never ellipsized.

## Changes

- Every visible control/tab label has the shared wrapper. Cap/center controls
  use grid centering, full-height text slot, line-height1 and one **+3 CSS px**
  optical correction for Trebuchet MS. No per-button top patches. Actual native
  green center ink is lower than the transparent sprite canvas center; the
 11-label sheet was checked visually and with text-safe rectangles.
- Main tagline has only a soft local gradient/shadow. Shortcut captions share
  baseline, equal maximum width, font and alignment. Small label slots receive
  clearance, not a new Main layout. Record/rank text columns and padding change
  inside the same physical plaque; its art, outer anchor and size are unchanged.
- Ranking preserves board/header/footer/podium and row ordering/escaping. Names
  may ellipsize; score is a max-content column, never ellipsized. Stress includes
  realistic32-character usernames and scores99,999,999.
- Result retains full-scene desktop and dedicated mobile composition. Removed
  permanent portal/expansion/world/time/bonus telemetry, not canonical stats.
  One short status: `Сохранён · Рекорд: …`,
  `Тренировка · попытки не тратятся`, or failed-send copy. Share gets a small
  local backing; no panel/modal or global darkening.
- Settings rows share icon/title/description/control grid; descriptions no
  longer disappear at the old compact breakpoint. The volume disclosure is
  retained because it owns three actual, functional sliders. Compact Settings
  body intentionally scrolls; all rows/sliders remain reachable. Footer stays
  fixed. This does not change mixer, persistence, quality or fullscreen semantics.

## Evidence

- [BEFORE → AFTER review](review.html): nine matched visual sections + fallback
  investigation. Stress and Result captures are explicit local fixtures.
- `before.json`: original V5 text inventory; `after.json`: **431 scenarios**,
  **1337 distinct rendered text records**, zero text-fit failures, document
  overflow, new page errors or failed local assets. Identical repeated text
  records are deduplicated; scenario outcomes remain complete.
- Each record includes container/text/safe bounds, font/size/line-height,
  alignment, foreground/background/shadow contrast treatment, wrap/overflow and
  scroll-region ownership. Critical labels also check icon/neighbor overlap.
- Sizes:1920×1080,1366×768,1280×720,844×390,720×405 (embedded-size local fixture).
  Eight score magnitudes × five ranks in Main; three Result variants; failed
  submission; long-name Ranking; Guide3tabs; Pause; both confirmations; Settings
  including sliders/game; no-attempts; mobile gate; sponsor/exhausted CTA.
- `contrast.json`: actual text-free composite beneath tagline, icon captions,
  Result status, Share and Ranking footer (desktop and mobile). Approximate
  mean-luminance and bright90th-percentile checks, not a full WCAG certification.
- **64 product tests** and **11 immutable package tests** passed. Only obsolete
  permanent-telemetry/copy assertions were updated; ownership, attempts, seed,
  routing, retry, share, escaping and ordering tests remain.
- `flows.json`:33 targeted local functional checks passed, including actual
  volume slider, Guide, Training/Ranked mock, pause/resume/confirm cancel and
  confirm, clipboard share and error/sponsor/no-attempt states.
- `candidate.json`:888 real TEST-host functional checks with local immutable
  candidate override, plus loaded-font text-safe probes in embedded/fullscreen
  desktop and mobile contexts. The final LIVE run must confirm the final revision.
- `legacy.json`:10 sizes, including1000/999,560/480 and portrait. Premium V5 Main
  and approved object masters remain selected. No V4.3 fallback reproduced.
  Without the reported screenshot's original URL/build stamp, its provenance
  cannot be established; stale/historical origin is not guessed as a fact.

## Safety / remaining baseline

No controller, bridge, mixer, scheduler, simulation, V4 ribbon, food, progression,
portal, input/D-pad, backend/SQL, Fly source or Production changes. Existing TEST
ranked/demo semantics remain. The prior intermittent headless scheduler-recovery
autopause is outside this text-only pass and is not claimed fixed; native OS
share dialog and physical-device/browser-font variations require human review.

TEST publication and final LIVE identifiers/evidence: pending final canonical
publish. Rollback must remain the already published Premium V5, not an
unpublished intermediate local candidate. Production publication is forbidden.
