$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'test-deploy-guard.ps1')
function Expect-Rejection([scriptblock]$Action) {
  $rejected=$false
  try { & $Action } catch { $rejected=$true }
  if (!$rejected) { throw 'Expected fail-closed rejection.' }
}
Assert-TestOnlyPaths @('giveaway-test/manifest.json','giveaway-test/releases/2.15.33-abc/app.html')
foreach($bad in @('giveaway/manifest.json','giveaway/releases/abc/app.html','giveaway-test/../giveaway/manifest.json','other.txt','giveaway-test/releases/abc/other.html')) {
  Expect-Rejection { Assert-TestOnlyPaths @($bad) }
}
# Generated throwaway Git fixture, never the user's checkout or a deployment.
$fixture=Join-Path ([System.IO.Path]::GetTempPath()) ('rytni-deploy-guard-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'giveaway') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $fixture 'giveaway-test') -Force | Out-Null
[System.IO.File]::WriteAllText((Join-Path $fixture 'giveaway/manifest.json'),'production')
[System.IO.File]::WriteAllText((Join-Path $fixture 'giveaway-test/manifest.json'),'test')
& git -C $fixture init --quiet
& git -C $fixture add -- giveaway giveaway-test
& git -C $fixture -c user.name=QA -c user.email=qa@example.invalid commit --quiet -m fixture
Assert-TestDeployState $fixture
$before=Get-ProductionSnapshot $fixture
[System.IO.File]::WriteAllText((Join-Path $fixture 'giveaway/manifest.json'),'modified')
Expect-Rejection { Assert-TestDeployState $fixture $before }
& git -C $fixture add -- giveaway/manifest.json
Expect-Rejection { Assert-TestDeployState $fixture $before }
# Preserve the disposable fixture as failure evidence; no recursive deletion.
Write-Output "PASS: path allowlist, modified Production, staged Production. Fixture: $fixture"
