# Dot-source: no filesystem or Git mutations.
Set-StrictMode -Version Latest
function Invoke-DeployGit([string]$Repo,[string[]]$GitArgs) {
  $result = @(& git -C $Repo @GitArgs)
  if ($LASTEXITCODE -ne 0) { throw "Git validation failed: $($GitArgs -join ' ')" }
  return ,$result
}
function Assert-TestOnlyPaths([string[]]$Paths,[string]$Repo='') {
  $runtimePaths=@()
  if ($Repo -and @($Paths | Where-Object { $_ -notmatch '^giveaway-test/(manifest\.json|releases/[^/]+/app\.html)$' }).Count) {
    $runtimePaths=Get-TestCandidatePaths $Repo
  }
  foreach ($path in $Paths) {
    if ($path -notmatch '^giveaway-test/(manifest\.json|releases/[^/]+/app\.html)$' -and $path -notin $runtimePaths) {
      throw "TEST deployment rejected protected/unexpected target: $path"
    }
  }
}
function Get-ProductionSnapshot([string]$Repo) {
  $root = Join-Path $Repo 'giveaway'
  if (-not (Test-Path -LiteralPath $root)) { throw 'Production directory missing; fail closed.' }
  return ((Get-ChildItem -LiteralPath $root -Recurse -File | Sort-Object FullName | ForEach-Object {
    $_.FullName.Substring($root.Length) + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
  }) -join "`n")
}
function Assert-TestDeployState([string]$Repo,[string]$ProductionSnapshot) {
  $productionDirty = Invoke-DeployGit $Repo @('status','--porcelain','--untracked-files=all','--','giveaway')
  if ($productionDirty.Count) { throw 'Production working tree/index is dirty; TEST deployment refused.' }
  $staged = Invoke-DeployGit $Repo @('diff','--cached','--name-only','--no-renames')
  Assert-TestOnlyPaths $staged $Repo
  $unstaged = Invoke-DeployGit $Repo @('diff','--name-only','--no-renames')
  Assert-TestOnlyPaths $unstaged $Repo
  if ($PSBoundParameters.ContainsKey('ProductionSnapshot') -and (Get-ProductionSnapshot $Repo) -cne $ProductionSnapshot) {
    throw 'Production bytes changed during TEST preparation; refused before staging/publishing.'
  }
}
function Get-TestCandidatePaths([string]$Repo) {
  $manifest = Get-Content -LiteralPath (Join-Path $Repo 'giveaway-test/manifest.json') -Raw | ConvertFrom-Json
  $file = [string]$manifest.current.file
  if ($file -notmatch '^releases/[a-zA-Z0-9.-]+/app\.html$') { throw 'Unsafe candidate path.' }
  $bundle = Join-Path $Repo ('giveaway-test/' + $file)
  $bytes = [System.IO.File]::ReadAllBytes($bundle)
  $hash = (Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($hash -cne $manifest.current.sha256 -or $bytes.Length -ne $manifest.current.size) { throw 'Candidate hash/size mismatch.' }
  $paths=@('giveaway-test/manifest.json',('giveaway-test/' + $file))
  if ($manifest.current.PSObject.Properties.Name -contains 'snake_runtime') {
    $rt=$manifest.current.snake_runtime
    if ($rt.id -notmatch '^snake-next-[a-f0-9]{12}$' -or $rt.file -cne "releases/$($rt.id)/runtime.json" -or $rt.entry -cne "releases/$($rt.id)/snake/product/index.html") { throw 'Unsafe Snake runtime descriptor.' }
    $runtimePath=Join-Path $Repo ('giveaway-test/'+$rt.file)
    if ((Get-FileHash -LiteralPath $runtimePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $rt.sha256 -or (Get-Item -LiteralPath $runtimePath).Length -ne $rt.size) { throw 'Snake runtime manifest hash/size mismatch.' }
    $runtime=Get-Content -LiteralPath $runtimePath -Raw | ConvertFrom-Json
    if ($runtime.schema -ne 1 -or $runtime.id -cne $rt.id -or $runtime.entry -cne 'snake/product/index.html' -or !$runtime.files.Count -or $runtime.files.Count -gt 2000) { throw 'Invalid Snake runtime manifest.' }
    $seen=@{}
    $paths+=('giveaway-test/'+$rt.file)
    foreach($dependency in $runtime.files) {
      $relative=[string]$dependency.file
      if ($relative -notmatch '^(snake|grib)/[a-zA-Z0-9_./-]+\.(html|js|mjs|css|json|png|webp|wav|mp3|ogg|woff2)$' -or @($relative.Split('/') | Where-Object { $_ -in @('.','..','') }).Count -or $seen.ContainsKey($relative)) { throw 'Unsafe/duplicate Snake runtime dependency.' }
      $seen[$relative]=$true
      $target="giveaway-test/releases/$($rt.id)/$relative"
      $absolute=Join-Path $Repo $target
      if ((Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLowerInvariant() -cne $dependency.sha256 -or (Get-Item -LiteralPath $absolute).Length -ne $dependency.size) { throw "Snake dependency hash/size mismatch: $relative" }
      $paths+=$target
    }
    if (!$seen.ContainsKey('snake/product/index.html')) { throw 'Missing Snake runtime entry.' }
    $validator=Join-Path $Repo 'arcade/assemble-snake-next.cjs'
    if (Test-Path -LiteralPath $validator) {
      $validated=& node $validator --validate (Join-Path $Repo 'giveaway-test/manifest.json')
      if ($LASTEXITCODE -ne 0) { throw 'Snake runtime source-closure/identity validation failed.' }
      $validatedPaths=($validated -join "`n") | ConvertFrom-Json
      foreach($runtimeTarget in $paths | Select-Object -Skip 2) { if ($runtimeTarget -notin $validatedPaths) { throw 'Runtime allowlist disagrees with strict assembly.' } }
    }
  }
  return $paths
}
