# Compatibility launcher for the retired sibling deployment path.
param([string]$AssetsRepo='C:\GitHub\rytni-assets',[int]$VerifyTimeoutSeconds=60,[switch]$Publish,[switch]$CheckOnly)
$ErrorActionPreference='Stop'
$canonical=Join-Path $AssetsRepo 'tools/deploy_tilda_test.ps1'
if (!(Test-Path -LiteralPath $canonical)) { throw 'Canonical TEST deploy guard missing; fail closed.' }
# No sibling build, no Production staging, no implicit publication.
& $canonical -AssetsRepo $AssetsRepo -Publish:$Publish -CheckOnly:$CheckOnly
