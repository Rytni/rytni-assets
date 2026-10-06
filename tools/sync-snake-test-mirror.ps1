$ErrorActionPreference='Stop'
$keys=@('RYTNI_S3_ACCESS_KEY','RYTNI_S3_SECRET_KEY','RYTNI_S3_ENDPOINT','RYTNI_S3_REGION','RYTNI_S3_BUCKET','RYTNI_S3_CHANNEL')
$saved=@{};foreach($key in $keys){$saved[$key]=[Environment]::GetEnvironmentVariable($key,'Process')}
try {
 if(!$env:RYTNI_S3_ACCESS_KEY -or !$env:RYTNI_S3_SECRET_KEY){
  $loader='C:\Codex\Rytni Gift\RYTNI_TRANSFER_2026-07-31\CORE\Сайт\tools\load_s3_credentials.ps1'
  if(!(Test-Path -LiteralPath $loader)){throw 'TEST mirror credential loader unavailable; no upload performed'}
  . $loader
 }
 if(!$env:RYTNI_S3_ACCESS_KEY -or !$env:RYTNI_S3_SECRET_KEY){throw 'TEST mirror credentials unavailable; no upload performed'}
 $env:RYTNI_S3_CHANNEL='giveaway-test'
 & node (Join-Path $PSScriptRoot 'sync-snake-test-mirror.cjs')
 if($LASTEXITCODE -ne 0){throw 'Exact TEST mirror synchronization failed'}
} finally {foreach($key in $keys){[Environment]::SetEnvironmentVariable($key,$saved[$key],'Process')}}
