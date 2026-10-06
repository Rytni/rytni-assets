param(
  [string]$AssetsRepo = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) 'tools' }
$projectRoot = Split-Path -Parent $scriptDir
$AssetsRepo = if ($AssetsRepo) { $AssetsRepo } else { $projectRoot }
$loaderPath = Join-Path $projectRoot 'tilda-test\blocks\00_T123_ТЕСТОВЫЙ_ЗАГРУЗЧИК.html'
$manifestPath = Join-Path $AssetsRepo 'giveaway-test\manifest.json'

if (-not (Test-Path -LiteralPath $loaderPath)) { throw 'Единый загрузчик T123 не найден.' }
if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'Манифест внешнего релиза не найден.' }

$loader = [System.IO.File]::ReadAllText($loaderPath)
foreach ($marker in @(
  'manifest.json',
  'storage-1090.s3hoster.by/rytnistatictest/giveaway-test/',
  'rytni.github.io/rytni-assets/giveaway-test/',
  'raw.githubusercontent.com/Rytni/rytni-assets/main/giveaway-test/',
  'AbortController',
  'NETWORK_TIMEOUT',
  'caches.open',
  'LAST_GOOD_KEY',
  'SCRIPT_MIRRORS',
  'rewriteAssetUrls',
  'ASSET_BASES',
  'sessionStorage',
  'manifest.previous',
  'crypto.subtle',
  'FALLBACK_MAX_AGE',
  'created_at: Date.now()',
  'if (usePrevious) clearFallback()'
)) {
  if ($loader -notmatch [regex]::Escape($marker)) { throw "В загрузчике отсутствует маркер: $marker" }
}
if ($loader -notmatch '(?s)const usePrevious\s*=.*?if \(usePrevious\) clearFallback\(\);.*?const selected') {
  throw 'TEST fallback не очищается до запуска резервной версии.'
}
if ($loader -match '(?i)headers\s*:\s*noStore|["'']Cache-Control["'']\s*:') {
  throw 'TEST loader снова отправляет пользовательский Cache-Control и вызывает CORS preflight.'
}
if ($loader -notmatch 'cache:\s*noStore\s*\?\s*"no-store"' -or $loader -notmatch 't=\$\{Date\.now\(\)\}') {
  throw 'TEST loader потерял безопасное отключение кеша без пользовательских заголовков.'
}

$scriptMatches = [regex]::Matches($loader, '(?is)<script(?:\s[^>]*)?>(.*?)</script>')
if ($scriptMatches.Count -ne 1) { throw "В едином загрузчике ожидался один script, найдено: $($scriptMatches.Count)" }
$tempFile = Join-Path ([System.IO.Path]::GetTempPath()) ('rytni-loader-' + [guid]::NewGuid().ToString('N') + '.js')
try {
  [System.IO.File]::WriteAllText($tempFile, $scriptMatches[0].Groups[1].Value, [System.Text.UTF8Encoding]::new($false))
  & node --check $tempFile
  if ($LASTEXITCODE -ne 0) { throw 'Синтаксическая ошибка в едином загрузчике.' }
} finally {
  if (Test-Path -LiteralPath $tempFile) { Remove-Item -LiteralPath $tempFile -Force }
}

$manifest = [System.IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
if ($manifest.schema -ne 1 -or -not $manifest.current.id -or -not $manifest.current.file) {
  throw 'Некорректный манифест внешнего релиза.'
}
$bundlePath = Join-Path (Join-Path $AssetsRepo 'giveaway-test') ($manifest.current.file -replace '/', '\')
if (-not (Test-Path -LiteralPath $bundlePath)) { throw "Пакет релиза не найден: $bundlePath" }

$bytes = [System.IO.File]::ReadAllBytes($bundlePath)
$sha = [System.Security.Cryptography.SHA256]::Create()
try {
  $hashBytes = $sha.ComputeHash($bytes)
} finally {
  $sha.Dispose()
}
$hash = ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
if ($hash -ne $manifest.current.sha256) { throw 'Контрольная сумма внешнего пакета не совпала.' }
if ($bytes.Length -ne $manifest.current.size) { throw 'Размер внешнего пакета не совпал с манифестом.' }

$bundle = [System.Text.Encoding]::UTF8.GetString($bytes)
if (-not $manifest.current.snake_runtime) { throw 'TEST candidate has no immutable Snake Next runtime descriptor.' }
$runtimePathsJson = & node (Join-Path $AssetsRepo 'arcade/assemble-snake-next.cjs') --validate $manifestPath
if ($LASTEXITCODE -ne 0) { throw 'Snake Next runtime dependency/hash/source validation failed.' }
$runtimePaths = ($runtimePathsJson -join "`n") | ConvertFrom-Json
$runtimeUrl = 'https://rytni.github.io/rytni-assets/giveaway-test/' + $manifest.current.snake_runtime.entry
if ($bundle -notmatch [regex]::Escape($runtimeUrl)) { throw 'Snake Next host does not select the declared immutable runtime.' }
if ($bundle -match '__SNAKE_NEXT_RUNTIME_URL__|window\.MushroomSnakeCore\.Engine') { throw 'TEST includes an unresolved Snake host token or legacy Snake engine.' }
if ($bundle -notmatch 'window\.RYTNI_RELEASE\s*=\s*"' + [regex]::Escape($manifest.current.version) + '"') {
  throw 'Версия пакета не совпала с манифестом.'
}
if ($bundle -notmatch 'if\(document\.readyState==="loading"\)document\.addEventListener\("DOMContentLoaded",initTikTokQuest') {
  throw 'TikTok-квест не подготовлен к асинхронной загрузке.'
}
foreach ($marker in @('winner-archive-card', 'winner-archive-season', 'winner-archive-winner', 'winner-archive-season-action-label', 'winner-archive-season-chevron', 'createElementNS("http://www.w3.org/2000/svg","svg")', 'Развернуть', 'Свернуть', 'aria-expanded', 'Зал славы Rytni')) {
  if ($bundle -notmatch [regex]::Escape($marker)) { throw "TEST не содержит новый архив победителей: $marker" }
}
$regionCount = [regex]::Matches($bundle, 'data-region-code="[A-Z]{2}"').Count
if ($regionCount -lt 200 -or $bundle -notmatch 'function ensureSteamRegionsAvailable') {
  throw "TEST не содержит полный самовосстанавливающийся список регионов Steam: $regionCount"
}
if ($bundle -match 'data-rytni-main-archive-hidden="true"') {
  throw 'TEST ошибочно содержит MAIN-правило скрытия архива победителей.'
}

Write-Output "Test Tilda bundle validated: $($manifest.current.id), $($bytes.Length) bytes; Snake Next $($manifest.current.snake_runtime.id), $($runtimePaths.Count) immutable files."
