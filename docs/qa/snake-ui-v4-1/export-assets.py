"""Offline exports from new blank-book master and existing V4/native icon authoring.
No reference screenshots or Fly retouching. Runtime uses independent PNG parts.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from collections import deque
import json,hashlib
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'grib/mushroom-snake-ui-v4-1';QA=Path(__file__).parent
for p in [OUT,OUT/'book',OUT/'icons',QA]:p.mkdir(parents=True,exist_ok=True)
original=Image.open(ROOT/'grib/mushroom-snake-ui-v4/icons/attempt-48.png').convert('RGBA')
remaining={(x,y) for y in range(48) for x in range(48) if original.getpixel((x,y))[3]};components=[]
while remaining:
 q=deque([remaining.pop()]);component=[]
 while q:
  x,y=q.popleft();component.append((x,y))
  for v in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
   if v in remaining:remaining.remove(v);q.append(v)
 components.append(component)
components.sort(key=len,reverse=True);clean=original.copy()
for c in components[1:]:
 for v in c:clean.putpixel(v,(0,0,0,0))
clean.save(OUT/'icons/attempt-48.png')
for key,im in [('before',original),('after',clean)]:im.resize((384,384),Image.Resampling.NEAREST).save(QA/f'{key}-token-source-8x.png')
# Keep new ImageGen master out of runtime; all layout is real nine-slice.
master=Path('C:/Users/rytni/.codex/generated_images/01a08321-eab4-7933-939d-19e5a820a209/exec-fda7a9a6-6132-470f-9443-fc9bffed0b3f.png')
book=Image.open(master).convert('RGBA');page=book.crop((24,68,750,948)).resize((364,440),Image.Resampling.NEAREST)
for name,box in {'tl':(0,0,96,96),'tr':(268,0,364,96),'bl':(0,344,96,440),'br':(268,344,364,440),'top':(160,0,192,96),'bottom':(160,344,192,440),'left':(0,180,96,212),'right':(268,180,364,212),'paper':(110,150,238,278)}.items():page.crop(box).save(OUT/'book'/f'{name}.png')
book.crop((748,100,780,932)).resize((16,416),Image.Resampling.NEAREST).save(OUT/'book/spine.png')
# Native64 medallions: crisp pixel rings/laurels, number is content not a font-icon.
font=ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf',32)
for key,number,palette in [('medal-1','1',['#684416','#b67b20','#ffe297']),('medal-2','2',['#37434c','#8c9da4','#f1eee0']),('medal-3','3',['#633421','#b77543','#f3c18a']),('medal-rank','',['#31412b','#799449','#dac281'])]:
 im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
 for r,col in [(24,'#14100b'),(22,palette[1]),(19,palette[2]),(17,palette[0])]:d.ellipse((32-r,32-r,32+r,32+r),fill=col)
 for side in [-1,1]:
  for y in [24,32,40,48]:
   x=32+side*(25-abs(y-36)//4);d.polygon([(x,y-4),(x+side*5,y-3),(x+side*2,y+3),(x-side*2,y+4)],fill=palette[1]);d.line((x,y-2,x-side*2,y+3),fill=palette[2])
 if number:d.text((32,30),number,font=font,anchor='mm',fill=palette[2],stroke_width=1,stroke_fill=palette[0])
 else:d.polygon([(32,20),(35,28),(44,29),(37,35),(39,44),(32,39),(25,44),(27,35),(20,29),(29,28)],fill=palette[2])
 im.save(OUT/'icons'/f'{key}.png')
# Native illustrated controls; transparent PNG source of truth, not live debug shapes.
for kind,size in [('keyboard',(168,92)),('dpad',(92,92))]:
 im=Image.new('RGBA',size);d=ImageDraw.Draw(im);font=ImageFont.truetype('C:/Windows/Fonts/consolab.ttf',18)
 cells=[(30,2,'W'),(2,32,'A'),(30,32,'S'),(58,32,'D'),(112,2,'↑'),(84,32,'←'),(112,32,'↓'),(140,32,'→')] if kind=='keyboard' else [(32,2,'↑'),(2,32,'←'),(32,32,'↓'),(62,32,'→')]
 for x,y,label in cells:
  if x+26>size[0]:x=size[0]-26
  d.rectangle((x,y,x+26,y+26),fill='#b18b44',outline='#4d341d',width=2);d.rectangle((x+3,y+3,x+23,y+21),fill='#faf0ce');d.text((x+13,y+12),label,font=font,anchor='mm',fill='#46351e')
 d.text((size[0]//2,77),'WASD / ↑↓' if kind=='keyboard' else 'D-PAD',font=ImageFont.truetype('C:/Windows/Fonts/consolab.ttf',12),anchor='mm',fill='#46351e')
 im.save(OUT/'icons'/f'{kind}.png')
assets=[]
for f in sorted(OUT.rglob('*.png')):
 im=Image.open(f);b=f.read_bytes();assets.append({'file':f.relative_to(OUT).as_posix(),'size':list(im.size),'sha256':hashlib.sha256(b).hexdigest()})
(OUT/'inventory.json').write_text(json.dumps({'schema':1,'assets':assets,'book_source':master.name,'attempt_components':[len(c) for c in components],'attempt_removed_bounds':[4,26,5,39]},indent=2)+'\n')
