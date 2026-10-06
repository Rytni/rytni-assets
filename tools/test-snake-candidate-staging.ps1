$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'test-deploy-guard.ps1')
$fixture=Join-Path ([IO.Path]::GetTempPath()) ('snake-staging-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'giveaway') -Force | Out-Null
[IO.File]::WriteAllText((Join-Path $fixture 'giveaway/manifest.json'),'protected')
& git -C $fixture init --quiet
$paths=for($n=0;$n -lt 600;$n++){
 $relative='giveaway-test/releases/app-'+$n+'-'+('a'*80)+'/app.html'
 $target=Join-Path $fixture $relative
 New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
 [IO.File]::WriteAllText($target,'immutable fixture')
 $relative
}
if(($paths -join ' ').Length -lt 32768){throw 'Fixture is not long enough to catch Windows argv limit'}
if(!(Get-Command Stage-TestCandidatePaths -ErrorAction SilentlyContinue)){throw 'Missing bounded candidate staging transport'}
$rejected=$false;try{Stage-TestCandidatePaths $fixture @('giveaway/manifest.json')}catch{$rejected=$true}
if(!$rejected){throw 'Production path accepted'}
Stage-TestCandidatePaths $fixture $paths
$actual=@(& git -C $fixture diff --cached --name-only)
if(@(Compare-Object ($paths|Sort-Object) ($actual|Sort-Object)).Count){throw 'Exact staging list differs'}
if($actual.Count -ne 600){throw 'Candidate dependencies were lost'}
Write-Output "PASS: 600 literal candidate paths via stdin; Production rejected. Fixture $fixture"
