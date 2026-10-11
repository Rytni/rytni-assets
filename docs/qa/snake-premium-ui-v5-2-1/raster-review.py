"""Diagnostic crops only. Never edits runtime assets; all coordinates in CSS px.

Metal contour: manually inspected material-glass source rail ends at x=30..32
outside the corner bevels. Use x=32 (conservative inner contour) at icon rows.
This is not an alpha-bound test: the glass interior is opaque too.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

task = Path(__file__).resolve().parent
repo = task.parents[2]
metrics = {tag: json.loads((task / (tag + '.json')).read_text(encoding='utf-8')) for tag in ['before', 'after']}
rows = []
for tag, data in metrics.items():
    for row in data['rows']:
        if row['state'] != 'settings':
            continue
        image = Image.open(task / f"{tag}-{row['name']}-settings.png").convert('RGB')
        draw = ImageDraw.Draw(image)
        for icon in row['settings']:
            panel, box = icon['panel'], icon['box']
            # .skin-wood inset 16px 12px 9px, center / cover, unchanged art.
            sw, sh = panel['width'] - 24, panel['height'] - 25
            scale = max(sw / 438, sh / 330)
            metal = panel['left'] + 12 + (sw - 438 * scale) / 2 + 32 * scale
            source = Image.open(repo / 'grib/mushroom-snake-ui-v5' / icon['src'].split('/')[-1]).convert('RGBA')
            # Count substantial ink, not transparent image-canvas bounds.
            alpha = source.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
            ink_left = box['left'] + alpha.getbbox()[0] * box['width'] / source.width
            gap = ink_left - metal
            rows.append({'tag': tag, 'case': row['name'], 'icon': icon['src'].split('/')[-1], 'metal': round(metal, 2), 'inkLeft': round(ink_left, 2), 'gap': round(gap, 2), 'method': 'visually inspected source metal contour x32, cover mapping; >=128 alpha icon ink'})
            draw.line((metal, box['top'], metal, box['bottom']), fill='#ff6688', width=1)
            draw.line((ink_left, box['top'], ink_left, box['bottom']), fill='#66ffff', width=1)
        image.save(task / f"{tag}-{row['name']}-settings-ink.png")
    for name in ['fullscreen-1920', 'fullscreen-1366']:
        image = Image.open(task / f'{tag}-{name}-result-record.png')
        width, height = image.size
        image.crop((int(width*.53), int(height*.64), int(width*.84), int(height*.735))).resize((int(width*.31)*2, int(height*.095)*2)).save(task / f'{tag}-{name}-result-detail.png')

baseline = next(r for r in metrics['before']['rows'] if r['name']=='fullscreen-1920' and r['state']=='normal')
current = next(r for r in metrics['after']['rows'] if r['name']=='fullscreen-1920' and r['state']=='normal')
delta = max(abs(a['box'][k]-b['box'][k]) for a,b in zip(baseline['children'],current['children']) for k in ['left','top','width','height'])
first = Image.open(task/'before-fullscreen-1920-main.png').convert('RGB')
second = Image.open(task/'after-fullscreen-1920-main.png').convert('RGB')
diff = ImageChops.difference(first,second)
outside = diff.copy()
ImageDraw.Draw(outside).rectangle((120,880,855,1035),fill='black')
report = {'settings': rows, 'fullscreen1920MaxBoxDelta': round(delta,4), 'fullscreen1920DiffOutsideDock': outside.getbbox(), 'afterMinimumVisibleGap': min(r['gap'] for r in rows if r['tag']=='after')}
(task/'raster.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='settings'}))
assert delta < .1, 'Approved spacious geometry moved'
assert report['fullscreen1920DiffOutsideDock'] is None, 'Unrelated fullscreen pixels changed'
assert report['afterMinimumVisibleGap'] >= 8, 'Icon touches metal'
