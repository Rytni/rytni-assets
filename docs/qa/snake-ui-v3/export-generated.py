"""Export the selected built-in ImageGen artwork; preserve source files."""
from PIL import Image
from pathlib import Path
import sys,json,hashlib
root=Path(__file__).resolve().parents[3];out=root/'grib/mushroom-snake-ui-v3'
cover=Image.open(sys.argv[1]).convert('RGBA');w,h=cover.size
ratio=1.6
if w/h>ratio:
 nw=round(h*ratio);cover=cover.crop(((w-nw)//2,0,(w+nw)//2,h))
else:
 nh=round(w/ratio);cover=cover.crop((0,(h-nh)//2,w,(h+nh)//2))
cover.resize((1024,640),Image.Resampling.NEAREST).save(out/'snake-cover.png')
hero=Image.open(sys.argv[2]).convert('RGBA');hero=hero.crop(hero.getbbox());hero.thumbnail((512,352),Image.Resampling.NEAREST);hero.save(out/'result-hero.png')
meta=json.loads((out/'inventory.json').read_text(encoding='utf8'))
meta['assets']=[{'file':str(p.relative_to(out)).replace('\\','/'),'size':Image.open(p).size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.rglob('*.png'))]
meta['generated']={'tool':'built-in ImageGen','cover':'enchanted forest cover; approved Snake identity reference; no text','result':'transparent authored ivory Snake result hero; same face/red mushroom/moss; no runtime screenshot'}
(out/'inventory.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf8')
print('Cover',Image.open(out/'snake-cover.png').size,'Hero',hero.size,'alpha',hero.getextrema()[-1])
