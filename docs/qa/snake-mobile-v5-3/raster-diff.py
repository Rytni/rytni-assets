from PIL import Image, ImageChops
from pathlib import Path
import json
task=Path(__file__).parent
rows=[]
for width in [720,1366,1920]:
 for screen in ['main','settings','rating','rules']:
  a=Image.open(task/f'desktop-{width}-before-{screen}.png').convert('RGB')
  b=Image.open(task/f'desktop-{width}-after-{screen}.png').convert('RGB')
  d=ImageChops.difference(a,b)
  count=sum(pixel!=(0,0,0) for pixel in d.getdata())
  print(width,screen,'bbox',d.getbbox(),'pixels',count,'max',max(x[1] for x in d.getextrema()))
  maximum=max(x[1] for x in d.getextrema())
  rows.append({'width':width,'screen':screen,'changedPixels':count,'maxChannelDelta':maximum,'pixelIdentical':count==0,'pass':maximum<=1 and count<=a.width*a.height*.0005})
  if width==1366 and screen=='rating' and d.getbbox():
    bbox=d.getbbox();a.crop(bbox).save(task/'desktop-diff-before.png');b.crop(bbox).save(task/'desktop-diff-after.png');d.save(task/'desktop-diff.png')
(task/'desktop-raster.json').write_text(json.dumps({'checks':len(rows),'failures':[r for r in rows if not r['pass']],'rows':rows,'criterion':'No visual/geometry change. <=1/255 channel rounding in <=0.05% pixels permitted; strict byte comparison retained in desktop.json.'},indent=2)+'\n',encoding='utf-8')
assert all(r['pass'] for r in rows)
