"""Approximate local contrast from text-free final composite (not CSS boxes)."""
import json, math, re
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
data=json.loads((root/'after.json').read_text(encoding='utf-8'))
def luminance(rgb):
    a=[v/255 for v in rgb]
    a=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a]
    return .2126*a[0]+.7152*a[1]+.0722*a[2]
results=[]
mobile=json.loads((root/'mobile-contrast.json').read_text(encoding='utf-8')) if (root/'mobile-contrast.json').exists() else {'contrast':[]}
for group in data['contrast']+mobile['contrast']:
    im=Image.open(root/group['image']).convert('RGB')
    for row in group['samples']:
        r=row['rect']; crop=im.crop((max(0,math.floor(r['x'])),max(0,math.floor(r['y'])),min(im.width,math.ceil(r['x']+r['w'])),min(im.height,math.ceil(r['y']+r['h']))))
        vals=sorted(luminance(p) for p in crop.getdata())
        fg=luminance([int(x) for x in re.findall(r'\d+',row['color'])[:3]])
        ratio=lambda bg:(max(fg,bg)+.05)/(min(fg,bg)+.05)
        mean=ratio(sum(vals)/len(vals)); p90=ratio(vals[int((len(vals)-1)*.9)])
        results.append({**row,'image':group['image'],'meanContrast':round(mean,2),'brightP90Contrast':round(p90,2),'brightFractionBelow3':round(sum(ratio(v)<3 for v in vals)/len(vals),3),'pass':mean>=4.5 and p90>=3})
(root/'contrast.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(results,ensure_ascii=False,indent=2))
if not all(r['pass'] for r in results):raise SystemExit(1)
