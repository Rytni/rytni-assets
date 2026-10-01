param([string]$AssetsRepo='', [switch]$Publish, [switch]$CheckOnly)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
if (!$AssetsRepo) { $AssetsRepo=$projectRoot }
$AssetsRepo=(Resolve-Path -LiteralPath $AssetsRepo).Path
if ($AssetsRepo -ne (Resolve-Path -LiteralPath $projectRoot).Path) { throw 'Use the canonical checkout build, not sibling source.' }
. (Join-Path $PSScriptRoot 'test-deploy-guard.ps1')
Assert-TestDeployState $AssetsRepo
if ($CheckOnly) { Write-Output 'TEST safety checks passed (no mutations).'; return }
if (!$Publish) { throw 'Publishing requires explicit -Publish; no build/stage/commit/push performed.' }
$branch=Invoke-DeployGit $AssetsRepo @('branch','--show-current')
if ($branch -ne 'main') { throw 'TEST publication requires main; do not push another branch to main.' }
if ((Invoke-DeployGit $AssetsRepo @('diff','--cached','--name-only')).Count) { throw 'Publication requires an empty index.' }
$snapshot=Get-ProductionSnapshot $AssetsRepo
& (Join-Path $PSScriptRoot 'build_tilda_test.ps1') -AssetsRepo $AssetsRepo
Assert-TestDeployState $AssetsRepo $snapshot
& (Join-Path $PSScriptRoot 'test_tilda_test.ps1') -AssetsRepo $AssetsRepo
Assert-TestDeployState $AssetsRepo $snapshot
$paths=Get-TestCandidatePaths $AssetsRepo
Assert-TestOnlyPaths $paths
& git -C $AssetsRepo add -- @paths
if ($LASTEXITCODE -ne 0) { throw 'Failed to stage TEST candidate.' }
Assert-TestDeployState $AssetsRepo $snapshot
$staged=Invoke-DeployGit $AssetsRepo @('diff','--cached','--name-only','--no-renames')
foreach($path in $staged) { if ($path -notin $paths) { throw "Unrelated TEST artifact in index: $path" } }
if (!$staged.Count) { Write-Output 'Candidate already committed; nothing published.'; return }
$id=(Get-Content -LiteralPath (Join-Path $AssetsRepo 'giveaway-test/manifest.json') -Raw | ConvertFrom-Json).current.id
& git -C $AssetsRepo commit -m "Publish TEST candidate $id"
if ($LASTEXITCODE -ne 0) { throw 'TEST commit failed.' }
Assert-TestDeployState $AssetsRepo $snapshot
& git -C $AssetsRepo push origin main
if ($LASTEXITCODE -ne 0) { throw 'TEST push failed.' }
Write-Output "Pushed TEST $id. Publication is NOT accepted until Pages/S3 manifest and public browser QA agree."
