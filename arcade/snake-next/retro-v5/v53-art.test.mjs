import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {variant} from './material.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const baseline='e17dffae848f0ab7c97c21bd3fae28f21e2624a3';
const prior=file=>execFileSync('git',['show',baseline+':'+file],{cwd:root});
const inventory=JSON.parse(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/inventory.json',import.meta.url)));
const {decode}=createRequire(import.meta.url)('./raster.cjs');
test('All 33 non-Snake assets are byte-identical to V5.2',()=>{
  const unchanged=inventory.assets.filter(a=>! /^(head|neck|straight|corner|terminal)-/.test(a.id));
  assert.equal(unchanged.length,33);
  for(const a of unchanged){const file='grib/mushroom-snake-retro-v5/'+a.file;assert.deepEqual(fs.readFileSync(new URL('../../../'+file,import.meta.url)),prior(file),file);}
});
test('Geometry / renderer / simulation remain byte-identical to V5.2',()=>{
  for(const file of ['arcade/snake-next/retro-v5/geometry.mjs','arcade/snake-next/retro-v5/renderer.js','arcade/snake-next/retro-v5/runtime.js','arcade/snake-next/entry.js']){
    assert.deepEqual(fs.readFileSync(new URL('../../../'+file,import.meta.url)),prior(file),file);
  }
});
test('Stable moss islands have no fixed cadence, at least 3 cell spacing and clean majority',()=>{
  const anchors=[];
  for(let id=-4000;id<4000;id++)if(variant(id)>=5)anchors.push(id);
  assert.ok(anchors.length/8000>.15&&anchors.length/8000<.25);
  const intervals=anchors.slice(1).map((id,i)=>id-anchors[i]);
  assert.ok(Math.min(...intervals)>=3);assert.ok(new Set(intervals).size>5);
  assert.ok(anchors.filter(id=>variant(id)===7).length/8000<.01);
});
test('Straight material has discrete multitone depth in grayscale, not solid ivory',()=>{
  const image=decode(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v5/straight-0-v0.png',import.meta.url)));
  const colors=new Set(),values=[];
  for(let i=0;i<image.w*image.h;i++)if(image.data[i*4+3]){
    const [r,g,b]=image.data.subarray(i*4,i*4+3);colors.add([r,g,b].join(','));values.push(.2126*r+.7152*g+.0722*b);
  }
  assert.ok(colors.size>=8);assert.ok(Math.max(...values)-Math.min(...values)>100);
});
