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

It then appends the thin Snake Next TEST host from `arcade/assemble-snake-next.cjs` and `arcade/snake-next/test-host.html`. The assembler snapshots the static import closure rooted at `arcade/snake-next/product/index.html` and `frame.html`, plus the bounded artwork families and audio cues used by that product. Legacy Snake v2 source and releases remain available for rollback/reference; they are not appended to new TEST candidates. `blocks/00_T123_ТЕСТОВЫЙ_ЗАГРУЗЧИК.html` is read by loader verification, not included in the app bundle.

From a clean clone on Windows with Node and PowerShell:

```powershell
node --test arcade/test-snake-next-package.cjs
& .\tools\build_tilda_test.ps1
& .\tools\test_tilda_test.ps1
```

The build writes `giveaway-test/releases/<version>-<sha12>/app.html`, a local candidate `giveaway-test/manifest.json`, and `.last_tilda_test_release.json`. It also creates `giveaway-test/releases/snake-next-<sha12>/runtime.json`, `snake/` modules, and `grib/` artwork. The runtime manifest records the exact relative paths, SHA-256 values, and sizes of every dependency. `current.snake_runtime` records the runtime manifest hash, size, and entry point; the host references that immutable entry. Artwork URLs remain relative to that same snapshot and work on GitHub Pages and the S3 mirror without mutable source dependencies.

Both content-addressed outputs are generated; edit source blocks/product files, not releases. Rebuilding identical inputs reuses the existing runtime; conflicting existing bytes cause a hard failure. Local badges and automatic `qa=1` iframe flags are removed from the TEST snapshot. Building or changing the local manifest does **not** publish TEST. Publication requires a separate authorized deployment, exact hash-verified candidate staging, and live mirror verification. Production (`giveaway/`) is not an input or output of this build.
