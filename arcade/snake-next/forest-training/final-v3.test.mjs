import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {boardVariant} from './board.js';
const {decode}=createRequire(import.meta.url)('../retro-v5/raster.cjs');
const load=(dir,name)=>decode(fs.readFileSync(new URL(`../../../grib/${dir}/${name}.png`,import.meta.url)));
test('six V3 tiles preserve all V2 outer seam pixels and 68px dimensions',()=>{
 const original=load('mushroom-snake-forest-cabinet-v2','tile-0');
 for(let n=0;n<6;n++){const r=load('mushroom-snake-forest-final-v3','tile-'+n);assert.equal(r.w,68);assert.equal(r.h,68);
  for(let y=0;y<68;y++)for(let x=0;x<68;x++)if(x<2||y<2||x>=66||y>=66){const k=(y*68+x)*4;assert.deepEqual(r.data.subarray(k,k+4),original.data.subarray(k,k+4));}
 }
});
test('V3 top internal bevel uses exactly 70% old edge-to-center delta',()=>{
 const centers=['0b4238','0b4238','093e35','0d463b','0b4238','0b4238'],edge=[27,88,72];
 for(let n=0;n<6;n++){const r=load('mushroom-snake-forest-final-v3','tile-'+n),k=(2*68+20)*4;
  for(let c=0;c<3;c++){const base=parseInt(centers[n].slice(c*2,c*2+2),16);assert.equal(r.data[k+c],Math.round(base+(edge[c]-base)*.7));}
 }
});
test('surface selection is stable with rare 1% patina/wear, not a 2x2 repeat',()=>{
 const counts=Array(6).fill(0);let repeats=0;
 for(let y=0;y<100;y++)for(let x=0;x<100;x++){const n=boardVariant(x,y);assert.equal(boardVariant(x,y),n);counts[n]++;if(n===boardVariant(x+2,y))repeats++;}
 for(const n of [4,5])assert.ok(counts[n]>65&&counts[n]<135,JSON.stringify(counts));assert.ok(repeats<4000);
});
test('D-pad retains exact alpha, 44px footprint; glyph canvases remain 32px',()=>{
 for(const state of ['normal','pressed']){const a=load('mushroom-snake-retro-v5','dpad-'+state),b=load('mushroom-snake-forest-final-v3','dpad-'+state);assert.equal(b.w,a.w);assert.equal(b.h,a.h);for(let k=3;k<a.data.length;k+=4)assert.equal(a.data[k],b.data[k]);}
 for(const name of ['pause','fullscreen']){const r=load('mushroom-snake-forest-final-v3',name);assert.equal(r.w,32);assert.equal(r.h,32);}
});
