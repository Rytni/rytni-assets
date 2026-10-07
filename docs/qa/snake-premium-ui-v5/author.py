"""Offline STATIC raster composition requested for human art approval.

No product import/write, gameplay execution, CSS artwork, or publication.
Generated originals remain immutable. Tile crops are OUR authored concept atlas,
never human screenshots. Extracted masters are not approved runtime assets.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = HERE / 'sources'
MASTERS = HERE / 'masters'
LZ = Image.Resampling.LANCZOS
IVORY = '#fff0cd'
GOLD = '#e8c681'
MUTED = '#dccba5'
FONTS = Path('C:/Windows/Fonts')
KEYS = ['guide', 'ranking', 'settings', 'sound-on', 'fullscreen', 'back',
        'close', 'home', 'restart', 'share', 'sound-off', 'exit-fullscreen']
LABELS = ['Путеводитель', 'Рейтинг', 'Настройки', 'Звук', 'Полный экран', 'Назад',
          'Закрыть', 'Главное меню', 'Заново', 'Поделиться', 'Без звука', 'Свернуть']
REUSED = [
    'grib/mushroom-snake-ui-v4-3/menu-forest.png',
    'grib/mushroom-snake-ui-v4/hero.png',
    'grib/mushroom-snake-retro-v5/logo.png',
    'grib/mushroom-snake-ui-v4-1/icons/attempt-48.png',
    'grib/mushroom-snake-ui-v4/icons/sponsor-48.png',
] + [f'grib/mushroom-snake-ui-v4/buttons/{kind}-{side}.png'
     for kind in ['play', 'wood'] for side in ['left', 'center', 'right']]


def image(path):
    return Image.open(path).convert('RGBA')


def trim(im):
    # Ignore only near-zero alpha when deriving crop bounds; preserve source alpha.
    bounds = im.getchannel('A').point(lambda a: 255 if a >= 16 else 0).getbbox()
    assert bounds, 'empty concept object'
    return im.crop(bounds)


def contain(im, size):
    return ImageOps.contain(im, tuple(map(int, size)), LZ)


def master(im):
    out = Image.new('RGBA', (256, 256))
    obj = contain(trim(im), (224, 224))
    out.alpha_composite(obj, ((256-obj.width)//2, (256-obj.height)//2))
    return out


def extract():
    atlas = image(SOURCE / 'icons-atlas.png')
    assert atlas.size == (1448, 1086)
    for n, key in enumerate(KEYS):
        x, y = (n % 4)*362, (n // 4)*362
        master(atlas.crop((x, y, x+362, y+362))).save(MASTERS / (key+'.png'))
    props = image(SOURCE / 'physical-objects.png')
    boxes = {
        'attempts': (20, 175, 535, 405),
        'record-rank': (540, 140, 1015, 425),
        'top-three': (1025, 80, 1420, 480),
        'ranking-board': (45, 435, 500, 1015),
        'stat-food': (515, 620, 720, 968),
        'stat-length': (725, 565, 900, 968),
        'stat-combo': (905, 615, 1100, 968),
        'control': (1130, 685, 1405, 965),
    }
    for key, box in boxes.items():
        obj = trim(image(SOURCE/'ranking-source.png').crop((30, 165, 1510, 858))) if key == 'ranking-board' else trim(props.crop(box))
        # Alpha-only offline glass treatment: leave brass/enamel untouched.
        # Dark neutral glass becomes translucent, not a flat green backing.
        if key in ['top-three', 'ranking-board', 'record-rank', 'attempts', 'control']:
            px = obj.load()
            for y in range(obj.height):
                for x in range(obj.width):
                    r, g, b, a = px[x, y]
                    if max(r, g, b)-min(r, g, b) < 24 and max(r, g, b) < 115:
                        px[x, y] = (r, g, b, round(a*.74))
        obj.save(MASTERS / (key+'.png'))
    material = image(SOURCE / 'materials-source.png')
    for n, key in enumerate(['brass', 'enamel', 'glass', 'resin', 'wood', 'parchment']):
        x0 = [62, 558, 1037][n % 3]
        y0 = 125 if n < 3 else 548
        material.crop((x0, y0, x0+438, y0+330)).save(MASTERS / ('material-'+key+'.png'))


class Scene:
    def __init__(self, size=(1920, 1080), name=''):
        self.name, self.size, self.boxes = name, size, []
        self.im = ImageOps.fit(image(ROOT/REUSED[0]), size, LZ)

    def record(self, name, x, y, w, h):
        assert x >= 0 and y >= 0 and x+w <= self.size[0] and y+h <= self.size[1], (name, x, y, w, h)
        self.boxes.append(dict(name=name, x=x, y=y, width=w, height=h))

    def smoke(self, cx, cy, rx, ry, opacity=140):
        # Local smooth alpha veil only; the forest itself is never blurred.
        patch = Image.new('RGBA', (2*rx, 2*ry))
        a = Image.new('L', patch.size)
        a.putdata([round(opacity*max(0, 1-((x-rx)/rx)**2-((y-ry)/ry)**2)**1.5)
                   for y in range(2*ry) for x in range(2*rx)])
        patch.paste((2, 12, 15), (0, 0, 2*rx, 2*ry)); patch.putalpha(a)
        self.im.alpha_composite(patch, (cx-rx, cy-ry))

    def obj(self, path, x, y, w, h, name='object'):
        self.record(name, x, y, w, h)
        obj = contain(image(path), (w, h))
        self.im.alpha_composite(obj, (round(x+(w-obj.width)/2), round(y+(h-obj.height)/2)))

    def art(self, key, x, y, w, h=None):
        self.obj(MASTERS/(key+'.png'), x, y, w, h or w, key)

    def text(self, value, x, y, size, color=IVORY, serif=False, center=True, maxwidth=None):
        face = FONTS / ('georgiab.ttf' if serif else 'trebucbd.ttf')
        font = ImageFont.truetype(str(face), size)
        if maxwidth:
            while font.getlength(value) > maxwidth:
                size -= 1; font = ImageFont.truetype(str(face), size)
        draw = ImageDraw.Draw(self.im)
        box = draw.textbbox((0, 0), value, font=font)
        tw, th = box[2]-box[0], box[3]-box[1]
        tx = x-tw/2 if center else x
        ty = y-box[1]
        self.record('text:'+value, round(tx), round(y), round(tw), round(th))
        draw.text((tx+1, ty+2), value, font=font, fill=(0, 6, 8, 180), stroke_width=1, stroke_fill=(0, 6, 8, 180))
        draw.text((tx, ty), value, font=font, fill=color)

    def button(self, label, x, y, w, h, primary=False):
        self.record('button:'+label, x, y, w, h)
        kind = 'play' if primary else 'wood'
        cap = round(h*80/64)
        for side, dx, dw in [('left', 0, cap), ('center', cap, w-2*cap), ('right', w-cap, cap)]:
            obj = image(ROOT/f'grib/mushroom-snake-ui-v4/buttons/{kind}-{side}.png').resize((dw, h), LZ)
            self.im.alpha_composite(obj, (x+dx, y))
        self.text(label, x+w/2, y+h*.37, max(18, round(h*.29)), serif=primary, maxwidth=w-76)

    def control(self, key, x, y, label='', size=80):
        self.art('control', x, y, size)
        self.art(key, x+8, y+8, size-16)
        if label:
            self.text(label, x+size/2, y+size+8, 18, maxwidth=125)

    def save(self):
        self.im.convert('RGB').save(HERE/(self.name+'.png'))
        return dict(file=self.name+'.png', size=self.size, components=self.boxes, singleViewport=True)


def main():
    s = Scene(name='main-premium-desktop')
    s.smoke(470, 235, 620, 240, 95)
    s.smoke(1020, 500, 350, 420, 145)
    s.obj(ROOT/REUSED[2], 100, 105, 590, 180, 'original logo')
    s.text('Расти. Рискуй. Забирай первое место.', 392, 292, 22, color=MUTED, serif=True)
    s.obj(ROOT/REUSED[1], 85, 380, 670, 429, 'original hero')
    s.button('ИГРАТЬ', 795, 326, 510, 88, True)
    s.button('ТРЕНИРОВКА', 843, 444, 414, 70)
    s.text('Без ограничений', 1050, 538, 20, color=MUTED)
    for key, x, label in [('guide', 880, 'КАК ИГРАТЬ'), ('ranking', 1008, 'РЕЙТИНГ'), ('settings', 1136, 'НАСТРОЙКИ')]:
        s.control(key, x, 603, label)
    s.control('sound-on', 976, 766, size=60)
    s.control('fullscreen', 1062, 766, size=60)
    s.art('attempts', 125, 889, 345, 130)
    s.text('ПОПЫТКИ', 241, 913, 18)
    s.text('СПОНСОР', 378, 913, 18)
    for x in [185, 223, 261]: s.obj(ROOT/REUSED[3], x, 939, 30, 30, 'attempt mushroom')
    for x in [345, 385]: s.obj(ROOT/REUSED[4], x, 939, 30, 30, 'sponsor gift')
    s.text('3 / 3', 241, 974, 22)
    s.text('0 / 2', 378, 974, 22)
    s.art('record-rank', 496, 886, 274, 137)
    for cx, label, value in [(568, 'РЕКОРД', '6 840'), (699, 'МЕСТО', '№7')]:
        s.text(label, cx, 926, 17, color=MUTED)
        s.text(value, cx, 951, 26, serif=True)
    s.art('top-three', 1390, 260, 438, 480)
    s.text('СЕЗОН ЛЕСА', 1609, 327, 18, color=MUTED)
    s.text('ТОП–3', 1609, 357, 33, serif=True)
    for rank, y, name, score in [(1, 442, 'Лесной гость', '12 480'), (2, 536, 'Грибная королева', '11 260'), (3, 632, 'Тихий мицелий', '10 480')]:
        s.text(str(rank), 1452, y+8, 30, color=GOLD, serif=True)
        s.text(name, 1490, y, 20, center=False, maxwidth=255)
        s.text(score, 1490, y+31, 26, serif=True, center=False)
    s.text('Ваше место: №7  ·  Рекорд: 6 840', 1609, 765, 20)
    s.button('ОТКРЫТЬ РЕЙТИНГ', 1425, 812, 370, 60)
    result = [s.save()]
    ImageOps.fit(s.im, (1366, 768), LZ).convert('RGB').save(HERE/'main-premium-1366.png')
    result.append(dict(file='main-premium-1366.png', size=[1366, 768], singleViewport=True, uniformAdaptationFrom=s.name))
    return result


def results():
    s = Scene(name='result-premium-desktop')
    s.smoke(1310, 530, 585, 520, 190)
    s.smoke(475, 610, 530, 400, 75)
    s.obj(ROOT/REUSED[1], 90, 325, 820, 525, 'original hero')
    s.text('ТРЕНИРОВКА', 1310, 185, 22, color=GOLD)
    s.text('ТРЕНИРОВКА ЗАВЕРШЕНА', 1310, 227, 40, serif=True, maxwidth=1040)
    s.text('215', 1310, 329, 160, serif=True)
    for key, cx, label, val in [('stat-food', 1105, 'ГРИБЫ', '2'), ('stat-length', 1310, 'ДЛИНА', '10'), ('stat-combo', 1515, 'КОМБО', '×2')]:
        s.art(key, cx-52, 566, 104, 168)
        s.text(label, cx, 526, 18, color=MUTED)
        s.text(val, cx, 709, 24, serif=True)
    s.text('Попытки не тратились. Результат не попал в рейтинг.', 1310, 755, 18, color=MUTED)
    s.button('НОВАЯ ТРЕНИРОВКА', 1050, 813, 520, 78, True)
    s.button('ГЛАВНОЕ МЕНЮ', 1115, 916, 390, 62)
    out = [s.save()]
    ImageOps.fit(s.im, (1366, 768), LZ).convert('RGB').save(HERE/'result-premium-1366.png')
    out.append(dict(file='result-premium-1366.png', size=[1366, 768], singleViewport=True, uniformAdaptationFrom=s.name))
    s = Scene(size=(844, 390), name='result-premium-mobile')
    s.smoke(597, 180, 247, 235, 220)
    s.smoke(188, 217, 233, 208, 85)
    s.obj(ROOT/REUSED[1], 22, 119, 325, 214, 'original hero')
    s.text('ТРЕНИРОВКА', 583, 22, 13, color=GOLD)
    s.text('ТРЕНИРОВКА ЗАВЕРШЕНА', 583, 48, 23, serif=True, maxwidth=445)
    s.text('215', 583, 93, 80, serif=True)
    for key, cx, label, val in [('stat-food', 476, 'ГРИБЫ', '2'), ('stat-length', 583, 'ДЛИНА', '10'), ('stat-combo', 690, 'КОМБО', '×2')]:
        s.art(key, cx-26, 203, 52, 78)
        s.text(label, cx, 183, 12, color=MUTED)
        s.text(val, cx, 268, 14, serif=True)
    s.button('НОВАЯ ТРЕНИРОВКА', 392, 287, 380, 48, True)
    s.button('ГЛАВНОЕ МЕНЮ', 455, 338, 255, 44)
    out.append(s.save())
    return out


def ranking():
    s = Scene(name='ranking-premium')
    s.smoke(960, 530, 870, 540, 150)
    s.art('ranking-board', 235, 170, 1450, 720)
    s.text('СЕЗОН ЛЕСА', 960, 240, 18, color=MUTED)
    s.text('РЕЙТИНГ', 960, 282, 38, serif=True)
    leaders = [('2', 'Грибная королева', '11 260', 640), ('1', 'Лесной гость', '12 480', 960), ('3', 'Тихий мицелий', '10 480', 1280)]
    for place, name, score, cx in leaders:
        s.art('ranking', cx-25, 367, 44)
        s.text(place, cx+34, 382, 22, color=GOLD, serif=True)
        s.text(name, cx, 418, 18, maxwidth=290)
        s.text(score, cx, 448, 24, serif=True)
    names = ['Лисичка', 'Боровик', 'Хранитель леса', 'Вы', 'Грибник', 'Светлячок', 'Лесная тропа']
    scores = ['9 820', '8 960', '7 520', '6 840', '6 120', '5 280', '3 960']
    for n, (name, score) in enumerate(zip(names, scores), 4):
        y = 505+(n-4)*34
        if name == 'Вы':
            s.smoke(960, y+10, 550, 24, 160)
        s.text(str(n), 545, y, 19, color=GOLD, serif=True)
        s.text(name, 600, y, 20, color=GOLD if name=='Вы' else MUTED, center=False)
        s.text(score, 1360, y, 23, color=GOLD if name=='Вы' else IVORY, serif=True)
    s.text('Ваше место: №7  ·  Рекорд: 6 840', 960, 761, 20)
    s.button('НАЗАД', 800, 804, 320, 54)
    return s.save()


def icons():
    s = Scene(size=(1536, 1410), name='icons-concept')
    s.smoke(768, 700, 1000, 1000, 210)
    s.text('MUSHROOM SNAKE · PREMIUM OBJECT ICONS', 768, 35, 30, serif=True)
    s.text('256×256 RGBA master  →  64 px  →  48 px · actual Forest / physical control', 768, 83, 19, color=MUTED)
    for n, (key, label) in enumerate(zip(KEYS, LABELS)):
        x, y = 42+(n % 3)*500, 135+(n // 3)*310
        s.art(key, x, y, 256)
        s.art('control', x+293, y+45, 84)
        s.art(key, x+303, y+55, 64)
        s.art('control', x+391, y+53, 68)
        s.art(key, x+401, y+63, 48)
        s.text('64 px', x+335, y+144, 17)
        s.text('48 px', x+425, y+144, 17)
        s.text(label, x+236, y+268, 21)
    return s.save()


def materials():
    s = Scene(size=(1536, 780), name='materials')
    s.smoke(768, 390, 1000, 700, 225)
    s.text('MUSHROOM SNAKE · SIX MATERIALS', 768, 30, 32, serif=True)
    labels = [('brass', 'СОСТАРЕННАЯ ЛАТУНЬ'), ('enamel', 'ИЗУМРУДНАЯ ЭМАЛЬ'), ('glass', 'ДЫМЧАТОЕ СТЕКЛО'),
              ('resin', 'ЛЕСНАЯ СМОЛА'), ('wood', 'РЕЗНОЕ ТЁМНОЕ ДЕРЕВО'), ('parchment', 'IVORY-ПЕРГАМЕНТ')]
    for n, (key, label) in enumerate(labels):
        x, y = 42+(n % 3)*500, 113+(n // 3)*320
        s.art('material-'+key, x+10, y, 230, 174)
        s.art('material-'+key, x+290, y+61, 128, 96)
        s.text(label, x+225, y+212, 20, maxwidth=470)
        s.text('128×96 px · runtime material sample', x+225, y+251, 16, color=MUTED)
    return s.save()


if __name__ == '__main__':
    extract()
    scenes = main()+results()+[ranking(), icons(), materials()]
    checks = []
    for key in KEYS:
        obj = image(MASTERS/(key+'.png'))
        assert obj.size == (256, 256) and obj.getpixel((0, 0))[3] == 0
        checks.append(dict(key=key, size=obj.size, mode=obj.mode, alphaRange=obj.getchannel('A').getextrema()))
    (HERE/'composition-metrics.json').write_text(json.dumps(dict(concepts=scenes, masters=checks, artApproval='PENDING', gameplayValidation='NOT APPLICABLE'), ensure_ascii=False, indent=2), encoding='utf-8')
    inventory = []
    for p in sorted(HERE.rglob('*.png')):
        b = p.read_bytes(); obj = Image.open(p)
        inventory.append(dict(file=p.relative_to(HERE).as_posix(), size=obj.size, mode=obj.mode, sha256=hashlib.sha256(b).hexdigest(), bytes=len(b)))
    (HERE/'asset-inventory.json').write_text(json.dumps(dict(mode='built-in image_gen + authorized offline raster composition', runtimeAssetsApproved=False, authored=inventory, reusedReferenceOnly=REUSED), ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(dict(concepts=len(scenes), masters=len(checks), resultScroll=False, productModified=False)))
