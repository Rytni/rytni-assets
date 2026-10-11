import test from 'node:test';import assert from 'node:assert/strict';import {AccentMaterial} from './material.js';
test('DEV accents keep >=80% material unchanged with exact alpha for singles and stacks',()=>{
 for(const kinds of [[],['harvest'],['focus'],['spores'],['guard'],['portalPrize'],['rush'],['weak'],['brambles'],['mist'],['focus','guard'],['harvest','rush'],['guard','weak'],['harvest','guard','weak']]){
  const m=new AccentMaterial();m.setSession({tick:20,state:{seed:1},effects:kinds.map(kind=>({kind,started:0,ends:100}))});let changed=0,total=0;
  for(let x=0;x<272;x++)for(let v=-17.5;v<18;v++){const a=new Uint8ClampedArray([241,223,186,255]);m.painter(a,0,5+x/68,v,18,0);if(a[0]!==241||a[1]!==223||a[2]!==186)changed++;assert.equal(a[3],255);total++;}
  assert.ok(changed/total<=.2,kinds+': '+changed/total);const old=m.table.slice();assert.equal(m.setSession({tick:20,state:{seed:1},effects:kinds.map(kind=>({kind,started:0,ends:100}))}),false);assert.deepEqual(m.table,old);
 }
});
test('cap overlays, moss and negative head-distance stay byte-identical; Mist/Roots do not skin',()=>{
 const m=new AccentMaterial();m.setSession({tick:20,state:{seed:1},effects:[{kind:'rush',started:0,ends:100}]});
 for(const color of [[212,63,49,255],[20,59,42,255],[69,106,54,255]]){const a=new Uint8ClampedArray(color);m.painter.overlay(a,0,color);assert.deepEqual([...a],color);m.painter(a,0,-.1,15,18,0);assert.deepEqual([...a],color);}
 for(const kind of ['brambles','mist']){m.setSession({tick:100,state:{seed:kind},effects:[{kind,started:0,ends:200}]});const a=new Uint8ClampedArray([241,223,186,255]);m.painter(a,0,1,15,18,0);assert.deepEqual([...a],[241,223,186,255]);}
});
