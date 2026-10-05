from pathlib import Path
from PIL import Image
from io import BytesIO
import json,subprocess
QA=Path(__file__).resolve().parent;ROOT=QA.parents[2]
before=json.loads((QA/'before.json').read_text());after=json.loads((QA/'after.json').read_text());entries=json.loads((QA/'inventory.json').read_text());bounds={}
for e in entries:
    old=Image.open(BytesIO(subprocess.check_output(['git','show','723427d:'+e['file']],cwd=ROOT)));new=Image.open(ROOT/e['file']);w,h=e['frame']
    def ink(im):
        boxes=[im.crop((i*w,0,(i+1)*w,h)).getbbox() for i in range(e['frames'])]
        return max(max(b[2]-b[0],b[3]-b[1]) for b in boxes)/max(w,h)
    bounds[e['key']]=(ink(old),ink(new))
keys={'focus':'focus-wisp','spores':'spore-idle','guard':'guard-plate','portalPrize':'portal-charged-ring','rush':'rush-ember'}
rows=[]
for b,a in zip(before['reports'],after['reports']):
    assert (b['id'],b['kind'],b['C'],b['hash'])==(a['id'],a['kind'],a['C'],a['hash'])
    k='vfx.'+keys[a['kind']];oldDraws=[d for d in b['draws'] if d['key']==k];bd=oldDraws[1] if a['kind']=='spores' else oldDraws[0];ad=next(d for d in a['draws'] if d['key']==k);oldInk,newInk=bounds[k]
    row={'fixture':a['id'],'effect':a['kind'],'cellCSS':a['C'],'beforeBoxCSS':bd['size'],'afterBoxCSS':ad['size'],'beforeMaxInkCSS':bd['size']*oldInk,'afterMaxInkCSS':ad['size']*newInk,'maxAxisFootprintRatio':ad['size']*newInk/(bd['size']*oldInk),'identicalCanonicalHash':a['hash']}
    if a['kind']=='spores':row['beforeSoftEchoMaxInkCSS']=oldDraws[0]['size']*oldInk;row['beforeSoftEchoOpacity']=.22
    rows.append(row)
(QA/'runtime-metrics.json').write_text(json.dumps({'note':'Maximum authored-frame ink axis × runtime uniform contain scale; not area or hitbox. Spores compares solid collectible core; prior 22%-opacity outer echo is reported separately, now removed. Capture canonical hashes equal before/after. Guard envelope is a redesigned open shell, not simple icon scaling.','comparisons':rows},indent=2)+'\n')
print('PASS: 20 before/after canonical hashes and cell scales identical')
