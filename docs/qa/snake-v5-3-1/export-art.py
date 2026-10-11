"""Package final ImageGen nine-slice art: transparent trim + uniform resize only."""
import json
from pathlib import Path
from PIL import Image

source = Path(r'C:\Users\rytni\.codex\generated_images\01a08321-eab4-7933-939d-19e5a820a209\exec-8e169ee8-9705-485b-8beb-d2341d8e3f83.png')
target = Path('grib/mushroom-snake-ui-v5-3-1/status-board.png')
image = Image.open(source).convert('RGBA')
box = image.getchannel('A').point(lambda a: 255 if a >= 8 else 0).getbbox()
image = image.crop(box)
image = image.resize((960, round(image.height * 960 / image.width)), Image.Resampling.LANCZOS)
target.parent.mkdir(parents=True, exist_ok=True)
image.save(target)
print(json.dumps({'source': str(source), 'nearTransparentPaddingTrim': box, 'threshold': 8, 'alphaPixelsUnmodified': True, 'size': image.size, 'slice': 72}))
