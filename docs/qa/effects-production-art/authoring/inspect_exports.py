import export as art
from PIL import Image, ImageDraw
out=Image.new('RGB',(9*260,360),'#12392f')
for i,name in enumerate(art.NAMES):
    im=art.field_export(art.QA/'authoring/masters'/f'{name}.png',64,4)
    out.paste(im.resize((256,256),Image.Resampling.NEAREST),(i*260,0),im.resize((256,256),Image.Resampling.NEAREST))
    l=art.lod(name).resize((96,96),Image.Resampling.NEAREST);out.paste(l,(i*260+80,260),l)
    print(name,im.getbbox())
out.save(art.QA/'authoring/export-contact.png')
idle=Image.new('RGB',(512,9*128),'#12392f')
for y,name in enumerate(art.NAMES):
    sheet=Image.open(art.OUT/f'effects/{name}-idle.png')
    idle.paste(sheet.resize((512,128),Image.Resampling.NEAREST),(0,y*128),sheet.resize((512,128),Image.Resampling.NEAREST))
idle.save(art.QA/'authoring/idle-contact.png')
