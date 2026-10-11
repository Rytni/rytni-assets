Add-Type -AssemblyName System.Drawing
$result=@()
foreach($width in @(1920,1366,390)){
 $before=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot "baseline-snake-$width.png"))
 $after=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot "candidate-snake-$width.png"))
 try{
  if($before.Width -ne $after.Width -or $before.Height -ne $after.Height){throw 'Snake raster dimensions differ'}
  $count=0;$left=$before.Width;$right=-1;$top=$before.Height;$bottom=-1;$maxDelta=0;$significant=@()
  for($y=0;$y -lt $before.Height;$y++){for($x=0;$x -lt $before.Width;$x++){
   $a=$before.GetPixel($x,$y);$b=$after.GetPixel($x,$y)
   if($a.ToArgb() -ne $b.ToArgb()){$count++;$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x);$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);$delta=[Math]::Max([Math]::Abs($a.R-$b.R),[Math]::Max([Math]::Abs($a.G-$b.G),[Math]::Abs($a.B-$b.B)));$maxDelta=[Math]::Max($maxDelta,$delta);if($delta -gt 2){$significant+=@{x=$x;y=$y;delta=$delta}}}
  }}
  $result+=@{viewport=$width;width=$before.Width;height=$before.Height;changedPixels=$count;fraction=$count/($before.Width*$before.Height);bounds=@($left,$top,$right,$bottom);maxChannelDelta=$maxDelta;significantCount=$significant.Count;significant=$significant}
 } finally {$before.Dispose();$after.Dispose()}
}
$result | ConvertTo-Json -Depth 5
