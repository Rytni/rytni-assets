import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pieces,fixtures,CELL} from './geometry.mjs';
import {selectPieces} from './renderer.js';
import {audit} from './qa.mjs';
const require=createRequire(import.meta.url),{decode}=require('./raster.cjs');
const inventory=JSON.parse(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/inventory.json',import.meta.url)));
const load=file=>decode(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/'+file,import.meta.url)));
test('Geometry module is byte-identical to LOCKED V5.1',()=>{
  const sha=crypto.createHash('sha256').update(fs.readFileSync(new URL('./geometry.mjs',import.meta.url))).digest('hex');
  assert.equal(sha,'6a3fc44525bdc51368823a12dc5be1060cfc752ab258aedf4bbd1c38557abba5');
});
test('Every material variant keeps exact 0/255 locked alpha mask',()=>{
  for(const p of pieces) for(const a of inventory.assets.filter(a=>a.id.startsWith(p.name+'-v'))) {
    const image=load(a.file);assert.equal(image.w,CELL);assert.equal(image.h,CELL);
    for(let i=0;i<CELL*CELL;i++)assert.equal(image.data[i*4+3],p.mask[i]*255,a.id+' pixel '+i);
  }
});
for(const dpr of [1,1.5,2])test('Actual art alpha preserves connectors DPR '+dpr,()=>{
  const masks=new Map(pieces.map(p=>[p.mask,load(p.name+'-v0.png')]));
  const scaler=mask=>{
    const image=masks.get(mask),size=CELL*dpr;
    return Uint8Array.from({length:size*size},(_,i)=>{
      const x=Math.floor((i%size+.5)/dpr),y=Math.floor((Math.floor(i/size)+.5)/dpr);
      return image.data[(y*CELL+x)*4+3]===255?1:0;
    });
  };
  assert.equal(audit(dpr,scaler).pass,true);
});
test('Every anatomy route resolves to an actual asset',()=>{
  const ids=new Set(inventory.assets.map(a=>a.id));
  for(const f of fixtures)for(const p of selectPieces(f.route.slice().reverse().map(([x,y])=>({x,y})),100))assert.ok(ids.has(p.key),p.key);
});
test('Retained body materials keep stable coordinates after movement and growth',()=>{
  const old=Array.from({length:8},(_,i)=>({x:20-i,y:0}));
  const moved=[{x:21,y:0},...old];
  const a=selectPieces(old,10),b=selectPieces(moved,11);
  for(let i=2;i<6;i++)assert.equal(a[i].materialId,b[i+1].materialId);
});
