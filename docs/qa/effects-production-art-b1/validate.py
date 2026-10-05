"""Targeted B.1 export and locked-source gate. No human art approval implied."""
from pathlib import Path
from PIL import Image
import json,subprocess,hashlib
QA=Path(__file__).resolve().parent;ROOT=QA.parents[2]
entries=json.loads((QA/'inventory.json').read_text());assert len(entries)==11
allowed={e['file'] for e in entries};locked=[];report=[]
for e in entries:
    p=ROOT/e['file'];im=Image.open(p);w,h=e['frame'];assert im.mode=='RGBA' and list(im.size)==e['sheet']
    frames=[]
    for f in range(e['frames']):
        c=im.crop((f*w,0,(f+1)*w,h));b=c.getbbox();pixels=list(c.get_flattened_data());colors=set(pixels)
        assert b and b[0]>0 and b[1]>0 and b[2]<w and b[3]<h,(e['key'],f,b)
        assert len(colors)<40 and any(p[3]==0 for p in colors)
        frames.append({'bounds':b,'ink':sum(p[3]>0 for p in pixels),'paletteColors':len(colors)})
    report.append({'key':e['key'],'frames':frames,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
paths=subprocess.check_output(['git','ls-files','grib/mushroom-snake-effects-v1/assets'],cwd=ROOT,text=True).splitlines()
paths+=[f'arcade/snake-next/{p}' for p in ['simulation/step.js','simulation/timing.js','gate-one/session.js','gate-one/motion.js','gate-one/ribbon.js','progressive-run/session.js','progressive-run/director.js','progressive-run/food.js','progressive-run/world.js','forest-training/ribbon-raster.js','forest-training/ribbon-sprites.js','forest-training/style.css','effect-playground/fit-world.js','effect-playground/capacity-model.js','effect-playground/asset-contract.js','effect-playground/asset-approvals.js','effect-playground/food-reaction.js']]
for p in paths:
    if p in allowed:continue
    assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show','723427d:'+p],cwd=ROOT),p
    locked.append(p)
(QA/'validation.json').write_text(json.dumps({'status':'PASS targeted export; not final human VFX approval','sheets':report,'locked':locked},indent=2)+'\n')
print('PASS:',len(report),'revised sheets;',len(locked),'locked assets/sources byte-identical to 723427d')
