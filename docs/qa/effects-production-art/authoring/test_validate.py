"""Targeted validator fault tests in throwaway fixtures, never live assets."""
import unittest, tempfile, shutil, contextlib, io
from pathlib import Path
from PIL import Image
import export as art
import validate

class ValidatorGate(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.original=(art.OUT,art.QA)
        folder=Path(self.temp.name);shutil.copytree(art.OUT,folder/'assets')
        art.OUT=folder/'assets';art.QA=folder
    def tearDown(self):
        art.OUT,art.QA=self.original;self.temp.cleanup()
    def run_gate(self):
        with contextlib.redirect_stdout(io.StringIO()):validate.main()
    def edit(self,path,change):
        f=art.OUT/path
        with Image.open(f) as source:im=source.copy()
        im=change(im);im.save(f)
    def test_delivery_passes(self):self.run_gate()
    def test_wrong_dimensions_rejected(self):
        self.edit('effects/focus-field.png',lambda im:im.resize((63,64)))
        with self.assertRaises(AssertionError):self.run_gate()
    def test_opaque_background_rejected(self):
        def opaque(im):im.putalpha(255);return im
        self.edit('effects/focus-field.png',opaque)
        with self.assertRaises(AssertionError):self.run_gate()
    def test_outside_content_rejected(self):
        def outside(im):im.putpixel((1,32),(255,255,255,255));return im
        self.edit('effects/focus-field.png',outside)
        with self.assertRaises(AssertionError):self.run_gate()
    def test_duplicate_idle_rejected(self):
        def duplicate(im):im.paste(im.crop((0,0,64,64)),(64,0));return im
        self.edit('effects/focus-idle.png',duplicate)
        with self.assertRaises(AssertionError):self.run_gate()
    def test_translated_whole_sprite_rejected(self):
        def drift(im):
            f=im.crop((64,0,128,64));shift=Image.new('RGBA',(64,64));shift.paste(f,(0,3));im.paste(shift,(64,0));return im
        self.edit('effects/focus-idle.png',drift)
        with self.assertRaises(AssertionError):self.run_gate()

if __name__=='__main__':unittest.main()
