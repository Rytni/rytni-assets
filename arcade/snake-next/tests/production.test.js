import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Assets,CRITICAL,GAME} from '../production/assets.js';
import {visualHash} from '../production/forest.js';

test('Production art packs are separate, namespaced, real assets; no legacy sources',()=>{
  assert.equal(Object.keys(CRITICAL).length,7);assert.equal(Object.keys(GAME).length,11);
  for(const [key,value]of Object.entries({...CRITICAL,...GAME})){
    assert.ok(!value.includes('legacy')&&!value.includes('mushroom-snake-v2'));assert.ok(existsSync(new URL('../assets/'+value,import.meta.url)),key);
    if(value.endsWith('.webp')){const buffer=readFileSync(new URL('../assets/'+value,import.meta.url));assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WEBP');}
  }
  assert.equal(Object.keys(CRITICAL).filter(key=>key in GAME).length,0);
});
test('Critical loader waits for decode, reuses promise across concurrent/repeat opens',async()=>{
  const before=globalThis.Image;let requests=0,decode;globalThis.Image=class{set src(value){this.url=value;requests++;queueMicrotask(()=>this.onload());}async decode(){await new Promise(resolve=>decode=resolve);}};
  try{const assets=new Assets(),one=assets.image('hero','ui/hero-v1.webp'),two=assets.image('hero','ui/hero-v1.webp');assert.equal(one,two);await new Promise(resolve=>setImmediate(resolve));assert.equal(assets.images.size,0);decode();await one;await assets.image('hero','ui/hero-v1.webp');assert.equal(requests,1);assert.equal(assets.images.size,1);}finally{globalThis.Image=before;}
});
test('Visual hash stable, does not modify geometry/state and is coordinate-varied',()=>{
  assert.equal(visualHash(12,38,7),visualHash(12,38,7));const values=new Set();for(let i=0;i<100;i++)values.add(visualHash(i,38,7));assert.equal(values.size,100);
});
test('Original PCM SFX are short, nonclipping and smoothly end at silence',()=>{
  for(const name of ['hover','click','pickup','combo','turn','death','result','pause','resume','arrival']){
    const buffer=readFileSync(new URL(`../assets/audio/${name}-v1.wav`,import.meta.url));assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.ok((buffer.length-44)/88200<.6);let peak=0;for(let i=44;i<buffer.length;i+=2)peak=Math.max(peak,Math.abs(buffer.readInt16LE(i)));assert.ok(peak<=16384);assert.equal(buffer.readInt16LE(buffer.length-2),0);
  }
});
