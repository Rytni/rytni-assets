"""Generate local-only route fixtures from the actual base commit, no checkout."""
from pathlib import Path
import subprocess,json
QA=Path(__file__).resolve().parent;ROOT=QA.parents[2]
paths=['arcade/snake-next/'+p for p in ['effect-playground/visuals.js','effect-playground/vfx-presentation.js','progressive-run/adapter.js','tuning-lab/lab.js']]
paths += [e['file'] for e in json.loads((QA/'inventory.json').read_text())]
data={}
for p in paths:
    raw=subprocess.check_output(['git','show','723427d:'+p],cwd=ROOT)
    if p.endswith('.png'):
        folder=QA/'baseline-local';folder.mkdir(exist_ok=True);target=folder/Path(p).name;target.write_bytes(raw)
        data['/'+p]={'path':target.as_posix(),'contentType':'image/png'}
    else:data['/'+p]={'body':raw.decode('utf8'),'contentType':'text/javascript; charset=utf-8'}
(QA/'baseline-local.json').write_text(json.dumps(data),encoding='utf8')
print('Local-only base routes:',len(data))
