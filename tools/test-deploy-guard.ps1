# Dot-source: no filesystem or Git mutations.
Set-StrictMode -Version Latest
function Invoke-DeployGit([string]$Repo,[string[]]$GitArgs) {
  $result = @(& git -C $Repo @GitArgs)
  if ($LASTEXITCODE -ne 0) { throw "Git validation failed: $($GitArgs -join ' ')" }
  return ,$result
}
function Assert-TestOnlyPaths([string[]]$Paths) {
  foreach ($path in $Paths) {
    if ($path -notmatch '^giveaway-test/(manifest\.json|releases/[^/]+/app\.html)$') {
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
  Assert-TestOnlyPaths $staged
  $unstaged = Invoke-DeployGit $Repo @('diff','--name-only','--no-renames')
  Assert-TestOnlyPaths $unstaged
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
  return @('giveaway-test/manifest.json',('giveaway-test/' + $file))
}
