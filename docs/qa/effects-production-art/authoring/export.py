"""OFFLINE raster authoring/export. Never imported by any game renderer."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageFont
import json, hashlib, sys, math

REPO = Path(__file__).resolve().parents[4]
OUT = REPO / 'grib/mushroom-snake-effects-v1/assets'
QA = REPO / 'docs/qa/effects-production-art'
NAMES = ['harvest','focus','spores','guard','portal-plus','rush','corruption','roots','mist']
O='#101d22'; IV='#fff0bf'; SH='#aa8254'; GD='#edb740'; GH='#fff28b'; GS='#835027'
CY='#6eeddf'; CS='#23667c'; WH='#f2fff3'; MG='#669b4c'; MS='#2c563a'
RO='#d68b9f'; PU='#775687'; PS='#332839'; RU='#b73a42'; OR='#ffb24e'; BN='#955b3e'

def polygon(im, points, color): ImageDraw.Draw(im).polygon(points, fill=color)
def rect(im, box, color): ImageDraw.Draw(im).rectangle(box, fill=color)
def line(im, points, color, width=1): ImageDraw.Draw(im).line(points, fill=color, width=width, joint='curve')
def cluster(im,x,y,color,shape=0):
    # Hand-placed stepped glints, not random noise.
    if shape==0:
        rect(im,(x,y,x+1,y+1),color)
    else:
        rect(im,(x,y+1,x+2,y+1),color);rect(im,(x+1,y,x+1,y+2),color)

def lod(name):
    """Each 24px miniature has independent authored coordinates, no source input."""
    im=Image.new('RGBA',(24,24))
    if name=='harvest':
        # A.1: symmetric royal crown, a full clear row above the flatter cap.
        polygon(im,[(3,2),(7,5),(11,2),(12,2),(16,5),(20,2),(19,8),(4,8)],O)
        polygon(im,[(4,3),(7,6),(11,3),(12,3),(16,6),(19,3),(18,7),(5,7)],GD)
        rect(im,(5,7,18,7),GH);rect(im,(11,4,12,5),GH)
        polygon(im,[(7,10),(16,10),(20,12),(21,14),(20,16),(3,16),(2,14),(3,12)],O)
        polygon(im,[(7,11),(16,11),(19,12),(20,14),(19,15),(4,15),(3,14),(4,12)],GD)
        polygon(im,[(7,11),(16,11),(18,12),(6,12),(4,14),(3,14),(4,12)],GH)
        rect(im,(5,15,18,15),GS)
        polygon(im,[(8,16),(15,16),(15,19),(17,20),(16,21),(7,21),(6,20),(8,19)],O)
        rect(im,(9,16,14,19),SH);rect(im,(9,16,11,19),IV)
        rect(im,(8,20,15,20),SH);rect(im,(8,20,11,20),IV)
        return im
    if name in ('harvest','corruption','food-golden','food-corrupted'):
        harvest=name=='harvest';bad=name in ('corruption','food-corrupted');top=8 if harvest else 4
        # Broad cap, stout flared stem: an object silhouette rather than a badge.
        polygon(im,[(9,top),(15,top),(19,top+3),(21,top+6),(20,top+9),(15,top+10),(15,18),(18,20),(17,21),(7,21),(6,20),(9,18),(9,top+10),(3,top+9),(2,top+7),(5,top+3)],O)
        polygon(im,[(10,top+9),(14,top+9),(14,18),(16,20),(8,20),(10,18)],SH)
        polygon(im,[(10,top+9),(12,top+9),(12,18),(10,20),(8,20)],IV)
        polygon(im,[(9,top+1),(15,top+1),(18,top+3),(20,top+6),(19,top+8),(4,top+8),(3,top+6),(6,top+3)],PU if bad else GD)
        polygon(im,[(8,top+2),(15,top+1),(18,top+3),(9,top+4),(4,top+6),(6,top+3)],RO if bad else GH)
        line(im,[(4,top+8),(18,top+8)],PS if bad else GS,2)
        cluster(im,7,top+4,IV if not bad else '#b6a0ac');cluster(im,15,top+3,IV if not bad else '#97849d')
        if harvest:
            polygon(im,[(7,7),(6,3),(9,5),(11,2),(13,2),(14,5),(17,3),(16,7)],O)
            polygon(im,[(8,6),(8,4),(10,6),(12,3),(14,6),(16,4),(15,6)],GD)
            rect(im,(8,7,15,8),GH);rect(im,(11,5,12,6),'#c95d3e')
        if bad:
            polygon(im,[(13,top+1),(11,top+4),(14,top+5),(11,top+9),(15,top+7),(16,top+4)],'#100f1b')
            # Heavy broken right shoulder instead of Harvest's balanced crown.
            polygon(im,[(19,top+3),(22,top+4),(19,top+6)],(0,0,0,0))
            if name=='corruption':polygon(im,[(4,16),(6,15),(8,17),(7,20),(4,19),(3,17)],PS);cluster(im,4,16,RO)
    elif name=='focus':
        polygon(im,[(2,11),(6,6),(11,3),(14,4),(19,7),(21,11),(18,15),(13,19),(10,18),(5,15)],O)
        polygon(im,[(3,11),(7,7),(11,4),(17,7),(20,11),(17,14),(13,17),(7,14)],CS)
        polygon(im,[(4,10),(8,7),(12,5),(17,8),(19,10),(14,9),(10,9)],CY)
        polygon(im,[(5,11),(8,9),(15,9),(18,11),(15,14),(8,14)],WH)
        polygon(im,[(10,8),(13,8),(15,11),(13,15),(10,15),(8,11)],'#288b9b')
        rect(im,(11,8,12,14),O);rect(im,(12,9,12,10),WH)
        line(im,[(5,13),(9,16),(13,17),(17,14)],'#49c6cd');cluster(im,5,8,WH)
        polygon(im,[(3,14),(4,17),(7,17),(6,15)],MG)
    elif name=='spores':
        # Exactly three independently shaped satellites, large at LOD scale.
        for x,y in [(3,4),(17,3),(16,16)]:
            polygon(im,[(x+1,y),(x+3,y),(x+4,y+2),(x+3,y+4),(x+1,y+5),(x,y+3)],O)
            polygon(im,[(x+1,y+1),(x+2,y+1),(x+3,y+2),(x+2,y+4),(x+1,y+3)],CY);rect(im,(x+1,y+1,x+2,y+2),WH)
        polygon(im,[(10,6),(13,6),(15,10),(17,11),(15,14),(13,16),(12,19),(9,17),(8,14),(6,12),(8,10)],O)
        polygon(im,[(11,7),(13,8),(14,11),(16,12),(13,14),(12,17),(10,16),(9,13),(7,12),(10,10)],'#499f92')
        polygon(im,[(11,8),(13,10),(14,12),(12,15),(10,13),(9,11)],'#baf3c3');rect(im,(11,10,12,12),WH)
        line(im,[(9,14),(10,17),(12,17)],'#ad99c7');cluster(im,14,11,CY)
    elif name=='guard':
        polygon(im,[(5,3),(11,2),(18,3),(21,5),(20,13),(17,17),(12,21),(7,18),(4,13),(3,6)],O)
        polygon(im,[(6,4),(12,3),(18,4),(19,6),(18,13),(15,17),(12,19),(8,16),(6,12),(5,6)],GD)
        polygon(im,[(7,5),(12,4),(17,5),(18,7),(16,13),(12,18),(8,14),(6,8)],MS)
        polygon(im,[(8,6),(12,5),(16,6),(15,13),(12,16),(9,13)],IV)
        polygon(im,[(8,6),(11,6),(10,13),(12,16),(9,13)],'#baa678')
        rect(im,(11,7,12,12),MG);rect(im,(9,8,14,9),MG)
        polygon(im,[(3,6),(5,4),(7,5),(6,8),(4,9)],MG);polygon(im,[(17,10),(21,9),(20,13),(17,15)],MG)
        cluster(im,5,5,GH);rect(im,(12,17,12,18),GH)
    elif name=='portal-plus':
        # Genuine empty hole: silhouette remains annular, not an eye.
        polygon(im,[(8,2),(16,2),(20,5),(21,9),(21,16),(17,20),(12,21),(6,20),(3,16),(2,9),(4,5)],O)
        polygon(im,[(8,3),(16,3),(19,6),(21,10),(19,16),(16,19),(11,20),(6,18),(4,15),(3,9),(5,6)],'#66726c')
        polygon(im,[(8,7),(15,7),(18,10),(17,15),(14,18),(9,17),(6,14),(6,10)],(0,0,0,0))
        line(im,[(4,9),(6,5),(10,3)],CY,2);line(im,[(20,12),(18,17),(14,20)],'#3cacae',2)
        rect(im,(10,3,12,4),GD);rect(im,(4,13,5,15),GD);rect(im,(16,17,17,18),GD)
        polygon(im,[(16,2),(19,3),(17,7),(15,6)],(0,0,0,0));rect(im,(18,4,20,5),WH)
        cluster(im,5,5,WH);cluster(im,18,13,CY)
    elif name=='rush':
        p=[(15,2),(20,2),(15,8),(21,8),(15,14),(12,16),(8,21),(5,21),(8,14),(3,14),(9,8),(8,5)]
        polygon(im,p,PS);polygon(im,[(15,3),(18,3),(12,9),(19,9),(13,14),(8,19),(11,12),(5,13),(11,7),(10,6)],RU)
        polygon(im,[(15,3),(17,3),(11,9),(15,9),(12,11),(7,12),(12,6)],OR)
        line(im,[(15,4),(13,6),(10,9)],'#ffe6a1',2)
        polygon(im,[(12,14),(10,18),(7,20),(8,17)],'#e2633a');polygon(im,[(3,8),(5,6),(6,9),(4,10)],OR)
    elif name=='roots':
        polygon(im,[(3,2),(9,6),(13,5),(17,7),(21,5),(20,11),(21,15),(18,17),(16,20),(10,20),(7,21),(6,18),(3,15),(4,10),(2,7),(6,8)],PS)
        for pts in [[(5,6),(10,9),(17,10),(17,15),(10,17),(6,14),(7,9)],[(18,7),(15,11),(10,13),(11,18),(16,17),(18,13),(11,8)],[(6,16),(8,11),(14,7),(17,9),(15,14),(9,18)]]:
            line(im,pts,BN,3);line(im,pts[:3],'#bd8552',1)
        polygon(im,[(3,3),(8,7),(6,10)],'#b88155');polygon(im,[(20,6),(18,12),(15,10)],'#ad6c50');polygon(im,[(7,21),(8,16),(11,18)],'#a9654d')
        polygon(im,[(10,10),(14,10),(15,13),(12,15),(9,13)],'#201c21');line(im,[(10,10),(13,9),(15,11)],'#843d46',2)
        rect(im,(5,12,6,13),MS);rect(im,(17,15,18,16),MG)
    elif name=='mist':
        polygon(im,[(3,7),(4,4),(8,3),(11,5),(13,2),(17,3),(18,7),(21,8),(21,11),(20,14),(18,15),(19,18),(17,21),(14,19),(14,16),(11,15),(9,18),(5,21),(4,20),(6,16),(3,14),(2,11)],PS)
        polygon(im,[(4,7),(5,5),(8,4),(11,7),(14,3),(17,4),(17,8),(20,9),(21,11),(19,13),(15,14),(16,18),(17,19),(14,17),(13,14),(10,14),(8,18),(5,20),(7,15),(4,13),(3,10)],'#697081')
        polygon(im,[(4,7),(6,5),(8,5),(10,8),(9,9),(6,8)],'#a2a8ad');polygon(im,[(13,5),(15,4),(17,5),(16,7),(13,8)],'#9696ac')
        polygon(im,[(7,10),(12,8),(17,10),(17,12),(14,14),(9,13)],'#413449')
        rect(im,(8,10,9,11),PS);rect(im,(14,10,15,11),PS);line(im,[(7,16),(6,18),(5,19)],'#9896a7')
    return im

def field_export(source,n,pad):
    im=Image.open(source).convert('RGBA');a=im.getchannel('A').point(lambda x:255 if x>=128 else 0);im.putalpha(a)
    b=a.getbbox();assert b,'Empty generation';im=im.crop(b);scale=(n-2*pad)/max(im.size)
    size=tuple(max(1,round(x*scale)) for x in im.size);im=im.resize(size,Image.Resampling.NEAREST)
    # Discrete palette; no new smoothed edges. Alpha stays binary.
    alpha=im.getchannel('A');rgb=im.convert('RGB').quantize(colors=22,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB');rgb.putalpha(alpha)
    c=Image.new('RGBA',(n,n));c.alpha_composite(rgb,((n-size[0])//2,(n-size[1])//2));return c

def idle_frames(name,base):
    frames=[base.copy() for _ in range(4)]
    def tint(f,box,color,strength=.3,predicate=lambda p:True):
        c=Image.new('RGBA',(1,1),color).getpixel((0,0))
        for y in range(box[1],box[3]):
            for x in range(box[0],box[2]):
                p=f.getpixel((x,y))
                if p[3] and predicate(p):f.putpixel((x,y),tuple(round(p[i]*(1-strength)+c[i]*strength) for i in range(3))+(255,))
    def glint(f,x,y,color=IV):
        for dx,dy in [(0,0),(-1,0),(1,0),(0,-1),(0,1)]:
            px,py=x+dx,y+dy
            if base.getpixel((px,py))[3]:f.putpixel((px,py),Image.new('RGBA',(1,1),color).getpixel((0,0)))
    def move(f,box,dx,dy):
        patch=base.crop(box);f.paste((0,0,0,0),box);f.alpha_composite(patch,(box[0]+dx,box[1]+dy))
    if name=='harvest':
        glint(frames[1],22,24);tint(frames[2],(21,4,42,19),GH,.35);glint(frames[3],53,24,GH)
    elif name=='focus':
        # Lens body stays fixed; only outer pupil columns contract in phase 1.
        for x in [29,33]:
            for y in range(27,39):
                p=base.getpixel((x,y))
                if p[3] and max(p[:3])<90:frames[1].putpixel((x,y),(55,158,165,255))
        tint(frames[2],(17,23,47,42),CY,.16,lambda p:max(p[:3])>100);glint(frames[3],20,22,WH)
    elif name=='spores':
        # Three isolated satellites, not the flower, orbit one native pixel.
        boxes=[(7,4,24,23),(39,4,57,23),(24,43,39,60)]
        shifts=[[(1,0),(0,1),(-1,0)],[(1,1),(-1,1),(1,-1)],[(0,1),(-1,0),(0,-1)]]
        for f,deltas in zip(frames[1:],shifts):
            for b,(dx,dy) in zip(boxes,deltas):move(f,b,dx,dy)
    elif name=='guard':
        tint(frames[1],(23,25,41,44),WH,.16);tint(frames[2],(12,15,24,29),GH,.3)
        tint(frames[3],(28,26,36,46),CY,.32,lambda p:p[1]>p[0])
    elif name=='portal-plus':
        # Sequential authored rune stations imply charge circulation.
        for f,b in zip(frames[1:],[(26,5,37,16),(46,26,57,39),(26,48,39,59)]):
            tint(f,b,CY,.5);glint(f,(b[0]+b[2])//2,(b[1]+b[3])//2,WH)
    elif name=='rush':
        for f,b,p in zip(frames[1:],[(20,12,27,20),(30,27,37,34),(43,45,50,52)],[(24,17),(35,31),(48,49)]):
            tint(f,b,OR,.38);glint(f,*p,GH)
        move(frames[3],(50,38,55,44),-1,-1)
    elif name=='corruption':
        tint(frames[1],(30,8,43,33),RO,.36,lambda p:p[0]<120)
        move(frames[2],(8,44,25,59),1,-1)
        tint(frames[3],(22,18,49,36),RO,.14,lambda p:p[0]>p[1])
    elif name=='roots':
        # Local root-tip extension/contraction; knot and anchor do not move.
        move(frames[1],(18,6,28,15),0,-1)
        move(frames[2],(45,23,60,32),-1,0)
        tint(frames[3],(8,43,23,56),OR,.32)
    elif name=='mist':
        # The dark core/outer rim stay fixed. Light masses drift one pixel
        # within their opaque lobe, avoiding a rectangular cut across a cloud.
        for phase,(f,dx) in enumerate(zip(frames[1:],[1,-1,1]),1):
            for y in range(4,29):
                for x in range(9,55):
                    p=base.getpixel((x,y));q=base.getpixel((x-dx,y))
                    if p[3] and q[3] and max(p[:3])>=140 and max(q[:3])>=90:f.putpixel((x,y),q)
            for y in range(37,60):
                shift=dx if y<47 or phase==3 else -dx
                row=base.crop((8,y,56,y+1));f.paste((0,0,0,0),(7,y,57,y+1));f.alpha_composite(row,(8+shift,y))
    return frames

def main():
    sources={k:QA/'authoring'/v for k,v in json.loads((QA/'authoring/sources.json').read_text(encoding='utf-8')).items()}
    for name in NAMES:
        folder=OUT/'effects';folder.mkdir(parents=True,exist_ok=True)
        base=field_export(sources[name],64,4);base.save(folder/f'{name}-field.png')
        lod(name).save(folder/f'{name}-lod.png')
        field_export(sources[name],32,2).save(folder/f'{name}-hud.png')
        sheet=Image.new('RGBA',(256,64))
        for i,f in enumerate(idle_frames(name,base)):sheet.alpha_composite(f,(64*i,0))
        sheet.save(folder/f'{name}-idle.png')
    for variant in ['golden','corrupted']:
        folder=OUT/'food';folder.mkdir(parents=True,exist_ok=True)
        field_export(sources['food-'+variant],48,2).save(folder/f'{variant}-field.png');lod('food-'+variant).save(folder/f'{variant}-lod.png')
    # Review derivatives only, generated from final PNGs.
    font=ImageFont.load_default();sil=Image.new('RGB',(9*96,112),'black')
    gray=Image.new('RGB',(9*96,160),'#071815');mobile=Image.new('RGB',(9*64,64),'#093b31')
    for i,name in enumerate(NAMES):
        f=Image.open(OUT/f'effects/{name}-field.png');l=Image.open(OUT/f'effects/{name}-lod.png');a=f.getchannel('A')
        solid=Image.new('RGBA',f.size,'white');solid.putalpha(a);sil.paste(solid,(i*96+16,8),solid)
        g=ImageOps.grayscale(f).convert('RGBA');g.putalpha(a);gray.paste(g,(i*96+16,8),g)
        gl=ImageOps.grayscale(l).convert('RGBA');gl.putalpha(l.getchannel('A'));gray.paste(gl,(i*96+36,88),gl)
        # Same fit-world + PICKUP_RULE footprint as the isolated review.
        # Reference snapshot: FIT WORLD V2 WORLDS[0]=30x12, 844x390,
        # cell=24.9983216783 CSS px; browser QA guards this assumption.
        footprint=max(19,24.998321678321673*.94*max(a.getbbox()[2]-a.getbbox()[0],a.getbbox()[3]-a.getbbox()[1])/64)
        b=l.getbbox();crop=l.crop(b);s=footprint/max(crop.size);crop=crop.resize(tuple(round(v*s) for v in crop.size),Image.Resampling.NEAREST);mobile.paste(crop,(i*64+(64-crop.width)//2,(64-crop.height)//2),crop)
        ImageDraw.Draw(sil).text((i*96+8,88),name,font=font,fill='white');ImageDraw.Draw(gray).text((i*96+8,126),name,font=font,fill='#d9dac3')
    sil.save(QA/'silhouettes.png');gray.save(QA/'grayscale.png');mobile.save(QA/'mobile-lod.png');ImageOps.grayscale(mobile).save(QA/'mobile-lod-grayscale.png')

if __name__=='__main__':main()
