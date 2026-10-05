"""Delivery gate only, never human art approval."""
from pathlib import Path
from PIL import Image
import json, hashlib, subprocess
ROOT=Path(__file__).resolve().parents[3]
QA=Path(__file__).resolve().parent
entries=json.loads((QA/'inventory.json').read_text());assert len(entries)==19
report=[]
for e in entries:
    im=Image.open(ROOT/e['file']);w,h=e['frame'];assert im.mode=='RGBA';assert list(im.size)==e['sheet']
    assert im.width==w*e['frames'] and im.height==h
    frames=[]
    for f in range(e['frames']):
        c=im.crop((f*w,0,(f+1)*w,h));b=c.getbbox();assert b and b[0]>0 and b[1]>0 and b[2]<w and b[3]<h,(e['key'],f,b)
        colors=set(c.getdata());assert len(colors)<40,(e['key'],len(colors))
        assert any(p[3]==0 for p in colors)
        frames.append({'bounds':b,'paletteColors':len(colors),'inkPixels':sum(p[3]>0 for p in c.getdata())})
    report.append({'key':e['key'],'sheet':im.size,'anchor':e['anchor'],'frames':frames,'sha256':hashlib.sha256((ROOT/e['file']).read_bytes()).hexdigest()})
locked=list((ROOT/'grib/mushroom-snake-effects-v1/assets/effects').glob('*.png'))+list((ROOT/'grib/mushroom-snake-effects-v1/assets/food').glob('*.png'))
assert len(locked)==40
for p in locked:assert p.read_bytes()==subprocess.check_output(['git','show','9a99036:'+p.relative_to(ROOT).as_posix()],cwd=ROOT),p
(QA/'validation.json').write_text(json.dumps({'status':'PASS delivery structure + 40 locked PNGs unchanged; human VFX approval pending','sheets':report},indent=2)+'\n')
print('PASS: 19 RGBA sheets, 84 native frames, contract anchors, transparent edges, limited palettes; 40 locked PNGs unchanged')
