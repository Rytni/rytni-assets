# Current Fly / Snake Next interaction parity

Source of truth: `tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html`, inspected as CSS and `showMenu()` / `fitMenuFrame()` logic, not inferred from screenshots. Captures date: 2026-10-06. Snake preserves its approved forest, hero, tokens, wood/gold/moss rails, leaderboard and result art. No Fly source was modified.

## Contract and effective Fly overrides

The requested Snake semantic maxima are **compact 560px, medium 680px, large 860px, result 760px**, constrained to the available stage. The current Fly source has later declarations that override its nominal widths; faithfully copying those declarations would exceed the explicitly requested maxima. Snake therefore implements the requested size contract and Fly's interaction/container principles, rather than reproducing every late Fly pixel width.

| State | Fly `showMenu()` size | Snake size / maximum |
|---|---|---|
| Main | menu / full scene | full scene, no framed modal |
| Pause | compact | compact / 560px |
| No attempts | compact | compact / 560px |
| Restart / exit confirmation | compact | compact / 560px |
| Error | compact | compact / 560px |
| Settings | medium | medium / 680px |
| Rules | large | large / 860px |
| Result / record | result | result / 760px |
| Mobile gate | compact | compact / 560px |

Relevant current Fly rules:

- Stage: `aspect-ratio:16/9` with `has-menu`; narrow portrait embedding switches to `9/16`.
- `#arcadeDialog:not([data-menu="main"])`: `width:min(var(--mf-modal-width),94cqw)`, `max-height:94cqh`, `overflow:hidden`; `.rytni-arcade-modal-body` owns ordinary content scrolling.
- Effective base widths: compact `clamp(420px,70cqw,620px)`, medium `clamp(560px,84cqw,790px)`, large `clamp(680px,93cqw,980px)`, result `clamp(620px,90cqw,900px)`.
- At stage ≥1200×650 the caps become compact 820, medium 1050, large 1320, result 1140; fullscreen result has a later 1240px cap. These enlargements are deliberately not copied to Snake.
- Short stages (≤500px height) reduce density and rearrange pause actions horizontally. A later recovery rule restores standard buttons to at least 44px; primary buttons still have short-stage overrides. Very short ≤300px panels retain fixed close controls and inner scroll. ≤560×300 main hides intro/summary and gives actions the available scene.
- Main actions remain bounded by a maximum 440px region; main is a scene rather than the ordinary modal frame.
- Close effective range is 44–52px; the measured desktop close is 51.28px. Snake uses a fixed 48×48px target.
- Fly result body has a later `overflow:visible` exception. Fly mobile gate also has a later whole-dialog scroll exception and 640px cap. Snake uses internal body scrolling consistently and the requested compact gate cap.

## Snake presentation changes

`product/parity.css` is a separate final stylesheet, loaded after the approved visual stylesheet. The old artwork remains intact. `ui.js` provides semantic `data-size` panels and separates fixed header, scrollable `.panel-body`, and fixed actions. Close controls reuse existing resume/cancel/back/main/gate-cancel controller actions.

Desktop embedded stage is a viewport-constrained 16:9 scene, capped at 1480px width. Fullscreen fills the actual viewport. Main actions occupy a bounded 340–360px region; standard actions are ≥48px, primary ≥54px, icon/close controls 48×48px. Pause has the same primary + three-secondary horizontal grouping as Fly; portrait stacks these controls. Long rules/settings/result content scrolls internally. In 436×245 embedding, decorative intro/identity is suppressed so Play, Training, Rules, Settings, Rating, audio, fullscreen and host return remain reachable. This is layout adaptation, not screenshot scaling. Portrait retains a 9:16 title composition and compact gate.

## Measured paired states

All values are CSS pixels. Desktop captures use a 1366×768 viewport. The current Fly layout has an external sidebar, yielding a 919.95×517.47 game stage; standalone Snake occupies 1365.33×767.98. This explains the different stage sizes in desktop paired images. The host integration verification separately exercises Snake in the real assembled TEST layout.

| State | Current Fly panel W×H | Snake panel W×H | Fly minimum button H | Snake minimum button H |
|---|---|---|---|---|
| Main scene | 860.98×472.39 composition | full 1365.33×767.98 stage | 48 | 48 |
| Pause | 620×291.22 | 560×311.39 | 48 | 48 |
| Settings | 769.39×472.80 | 680×489.09 | 44 | 48 |
| Rules | 851.83×456.59 | 860×549.91 | 48 | 48 |
| Record result | 824.34×461.22 | 760×540.56 | 48 | 48 |

Fullscreen landscape 844×390, native stage size in both games:

| State | Fly panel W×H | Snake panel W×H | Fly minimum H | Snake minimum H |
|---|---|---|---|---|
| Main composition | 793.36×350 | full 844×390 stage | 48 | 48 |
| Pause | 590.80×254.45 | 560×209.89 | 47.25 close / 44+ actions | 48 |
| Settings | 784.91×374.39 | 680×374.39 | 44 | 48 |
| Rules | 784.91×374.39 | 793.36×374.39 | 47.25 close / 44+ actions | 48 |
| Result | 793.36×374.39 | 760×374.39 | 44 | 48 |

Very short embedded stage: Fly 436×245.25, Snake 436×245. Fly fixture fixes the stage width inside its sidebar layout solely for this controlled comparison; source CSS/state logic stays unchanged.

| State | Fly panel W×H | Snake panel W×H | Scrolling |
|---|---|---|---|
| Main | 406.08×221.25 | full stage, bounded action region | Neither main scene scrolls |
| Pause | 406.08×182.45 | 409.83×179.89 | Actions fixed |
| Settings | 406.08×231.59 | 409.83×235.19 | Content body only |
| Rules | 406.08×231.59 | 409.83×235.19 | Content body only |
| Result | 406.08×231.59 | 409.83×235.19 | Snake content body only |

Snake minima remain 48px across all measured states. Fly minima are 44px in this short fixture. Current Fly's synthetic record result (`qaResult('record')`, very large score/stat values) reports horizontal panel overflow at 436px; this is an existing Fly result exception, not introduced or changed by Snake. Snake reports no panel or document horizontal overflow.

## Verification and scope

Run with the repository served on port 8775:

```powershell
playwright-cli -s=parityui open http://127.0.0.1:8775/arcade/snake-next/product/index.html --browser=msedge
playwright-cli -s=parityui run-code --filename=docs/qa/snake-test-parity/parity-browser.js
playwright-cli -s=parityui run-code --filename=docs/qa/snake-test-parity/fly-browser.js
```

TDD: the original Snake first failed the pause assertion because it had no inner scroll body and the entire panel allowed visible overflow. The final Snake geometry run passes **90 state×viewport cases**: ten states across 1366×768, 1920×1080, 2560×1440, 1093×614 (1366×768 at 125% zoom equivalent), 436×245, 844×390 embedding, 390×844 portrait, desktop fullscreen CSS, and 844×390 fullscreen CSS. Assertions cover aspect ratio, semantic panel maxima, button/close minima, fixed-action reachability, and no document/panel horizontal overflow. All measured minima are 48px.

These are real `view()` presentation fixtures with deterministic data; they do not claim gameplay or backend acceptance. Snake fullscreen geometry cases use its pseudo-fullscreen CSS; actual requestFullscreen, touch/mobile gating, lifecycle, Hub routing and live TEST acceptance are verified by the host QA. Fly captures use its actual current block and native fullscreen request, wait for `qaReady()`, and leave remote artwork paths unchanged. Browser console for this presentation run has zero errors and one existing Canvas2D readback performance warning from `forest-training/ribbon-sprites.js`.

The original 90-case geometry suite uses equivalent CSS dimensions for its 125% case. Final integration also verifies actual Edge browser zoom at 125% for 1366×768 / 1920×1080 / 2560×1440, recording DPR 1.25 and CSS viewport width (see `site-zoom-results.txt`). Physical device/mobile browser chrome remains a human review item. Review paired captures in `review.html`.

Additional verification: `node --test arcade/snake-next/product/ui.test.mjs arcade/snake-next/product/menu-art.test.mjs` passes 7/7 tests. Every one of the 20 paired review combinations decodes both screenshot files successfully. Relevant `git diff --check` passes (only the repository's existing LF→CRLF advisory is printed).
