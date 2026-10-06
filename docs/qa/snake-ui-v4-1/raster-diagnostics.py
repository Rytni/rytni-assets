from pathlib import Path
from PIL import Image
import json,hashlib
q=Path(__file__).parent;root=q.parents[2]
for phase in ['before','after']:
 for dpr in ['1','1.5','2']:
  im=Image.open(q/f'{phase}-token-dpr{dpr}.png');im.resize((im.width*8,im.height*8),Image.Resampling.NEAREST).save(q/f'{phase}-token-dpr{dpr}-8x.png')
old=Image.open(root/'grib/mushroom-snake-ui-v4/icons/attempt-48.png').convert('RGBA');new=Image.open(root/'grib/mushroom-snake-ui-v4-1/icons/attempt-48.png').convert('RGBA')
changed=[(x,y) for y in range(48) for x in range(48) if old.getpixel((x,y))!=new.getpixel((x,y))]
assert len(changed)==17
assert all(4<=x<=5 and 26<=y<=39 and new.getpixel((x,y))[3]==0 for x,y in changed)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
result={'root_cause':'disconnected17px atlas-export residue in source PNG, not a CSS border or runtime scale seam','changed_pixels':17,'removed_source_bounds':[4,26,5,39],'retained_main_pixels':953,'retained_pixels_byte_identical':True,'dpr_crops':[1,1.5,2], 'known_good_fly':{'source':'grib/mushroom-snake-v1/fly-card.png','historical_commit':'e4b203c','sha256':sha(root/'grib/mushroom-snake-v1/fly-card.png'),'restored':'grib/mushroom-snake-ui-v4-1/fly-cover.png','restored_sha256':sha(root/'grib/mushroom-snake-ui-v4-1/fly-cover.png'),'reported_toolbar':'not reproduced in fresh TEST raster or either CDN asset; current old TEST asset already has known-good hash'}}
(q/'raster-metrics.json').write_text(json.dumps(result,indent=2)+'\n')
