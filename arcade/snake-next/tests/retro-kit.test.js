import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture,selectTiles,direction,sceneLayout,noSpawn} from '../retro-kit/renderer.js';
const inventory=JSON.parse(fs.readFileSync(new URL('../../../grib/mushroom-snake-retro-v2/inventory.json',import.meta.url),'utf8'));
const assets=new Map(inventory.assets.map(a=>[a.id,a]));
test('standalone raster inventory has required families and small decoded budget',()=>{
 assert.equal(assets.size,inventory.assets.length);
 for(const family of ['snake-head','snake-tail'])for(const name of ['up','right','down','left'])assert.ok(assets.has(family+'-'+name));
 for(const id of ['food-magical-seed','pickup-positive','pickup-negative','portal','obstacle-stone','frame-ornament','vfx-atlas','hud-panel'])assert.ok(assets.has(id));
 assert.ok(inventory.assets.reduce((n,a)=>n+a.width*a.height*4,0)<1024*1024);
 assert.equal(inventory.cell,32);assert.equal(inventory.overhang,2);
});
test('all fixtures are connected unique occupied cells; every selected sprite exists',()=>{
 for(const length of [8,22,100,250,500,1200])for(const shape of ['straight','corner','U','S','parallel'])for(let heading=0;heading<4;heading++){
  const cells=fixture(length,shape,heading),tiles=selectTiles(cells);assert.equal(cells.length,length);assert.equal(new Set(cells.map(c=>c.x+','+c.y)).size,length);
  for(let i=1;i<length;i++)assert.doesNotThrow(()=>direction(cells[i-1],cells[i]));
  for(const t of tiles)assert.ok(assets.has(t.key),t.key);
  assert.ok(tiles[0].key.startsWith('snake-head'));assert.ok(tiles.at(-1).key.startsWith('snake-tail'));assert.ok(tiles.at(-2).key.startsWith('snake-taper'));
 }
});
test('opposing selected ports have matching opaque widths including corner taper',()=>{
 for(const shape of ['straight','corner','U','S'])for(let heading=0;heading<4;heading++)for(const length of [8,22]){
  const cells=fixture(length,shape,heading),tiles=selectTiles(cells);
  const port=(t,d)=>{const a=assets.get(t.key),idx=a.ports.map(p=>(p+t.rotation)%4).indexOf(d);assert.ok(idx>=0,t.key+' lacks port '+d);return a.radii[idx];};
  for(let i=1;i<cells.length;i++){const d=direction(cells[i-1],cells[i]);assert.equal(port(tiles[i-1],d),port(tiles[i],(d+2)%4));}
 }
});
test('accent variants depend only on stable identity, not translation or resize',()=>{
 const cells=fixture(100,'parallel'),a=selectTiles(cells),b=selectTiles(cells.map(c=>({...c,x:c.x+9,y:c.y-2})));
 assert.deepEqual(a.map(c=>[c.key,c.rotation]),b.map(c=>[c.key,c.rotation]));
});
test('mobile control safe zone includes hit area plus object extent; desktop has none',()=>{
 const tiles=selectTiles(fixture(22,'S'));
 for(const [w,h]of [[844,390],[915,412]]){const layout=sceneLayout(w,h,tiles,true),r=layout.dpad;const center={x:(r.x+r.w/2-layout.ox)/layout.cell-.5,y:(r.y+r.h/2-layout.oy)/layout.cell-.5};assert.ok(noSpawn(center,layout));assert.ok(!noSpawn({x:layout.cols-3,y:2},layout));}
 assert.ok(!noSpawn({x:0,y:0},sceneLayout(1366,768,tiles,false)));
});
