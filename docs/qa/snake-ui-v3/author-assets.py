"""Offline pixel authoring; runtime uses these PNGs, never procedural UI art.
Approved production art supplies structural material; no concept crops.
"""
from PIL import Image, ImageDraw, ImageFont, ImageChops
from pathlib import Path
import json, hashlib, random

ROOT=Path(__file__).resolve().parents[3]
OLD=ROOT/'grib/mushroom-snake-menu-v1'
OUT=ROOT/'grib/mushroom-snake-ui-v3'
OUT.mkdir(parents=True,exist_ok=True)
for folder in ['panels','buttons','icons','ornaments']: (OUT/folder).mkdir(exist_ok=True)
N=Image.Resampling.NEAREST
def save(im,name): im.save(OUT/name)
def crop(im,box,name,half=True):
 a=im.crop(box)
 if half:a=a.resize((a.width//2,a.height//2),N)
 save(a,name);return a

board=Image.open(OLD/'board-frame.png').convert('RGBA')
for name,box in {'tl':(0,0,96,96),'tr':(416,0,512,96),'bl':(0,577,96,673),'br':(416,577,512,673)}.items():crop(board,box,'panels/'+name+'.png')
# Plain structural edge regions exclude corner clusters and central crest.
crop(board,(90,42,166,90),'panels/top.png')
crop(board,(96,615,160,663),'panels/bottom.png')
crop(board,(0,112,48,208),'panels/left.png')
crop(board,(464,112,512,208),'panels/right.png')
crop(board,(120,160,248,288),'panels/wood.png')
crest=crop(board,(160,0,352,100),'ornaments/crest-gold.png')
mask=Image.new('L',crest.size);md=ImageDraw.Draw(mask)
md.polygon([(0,31),(0,20),(12,16),(23,9),(30,13),(36,4),(48,0),(58,4),(66,13),(74,9),(84,16),(95,20),(95,31),(82,33),(73,37),(64,39),(60,47),(48,49),(36,47),(32,40),(24,37),(14,33)],fill=255)
crest.putalpha(ImageChops.multiply(crest.getchannel('A'),mask))
# Flood only connected dark wood outside the crest, not its enclosed engraving.
from collections import deque
q=deque([(x,y) for x in range(96) for y in [0,49]]+[(x,y) for x in [0,95] for y in range(50)]);seen=set();p=crest.load()
while q:
 x,y=q.popleft()
 if (x,y) in seen or not(0<=x<96 and 0<=y<50):continue
 seen.add((x,y));r,g,b,a=p[x,y]
 if a==0 or r+g+b<230 and r>g*1.05 and g>b*1.15:
  p[x,y]=(r,g,b,0);q.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
save(crest,'ornaments/crest-gold.png')
def tint(im,hue):
 a=im.copy();p=a.load()
 for y in range(a.height):
  for x in range(a.width):
   r,g,b,alpha=p[x,y]
   if alpha and r>g*1.06 and r>b*1.45:
    l=(r+g+b)/3
    if hue=='green':p[x,y]=(int(l*.72),min(255,int(l*1.24)),int(l*.84),alpha)
    else:p[x,y]=(min(255,int(l*1.28)),int(l*.48),int(l*.60),alpha)
 return a
save(tint(crest,'green'),'ornaments/crest-pause.png')
save(tint(crest,'red'),'ornaments/crest-confirm.png')
for key in ['settings','guide','result','tournament']:save(crest.copy(),'ornaments/crest-'+key+'.png')

# Buttons: ornamental caps are fixed-ratio PNGs; only plain center repeats.
# Build source at 1:1 native height 64, not a flattened complete button.
for kind,filename in [('play','button-play.png'),('wood','button-wood.png'),('danger','button-danger.png')]:
 source=Image.open(OLD/filename).convert('RGBA')
 target_height=64
 source=source.resize((round(source.width*target_height/source.height),target_height),N)
 cap=38 if kind=='play' else 30
 save(source.crop((0,0,cap,target_height)),f'buttons/{kind}-left.png')
 save(source.crop((source.width-cap,0,source.width,target_height)),f'buttons/{kind}-right.png')
 # The crest/bottom jewel are not included in the stretching region.
 center=Image.new('RGBA',(16,64))
 d=ImageDraw.Draw(center)
 pal={'play':['#251b10','#c48c34','#ffdd7a','#174d32','#1c7a48','#27a262','#123427'],
      'wood':['#20150e','#ab7131','#efce7d','#3b2418','#563724','#6b4930','#24180f'],
      'danger':['#24100f','#a77730','#f3cf78','#4d1926','#752b35','#913a47','#35151c']}[kind]
 for y,col in [(6,pal[0]),(8,pal[1]),(10,pal[2]),(12,pal[1]),(14,pal[3]),(18,pal[4]),(28,pal[5]),(46,pal[4]),(50,pal[6]),(52,pal[1]),(54,pal[2]),(56,pal[0])]:d.rectangle((0,y,15,y+3),fill=col)
 d.rectangle((0,20,15,45),fill=pal[4]);d.line((0,22,15,22),fill=pal[5],width=2)
 for x,y in [(2,24),(9,26),(5,34),(13,38),(1,42)]:d.rectangle((x,y,x+2,y+1),fill=pal[5])
 save(center,f'buttons/{kind}-center.png')
 if kind=='play':
  ornament=Image.open(OLD/filename).convert('RGBA').crop((135,0,186,46)).resize((28,26),N)
  save(ornament,'buttons/play-jewel.png')

INK='#19251b';DEEP='#2b2518';GOLD='#c29645';LIGHT='#ffdfa1';MOSS='#4a7a43';MINT='#9cbc68';IVORY='#fff0c5';RED='#b73534';HIRED='#ef7250';WOOD='#825b36'
def icon(kind):
 im=Image.new('RGBA',(24,24));d=ImageDraw.Draw(im)
 def rect(box,c,outline=None):d.rectangle(box,fill=c,outline=outline,width=1)
 def poly(points,c,outline=None):d.polygon(points,fill=c,outline=outline)
 def line(points,c,w=1):d.line(points,fill=c,width=w)
 def mushroom(x=5,y=5):
  poly([(x,y+6),(x+1,y+3),(x+4,y),(x+9,y),(x+12,y+3),(x+13,y+6)],INK)
  poly([(x+1,y+5),(x+2,y+2),(x+5,y+1),(x+8,y+1),(x+11,y+3),(x+12,y+5)],RED)
  line([(x+3,y+2),(x+9,y+2)],HIRED,1);rect((x+3,y+3,x+5,y+4),IVORY);rect((x+9,y+4,x+10,y+5),IVORY)
  rect((x+4,y+7,x+9,y+13),DEEP);rect((x+5,y+7,x+8,y+12),IVORY);rect((x+5,y+13,x+9,y+14),MOSS)
 if kind=='settings':
  poly([(9,2),(14,2),(14,5),(17,5),(19,7),(17,10),(21,10),(21,14),(18,14),(18,17),(16,19),(13,17),(13,21),(9,21),(9,18),(6,18),(4,16),(6,13),(2,13),(2,9),(5,9),(5,6),(7,4),(10,6)],DEEP)
  poly([(10,3),(13,3),(13,6),(16,6),(18,8),(16,10),(20,11),(20,13),(17,13),(17,16),(15,18),(13,16),(12,20),(10,20),(10,17),(7,17),(5,15),(7,13),(3,12),(3,10),(6,10),(6,7),(8,5),(10,7)],GOLD)
  d.ellipse((7,7,16,16),fill=LIGHT);d.ellipse((9,9,14,14),fill=MOSS);rect((11,10,12,12),MINT)
 elif kind=='guide':
  poly([(2,5),(9,4),(12,6),(15,4),(22,5),(22,20),(14,20),(12,22),(10,20),(2,20)],DEEP)
  poly([(3,6),(9,5),(11,7),(11,19),(8,18),(3,19)],IVORY);poly([(13,7),(15,5),(21,6),(21,19),(16,18),(13,19)],'#dac288')
  line([(12,7),(12,20)],GOLD,2);line([(4,9),(9,8)],WOOD);line([(4,12),(9,11)],WOOD);line([(4,15),(9,14)],WOOD)
  poly([(16,9),(19,10),(19,14),(16,15),(15,13)],MOSS);line([(16,10),(18,13)],MINT)
 elif kind in ['sound-on','sound-off','sfx']:
  poly([(2,9),(7,9),(13,4),(13,20),(7,15),(2,15)],DEEP);poly([(3,10),(7,10),(11,6),(11,18),(7,14),(3,14)],GOLD);line([(4,10),(7,10)],LIGHT,2)
  if kind!='sound-off':line([(15,8),(17,10),(17,14),(15,16)],IVORY,2);line([(19,5),(22,8),(22,16),(19,19)],MINT)
  else:line([(16,8),(21,15)],LIGHT,2);line([(21,8),(16,15)],LIGHT,2)
 elif kind in ['fullscreen','exit-fullscreen']:
  for x,y,flipx,flipy in [(3,3,False,False),(15,3,True,False),(3,15,False,True),(15,15,True,True)]:
   if kind=='exit-fullscreen':flipx=not flipx;flipy=not flipy
   rect((x,y+4 if flipy else y,x+6,y+6 if flipy else y+2),GOLD);rect((x+4 if flipx else x,y,x+6 if flipx else x+2,y+6),GOLD)
  for x,y in [(4,4),(16,4),(4,16),(16,16)]:rect((x,y,x+1,y+1),LIGHT)
 elif kind=='close':
  line([(5,5),(18,18)],DEEP,5);line([(18,5),(5,18)],DEEP,5);line([(5,5),(18,18)],GOLD,3);line([(18,5),(5,18)],GOLD,3);line([(6,5),(18,17)],LIGHT,1);line([(17,5),(5,17)],IVORY,1)
 elif kind=='back':
  poly([(2,12),(11,3),(11,8),(21,8),(21,16),(11,16),(11,21)],DEEP);poly([(4,12),(10,6),(10,10),(19,10),(19,14),(10,14),(10,18)],GOLD);line([(5,12),(10,7)],LIGHT,2)
 elif kind=='home':
  rect((6,10,18,21),DEEP);rect((7,11,17,20),WOOD);poly([(2,11),(12,2),(22,11)],DEEP);poly([(4,10),(12,4),(20,10)],RED);line([(7,8),(12,4),(17,8)],HIRED,2);rect((10,14,14,20),MOSS);rect((8,12,10,14),LIGHT);rect((14,12,16,14),LIGHT)
 elif kind=='restart':
  line([(19,7),(15,3),(7,3),(3,7),(3,15),(7,19),(15,19),(19,15)],DEEP,5);line([(18,7),(14,4),(8,4),(4,8),(4,14),(8,18),(14,18),(18,14)],GOLD,3);line([(7,5),(14,5),(17,7)],LIGHT,1);poly([(14,7),(21,5),(21,12)],MINT)
 elif kind=='share':
  rect((3,14,20,21),DEEP);rect((4,15,19,20),GOLD);rect((6,15,17,18),MOSS);poly([(12,2),(5,9),(9,9),(9,15),(15,15),(15,9),(19,9)],DEEP);poly([(12,4),(8,8),(11,8),(11,14),(13,14),(13,8),(16,8)],IVORY)
 elif kind=='trophy':
  d.arc((1,4,22,16),0,180,fill=GOLD,width=3);poly([(5,3),(19,3),(18,11),(14,15),(13,18),(17,19),(17,22),(7,22),(7,19),(11,18),(10,15),(6,11)],DEEP);poly([(7,4),(17,4),(16,10),(13,13),(11,13),(8,10)],GOLD);line([(8,5),(8,9),(11,11)],LIGHT,2);rect((11,13,13,19),GOLD);rect((8,20,16,21),LIGHT)
 elif kind=='rank':
  rect((2,13,7,21),WOOD,DEEP);rect((8,7,15,21),GOLD,DEEP);rect((16,16,21,21),MOSS,DEEP);poly([(11,1),(13,4),(16,4),(14,6),(15,9),(11,7),(8,9),(9,6),(7,4),(10,4)],LIGHT);line([(9,9),(13,9)],IVORY,2)
 elif kind=='attempt':mushroom()
 elif kind=='sponsor':
  rect((4,10,20,21),DEEP);rect((5,11,19,20),GOLD);rect((4,8,20,11),LIGHT);rect((11,8,13,21),MOSS);poly([(11,8),(5,5),(6,2),(9,3),(12,7),(15,3),(18,2),(19,5),(13,8)],DEEP);line([(11,7),(7,4),(7,3)],MINT,2);line([(13,7),(17,4),(17,3)],MINT,2)
 elif kind=='leaderboard':
  rect((3,3,21,22),DEEP);rect((4,4,20,21),GOLD);rect((6,6,18,19),WOOD);line([(8,8),(17,8)],IVORY,2);line([(8,12),(16,12)],MINT,2);line([(8,16),(15,16)],IVORY,2);rect((5,8,6,9),LIGHT)
 elif kind=='music':
  rect((8,3,19,6),DEEP);rect((9,4,18,5),GOLD);line([(9,5),(9,17)],IVORY,2);line([(18,5),(18,15)],IVORY,2);d.ellipse((3,15,10,20),fill=MINT);d.ellipse((12,13,19,18),fill=GOLD)
 elif kind=='combo':
  line([(5,5),(18,18)],GOLD,4);line([(18,5),(5,18)],GOLD,4);line([(6,5),(18,17)],IVORY,1)
 elif kind=='keys':
  for x,y in [(8,1),(1,12),(8,12),(15,12)]:rect((x,y,x+7,y+9),DEEP);rect((x+1,y+1,x+6,y+8),GOLD);rect((x+2,y+2,x+5,y+7),MOSS)
  poly([(11,3),(9,6),(13,6)],IVORY);poly([(3,16),(5,14),(5,18)],IVORY);poly([(11,19),(9,16),(13,16)],IVORY);poly([(20,16),(18,14),(18,18)],IVORY)
 else:raise ValueError(kind)
 return im

ICONS=['settings','guide','sound-on','sound-off','fullscreen','exit-fullscreen','close','back','home','restart','share','trophy','rank','attempt','sponsor','leaderboard','music','sfx','keys','combo']
for key in ICONS:
 save(icon(key).resize((48,48),N),'icons/'+key+'-48.png')
 if key in ['guide','settings','trophy','leaderboard']:save(icon(key).resize((64,64),N),'icons/'+key+'-64.png')
bezel=Image.open(OLD/'icon-bezel.png').convert('RGBA').resize((48,48),N);save(bezel,'buttons/control.png')
# Long native strip for tiled lower-cabinet rails, texture never owns gameplay.
rail=Image.new('RGBA',(128,96));d=ImageDraw.Draw(rail)
d.rectangle((0,0,127,95),fill='#2b2018');d.rectangle((0,4,127,91),fill='#483021');d.rectangle((0,4,127,7),fill='#ddb66a');d.rectangle((0,9,127,12),fill='#76522e');d.rectangle((0,84,127,87),fill='#b78b46');d.rectangle((0,89,127,92),fill='#211911')
rng=random.Random(731)
for y in [20,30,43,56,70]:
 for x in range(0,128,8):d.rectangle((x,y,x+rng.randrange(8,28),y+1),fill=rng.choice(['#4e3524','#3c281c','#59402b']))
save(rail,'panels/lower-rail.png')

# Native inspection sheet: all icons at 1× / 2× / 4× on three materials.
font=ImageFont.load_default();sheet=Image.new('RGB',(1400,980),'#081e17');d=ImageDraw.Draw(sheet)
for row,bg in enumerate(['#0a3024','#553823','#176745']):
 d.rectangle((0,row*326,1399,row*326+325),fill=bg)
 for i,key in enumerate(ICONS):
  x=(i%10)*140;y=row*326+(i//10)*160
  d.text((x+6,y+3),key,fill='#ffdf9d',font=font)
  a=Image.open(OUT/'icons'/f'{key}-48.png');sheet.paste(a,(x+6,y+20),a)
  b=a.resize((96,96),N);sheet.paste(b,(x+40,y+64),b)
sheet.save(ROOT/'docs/qa/snake-ui-v3/icons-1x-2x.png')
zoom=Image.new('RGB',(20*202,660),'#0a3024');zd=ImageDraw.Draw(zoom)
for row,bg in enumerate(['#0a3024','#553823','#176745']):
 zd.rectangle((0,row*220,4039,row*220+219),fill=bg)
 for i,key in enumerate(ICONS):
  a=Image.open(OUT/'icons'/f'{key}-48.png').resize((192,192),N);zoom.paste(a,(i*202,row*220+20),a)
zoom.save(ROOT/'docs/qa/snake-ui-v3/icons-4x.png')
inventory=[{'file':str(p.relative_to(OUT)).replace('\\','/'),'size':Image.open(p).size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(OUT.rglob('*.png'))]
(OUT/'inventory.json').write_text(json.dumps({'schema':1,'authoring':'offline pixel authoring; approved material slices; fixed-aspect ornaments','icons':ICONS,'assets':inventory},indent=2)+'\n',encoding='utf8')
print('Authored',len(inventory),'PNG assets;',len(ICONS),'icons')
