param(
  [string]$Ffmpeg='ffmpeg',
  [string]$SourceRoot=(Join-Path $PSScriptRoot '../../.playwright-cli/phase3a/sources'),
  [string]$OutputRoot=(Join-Path $PSScriptRoot '../../arcade/snake-next/assets')
)
$ErrorActionPreference='Stop'
# Mechanical production downsampling only. Original ImageGen PNGs remain in
# CODEX generated_images and an untracked local QA source folder.
$groups=@{
  character=@{ 'head-right-v1'=192;'skin-v1'=128;'moss-mushrooms-v1'=128 }
  forest=@{ 'ground-v2'=256;'fern-v1'=128;'rock-v1'=128;'stump-v1'=128;'root-v1'=128;'bush-v1'=128;'log-v1'=128;'seed-v1'=96 }
  ui=@{ 'background-v1'=1280;'hero-v1'=768;'frame-v1'=640;'surface-v1'=256;'button-v1'=720;'logo-v1'=960 }
}
foreach($group in $groups.Keys){
  $destination=Join-Path $OutputRoot $group
  New-Item -ItemType Directory -Force -Path $destination | Out-Null
  foreach($name in $groups[$group].Keys){
    $source=Join-Path $SourceRoot "$group/$name.png"
    if(!(Test-Path -LiteralPath $source)){throw "Missing accepted source: $source"}
    $target=Join-Path $destination "$name.webp"
    if(Test-Path -LiteralPath $target){continue} # Never overwrite an accepted asset.
    $width=$groups[$group][$name]
    & $Ffmpeg -hide_banner -loglevel error -i $source -vf "scale=${width}:-1:flags=neighbor" -c:v libwebp -lossless 1 -compression_level 6 -n $target
    if($LASTEXITCODE){throw "Preparation failed: $name"}
  }
}
$audioDestination=Join-Path $OutputRoot 'audio'
New-Item -ItemType Directory -Force -Path $audioDestination | Out-Null
foreach($file in Get-ChildItem -LiteralPath (Join-Path $SourceRoot 'audio') -Filter '*.wav'){
  $target=Join-Path $audioDestination $file.Name
  if($file.BaseName -eq 'forest-theme-v1'){
    $target=[IO.Path]::ChangeExtension($target,'.ogg')
    if(Test-Path -LiteralPath $target){continue}
    & $Ffmpeg -hide_banner -loglevel error -i $file.FullName -c:a libvorbis -q:a 5 -n $target
    if($LASTEXITCODE){throw 'Music encoding failed'}
  }elseif(!(Test-Path -LiteralPath $target)){Copy-Item -LiteralPath $file.FullName -Destination $target}
}
