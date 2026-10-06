$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'test-deploy-guard.ps1')
function Reject([scriptblock]$Action){$failed=$false;try{& $Action}catch{$failed=$true};if(!$failed){throw 'Unsafe runtime accepted.'}}
$fixture=Join-Path ([IO.Path]::GetTempPath()) ('snake-runtime-guard-'+[guid]::NewGuid().ToString('N'))
$runtime='giveaway-test/releases/snake-next-abc123def456'
New-Item -ItemType Directory -Path (Join-Path $fixture "$runtime/snake/product") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $fixture 'giveaway-test/releases/app-abc') -Force | Out-Null
function Write-Text($path,$text){[IO.File]::WriteAllText((Join-Path $fixture $path),$text,[Text.UTF8Encoding]::new($false))}
function Descriptor($file){$path=Join-Path $fixture "giveaway-test/$file";return @{file=$file;sha256=(Get-FileHash $path -Algorithm SHA256).Hash.ToLowerInvariant();size=(Get-Item $path).Length}}
Write-Text "$runtime/snake/product/index.html" 'safe preview'
$entry=Descriptor 'releases/snake-next-abc123def456/snake/product/index.html';$entry.file='snake/product/index.html'
Write-Text "$runtime/runtime.json" (@{schema=1;id='snake-next-abc123def456';entry='snake/product/index.html';files=@($entry)}|ConvertTo-Json -Depth 8)
Write-Text 'giveaway-test/releases/app-abc/app.html' 'test bundle'
$app=Descriptor 'releases/app-abc/app.html';$app.id='app-abc';$rt=Descriptor 'releases/snake-next-abc123def456/runtime.json';$rt.id='snake-next-abc123def456';$rt.entry='releases/snake-next-abc123def456/snake/product/index.html';$app.snake_runtime=$rt
Write-Text 'giveaway-test/manifest.json' (@{schema=1;current=$app}|ConvertTo-Json -Depth 8)
$paths=Get-TestCandidatePaths $fixture
if($paths.Count -ne 4 -or "$runtime/snake/product/index.html" -notin $paths){throw 'Runtime was omitted from canonical candidate.'}
Assert-TestOnlyPaths $paths $fixture
Reject { Assert-TestOnlyPaths @("$runtime/snake/product/unlisted.js") $fixture }
Reject { Assert-TestOnlyPaths @('giveaway/manifest.json') $fixture }
Write-Text "$runtime/snake/product/index.html" 'tampered'
Reject { Get-TestCandidatePaths $fixture }
Write-Output "PASS: exact runtime allowlist, protected paths, dependency tampering. Fixture $fixture"
