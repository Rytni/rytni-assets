Add-Type -AssemblyName System.Drawing
$source=Join-Path (Split-Path -Parent $PSScriptRoot) 'mushroom-fly-premium-v2'
$files=@(Get-ChildItem -LiteralPath $source -File | Where-Object {$_.Name -match '^(live-|runtime-).*\.png$'} | Sort-Object Name)
for($offset=0;$offset -lt $files.Count;$offset+=9){
 $canvas=[Drawing.Bitmap]::new(1500,1050);$g=[Drawing.Graphics]::FromImage($canvas);$g.Clear([Drawing.Color]::FromArgb(25,30,40));$font=[Drawing.Font]::new('Arial',12)
 for($i=0;$i -lt 9 -and $offset+$i -lt $files.Count;$i++){$file=$files[$offset+$i];$img=[Drawing.Image]::FromFile($file.FullName);try{$x=($i%3)*500;$y=[Math]::Floor($i/3)*350;$scale=[Math]::Min(490/$img.Width,320/$img.Height);$g.DrawImage($img,[int]($x+(490-$img.Width*$scale)/2),[int]($y+25),[int]($img.Width*$scale),[int]($img.Height*$scale));$g.DrawString($file.Name,$font,[Drawing.Brushes]::White,$x+6,$y+4)}finally{$img.Dispose()}}
 $canvas.Save((Join-Path $PSScriptRoot ('audit-sheet-'+[int]($offset/9)+'.png')),[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$font.Dispose();$canvas.Dispose()
}
Write-Output "Inspected source inventory: $($files.Count) native captures"
