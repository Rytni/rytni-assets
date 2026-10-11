Add-Type -AssemblyName System.Drawing
$assetRoot=Join-Path (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path 'grib/mushroom-fly-premium-v2-1'
$source=[Drawing.Bitmap]::new((Join-Path $assetRoot 'secondary-source-v2-1.png'))
try{$left=$source.Width;$right=-1;$top=$source.Height;$bottom=-1
 # Generator's alpha<=15 haze spans the canvas; remove only this near-invisible
 # exterior fringe in a sibling authoring derivative, never the original.
 for($y=0;$y -lt $source.Height;$y++){for($x=0;$x -lt $source.Width;$x++){if($source.GetPixel($x,$y).A -ge 16){$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x);$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y)}}}
 $rect=[Drawing.Rectangle]::new($left,$top,$right-$left+1,$bottom-$top+1);$trim=$source.Clone($rect,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $trim.Save((Join-Path $assetRoot 'secondary-trimmed-v2-1.png'),[Drawing.Imaging.ImageFormat]::Png);$trim.Dispose()
 Write-Output "Secondary transparent trim: $left,$top → $right,$bottom"
}finally{$source.Dispose()}
$gift=[Drawing.Image]::FromFile((Join-Path $assetRoot 'sponsor-token-v2-1.png'));$small=[Drawing.Bitmap]::new(128,128);$g=[Drawing.Graphics]::FromImage($small)
try{$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;$g.DrawImage($gift,0,0,128,128);$small.Save((Join-Path $assetRoot 'sponsor-token-128-v2-1.png'),[Drawing.Imaging.ImageFormat]::Png)}finally{$g.Dispose();$small.Dispose();$gift.Dispose()}
