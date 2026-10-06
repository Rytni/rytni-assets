"""Offline export of NEW menu-only source art. Never reads a concept screenshot.
Generated source originals remain unchanged. Native clusters use nearest-neighbour.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib

ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'grib/mushroom-snake-menu-v1'
SRC=OUT/'sources'
inventory=[]
def save(name,im,source,rect=None):
    im.save(OUT/name,optimize=True)
    inventory.append(dict(file=name,size=list(im.size),mode=im.mode,source=source,sourceRect=rect,
        sha256=hashlib.sha256((OUT/name).read_bytes()).hexdigest()))
def trimmed(im):
    box=im.getchannel('A').getbbox() if im.mode=='RGBA' else (0,0,*im.size)
    return im.crop(box)
def export(name,source,width,rect=None):
    im=Image.open(SRC/source)
    if rect:
        # Atlas coordinates were authored/inspected on a1280-square preview.
        scale=im.width/1280
        im=im.crop(tuple(round(x*scale) for x in rect))
    im=trimmed(im)
    im=im.resize((width,round(im.height*width/im.width)),Image.Resampling.NEAREST)
    save(name,im,source,rect)

export('title-forest.png','forest-title.png',1008)
export('snake-hero.png','snake-hero.png',512)
for name,width,rect in [
 ('button-play.png',320,(0,118,438,352)),
 ('button-wood.png',256,(440,150,816,326)),
 ('button-danger.png',256,(816,130,1254,354)),
 ('record-plaque.png',320,(0,495,516,758)),
 ('icon-bezel.png',96,(518,465,814,758)),
 ('guide-book.png',256,(818,415,1254,795)),
 ('attempt-mushroom.png',64,(65,820,368,1195)),
 ('attempt-sponsor.png',64,(435,820,802,1195)),
 ('record-trophy.png',256,(818,784,1254,1215)),
]: export(name,'ui-sheet.png',width,rect)
export('board-frame.png','board-frame.png',512)

# New hand-authored32px UI pictograms. A fixed pixel grid, no runtime shapes.
# These overlay the illustrated round bezel; no emoji/icon font dependency.
gold='#f4dc98'; light='#fff3c8'; shadow='#7b4d1e'
for name in ['sound','music','sfx','settings','fullscreen','back','play','combo','keys']:
    im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im)
    if name in ('sound','sfx'):
        d.rectangle((5,12,10,21),fill=gold);d.polygon([(10,12),(16,7),(16,26),(10,21)],fill=light)
        d.line([(21,10),(24,14),(24,20),(21,24)],fill=gold,width=3)
        if name=='sfx':d.line([(27,7),(29,12),(29,23),(27,27)],fill=gold,width=2)
    elif name=='music':
        d.rectangle((11,6,24,10),fill=gold);d.rectangle((11,8,13,24),fill=light);d.rectangle((22,8,24,21),fill=light);d.rectangle((6,22,12,26),fill=gold);d.rectangle((17,19,23,23),fill=gold)
    elif name=='settings':
        for r in [(12,3,19,9),(12,23,19,29),(3,12,9,19),(23,12,29,19),(6,6,11,11),(21,6,26,11),(6,21,11,26),(21,21,26,26)]:d.rectangle(r,fill=gold)
        d.rectangle((8,8,24,24),fill=gold);d.rectangle((12,12,20,20),fill=shadow);d.rectangle((14,14,18,18),fill=light)
    elif name=='fullscreen':
        for x,y,sx,sy in [(5,5,1,1),(27,5,-1,1),(5,27,1,-1),(27,27,-1,-1)]:
            d.line([(x+sx*7,y),(x,y),(x,y+sy*7)],fill=light,width=3)
    elif name in ('back','play'):
        d.polygon([(9,7),(24,16),(9,25)] if name=='play' else [(23,7),(8,16),(23,25)],fill=light)
    elif name=='combo':
        d.line([(7,7),(25,25)],fill=light,width=4);d.line([(25,7),(7,25)],fill=gold,width=4)
    else:
        for x,y in [(12,1),(1,12),(12,12),(23,12)]:
            d.rectangle((x,y,x+8,y+8),fill=shadow);d.rectangle((x,y,x+7,y+6),fill=gold)
        d.polygon([(16,3),(13,6),(19,6)],fill='#1b3020');d.polygon([(3,15),(3,18),(6,16)],fill='#1b3020');d.polygon([(16,18),(13,15),(19,15)],fill='#1b3020');d.polygon([(28,16),(25,15),(25,18)],fill='#1b3020')
    save('icon-'+name+'.png',im,'offline pixel authoring')
(OUT/'manifest.json').write_text(json.dumps(dict(version='menu-art-v1',sourcePolicy='Original menu-only art; no concept crops; gameplay PNGs unchanged',assets=inventory),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(inventory,ensure_ascii=False))
