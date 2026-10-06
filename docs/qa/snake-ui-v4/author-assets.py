"""Native UI V4 pixel authoring. No input/reference pixels used for components.
Illustrations are exported only from newly authored ImageGen source files.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import random, json, hashlib
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'grib/mushroom-snake-ui-v4';QA=ROOT/'docs/qa/snake-ui-v4'
for p in [OUT,QA,*[OUT/n for n in ['panels','buttons','icons','ornaments']]]:p.mkdir(parents=True,exist_ok=True)
G=['#20140d','#593713','#9c641e','#d79b36','#ffe18b','#fff1ba'];V=['#061d17','#134536','#227050','#51a16a'];R=['#3b1115','#7e2424','#c74735','#ff9960'];N=Image.Resampling.NEAREST
def save(im,file):im.save(OUT/file)
def canvas(w,h):return Image.new('RGBA',(w,h))
def leaf(d,x,y,flip=False):
 pts=[(x,y+4),(x+3,y),(x+9,y+1),(x+8,y+6),(x+3,y+8)];d.polygon(pts,fill='#11351e');d.polygon([(x+1,y+4),(x+4,y+1),(x+8,y+2),(x+6,y+6)],fill='#588342');d.line([(x+2,y+5),(x+7,y+2)],fill='#b5b958',width=1)
def mush(d,x,y,k=1):
 def box(a):return tuple(round(v*k) for v in a)
 d.rectangle(box((x+5,y+8,x+10,y+15)),fill='#593f26');d.rectangle(box((x+6,y+8,x+9,y+14)),fill='#ffefba');d.rectangle(box((x+6,y+15,x+11,y+16)),fill='#46743b')
 d.polygon([(round(a*k),round(b*k)) for a,b in [(x,y+8),(x+1,y+4),(x+4,y+1),(x+9,y),(x+13,y+3),(x+15,y+7),(x+13,y+9),(x+2,y+9)]],fill='#461a15')
 d.polygon([(round(a*k),round(b*k)) for a,b in [(x+1,y+7),(x+2,y+4),(x+5,y+2),(x+9,y+1),(x+12,y+3),(x+14,y+7)]],fill='#cb3b28');d.line(box((x+4,y+3,x+10,y+2)),fill='#ff915a',width=max(1,round(k)))
 for a in [(x+4,y+4,x+6,y+5),(x+10,y+4,x+11,y+5),(x+7,y+2,x+8,y+3)]:d.rectangle(box(a),fill='#fff3ce')
def rim(d,box,fill):
 x,y,r,b=box;d.rounded_rectangle(box,radius=5,fill=G[0]);d.rounded_rectangle((x+1,y+1,r-1,b-1),radius=4,fill=G[2]);d.rounded_rectangle((x+2,y+2,r-2,b-2),radius=3,fill=G[4]);d.rounded_rectangle((x+3,y+4,r-3,b-2),radius=2,fill=G[1]);d.rounded_rectangle((x+5,y+6,r-5,b-5),radius=1,fill=fill)
wood=canvas(128,128);d=ImageDraw.Draw(wood);d.rectangle((0,0,127,127),fill='#352117');rng=random.Random(4401)
for y in range(128):
 c=['#342116','#39251a','#3e291c','#362217'][y//16%4];d.line((0,y,127,y),fill=c)
 for _ in range(4):
  x=rng.randrange(128);d.line((x,y,min(127,x+rng.randrange(6,40)),y),fill=rng.choice(['#3f2a1c','#40291d','#2d1d15','#483020']))
# Low-contrast wood grain: no visible striped tile blocks behind text.
d=ImageDraw.Draw(wood);d.rectangle((0,0,127,127),fill='#302016')
for _ in range(120):
 x=rng.randrange(128);y=rng.randrange(128);d.line((x,y,min(127,x+rng.randrange(5,30)),y),fill=rng.choice(['#322218','#2d1e15','#342218']))
save(wood,'panels/wood.png')
for name in ['tl','tr','bl','br']:
 im=canvas(48,48);d=ImageDraw.Draw(im)
 d.polygon([(3,45),(3,10),(10,3),(45,3),(45,15),(17,15),(15,17),(15,45)],fill=G[0]);d.line([(5,44),(5,11),(11,5),(44,5)],fill=G[3],width=3);d.line([(8,42),(8,13),(13,8),(42,8)],fill=G[5],width=1);d.line([(12,40),(12,16),(16,12),(40,12)],fill=G[1],width=2)
 d.rectangle((8,8,20,20),fill=G[2]);d.rectangle((10,10,18,18),fill=G[4]);d.rectangle((12,12,17,17),fill=G[1]);d.rectangle((13,13,15,15),fill=G[5]);leaf(d,23,3);leaf(d,1,27);leaf(d,17,15);mush(d,1,0);mush(d,26,9,.8)
 if name.endswith('r'):im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 if name.startswith('b'):im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 save(im,'panels/'+name+'.png')
top=canvas(32,20);d=ImageDraw.Draw(top)
for y,c in enumerate([G[0],G[1],G[2],G[4],G[3],G[1],'#2a1a12','#4a2b19','#5a351c','#3b2317','#2c1c13',G[1],G[2],G[4],G[1],G[0]]):d.line((0,y+2,31,y+2),fill=c)
d.line((0,10,10,10),fill='#865631');d.line((16,7,28,7),fill='#986638');save(top,'panels/top.png');save(top.transpose(Image.Transpose.FLIP_TOP_BOTTOM),'panels/bottom.png');save(top.transpose(Image.Transpose.ROTATE_90),'panels/left.png');save(top.transpose(Image.Transpose.ROTATE_270),'panels/right.png')
rail=canvas(128,64);rail.paste(wood.crop((0,0,128,64)));d=ImageDraw.Draw(rail)
for y,c in [(0,G[0]),(2,G[3]),(4,G[5]),(6,G[1]),(57,G[1]),(59,G[3]),(61,G[0])]:d.line((0,y,127,y),fill=c,width=2)
save(rail,'panels/lower-rail.png')

ICONS=['settings','guide','sound-on','sound-off','fullscreen','exit-fullscreen','close','back','home','restart','share','trophy','rank','attempt','sponsor','leaderboard','music','sfx','keys','combo']
def glyph(kind,size=48):
 im=canvas(size,size);d=ImageDraw.Draw(im);q=size/48
 def xy(points):return [(round(x*q),round(y*q)) for x,y in points]
 def poly(p,c):d.polygon(xy(p),fill=c)
 def line(p,c=G[4],w=2):d.line(xy(p),fill=c,width=max(1,round(w*q)),joint='curve')
 def rect(b,c):d.rectangle(tuple(round(x*q) for x in b),fill=c)
 def goldpoly(p):poly(p,G[1]);poly([(x,y-1) for x,y in p],G[3]);line(p[:max(2,len(p)//2)],G[5],1)
 if kind=='settings':
  poly([(20,6),(28,6),(29,12),(34,10),(39,16),(35,21),(42,23),(41,30),(34,31),(35,37),(28,40),(25,34),(19,39),(13,35),(16,29),(8,28),(8,21),(15,19),(12,13),(18,9)],G[1]);poly([(21,8),(27,8),(28,15),(34,12),(37,16),(32,22),(39,24),(38,28),(31,29),(33,35),(28,37),(24,30),(19,36),(15,33),(20,27),(11,26),(11,23),(20,21),(15,15),(18,12),(21,17)],G[3]);d.ellipse(tuple(round(v*q) for v in (17,17,31,31)),fill=G[5]);d.ellipse(tuple(round(v*q) for v in (20,20,28,28)),fill=V[1]);rect((22,20,25,23),V[3])
 elif kind=='guide':
  goldpoly([(7,11),(17,9),(24,13),(31,9),(41,11),(40,36),(31,34),(24,38),(17,34),(7,36),(7,11)]);poly([(10,13),(17,12),(21,15),(21,32),(16,30),(10,32)],'#ffedb5');poly([(27,15),(31,12),(37,13),(37,32),(31,30),(27,33)],'#d6b37a');line([(24,15),(24,35)],G[1],2)
  for y in [17,22,27]:line([(12,y),(18,y-1)],'#816032',1)
  leaf(d,29*q,18*q)
 elif kind in ['sound-on','sound-off','sfx']:
  goldpoly([(7,19),(15,19),(26,11),(26,37),(15,29),(7,29),(7,19)]);rect((10,21,16,26),G[5]);line([(23,16),(23,31)],G[5],2)
  if kind=='sound-off':line([(31,17),(40,30)],G[1],5);line([(40,17),(31,30)],G[1],5);line([(31,17),(40,30)],G[4],2);line([(40,17),(31,30)],G[4],2)
  else:line([(31,18),(34,21),(34,27),(31,30)],G[5],2);line([(37,13),(42,18),(43,28),(37,35)],G[3],2);line([(38,14),(42,19)],G[5],1)
 elif kind in ['fullscreen','exit-fullscreen']:
  for x,y,sx,sy in [(9,9,1,1),(38,9,-1,1),(9,38,1,-1),(38,38,-1,-1)]:
   if kind=='exit-fullscreen':x+=sx*8;y+=sy*8;sx=-sx;sy=-sy
   line([(x+sx*9,y),(x,y),(x,y+sy*9)],G[1],5);line([(x+sx*8,y-1),(x,y-1),(x,y+sy*8)],G[4],3)
 elif kind=='close':
  for p in [[(13,13),(35,35)],[(35,13),(13,35)]]:line(p,G[1],6);line([(x,y-1) for x,y in p],G[4],3)
 elif kind=='back':goldpoly([(8,24),(22,11),(22,19),(40,19),(40,29),(22,29),(22,37),(8,24)])
 elif kind=='home':
  goldpoly([(7,22),(24,8),(41,22),(36,25),(36,38),(12,38),(12,25),(7,22)]);poly([(12,21),(24,12),(36,21)],'#e9bd60');rect((17,25,31,36),G[2]);rect((21,27,27,38),V[1]);rect((13,25,17,29),G[5]);rect((31,25,35,29),G[5])
 elif kind=='restart':
  line([(36,17),(29,10),(18,10),(10,18),(10,30),(18,38),(29,38),(36,30)],G[1],7);line([(35,17),(28,12),(19,12),(12,19),(12,29),(19,35),(28,35),(34,30)],G[3],4);line([(15,15),(20,12),(27,12)],G[5],2);goldpoly([(29,19),(41,9),(41,25),(29,19)])
 elif kind=='share':
  goldpoly([(9,29),(15,29),(15,36),(34,36),(34,29),(40,29),(40,41),(9,41),(9,29)]);goldpoly([(24,7),(12,20),(20,20),(20,31),(28,31),(28,20),(36,20),(24,7)])
 elif kind=='trophy':
  line([(13,13),(7,13),(8,23),(17,27)],G[1],5);line([(35,13),(41,13),(40,23),(31,27)],G[1],5);line([(13,12),(8,12),(9,21),(17,25)],G[4],2);line([(35,12),(40,12),(39,21),(31,25)],G[3],2);goldpoly([(14,9),(34,9),(32,23),(27,29),(26,35),(33,37),(33,41),(15,41),(15,37),(22,35),(21,29),(16,23),(14,9)]);line([(18,13),(19,22),(23,25)],G[5],3);rect((19,38,29,39),G[5])
 elif kind=='rank':
  goldpoly([(9,27),(19,27),(19,40),(9,40),(9,27)]);goldpoly([(20,19),(30,19),(30,40),(20,40),(20,19)]);poly([(31,30),(39,30),(39,40),(31,40)],V[2]);goldpoly([(24,5),(27,10),(34,10),(29,15),(31,21),(24,18),(18,21),(19,15),(14,10),(21,10),(24,5)])
 elif kind=='attempt':mush(d,8,6,size/30)
 elif kind=='sponsor':
  goldpoly([(10,22),(38,22),(38,40),(10,40),(10,22)]);rect((13,24,22,37),G[3]);rect((26,24,35,37),G[4]);rect((8,18,40,23),G[5]);rect((22,17,26,40),'#aa6530');line([(23,18),(23,38)],G[4],1);line([(23,17),(15,10),(11,12),(14,17),(22,18)],G[1],5);line([(25,17),(33,10),(37,12),(34,17),(26,18)],G[1],5);line([(23,16),(15,10),(12,12),(16,16)],G[4],2);line([(25,16),(33,10),(36,12),(32,16)],G[3],2)
 elif kind=='leaderboard':
  goldpoly([(11,8),(37,8),(37,40),(11,40),(11,8)]);rect((14,12,34,36),V[0]);
  for i,y in enumerate([16,24,32]):rect((16,y,19,y+2),G[3]);line([(23,y),(32-i*2,y)],G[5],2)
 elif kind=='music':
  goldpoly([(18,9),(37,7),(37,14),(21,16),(21,34),(16,38),(9,37),(9,32),(16,29),(18,29),(18,9)]);line([(34,13),(34,30)],G[4],3);goldpoly([(34,26),(27,29),(27,34),(34,35),(38,32),(38,26),(34,26)])
 elif kind=='keys':
  for x,y in [(18,6),(5,23),(18,23),(31,23)]:
   rect((x,y,x+11,y+15),G[1]);rect((x+1,y+1,x+10,y+13),G[4]);rect((x+3,y+3,x+8,y+11),V[1])
  poly([(23,10),(20,15),(26,15)],G[5]);poly([(8,30),(12,27),(12,33)],G[5]);poly([(23,34),(20,29),(26,29)],G[5]);poly([(38,30),(34,27),(34,33)],G[5])
 elif kind=='combo':
  for p in [[(12,11),(36,35)],[(36,11),(12,35)]]:line(p,G[1],7);line(p,G[3],4);line([(x,y-1) for x,y in p],G[5],1)
 return im
for key in ICONS:
 save(glyph(key),'icons/'+key+'-48.png')
 if key in ['guide','trophy','rank','settings','attempt']:save(glyph(key,64),'icons/'+key+'-64.png')
bezel=canvas(48,48);d=ImageDraw.Draw(bezel);rim(d,(1,1,46,46),V[0]);d.line((9,8,36,8),fill=V[2]);d.line((8,9,8,36),fill='#286c49');save(bezel,'buttons/control.png')
for kind,pal in [('play',V),('wood',['#201711','#38271a','#593e25','#775434']),('danger',R)]:
 center=canvas(24,64);d=ImageDraw.Draw(center)
 for y in range(8,57):
  c=G[0] if y in [8,56] else G[4] if y in [10,54] else G[2] if y in [9,11,53,55] else pal[0] if y in [12,13,51,52] else pal[1] if y>35 else pal[2] if y>19 else pal[3];d.line((0,y,23,y),fill=c)
 d.line((0,17,23,17),fill=pal[3]);d.line((0,49,23,49),fill=pal[0]);save(center,f'buttons/{kind}-center.png')
 cap=canvas(40,64);d=ImageDraw.Draw(cap);d.polygon([(39,8),(13,8),(4,14),(1,31),(5,49),(14,56),(39,56)],fill=G[0]);d.line([(39,10),(15,10),(6,16),(4,32),(8,47),(15,54),(39,54)],fill=G[3],width=3);d.line([(38,11),(16,11),(8,17),(6,30)],fill=G[5],width=1);d.polygon([(39,14),(17,14),(10,20),(9,42),(18,50),(39,50)],fill=pal[1]);d.line([(18,17),(38,17)],fill=pal[3]);d.arc((6,16,27,45),80,270,fill=G[4],width=2);d.arc((11,21,24,39),-90,120,fill=G[2],width=2);leaf(d,8,44)
 if kind!='wood':mush(d,0,14,.85);leaf(d,13,5)
 else:d.polygon([(7,16),(15,10),(19,16),(14,22)],fill=G[3]);d.point((14,15),fill=G[5])
 save(cap,f'buttons/{kind}-left.png');save(cap.transpose(Image.Transpose.FLIP_LEFT_RIGHT),f'buttons/{kind}-right.png')
for theme,accent in [('pause','#4eab6c'),('confirm','#d54a43'),('settings','#e0b758'),('guide','#eed3a0'),('result','#ffdb67'),('tournament','#efc663')]:
 im=canvas(128,48);d=ImageDraw.Draw(im)
 for side in [0,1]:
  for i in range(5):
   x=20+i*8 if side==0 else 108-i*8;y=26-i*3;leaf(d,x-4,y-2);d.line((x,y+6,64,34),fill=G[3],width=1)
 d.polygon([(47,31),(44,21),(54,17),(56,10),(64,3),(72,10),(74,17),(84,21),(81,31),(64,41)],fill=G[0]);d.line([(48,29),(47,22),(56,20),(58,12),(64,6),(70,12),(72,20),(81,23),(79,30),(64,38),(48,29)],fill=G[3],width=2);d.polygon([(55,25),(59,16),(64,10),(69,16),(73,25),(64,34)],fill=accent);d.line((60,19,64,13,68,20),fill=G[5],width=1)
 if theme=='confirm':d.line((58,29,70,17),fill=G[5],width=2);d.line((58,17,70,29),fill=G[1],width=2)
 if theme in ['result','tournament']:d.polygon([(56,24),(53,14),(60,19),(64,11),(68,19),(76,14),(72,24)],fill=G[4]);d.line((56,26,72,26),fill=G[2],width=2)
 if theme=='settings':d.ellipse((59,19,69,29),fill=G[1]);d.ellipse((61,21,67,27),fill=G[4])
 save(im,'ornaments/crest-'+theme+'.png')
save(glyph('trophy',128),'ornaments/trophy.png')
# Newly generated production component sheets, NOT the human UI references.
# Export to bounded native PNGs with nearest raster treatment; no high-res
# atlas is served at runtime, no filters/anti-aliasing in the tiny glyphs.
source=Path('C:/Users/rytni/.codex/generated_images/01a08321-eab4-7933-939d-19e5a820a209')
atlas=Image.open(source/'exec-225dd743-470d-4dff-9abe-b993c0dd12d3.png').convert('RGBA')
names=ICONS[:16]
def cell(im,i,cols,rows):
 w,h=im.size;row=i//cols
 bounds=[(0,.335),(.36,.60),(.605,1)] if rows==3 else [(r/rows,(r+1)/rows) for r in range(rows)]
 a=im.crop((round(i%cols*w/cols),round(bounds[row][0]*h),round((i%cols+1)*w/cols),round(bounds[row][1]*h)))
 a.putalpha(a.getchannel('A').point(lambda v:255 if v>=128 else 0))
 return a.crop(a.getbbox())
def native(a,size,padding=4):
 a=a.copy();a.thumbnail((size-padding*2,size-padding*2),N);b=canvas(size,size);b.paste(a,((size-a.width)//2,(size-a.height)//2),a);b.putalpha(b.getchannel('A').point(lambda v:255 if v>=128 else 0));return b
for i,key in enumerate(names):
 a=cell(atlas,i,4,4);save(native(a,48),'icons/'+key+'-48.png')
 if key in ['guide','trophy','rank','settings','attempt']:save(native(a,64,4),'icons/'+key+'-64.png')
parts=Image.open(source/'exec-c717a7da-8d76-4b80-8bf1-8b3ad8fd1378.png').convert('RGBA')
for i,key in enumerate(['tl','tr','bl','br']):save(native(cell(parts,i,4,3),48,0),'panels/'+key+'.png')
tl=Image.open(OUT/'panels/tl.png');bl=Image.open(OUT/'panels/bl.png');tr=Image.open(OUT/'panels/tr.png')
def join_column(a,minimum=5):
 return next(x for x in range(a.width-1,-1,-1) if sum(a.getpixel((x,y))[3]>=128 for y in range(a.height))>=minimum)
def join_row(a,minimum=5):
 return next(y for y in range(a.height-1,-1,-1) if sum(a.getpixel((x,y))[3]>=128 for x in range(a.width))>=minimum)
for a,key in [(tl,'top'),(bl,'bottom')]:x=join_column(a);save(a.crop((x,0,x+1,48)).resize((24,48),N),'panels/'+key+'.png')
for a,key in [(tl,'left'),(tr,'right')]:y=join_row(a);save(a.crop((0,y,48,y+1)).resize((48,24),N),'panels/'+key+'.png')
for i,key in [(4,'play'),(6,'wood')]:
 a=cell(parts,i,4,3);a=a.resize((round(a.width*64/a.height),64),N)
 x=max(0,join_column(a,24)-2);a=a.crop((0,0,x+1,64))
 save(a,'buttons/'+key+'-left.png');save(a.transpose(Image.Transpose.FLIP_LEFT_RIGHT),'buttons/'+key+'-right.png')
 # Only extrude the clean straight join, not a crest or mushroom.
 join=a.crop((a.width-1,0,a.width,64));join=join.resize((24,64),N);save(join,'buttons/'+key+'-center.png')
 if key=='play':
  danger=a.copy();p=danger.load()
  for y in range(danger.height):
   for x in range(danger.width):
    r,g,b,al=p[x,y]
    if al and 18<y<53 and g>r*1.3 and b>r: p[x,y]=(min(240,int(g*.85)),int(g*.2),int(b*.5),al)
  save(danger,'buttons/danger-left.png');save(danger.transpose(Image.Transpose.FLIP_LEFT_RIGHT),'buttons/danger-right.png');save(danger.crop((danger.width-1,0,danger.width,64)).resize((24,64),N),'buttons/danger-center.png')
for i,key in [(8,'pause'),(9,'confirm'),(10,'result'),(10,'tournament'),(8,'settings'),(10,'guide')]:
 a=cell(parts,i,4,3);a.thumbnail((96,64),N);b=canvas(128,64);b.paste(a,((128-a.width)//2,0),a);save(b,'ornaments/crest-'+key+'.png')
save(native(cell(parts,11,4,3),128,0),'ornaments/trophy.png')
save(native(cell(parts,10,4,3),32,0),'buttons/play-jewel.png')
# Export only newly generated production source, never any composite reference.
generated={'forest-backdrop.png':('exec-6c26c79d-9a65-4f7c-9df9-7c2489201481.png',(1920,1080)), 'hero.png':('exec-8d6ea50f-3357-46dd-9051-c19a3f42455f.png',(640,432)), 'snake-cover.png':('exec-6fd81a0d-b747-45cf-a1a3-3263234e1697.png',(1024,640))}
source=Path('C:/Users/rytni/.codex/generated_images/01a08321-eab4-7933-939d-19e5a820a209')
for name,(file,size) in generated.items():
 im=Image.open(source/file).convert('RGBA')
 if name=='hero.png':
  im=im.crop(im.getbbox());im.thumbnail(size,N)
 else:
  ratio=size[0]/size[1];w,h=im.size
  if w/h>ratio:nw=round(h*ratio);im=im.crop(((w-nw)//2,0,(w+nw)//2,h))
  else:nh=round(w/ratio);im=im.crop((0,(h-nh)//2,w,(h+nh)//2))
  im=im.resize(size,N)
 save(im,name)
sheet=Image.new('RGB',(1200,840));d=ImageDraw.Draw(sheet);font=ImageFont.load_default()
for row,bg in enumerate(['#0a2c20','#40291c','#176345']):
 d.rectangle((0,row*280,1199,row*280+279),fill=bg)
 for i,key in enumerate(ICONS):
  x=i%10*120;y=row*280+i//10*140;d.text((x+4,y+2),key,font=font,fill=G[4]);a=Image.open(OUT/'icons'/f'{key}-48.png');sheet.paste(a,(x+4,y+18),a);b=a.resize((72,72),N);sheet.paste(b,(x+46,y+65),b)
sheet.save(QA/'icons-native.png')
zoom=Image.new('RGB',(1000,820),'#0a2c20')
for i,key in enumerate(ICONS):a=Image.open(OUT/'icons'/f'{key}-48.png').resize((192,192),N);zoom.paste(a,(i%5*200,i//5*204),a)
zoom.save(QA/'icons-4x.png')
assets=[{'file':p.relative_to(OUT).as_posix(),'size':list(Image.open(p).size),'alpha_ratio':sum(a>=128 for a in Image.open(p).getchannel('A').getdata())/(Image.open(p).width*Image.open(p).height),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(OUT.rglob('*.png'))]
(OUT/'inventory.json').write_bytes((json.dumps({'schema':1,'authoring':'native pixel raster48/64; no reference source pixels','icons':ICONS,'assets':assets,'generated':generated},indent=2)+'\n').encode())
print('UI V4',len(assets),'PNGs; native icons',len(ICONS),'hero alpha',Image.open(OUT/'hero.png').getextrema()[-1])
