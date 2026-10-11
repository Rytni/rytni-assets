# Fly Premium V2 — presentation audit

Base: `a9aa81c`; published TEST `2.15.33-e56b72a011df`.

## Ownership

The current shared host is `arcade/snake-next/test-host.html`. It owns the approved chooser, participant header and game switching. It remains byte-identical. The Fly block is `tilda-test/blocks/08_T123_BROWSER_ARCADE_2.15.34.html`.

Fly `renderShell`, `showMenu`, `resultPanel`, `renderBoard`, and the menu portion of `handleMenuAction` own presentation. The canvas, `gameCamera`, `fitCanvas`, `start`, sponsor claim, finish, AudioManager, fullscreen/orientation gate, activate/deactivate, frame/update, collision and bonus functions remain protected. Canvas simulation is 960×540, independent of CSS stage size.

## Rejected shell

The outer title/description plus three `.rytni-arcade-stat` cards duplicate the title menu identity. `.rytni-arcade-layout` reserves a permanent right column for a full TOP-10. The stage is a small left region, leaving unused space underneath the board. Multiple historical media/container rules fight over menu layout; final Premium V2 selectors must supersede them, without touching HUD or gameplay.

The shared header already supplies participant identity. No new Fly participant header is needed. The old technical note remains hidden. Main Play/Training, pause/confirmation, settings, guide and results already route through the canonical action handler. Preserve those actions and contracts.

## Real supported settings

One shared AudioManager owns master/music/SFX gains, mute, limiter, persistence and teardown. There is no need for another AudioContext. Effects full/eco and fullscreen are existing controls. Expose these exact controls through Sound/Game tabs, with mute in Sound.

## Proposed presentation

Full-aperture authored sky title scene, left/center logo and dominant amber Play, compact right TOP-3 sky-league object, one intrinsic four-part brass/wood status console below. Dedicated parchment TOP-10; short illustrated travel guide; compact pause over real gameplay; sky-celebration result. Portrait menus use an independent art composition and one-column content. Gameplay aspect ratio and HUD are unchanged.

## Protection gate

Record protected function hashes plus Snake/chooser/shared-host/Production tracked file hashes before changing runtime. Only presentation functions and Fly CSS/markup are allowlisted. No backend, SQL, Fly mechanics, Snake or shared-host changes. TEST publication is allowed only after raster and functional gates pass.
