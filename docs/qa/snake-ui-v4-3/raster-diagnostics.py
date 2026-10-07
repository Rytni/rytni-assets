"""Requested FINAL-composite crops/ownership measurements, not runtime edits."""
from pathlib import Path
from PIL import Image
import json
q=Path(__file__).parent
metrics=[]
for phase in ['before','after']:
 for dpr in [1,1.5,2]:
  im=Image.open(q/f'{phase}-result-dpr{dpr}.png').convert('RGB')
  mask=Image.open(q/f'{phase}-result-ownership-dpr{dpr}.png').convert('RGB')
  w,h=mask.size
  sides={}
  # Same DOM/source alpha at the same DPR; white = wood, blue = fill,
  # magenta = scene exposed. Measure final ink adjacency on central rails.
  for side in ['top','bottom','left','right']:
   vertical=side in ['top','bottom'];count=h if vertical else w
   lines=[]
   for t in [.35,.5,.65]:
    pos=int((w if vertical else h)*t)
    points=[mask.getpixel((pos,i) if vertical else (i,pos)) for i in range(count)]
    if side in ['bottom','right']:points.reverse()
    wood=[i for i,(r,g,b) in enumerate(points[:int(48*dpr)]) if min(r,g,b)>235]
    field=[i for i,(r,g,b) in enumerate(points[:int(48*dpr)]) if r<25 and 70<g<130 and b>230]
    if not wood or not field:raise AssertionError((phase,dpr,side,'missing ownership ink'))
    first_field=min(field);inner=max(i for i in wood if i<max(field))
    lines.append(max(0,first_field-inner-1)/dpr)
   sides[side]=max(lines)
   thickness=int(32*dpr)
   box=(int(w*.38),0,int(w*.62),thickness) if side=='top' else (int(w*.38),h-thickness,int(w*.62),h) if side=='bottom' else (0,int(h*.38),thickness,int(h*.62)) if side=='left' else (w-thickness,int(h*.38),w,int(h*.62))
   crop=im.crop(box);crop.resize((crop.width*8,crop.height*8),Image.Resampling.NEAREST).save(q/f'{phase}-seam-{side}-dpr{dpr}-8x.png')
  metrics.append({'phase':phase,'dpr':dpr,'visible_scene_gap_css_px':sides})
  if phase=='after':assert all(v==0 for v in sides.values()),('visible seam',dpr,sides)
 for path in q.glob(f'{phase}-label-*-dpr1.png'):
  im=Image.open(path);im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST).save(q/f'{path.stem}-4x.png')
# Verify authored runtime contracts, alpha exterior, no baked plate.
root=q.parents[2]
icons=[]
for path in (root/'grib/mushroom-snake-ui-v4-3/icons').glob('*.png'):
 im=Image.open(path).convert('RGBA');assert im.size==(128,128);assert im.getpixel((0,0))[3]==0
 icons.append({'file':path.name,'size':list(im.size),'transparent_exterior':True})
(q/'raster-metrics.json').write_text(json.dumps({'seams':metrics,'icons':icons},indent=2)+'\n',encoding='utf-8')
print(json.dumps(metrics,indent=2))
