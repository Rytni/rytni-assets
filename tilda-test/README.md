# TEST page source

`blocks/` is the canonical, version-controlled source for the TEST page. `tools/build_tilda_test.ps1` concatenates these runtime blocks in this order (normalizing line endings and trimming trailing whitespace):

1. `01_T123_ОСНОВНЫЕ_СТИЛИ_2.12.html`
2. `02_T123_КАРТОЧКА_УЧАСТНИКА_2.12.html`
3. `03_T123_СТИЛИ_СТРАНИЦЫ_2.12.html`
4. `04_T123_HTML_РАЗМЕТКА_2.12.html`
5. `05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html` (defines `RYTNI_RELEASE`)
6. `05B_T123_JAVASCRIPT_ЧАСТЬ_2_2.12.html`
7. `07_T123_TIKTOK_КВЕСТ_2.12.html`
8. `08_T123_BROWSER_ARCADE_2.15.34.html` (Mushroom Fly and shared Arcade runtime)

It then appends the strict Snake bundle from `arcade/assemble-snake-v2.cjs`, which reads `arcade/snake-{rules,world,core,segments,forest,controller}.js`, `arcade/09_T123_ARCADE_HUB_SNAKE.html`, and `arcade/snake-ui.html`. Snake production assets in `grib/mushroom-snake-v2/` are gated by the assembler. `blocks/00_T123_ТЕСТОВЫЙ_ЗАГРУЗЧИК.html` is read by loader verification, not included in the app bundle.

From a clean clone on Windows with Node and PowerShell:

```powershell
node arcade/test-snake-core.cjs
& .\tools\build_tilda_test.ps1
& .\tools\test_tilda_test.ps1
```

The build writes `giveaway-test/releases/<version>-<sha12>/app.html`, a local candidate `giveaway-test/manifest.json`, and `.last_tilda_test_release.json`. The content-addressed app is generated; edit the source blocks, not the release. Building or changing the local manifest does **not** publish TEST. Publication requires a separate authorized deployment and live mirror verification. Production (`giveaway/`) is not an input or output of this build.
