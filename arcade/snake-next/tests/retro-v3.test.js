import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {selectTiles,fixture,targetFixture,direction} from '../retro-v3/renderer.js';
const require=createRequire(import.meta.url),{decode}=require('../retro-v3/raster.cjs');
const root=new URL('../../../grib/mushroom-snake-retro-v3/',import.meta.url),inventory=JSON.parse(fs.readFileSync(new URL('inventory.json',root)));
test('V3 is a new independently generated kit; no target or V2 art input',()=>{
 assert.equal(inventory.version,3);assert.equal(inventory.provenance.length,14);
 for(const source of inventory.provenance)assert.match(source.method,/independent generation/);
 const builder=fs.readFileSync(new URL('../retro-v3/build-assets.cjs',import.meta.url),'utf8');
 assert.doesNotMatch(builder,/readFileSync\([^\n]*(?:Desktop|retro-v2|target-)/);
});
test('every asset exists, decodes and has unique id',()=>{
 assert.equal(new Set(inventory.assets.map(a=>a.id)).size,inventory.assets.length);
 for(const a of inventory.assets){const img=decode(fs.readFileSync(new URL(a.file,root)));assert.equal(img.w,a.width,a.id);assert.equal(img.h,a.height,a.id);}
});
test('all four directions have matching head and terminal replacement',()=>{
 for(let d=0;d<4;d++){const tiles=selectTiles(fixture(8,'straight',d));assert.equal(tiles[0].key,'snake-head-'+['up','right','down','left'][d]);assert.match(tiles.at(-1).key,/^snake-tail-/);assert.match(tiles.at(-2).key,/^snake-taper-/);}
});
test('straight, 90, U and S use only canonical neighboring cells',()=>{
 for(const shape of ['straight','90','U','S','parallel'])for(const d of [0,1,2,3])for(const n of [8,30,100,250,500,1200]){
  const cells=fixture(n,shape,d),tiles=selectTiles(cells);assert.equal(cells.length,n);
  for(let i=1;i<n;i++)assert.doesNotThrow(()=>direction(cells[i-1],cells[i]));
  for(const t of tiles)assert.ok(inventory.assets.some(a=>a.id===t.key),t.key);
  assert.equal(new Set(cells.map(c=>`${c.x}:${c.y}`)).size,n);
 }
});
test('stable material selection survives camera/position changes',()=>{
 const cells=fixture(30,'S'),keys=selectTiles(cells).map(t=>t.key);
 assert.deepEqual(selectTiles(cells.map(c=>({...c,x:c.x+17,y:c.y-9}))).map(t=>t.key),keys);
});
test('target fixture matches compact larger-cell arena; stationary proof',()=>{
 for(const mobile of [false,true]){const cells=targetFixture(mobile);assert.equal(cells.length,mobile?20:22);assert.ok(Math.max(...cells.map(c=>c.x))<26);assert.ok(Math.max(...cells.map(c=>c.y))<(mobile?10:12));if(mobile)assert.ok(cells.at(-1).x>=7,'Tail clear of D-pad region');}
 const renderer=fs.readFileSync(new URL('../retro-v3/renderer.js',import.meta.url),'utf8');
 assert.doesNotMatch(renderer,/from.*(?:simulation|runtime|entry|snake-controller|retro-kit)/);assert.doesNotMatch(renderer,/interpolat|shadowBlur|ctx\.filter\s*=\s*['"]blur/);
});
test('short terminal point; no full body under terminal tip',()=>{
 const tail=decode(fs.readFileSync(new URL('snake-tail-right.png',root)));let xMax=0;
 for(let y=0;y<tail.h;y++)for(let x=0;x<tail.w;x++)if(tail.data[(y*tail.w+x)*4+3])xMax=Math.max(xMax,x);
 assert.ok(xMax<=52);assert.equal(selectTiles(fixture(8)).filter(t=>/^snake-tail-/.test(t.key)).length,1);
});
test('animation grammar uses different authored bounded sequences',()=>{
 const rows=inventory.assets.filter(a=>a.group==='vfx');assert.equal(rows.length,5);
 for(const a of rows){assert.equal(a.frames,6);assert.ok(a.durationMs<=420);assert.equal(a.width,576);assert.equal(a.height,96);}
});
