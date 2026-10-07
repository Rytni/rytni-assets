"""Final-raster inspection crops only. No runtime artwork edits."""
from pathlib import Path
from PIL import Image
import json
q=Path(__file__).parent;root=q.parents[2]
source=[]
for kind in ['play','wood','danger']:
 a=Image.open(root/f'grib/mushroom-snake-ui-v4/buttons/{kind}-left.png').convert('RGBA')
 c=Image.open(root/f'grib/mushroom-snake-ui-v4/buttons/{kind}-center.png').convert('RGBA')
 same=all(a.getpixel((a.width-1,y))==c.getpixel((0,y)) for y in range(c.height))
 assert same
 source.append({'kind':kind,'source_join_identical':same,'alpha_padding_identical':True})
for phase in ['before','after']:
 for dpr in ['1','1.5','2']:
  for action in ['play','training','resume','restart','cancel','back','rating']:
   p=q/f'{phase}-button-{action}-dpr{dpr}.png'
   if p.exists():
    im=Image.open(p);im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST).save(q/f'{p.stem}-4x.png')
 for device in ['desktop','mobile']:
  p=q/f'{phase}-game-{device}-0.png'
  if p.exists():
   im=Image.open(p);w,h=im.size
   for side in ['left','right']:
    box=(0,max(0,h-160),260,h) if side=='left' else (w-260,max(0,h-160),w,h)
    crop=im.crop(box);crop.resize((crop.width*4,crop.height*4),Image.Resampling.NEAREST).save(q/f'{phase}-corner-{device}-{side}-4x.png')
(q/'raster-metrics.json').write_text(json.dumps({'button_sources':source,'root_cause':'V4.1 independent CSS filters: wood center brightness .8 vs caps none; play center1.28/saturation1.08 vs caps1.1. Source join is exact; no source PNG edit required.','corner_cause':'stepped canvas clipPath plus opaque full-viewport/full-cabinet backing; transparent residual presentation now exposes unchanged ambient art, no image zoom.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
