"""Asset-only gate. Does not import or mutate gameplay/approvals."""
from PIL import Image
from pathlib import Path
import json, hashlib, struct
import export as art

def pixels(im):return list(im.get_flattened_data())
def changed(a,b):return sum(p!=q for p,q in zip(pixels(a),pixels(b)))
def centroid(im):
    pts=[(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]]
    return [sum(p[i] for p in pts)/len(pts) for i in range(2)]
def alpha_distance(a,b):
    # Silhouette changes must be within two pixels of the other silhouette.
    aa=a.getchannel('A');bb=b.getchannel('A');worst=0
    for src,dst in [(aa,bb),(bb,aa)]:
        for y in range(64):
            for x in range(64):
                if src.getpixel((x,y)) and not dst.getpixel((x,y)):
                    dist=min((max(abs(dx),abs(dy)) for dy in range(-2,3) for dx in range(-2,3) if 0<=x+dx<64 and 0<=y+dy<64 and dst.getpixel((x+dx,y+dy))),default=99)
                    worst=max(worst,dist)
    return worst

def main():
    expected={}
    for name in art.NAMES:
        for role,n,pad,frames in [('field',64,4,1),('lod',24,2,1),('hud',32,2,1),('idle',64,4,4)]:expected[f'effects/{name}-{role}.png']=(n,pad,frames)
    for name in ['golden','corrupted']:
        for role,n,pad in [('field',48,2),('lod',24,2)]:expected[f'food/{name}-{role}.png']=(n,pad,1)
    actual={p.relative_to(art.OUT).as_posix() for p in art.OUT.rglob('*.png')}
    assert actual==set(expected),(actual-set(expected),set(expected)-actual)
    rows=[];animations=[]
    for path,(n,pad,frames) in expected.items():
        file=art.OUT/path
        with Image.open(file) as source:im=source.copy()
        assert im.mode=='RGBA' and im.size==(n*frames,n),path
        assert file.read_bytes()[25]==6,'PNG must be true RGBA color type 6'
        bboxes=[]
        for i in range(frames):
            f=im.crop((i*n,0,(i+1)*n,n));a=f.getchannel('A');b=a.getbbox();assert b,path
            assert b[0]>=pad and b[1]>=pad and b[2]<=n-pad and b[3]<=n-pad,(path,i,b)
            assert set(a.get_flattened_data())=={0,255},path
            assert all(f.getpixel(p)[3]==0 for p in [(0,0),(n-1,0),(0,n-1),(n-1,n-1)]),path
            bboxes.append(b)
        rows.append(dict(file=path,size=list(im.size),mode=im.mode,content=[pad,pad,n-2*pad,n-2*pad],anchor=[n//2,n//2],frameBounds=bboxes,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
    for name in art.NAMES:
        base=Image.open(art.OUT/f'effects/{name}-field.png');sheet=Image.open(art.OUT/f'effects/{name}-idle.png');frames=[sheet.crop((64*i,0,64*(i+1),64)) for i in range(4)]
        assert changed(base,frames[0])==0,name
        diffs=[changed(base,f) for f in frames]
        assert all(0<c<650 for c in diffs[1:]),(name,diffs)
        assert len({f.tobytes() for f in frames})==4,(name,'duplicate frames')
        drift=max(max(abs(p-q) for p,q in zip(centroid(base),centroid(f))) for f in frames)
        assert drift<1,(name,drift)
        distance=max(alpha_distance(base,f) for f in frames)
        assert distance<=2,(name,distance)
        # At least half the sprite remains byte-identical across every frame.
        stable=sum(all(f.getpixel((x,y))==base.getpixel((x,y)) for f in frames) for y in range(64) for x in range(64) if base.getpixel((x,y))[3])
        opaque=sum(p[3]>0 for p in pixels(base));assert stable/opaque>.5,(name,stable/opaque)
        lod=Image.open(art.OUT/f'effects/{name}-lod.png')
        assert lod.tobytes()!=base.resize((24,24),Image.Resampling.NEAREST).tobytes(),name
        assert lod.tobytes()==art.lod(name).tobytes(),name
        animations.append(dict(name=name,changedVsNeutral=diffs,alphaBoundaryMotionMaxPx=distance,alphaCentroidDeltaMaxPx=round(drift,4),stableOpaqueCoreFraction=round(stable/opaque,4),fixedAnchor=[32,32],neutralEqualsField=True,lodIndependent=True))
    for variant in ['golden','corrupted']:
        field=Image.open(art.OUT/f'food/{variant}-field.png');mini=Image.open(art.OUT/f'food/{variant}-lod.png')
        assert mini.tobytes()==art.lod('food-'+variant).tobytes()
        assert mini.tobytes()!=field.resize((24,24),Image.Resampling.NEAREST).tobytes()
    report=dict(status='PASS — asset structure only; no human art approval',base='398ee52',pngCount=len(rows),files=rows,animations=animations,foodLodIndependent=True,limits=dict(localSilhouetteMotionPx=2,alphaCentroidDeltaPx=1,changedPixelsPerPhase=650,stableOpaqueCoreFraction=.5),notes=['Anchor is a fixed canvas coordinate, not alpha centroid. Satellite/root-tip/mist-tail motion is intentional; stationary core is retained.','Content containment guarantees transparent padding; it does not establish human silhouette quality.','LOD drawings take no field/master image input.','No live renderer, mechanics, approvals or deployments changed.'])
    (art.QA/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    inv='# Exact created delivery PNGs\n\nRoot: `grib/mushroom-snake-effects-v1/assets/`\n\n'+''.join(f'- `{path}` — {n*frames}×{n} RGBA\n' for path,(n,pad,frames) in expected.items())
    (art.QA/'inventory.md').write_text(inv,encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['status','pngCount','animations']},indent=2))

if __name__=='__main__':main()
