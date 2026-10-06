param(
  [string]$AssetsRepo = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) 'tools' }
$projectRoot = Split-Path -Parent $scriptDir
$AssetsRepo = if ($AssetsRepo) { $AssetsRepo } else { $projectRoot }
$blocksDir = Join-Path $projectRoot 'tilda-test\blocks'
$releaseFile = Join-Path $blocksDir '05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html'
$blocks = @(
  '01_T123_ОСНОВНЫЕ_СТИЛИ_2.12.html',
  '02_T123_КАРТОЧКА_УЧАСТНИКА_2.12.html',
  '03_T123_СТИЛИ_СТРАНИЦЫ_2.12.html',
  '04_T123_HTML_РАЗМЕТКА_2.12.html',
  '05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html',
  '05B_T123_JAVASCRIPT_ЧАСТЬ_2_2.12.html',
  '07_T123_TIKTOK_КВЕСТ_2.12.html',
  '08_T123_BROWSER_ARCADE_2.15.34.html'
)

if (-not (Test-Path -LiteralPath (Join-Path $AssetsRepo '.git'))) {
  throw "Репозиторий ресурсов не найден: $AssetsRepo"
}

$releaseSource = [System.IO.File]::ReadAllText($releaseFile)
$releaseMatch = [regex]::Match($releaseSource, 'window\.RYTNI_RELEASE\s*=\s*"([^"]+)"')
if (-not $releaseMatch.Success) { throw 'Не найден window.RYTNI_RELEASE.' }
$clientVersion = $releaseMatch.Groups[1].Value

$parts = foreach ($name in $blocks) {
  $path = Join-Path $blocksDir $name
  if (-not (Test-Path -LiteralPath $path)) { throw "Не найден блок: $name" }
  ([System.IO.File]::ReadAllText($path) -replace "`r`n?", "`n").TrimEnd()
}
$snakeCandidateJson = & node (Join-Path $AssetsRepo 'arcade/assemble-snake-next.cjs') --candidate
if ($LASTEXITCODE -ne 0) { throw 'Snake Next immutable runtime/host assembly failed.' }
$snakeCandidate = ($snakeCandidateJson -join "`n") | ConvertFrom-Json
$snakeRuntime = $snakeCandidate.runtime
$parts += ($snakeCandidate.bundle -replace "`r`n?", "`n").TrimEnd()
$bundle = ($parts -join "`n`n") + "`n"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$bytes = $utf8.GetBytes($bundle)
$sha = [System.Security.Cryptography.SHA256]::Create()
try {
  $hashBytes = $sha.ComputeHash($bytes)
} finally {
  $sha.Dispose()
}
$hash = ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
$releaseId = "$clientVersion-$($hash.Substring(0, 12))"
$relativeFile = "releases/$releaseId/app.html"

$giveawayRoot = Join-Path $AssetsRepo 'giveaway-test'
$releaseDir = Join-Path $giveawayRoot "releases\$releaseId"
$bundlePath = Join-Path $releaseDir 'app.html'
$manifestPath = Join-Path $giveawayRoot 'manifest.json'
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
[System.IO.File]::WriteAllText($bundlePath, $bundle, $utf8)

$oldManifest = $null
if (Test-Path -LiteralPath $manifestPath) {
  $oldManifest = [System.IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
}
$sameRelease = [bool]($oldManifest -and $oldManifest.current -and $oldManifest.current.id -eq $releaseId -and $oldManifest.current.loader_schema -eq 2)

$current = [ordered]@{
  id = $releaseId
  version = $clientVersion
  loader_schema = 2
  file = $relativeFile
  sha256 = $hash
  size = $bytes.Length
  snake_runtime = $snakeRuntime
}

$previous = $null
if ($sameRelease -and $oldManifest.previous) {
  $previous = $oldManifest.previous
} elseif (
  $oldManifest -and
  $oldManifest.current -and
  $oldManifest.current.id -ne $releaseId -and
  $oldManifest.current.loader_schema -eq 2
) {
  $previous = $oldManifest.current
} elseif ($oldManifest -and $oldManifest.previous -and $oldManifest.previous.loader_schema -eq 2) {
  $previous = $oldManifest.previous
} else {
  $fallbackId = "$clientVersion-bootstrap-$($hash.Substring(0, 12))"
  $fallbackRelativeFile = "releases/$fallbackId/app.html"
  $fallbackDir = Join-Path $giveawayRoot "releases\$fallbackId"
  New-Item -ItemType Directory -Path $fallbackDir -Force | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $fallbackDir 'app.html'), $bundle, $utf8)
  $previous = [ordered]@{
    id = $fallbackId
    version = $clientVersion
    loader_schema = 2
    file = $fallbackRelativeFile
    sha256 = $hash
    size = $bytes.Length
    snake_runtime = $snakeRuntime
  }
}

$manifest = [ordered]@{
  schema = 1
  published_at = if ($sameRelease) { $oldManifest.published_at } else { [DateTime]::UtcNow.ToString('o') }
  current = $current
  previous = $previous
}
$manifestJson = $manifest | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($manifestPath, $manifestJson + "`n", $utf8)

$result = [ordered]@{
  id = $releaseId
  version = $clientVersion
  bundle = $bundlePath
  manifest = $manifestPath
  sha256 = $hash
  size = $bytes.Length
  snake_runtime = $snakeRuntime
}
$resultPath = Join-Path $projectRoot '.last_tilda_test_release.json'
[System.IO.File]::WriteAllText($resultPath, (($result | ConvertTo-Json -Depth 8) + "`n"), $utf8)
$result | ConvertTo-Json -Depth 8
