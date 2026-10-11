# Targeted mobile gate

- 18/18 controller/lifecycle unit tests.
- 4/4 V4 live raster/material/replay tests (targeted name filter).
- 36 portrait UI/audio/gate checks at390×844,393×873,412×915, touch/mobile,DPR2.
- 21 landscape input/lifecycle checks at844×390,873×393,915×412:600presses per viewport,50each cardinal plus100pairs DOWN→RIGHT and100pairs UP→LEFT.1,800 total.0unexpected pauses/gates/fullscreen exits/scroll. Exactly600canonical queued commands per input fixture.
- 21 toolbar height changes on real running simulation; tick advancement and stationary12px D-pad margins confirmed.
- Portrait reliably freezes clock and records orientation-portrait; landscape return needs explicit Resume. No accumulated hidden/settle elapsed-time debt.
- 3 dedicated blur/transient-fullscreen/persistent-fullscreen browser checks.
- 8 landscape Pause/Result layout checks including800×360. Settled screenshots supplied; instant first-animation-frame captures are not visual acceptance images.
- 12 desktop static states at720×405,1366×768,1920×1080.9pixel-identical; remaining3differ by at most1/255 channel in4–120pixels. See desktop-raster.json (<=0.05% pixel rounding tolerance, no position/layout/image changes). Strict byte differences remain honestly recorded in desktop.json. Desktop CSS/art/premium.js unchanged.

No new page errors/failed asset responses in local targeted captures. No benchmark/full-suite/screenshot spam.

19/19 actual Tilda-host candidate checks: portrait390/393/412 menus, Settings→Main, Ranking→Main, Guide→Main, user-gesture Training→portrait gate→landscape fullscreen auto-start,8touch directions per actual nested game, desktop1366Main. All pass; no new console/network errors. The host's existing anonymous auth-health401 is separately recorded, not a Snake regression. Review before publication uses exact local immutable files routed into the real host, not a claim of deployment.

Historical test note: full `ribbon-live.test.mjs` additionally has an obsolete static comparison of motion.js to86379ba. Current HEAD already contains later approved retired-route/portal history changes; that assertion fails before this task, while4functional tests pass. motion.js is unchanged by V5.3. Do not "fix" locked geometry/history to satisfy this historical comparison.

Physical Android/Yandex cause and physical usability remain pending human review. The QA journal is available only at?qa=1, including on immutable TEST product URLs. No physical screenshot attachments were present in the latest request; prose references are not invented evidence.
