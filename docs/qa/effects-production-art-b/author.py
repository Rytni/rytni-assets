"""Offline, native-pixel cluster authoring. No runtime painter or source extraction.
Only writes the nineteen contract VFX sheets, never the locked pickup/food art.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'grib/mushroom-snake-effects-v1/assets/vfx'
QA = Path(__file__).resolve().parent
P = {'ink':'#152d30','ivory':'#fff4cd','gold':'#efbb43','amber':'#a76932',
     'mint':'#a5f5da','cyan':'#58ced4','teal':'#286c82','lilac':'#b9a0db',
     'moss':'#659249','leaf':'#a3c85f','deep':'#304b38','root':'#80533b',
     'bark':'#b48653','dry':'#c8b37d','orange':'#ffbd67','red':'#dd6245',
     'burgundy':'#74323d','purple':'#9472b2','violet':'#564263'}
SPECS = [
 ('harvest-sparkle',32,32,4),('harvest-third-burst',64,64,6),
 ('focus-wisp',32,32,4),('spore-idle',24,24,4),('spore-trail',32,16,4),('spore-burst',48,48,6),
 ('guard-plate',40,40,4),('guard-charged',48,48,4),('guard-break',64,64,6),
 ('portal-charged-ring',68,68,4),('portal-body-trail',32,32,4),
 ('rush-ember',32,32,4),('rush-thorn',32,32,4),('corruption-particle',32,32,4),
 ('roots-crack',68,68,4),('roots-sprout',68,68,4),('roots-root',68,68,4),('roots-decay',68,68,6),
 ('mist-puff',96,64,4)]

def poly(im, points, color): ImageDraw.Draw(im).polygon(points, fill=P.get(color,color))
def rect(im, box, color): ImageDraw.Draw(im).rectangle(box, fill=P.get(color,color))
def stroke(im, points, color, width=1): ImageDraw.Draw(im).line(points, fill=P.get(color,color), width=width)
def moved(points,x,y): return [(a+x,b+y) for a,b in points]
def glint(im,x,y,r=3,color='ivory'):
    poly(im,[(x,y-r),(x+1,y-1),(x+r,y),(x+1,y+1),(x,y+r),(x-1,y+1),(x-r,y),(x-1,y-1)],color)
def petal(im,x,y,color='cyan',flip=False):
    p=[(-4,0),(-2,-3),(0,-6),(2,-4),(3,-1),(1,2),(-2,2)]
    poly(im,moved([(-a,b) if flip else (a,b) for a,b in p],x,y),'amber' if color=='gold' else 'teal')
    poly(im,moved([(-2,0),(0,-4),(1,-2),(1,0),(-1,1)],x,y),color)
    rect(im,(x,y-3,x,y-1),'ivory')
def crown(im,x,y,s=1):
    p=[(-9,-3),(-5,0),(-3,-2),(0,-6),(3,-2),(5,0),(9,-3),(7,5),(-7,5)]
    poly(im,[(x+a*s,y+b*s) for a,b in p],'amber')
    p=[(-8,-2),(-5,1),(-2,-1),(0,-4),(2,-1),(5,1),(8,-2),(6,3),(-6,3)]
    poly(im,[(x+a*s,y+b*s) for a,b in p],'gold')
    stroke(im,[(x-5*s,y+3*s),(x+5*s,y+3*s)],'ivory',s)
def flake(im,x,y,phase=0):
    poly(im,moved([(-7,-3),(-3,-2),(-1,-7),(2,-4),(2,-1),(7,0),(3,3),(2,7),(-1,4),(-4,5),(-3,1),(-7,0)],x,y),'violet')
    poly(im,moved([(-5,-2),(-2,-1),(0,-5),(1,-1),(5,0),(1,2),(1,5),(-1,2),(-3,3),(-2,0)],x,y),'purple')
    poly(im,moved([(-1,-1),(1,-2),(2,0),(0,2),(-2,0)],x,y),'lilac')
    rect(im,(x,y-1,x+1,y),'ivory')
    if phase%2:rect(im,(x-5,y+6,x-4,y+7),'moss')
def shield(im,x,y,small=False):
    s=.72 if small else 1
    def pp(p,c):poly(im,[(round(x+a*s),round(y+b*s)) for a,b in p],c)
    pp([(-12,-12),(-3,-15),(10,-11),(11,0),(6,10),(-1,16),(-10,8),(-13,-2)],'ink')
    pp([(-10,-11),(-3,-13),(8,-10),(9,0),(4,9),(-1,13),(-8,7),(-11,-2)],'amber')
    pp([(-8,-9),(-2,-11),(6,-8),(7,0),(2,8),(-1,10),(-6,5),(-9,-2)],'deep')
    pp([(-7,-8),(-2,-10),(5,-7),(3,-3),(-1,-2),(-5,3),(-7,-1)],'moss')
    pp([(-2,5),(-1,-4),(3,-8),(4,-3),(1,2)],'leaf')
    stroke(im,[(round(x-9*s),round(y-10*s)),(round(x-2*s),round(y-12*s)),(round(x+6*s),round(y-9*s))],'gold',2)
    glint(im,round(x),round(y-3*s),2,'ivory')

ROOT_BRANCHES = [
 [(34,53),(33,42),(27,32),(19,26),(13,15),(15,9)],
 [(33,48),(40,39),(46,34),(49,25),(56,19)],
 [(34,39),(35,30),(30,24),(31,15),(28,8)],
 [(29,35),(22,38),(16,33),(9,31)],
 [(42,37),(45,44),(52,46),(56,43)]]
def root_shape(im,f,mode):
    # Soil and branching tips are staged before solid occupancy; no block tile.
    if mode in ('sprout','root'):
        poly(im,[(14,53),(21,47),(31,48),(38,45),(51,49),(58,53),(50,57),(18,57)],'deep')
        poly(im,[(18,53),(27,50),(36,51),(43,49),(53,53),(46,55),(24,55)],'root')
    for i,points in enumerate(ROOT_BRANCHES):
        if mode=='sprout':
            k=min(len(points),2+f);pts=points[:k]
            stroke(im,pts,'ink',5);stroke(im,pts,'root',3);stroke(im,[(x-1,y) for x,y in pts],'bark',1)
            x,y=pts[-1];poly(im,[(x-2,y),(x-1,y-5),(x+2,y-7),(x+1,y)],'moss')
        elif mode=='root':
            stroke(im,points,'ink',9 if i<3 else 6);stroke(im,points,'root',6 if i<3 else 4)
            stroke(im,[(x-2,y) for x,y in points],'bark',2)
            x,y=points[2];poly(im,[(x,y),(x-6,y-3),(x-4,y+3)],'root')
            x,y=points[-2];poly(im,[(x,y),(x-4,y-5),(x-2,y+3)],'moss')
    if mode=='root':
        for x,y in [(18,25),(36,32),(45,34),(26,38)]:rect(im,(x,y,x+2,y+1),'leaf' if (f+x)%3==0 else 'moss')

def frame(name,w,h,f):
    im=Image.new('RGBA',(w,h));x=w//2;y=h//2
    bob=[0,-1,0,1][f%4]
    if name=='harvest-sparkle':
        r=[4,6,5,3][f];glint(im,x,y,r,'amber');glint(im,x,y,r-1,'gold');glint(im,x,y,2)
        poly(im,[(7,23),(10,20),(14,20),(17,23),(15,24),(9,24)],'gold');rect(im,(11,24,12,27),'ivory')
        glint(im,24,8,2 if f%2 else 1,'ivory')
    elif name=='harvest-third-burst':
        if f<2:crown(im,x,y-2,1);glint(im,x,y-9,2+f)
        offsets=[(-1,-13),(13,-9),(16,5),(8,16),(-12,12),(-16,-3)]
        if f>=1:
            for i,(a,b) in enumerate(offsets):
                k=[0,.4,.65,.9,1.15,1.35][f];px=round(x+a*k);py=round(y+b*k)
                if f<4:petal(im,px,py,'gold',i%2==0)
                else:glint(im,px,py,2 if f==4 else 1,'gold')
        if f==2:glint(im,x,y,7)
    elif name=='focus-wisp':
        # Crystal/flame spine with a curled leaf tail; deliberately not a halo.
        p=[(-9,7),(-6,1),(-7,-4),(-2,-7),(1,-13),(4,-9),(4,-5),(8,-8),(9,-1),(5,4),(1,5),(-1,9),(-7,11)]
        poly(im,moved(p,x,y+bob),'teal')
        poly(im,moved([(-7,7),(-4,0),(-5,-3),(0,-5),(2,-10),(3,-4),(6,-5),(6,0),(2,3),(0,3),(-2,8)],x,y+bob),'cyan')
        poly(im,moved([(-3,2),(1,-5),(2,-8),(3,-2),(1,2),(-3,7)],x,y+bob),'mint')
        poly(im,moved([(0,0),(1,-4),(2,-1),(1,2)],x,y+bob),'ivory')
        stroke(im,[(x-7,y+10+bob),(x-4,y+9+bob),(x-1,y+5+bob)],'lilac')
        glint(im,24,24,1 if f%2 else 2,'mint')
    elif name=='spore-idle':
        for a,b,fl in [(-4,0,False),(4,0,True),(0,-3,False)]:petal(im,x+a,y+b+bob,'cyan',fl)
        poly(im,[(x-5,y+2+bob),(x,y-3+bob),(x+5,y+2+bob),(x+2,y+6+bob),(x-2,y+6+bob)],'teal')
        poly(im,[(x-3,y+1+bob),(x,y-2+bob),(x+3,y+1+bob),(x+1,y+4+bob),(x-1,y+4+bob)],'mint')
        rect(im,(x-1,y+bob,x+1,y+2+bob),'ivory');rect(im,(x-5,y+5+bob,x-3,y+6+bob),'lilac')
    elif name=='spore-trail':
        # A drawn stepped crescent, not a rotated/vector runtime curve.
        poly(im,[(2,12),(8,12),(13,9),(18,4),(24,2),(29,4),(26,8),(21,8),(17,11),(11,14),(5,14)],'teal')
        poly(im,[(5,12),(11,10),(16,5),(22,3),(27,4),(24,6),(20,6),(16,9),(11,12)],'cyan')
        stroke(im,[(12,10),(17,5),(22,4),(25,4)],'mint')
        glint(im,24-f,5,2,'ivory');rect(im,(6+f,12,7+f,12),'lilac')
    elif name=='spore-burst':
        if f==0:
            for a,b in [(-3,0),(3,0),(0,-2)]:petal(im,x+a,y+b,'mint')
        elif f==1:glint(im,x,y,9);glint(im,x,y,5,'mint')
        else:
            for i,(a,b) in enumerate([(-12,-8),(3,-14),(14,-4),(10,11),(-6,14),(-15,5)]):
                k=[0,0,.65,.9,1.1,1.25][f];px=round(x+a*k);py=round(y+b*k)
                if f<5:petal(im,px,py,'lilac' if i==4 else 'mint',bool(i%2))
                else:glint(im,px,py,1,'mint')
    elif name=='guard-plate':
        shield(im,x,y+bob)
        poly(im,[(8,11),(11,7),(15,8),(16,12),(12,14)],'moss');rect(im,(11,9,13,10),'leaf')
    elif name=='guard-charged':
        # Filled leaf rune, not a circular head enclosure.
        poly(im,moved([(-13,4),(-6,-4),(-2,-12),(6,-15),(11,-9),(12,-2),(6,6),(-2,13),(-10,11)],x,y),'deep')
        poly(im,moved([(-10,4),(-4,-3),(0,-10),(6,-12),(8,-7),(8,-2),(4,4),(-3,10),(-8,9)],x,y),'moss')
        poly(im,moved([(-8,5),(-1,-2),(4,-10),(7,-9),(5,-3),(1,3),(-5,9)],x,y),'leaf')
        stroke(im,[(x-7,y+7),(x+2,y-4),(x+5,y-9)],'gold',2);glint(im,x,y-2,3 if f%2 else 4,'ivory')
        glint(im,x+13,y+10,2,'gold')
    elif name=='guard-break':
        if f==0:shield(im,x,y,True)
        elif f==1:
            shield(im,x,y);stroke(im,[(24,17),(30,26),(28,32),(37,38),(38,44)],'ivory',3);glint(im,x,y,7,'gold')
        else:
            for i,(a,b) in enumerate([(-12,-12),(11,-13),(16,3),(6,16),(-14,12),(-16,-1)]):
                k=[0,0,.7,1,1.2,1.45][f];px=round(x+a*k);py=round(y+b*k)
                poly(im,[(px-4,py-4),(px+3,py-3),(px+4,py+1),(px-1,py+5),(px-3,py+1)],'amber' if i%2 else 'deep')
                poly(im,[(px-3,py-3),(px+2,py-2),(px,py+2)],'gold' if i%2 else 'moss')
                if f<4:rect(im,(px-1,py-2,px,py-1),'ivory')
    elif name=='portal-charged-ring':
        # Broken squared rune rails + outward crystal leaves overlay the portal.
        for p in [[(15,9),(25,5),(29,5)],[(39,5),(44,5),(53,10)],[(59,18),(63,27),(63,30)],[(63,39),(61,47),(55,54)],[(47,61),(38,63)],[(29,63),(19,59),(14,55)],[(7,48),(5,39)],[(5,29),(8,19)]]:
            stroke(im,p,'teal',4);stroke(im,[(a,b-1) for a,b in p],'gold',1)
        for px,py in [(13,13),(55,13),(55,55),(13,55)]:
            poly(im,[(px,py-5),(px+4,py),(px,py+5),(px-4,py)],'teal')
            poly(im,[(px,py-3),(px+2,py),(px,py+3),(px-2,py)],'cyan');rect(im,(px,py-1,px,py+1),'ivory')
        for i,(px,py) in enumerate([(34,5),(63,34),(34,63),(5,34)]):
            stroke(im,[(px-2,py+2),(px,py-2),(px+2,py+2)],'ivory' if (i+f)%4==0 else 'gold',2)
    elif name=='portal-body-trail':
        poly(im,moved([(-8,3),(-3,-4),(3,-10),(7,-5),(5,1),(0,5),(-5,8)],x,y+bob),'teal')
        poly(im,moved([(-5,3),(3,-7),(5,-4),(3,0),(-3,6)],x,y+bob),'cyan')
        stroke(im,[(x-3,y+3+bob),(x+3,y-4+bob)],'ivory',2)
        poly(im,[(22,23),(26,18),(27,22),(24,26)],'gold');glint(im,7,8,2,'gold')
    elif name=='rush-ember':
        poly(im,moved([(-9,10),(-11,3),(-8,-1),(-9,-6),(-3,-3),(0,-13),(4,-8),(4,-3),(9,-7),(10,2),(6,9),(0,12)],x,y+bob),'burgundy')
        poly(im,moved([(-7,8),(-8,2),(-5,-2),(-3,1),(1,-9),(3,-4),(7,-4),(7,2),(4,7),(0,9)],x,y+bob),'red')
        poly(im,moved([(-4,6),(-4,2),(0,-3),(1,2),(4,0),(3,5),(0,7)],x,y+bob),'orange')
        poly(im,moved([(-1,4),(0,1),(1,4),(0,6)],x,y+bob),'ivory')
    elif name=='rush-thorn':
        poly(im,moved([(-12,10),(-5,0),(-6,-7),(0,-3),(7,-12),(6,-1),(12,-4),(7,6),(2,5),(-5,11)],x,y),'burgundy')
        poly(im,moved([(-9,8),(-2,-1),(6,-9),(4,1),(8,0),(5,4),(0,3)],x,y),'red')
        stroke(im,[(x-7,y+7),(x+4,y-6)],'orange',2)
        rect(im,(x+2,y-5,x+3,y-3),'ivory' if f%2 else 'orange')
    elif name=='corruption-particle':flake(im,x,y+bob,f)
    elif name=='roots-crack':
        for i,p in enumerate(ROOT_BRANCHES):
            pts=p[:min(len(p),2+f)];stroke(im,pts,'ink',3);stroke(im,[(a+1,b) for a,b in pts],'root')
        for a,b in [(29,47),(39,43),(18,32),(48,31)]:poly(im,[(a,b),(a+3,b-1),(a+5,b+2),(a+1,b+2)],'root')
    elif name in ('roots-sprout','roots-root'):root_shape(im,f,name.split('-')[1])
    elif name=='roots-decay':
        if f<2:
            root_shape(im,0,'root')
            # Discrete palette replacement: dried bark, no continuous gradient.
            colors={P['moss']:P['root'],P['leaf']:P['dry'],P['root']:P['amber'],P['bark']:P['dry']}
            for a in range(w):
                for b in range(h):
                    c=im.getpixel((a,b));hexcolor='#%02x%02x%02x'%c[:3]
                    if c[3] and hexcolor in colors:im.putpixel((a,b),tuple(bytes.fromhex(colors[hexcolor][1:]))+(255,))
            if f==1:
                for a,b in [(27,32),(40,39),(31,20)]:stroke(im,[(a-4,b+2),(a+4,b-2)],(0,0,0,0),3)
        else:
            for i,(a,b) in enumerate([(16,26),(30,20),(45,34),(24,41),(39,48),(52,46)]):
                py=b+(f-2)*3;px=a+(-1 if i%2 else 1)*(f-2)
                if f<5:poly(im,[(px-3,py-2),(px+3,py-1),(px+1,py+3),(px-2,py+1)],'bark' if i%2 else 'root')
                else:rect(im,(px,py,px+1,py),'root')
    elif name=='mist-puff':
        # Hand-shaped, stepped lobes. Limited flat alpha colors, no blur/gradient.
        b=bob
        silhouette=[(2,44),(8,41),(5,38),(12,38),(12,33),(18,33),(18,25),(24,25),(24,18),(33,18),(33,13),(43,13),(43,16),(49,16),(49,11),(60,11),(60,17),(69,17),(69,22),(78,22),(78,30),(86,30),(86,37),(93,37),(93,42),(86,44),(79,45),(74,49),(65,49),(65,53),(50,53),(50,50),(42,50),(38,54),(25,54),(29,50),(18,50),(14,47),(5,47)]
        poly(im,[(a,c+b) for a,c in silhouette],(78,77,111,170))
        poly(im,[(10,43+b),(20,39+b),(22,30+b),(28,27+b),(30,21+b),(40,20+b),(45,26+b),(50,21+b),(52,17+b),(60,19+b),(64,25+b),(73,28+b),(75,35+b),(85,39+b),(77,42+b),(66,42+b),(61,47+b),(50,46+b),(43,42+b),(34,48+b),(23,45+b)],(110,110,143,145))
        poly(im,[(28,35+b),(35,29+b),(43,31+b),(50,29+b),(60,32+b),(67,37+b),(63,42+b),(54,43+b),(45,39+b),(38,43+b),(30,40+b)],(48,51,76,155))
        stroke(im,[(16,40+b),(21,36+b),(22,30+b),(28,27+b),(31,22+b),(38,21+b)],(155,151,180,150),2)
        stroke(im,[(57,20+b),(61,23+b),(62,27+b),(71,30+b)],(145,151,177,145),2)
        for a,c in [(29,28),(62,37),(45,45)]:glint(im,a,c+b,1,'mint' if f%2 else 'lilac')
    return im

def export():
    OUT.mkdir(parents=True,exist_ok=True);inventory=[]
    contact=Image.new('RGB',(800,19*100),'#102d27');d=ImageDraw.Draw(contact)
    for row,(name,w,h,n) in enumerate(SPECS):
        sheet=Image.new('RGBA',(w*n,h));bounds=[]
        for f in range(n):
            im=frame(name,w,h,f);sheet.paste(im,(f*w,0));bounds.append(im.getbbox())
        target=OUT/(name+'.png');sheet.save(target)
        inventory.append({'key':'vfx.'+name,'file':str(target.relative_to(ROOT)).replace('\\','/'),'frame':[w,h],'frames':n,'sheet':list(sheet.size),'anchor':[w/2,h/2],'bounds':bounds,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
        d.text((8,row*100+5),name,fill='#f1dfba');contact.paste(sheet,(8,row*100+24),sheet)
    contact.save(QA/'native-contact.png')
    (QA/'inventory.json').write_text(json.dumps(inventory,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':export()
