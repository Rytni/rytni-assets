from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent
repo=root.parents[2]
before=Image.open(root/'harvest-lod-before.png').convert('RGBA')
after=Image.open(repo/'grib/mushroom-snake-effects-v1/assets/effects/harvest-lod.png').convert('RGBA')
out=Image.new('RGB',(360,220),'#102e25');d=ImageDraw.Draw(out)
for im,x,label in [(before,16,'BEFORE / 8788006'),(after,196,'AFTER / A.1')]:
 d.text((x,8),label,fill='#f3e3b4');out.paste(im,(x,30),im)
 for y in range(65,209,8):
  for xx in range(x,x+144,8):d.rectangle((xx,y,xx+7,y+7),fill='#31453b' if ((xx-x)//8+(y-65)//8)%2 else '#20392d')
 big=im.resize((144,144),Image.Resampling.NEAREST);out.paste(big,(x,65),big)
out.save(root/'06-harvest-lod-before-after.png')
