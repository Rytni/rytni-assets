"""B.1 native integer-cluster refinements: export ONLY eleven allowed sheets."""
from pathlib import Path
from PIL import Image, ImageDraw
import importlib.util, json, hashlib

QA=Path(__file__).resolve().parent
ROOT=QA.parents[2]
spec=importlib.util.spec_from_file_location('prior',QA.parent/'effects-production-art-b/author.py')
prior=importlib.util.module_from_spec(spec);spec.loader.exec_module(prior)
poly,rect,stroke,glint,moved=prior.poly,prior.rect,prior.stroke,prior.glint,prior.moved
NAMES=['focus-wisp','spore-idle','spore-trail','spore-burst','guard-plate','guard-charged','guard-break','portal-charged-ring','portal-body-trail','rush-ember','rush-thorn']

def frame(name,w,h,f):
    im=Image.new('RGBA',(w,h));x=w//2;y=h//2;b=[0,-1,0,1][f%4]
    if name=='focus-wisp':
        poly(im,moved([(-12,7),(-10,0),(-8,-6),(-3,-7),(1,-13),(5,-9),(5,-4),(10,-7),(12,-2),(9,5),(3,7),(-2,12),(-9,11)],x,y+b),'teal')
        poly(im,moved([(-10,7),(-7,1),(-6,-4),(-1,-5),(2,-10),(4,-3),(9,-4),(9,0),(5,4),(0,5),(-4,10)],x,y+b),'cyan')
        poly(im,moved([(-6,4),(-3,-2),(1,-7),(4,-2),(3,3),(-1,7),(-5,8)],x,y+b),'mint')
        poly(im,moved([(-2,3),(-1,-2),(1,-4),(3,-1),(1,3),(-1,5)],x,y+b),'ivory')
        stroke(im,[(x-8,y+10+b),(x-4,y+9+b),(x-1,y+6+b)],'lilac',2)
    elif name=='spore-idle':
        # Distinct broad four-petal collectible shell, not a thin wisp.
        for pts in [[(-10,-3),(-7,-8),(-2,-6),(0,-2),(-3,2),(-8,1)],[(10,-3),(7,-8),(2,-6),(0,-2),(3,2),(8,1)],[(-4,-6),(-3,-10),(2,-10),(5,-5),(2,-1),(-2,-1)],[(-7,4),(-2,1),(3,1),(7,5),(3,9),(-3,9)]]:
            poly(im,moved(pts,x,y),'teal')
        for pts in [[(-8,-3),(-6,-6),(-3,-4),(-2,0),(-6,0)],[(8,-3),(6,-6),(3,-4),(2,0),(6,0)],[(-2,-7),(1,-8),(3,-5),(1,-2),(-1,-2)],[(-5,5),(-1,3),(2,3),(4,6),(1,7),(-2,7)]]:poly(im,moved(pts,x,y),'cyan')
        poly(im,moved([(-4,-1),(0,-4),(4,-1),(3,4),(0,6),(-3,4)],x,y),'mint')
        rect(im,(x-2,y-1,x+2,y+2),'ivory');rect(im,(x-1,y-2,x+1,y+3),'ivory')
        rect(im,(x-7,y+3,x-5,y+4),'lilac')
        if f in (0,1):rect(im,(x-1,y-3,x+1,y-2),'ivory')
    elif name=='spore-trail':
        poly(im,[(2,11),(7,10),(12,7),(18,3),(24,2),(29,4),(27,8),(21,8),(17,11),(11,14),(5,14)],'teal')
        poly(im,[(5,11),(11,8),(17,4),(23,3),(27,4),(24,6),(19,7),(15,10),(10,12)],'cyan')
        stroke(im,[(15,7),(20,5),(24,5)],'mint',2);rect(im,(6+f,11,7+f,12),'lilac')
    elif name=='spore-burst':
        if f==0:
            small=frame('spore-idle',24,24,0);im.paste(small,(12,12))
        elif f==1:
            glint(im,x,y,11,'mint');glint(im,x,y,7,'ivory')
        else:
            for i,(a,c) in enumerate([(-12,-8),(3,-14),(14,-4),(10,11),(-6,14),(-15,5)]):
                k=[0,0,.65,.88,1.05,1.13][f];px=round(x+a*k);py=round(y+c*k)
                if f<5:prior.petal(im,px,py,'lilac' if i==4 else 'mint',bool(i%2))
                else:glint(im,px,py,2,'mint')
    elif name=='guard-plate':
        # Open crescent shell; no HUD shield escutcheon.
        poly(im,[(11,3),(7,8),(4,15),(4,24),(8,31),(14,36),(21,35),(17,30),(13,23),(13,15),(16,8),(21,4)],'ink')
        poly(im,[(11,5),(8,10),(6,16),(6,23),(10,30),(15,33),(18,33),(14,27),(11,22),(11,15),(14,9),(18,6)],'amber')
        stroke(im,[(12,6),(9,11),(7,17),(7,23),(11,29),(15,32)],'gold',3)
        stroke(im,[(11,11),(9,17),(9,23),(12,28)],'mint',2)
        rect(im,(9,16,10,21),'ivory');glint(im,14,6,2 if f%2 else 3,'ivory')
        poly(im,[(12,28),(16,26),(19,29),(16,32)],'moss')
    elif name=='guard-charged':
        # Upper/front angular rune bridge; transparent central face area.
        stroke(im,[(8,24),(10,17),(17,11),(24,7),(31,11),(38,17),(40,24)],'ink',5)
        stroke(im,[(9,23),(12,17),(18,12),(24,9),(30,12),(36,17),(39,23)],'gold',3)
        stroke(im,[(14,16),(19,12),(24,10),(29,12),(34,16)],'mint',2)
        glint(im,24,10,3 if f%2 else 4,'ivory');rect(im,(9,23,11,25),'cyan');rect(im,(37,23,39,25),'cyan')
    elif name=='guard-break':
        if f<2:
            for flip in (False,True):
                plate=frame('guard-plate',40,40,f)
                if flip:plate=plate.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                im.alpha_composite(plate,(12,12))
            stroke(im,[(23,15),(31,25),(28,32),(36,40),(40,49)],'ivory',3)
            glint(im,x,y,6+f*3,'gold');glint(im,x,y,4+f*2,'ivory')
        else:
            for i,(a,c) in enumerate([(-14,-13),(12,-14),(17,2),(8,17),(-14,14),(-18,-1)]):
                k=[0,0,.75,1,1.22,1.4][f];px=round(x+a*k);py=round(y+c*k)
                poly(im,[(px-4,py-5),(px+3,py-3),(px+4,py+1),(px-1,py+5),(px-4,py+1)],'amber')
                poly(im,[(px-3,py-3),(px+2,py-2),(px+1,py+2),(px-2,py+1)],'gold' if i%2 else 'mint')
                if f<4:rect(im,(px-1,py-2,px+1,py),'ivory')
    elif name=='portal-charged-ring':
        rails=[[(15,9),(25,5),(29,5)],[(39,5),(44,5),(53,10)],[(59,18),(63,27),(63,30)],[(63,39),(61,47),(55,54)],[(47,61),(38,63)],[(29,63),(19,59),(14,55)],[(7,48),(5,39)],[(5,29),(8,19)]]
        for i,p in enumerate(rails):
            stroke(im,p,'amber',5);stroke(im,[(a,c-1) for a,c in p],'gold',3)
            if (i+f*2)%8 in (0,1):stroke(im,[(a,c-1) for a,c in p],'ivory',2)
        for i,(px,py) in enumerate([(13,13),(55,13),(55,55),(13,55)]):
            poly(im,[(px,py-6),(px+5,py),(px,py+6),(px-5,py)],'teal')
            poly(im,[(px,py-4),(px+3,py),(px,py+4),(px-3,py)],'cyan')
            glint(im,px,py,3 if i==f else 2,'ivory')
        for i,(px,py) in enumerate([(34,5),(62,34),(34,62),(5,34)]):stroke(im,[(px-3,py+2),(px,py-2),(px+3,py+2)],'ivory' if i==f else 'gold',2)
    elif name=='portal-body-trail':
        poly(im,moved([(-11,3),(-5,-5),(3,-12),(9,-7),(9,0),(3,7),(-5,11)],x,y+b),'teal')
        poly(im,moved([(-8,3),(-3,-3),(3,-9),(6,-5),(5,0),(0,5),(-4,8)],x,y+b),'cyan')
        stroke(im,[(x-4,y+3+b),(x+3,y-5+b)],'ivory',3)
        poly(im,[(23,23),(27,18),(29,23),(25,28)],'gold');glint(im,6,7,2,'gold')
    elif name in ('rush-ember','rush-thorn'):
        # Saturated authored fang/flame clusters, no blurred halo.
        im=prior.frame(name,w,h,f)
        pixels=im.load()
        replace={'#dd6245':'#f07538','#ffbd67':'#ffcd71','#74323d':'#873238'}
        for a in range(w):
            for c in range(h):
                rgb='#%02x%02x%02x'%pixels[a,c][:3]
                if pixels[a,c][3] and rgb in replace:pixels[a,c]=tuple(bytes.fromhex(replace[rgb][1:]))+(255,)
        if name=='rush-ember':poly(im,moved([(-7,5),(-5,-1),(0,-5),(2,0),(6,-2),(5,5),(0,9)],x,y+b),'orange')
        else:stroke(im,[(x-8,y+8),(x+5,y-7)],'orange',3)
    return im

inventory=[]
for name,w,h,n in prior.SPECS:
    if name not in NAMES:continue
    sheet=Image.new('RGBA',(w*n,h));bounds=[]
    for f in range(n):
        im=frame(name,w,h,f);sheet.paste(im,(f*w,0));bounds.append(im.getbbox())
    path=prior.OUT/(name+'.png');sheet.save(path)
    inventory.append({'key':'vfx.'+name,'file':path.relative_to(ROOT).as_posix(),'frame':[w,h],'frames':n,'sheet':list(sheet.size),'anchor':[w/2,h/2],'bounds':bounds,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(QA/'inventory.json').write_text(json.dumps(inventory,indent=2)+'\n',encoding='utf8')
print('Exported exactly',len(inventory),'B.1 sheets')
