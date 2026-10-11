# Offline authoring: remove only transparent vertical source padding. The art,
# palette and original generator output remain untouched. Not a mockup crop.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$source=Join-Path $PSScriptRoot '../../../grib/mushroom-fly-premium-v2/play-amber-v2.png'
$target=Join-Path $PSScriptRoot '../../../grib/mushroom-fly-premium-v2/play-amber-trimmed-v2.png'
$image=[System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $source).Path)
try {
 $top=$image.Height; $bottom=-1
 for($y=0;$y -lt $image.Height;$y++){for($x=0;$x -lt $image.Width;$x++){if($image.GetPixel($x,$y).A -gt 8){$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);break}}}
 $rect=[System.Drawing.Rectangle]::new(0,$top,$image.Width,$bottom-$top+1)
 $crop=$image.Clone($rect,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 try{$crop.Save([IO.Path]::GetFullPath($target),[System.Drawing.Imaging.ImageFormat]::Png)}finally{$crop.Dispose()}
 Write-Output "Trimmed alpha only: $($image.Width) x $($image.Height), y=$top..$bottom -> $($rect.Width) x $($rect.Height)"
} finally {$image.Dispose()}
