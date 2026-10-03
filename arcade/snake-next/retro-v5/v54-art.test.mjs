import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {palette} from './paint-snake-v54.mjs';
const {decode}=createRequire(import.meta.url)('./raster.cjs');
const root=fileURLToPath(new URL('../../../',import.meta.url));
const inventory=JSON.parse(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/inventory.json',import.meta.url)));
const load=id=>decode(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/'+id+'.png',import.meta.url)));
const green=new Set(['25452d','456a36','638844','8ea458','aabb72']);
const hex=image=>Array.from({length:image.w*image.h},(_,i)=>image.data[i*4+3]?image.data.subarray(i*4,i*4+3).toString('hex'):null);
test('132 Snake variants share one hand-authored palette and unchanged geometry',()=>{
  const allowed=new Set(Object.values(palette));
  const snake=inventory.assets.filter(a=>/^(head|neck|straight|corner|terminal)-/.test(a.id));assert.equal(snake.length,132);
  for(const a of snake)for(const c of hex(load(a.id)))if(c)assert.ok(allowed.has(c),a.id+': '+c);
  assert.equal(inventory.imageGenOperations,0);assert.equal(inventory.maskMismatch,0);
});
test('Meaningful authored foliage replaces V5.3 specks',()=>{
  for(const id of ['straight-0-v5','straight-0-v6']){
    const before=decode(execFileSync('git',['show','ebc38bf7250ddcc57f6ef737642c8921c5b0834a:grib/mushroom-snake-retro-v5/'+id+'.png'],{cwd:root}));
    const oldGreens=new Set(['2b4934','456644','74915b','94a66a']);
    const count=hex(load(id)).filter(c=>green.has(c)).length,old=hex(before).filter(c=>oldGreens.has(c)).length;
    assert.ok(count>=60,id+' foliage pixels '+count);assert.ok(count>=old*1.5,id+' vs '+old);
  }
});
test('Mobile nearest-neighbor head retains cap and expression pixels',()=>{
  const head=load('head-0-v0'),size=31;
  const pixels=Array.from({length:size*size},(_,i)=>{
    const x=Math.floor((i%size+.5)*68/size),y=Math.floor((Math.floor(i/size)+.5)*68/size);
    return head.data.subarray((y*68+x)*4,(y*68+x)*4+3).toString('hex');
  });
  assert.ok(pixels.filter(c=>[palette.cap,palette.capDark,palette.capLight].includes(c)).length>=16);
  assert.ok(pixels.filter(c=>[palette.eye,palette.pupil].includes(c)).length>=12);
});
