"""Review-only crops. They NEVER enter grib/runtime assembly."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
ROOT=Path(__file__).resolve().parents[3];QA=ROOT/'docs/qa/snake-ui-v4';SRC=Path('C:/Users/rytni/Desktop/задание/Новая папка (3)')
files=['51d243b8-00e7-4164-9906-18b2b91f7f85.png','311a35e4-5fbc-488c-b90c-af51a24dfcd3.png','754f55ad-a943-4c70-9c58-de1a158c59fb.png','a823e408-0778-4f09-8eee-cf3b06f8d88a.png']
for i,f in enumerate(files):Image.open(SRC/f).save(QA/f'reference-master-{i+1}.png')
regions=[('selector',3,(1025,734,1528,1019)),('main',3,(5,0,915,405)),('guide',3,(5,735,542,1018)),('settings',3,(1202,435,1534,697)),('gameplay',1,(12,486,857,726)),('pause',3,(4,435,402,698)),('confirm',3,(410,435,729,698)),('result',3,(738,435,1197,698)),('mobile',3,(928,33,1528,390))]
for name,i,box in regions:Image.open(SRC/files[i]).crop(box).save(QA/('reference-'+name+'.png'))
# True1x/2x/4x sheets on all three requested backgrounds.
OUT=ROOT/'grib/mushroom-snake-ui-v4';keys=json.loads((OUT/'inventory.json').read_text())['icons'];font=ImageFont.load_default()
for scale in [1,2,4]:
 cell=48*scale+24;row=48*scale+32;im=Image.new('RGB',(cell*10,row*6));d=ImageDraw.Draw(im)
 for bg,color in enumerate(['#0a2c20','#40291c','#176345']):
  d.rectangle((0,bg*row*2,im.width,(bg+1)*row*2),fill=color)
  for i,key in enumerate(keys):
   x=i%10*cell;y=bg*row*2+i//10*row;d.text((x+4,y+3),key,font=font,fill='#ffdc8a');a=Image.open(OUT/'icons'/f'{key}-48.png').resize((48*scale,48*scale),Image.Resampling.NEAREST);im.paste(a,(x+12,y+22),a)
 im.save(QA/f'icons-{scale}x.png')
