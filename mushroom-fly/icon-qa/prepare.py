"""Lossless PNG downsizing only; never crops or derives from the art reference."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(r'C:\Users\rytni\.codex\generated_images\01a08321-eab4-7933-939d-19e5a820a209')
TARGET = ROOT / 'grib/mushroom-fly-v2/ui/icons-recovery-v1'
FILES = {
    'home': '2e47ac4e-ec13-4e1c-aee8-d6e97011338d',
    'close': '628d1ef0-0bb2-4e44-939f-031f8fda7519',
    'confirm': '369cf2f7-27fb-4242-b607-c9134dacdc32',
    'sound-on': '77942bab-e3c0-4b81-bc4e-3cea73d2d87a',
    'sound-off': 'f44840f6-4c75-45de-8268-a4c2a09dff41',
    'settings': '376d77d5-7c12-4685-9e12-6ff61eae12e1',
    'fullscreen': '3f966a98-a1b3-471c-86b2-677070133276',
    'exit-fullscreen': 'f6ac770c-4a21-477b-b7de-bc1f790b8840',
    'play': '081320bc-6572-4124-9738-43b1fb83d34c',
    'how-to-play': 'cb48f0a9-d684-4f4e-86f7-403545fe14c2',
    'continue': 'beb6f4d2-600e-477d-89d0-c41db6893273',
    'restart': 'f62fa638-65a9-42f5-ae9c-e6db51498d72',
}
TARGET.mkdir(parents=True, exist_ok=True)
for name, image_id in FILES.items():
    image = Image.open(SOURCE / f'exec-{image_id}.png')
    assert image.mode == 'RGBA' and image.getchannel('A').getextrema() == (0, 255)
    image.thumbnail((192, 192), Image.Resampling.LANCZOS)
    image.save(TARGET / f'{name}.png', optimize=True)
    print(name, image.size, (TARGET / f'{name}.png').stat().st_size)
