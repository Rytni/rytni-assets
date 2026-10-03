import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {OBJECTS,objectRect,drawObject,foodKey,foodBob,drawFoodFeedback,FOOD_POP_SECONDS} from './objects.js';
import {Session} from './session.js';
const {decode,bounds}=createRequire(import.meta.url)('../retro-v5/raster.cjs');
const image=key=>{const dir=key.startsWith('food-')?'mushroom-snake-forest-food':'mushroom-snake-retro-v5',r=decode(fs.readFileSync(new URL(`../../../grib/${dir}/${key}.png`,import.meta.url)));return {...r,width:r.w,height:r.h};};
test('all game objects have tight source bounds and equal X/Y scaling at desktop/mobile, DPR 1/1.5/2',()=>{
 for(const key of Object.keys(OBJECTS)){
  const im=image(key);assert.deepEqual(bounds(im),[0,0,im.w,im.h],key);
  for(const cell of [68,66.46538461538461,47.0706,30.028666])for(const dpr of [1,1.5,2]){
   const r=objectRect(im,key,100.4,122.8,cell);assert.ok(Math.abs(r.w/im.width-r.h/im.height)<1e-12,key);assert.ok(r.w<=cell+1e-9&&r.h<=cell+1e-9,key);assert.ok(Math.abs(r.w*dpr/(im.width*dpr)-r.h*dpr/(im.height*dpr))<1e-12);
   const calls=[];drawObject({drawImage:(...args)=>calls.push(args)},{images:new Map([[key,im]])},key,100.4,122.8,cell);assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1),[r.x,r.y,r.w,r.h]);
  }
 }
});
test('golden variant keeps identical mushroom alpha; food is 70% max cell extent',()=>{
 const red=image('food-red'),gold=image('food-gold');assert.equal(red.w,gold.w);assert.equal(red.h,gold.h);for(let k=3;k<red.data.length;k+=4)assert.equal(red.data[k],gold.data[k]);
 assert.equal(OBJECTS['food-red'].visualScale,.7);assert.equal(OBJECTS['food-gold'].visualScale,.7);
 assert.equal(foodKey([],0),'food-red');assert.equal(foodKey([{kind:'focus',ends:100}],0),'food-red');assert.equal(foodKey([{kind:'harvest',ends:100}],99),'food-gold');assert.equal(foodKey([{kind:'harvest',ends:100}],100),'food-red');
});
test('mushroom idle bob stays at 1–2px and never changes scale',()=>{
 for(let t=0;t<1200;t++){assert.ok(Math.abs(foodBob(t,68))<=2);assert.ok(Math.abs(foodBob(t,30))<=1);}
 assert.equal(foodBob(0,68),0);
});
test('food pickup rendering ends at 300ms; score uses actual event amount',()=>{
 assert.ok(FOOD_POP_SECONDS<.35);const im=image('food-pop'),art={objects:{images:new Map([['food-pop',im]])},images:new Map()},calls=[],ctx={drawImage:(...a)=>calls.push(a),fillRect:(...a)=>calls.push(a)};
 drawFoodFeedback(ctx,art,{amount:200},.1,{x:10,y:10},30);assert.ok(calls.length);calls.length=0;drawFoodFeedback(ctx,art,{amount:200},.30,{x:10,y:10},30);assert.equal(calls.length,0);
});
test('normal mushroom remains one atomic food; Harvest still exactly doubles award without changing growth/spawn',()=>{
 const normal=new Session(),gold=new Session();gold.collect('harvest',100);
 for(let t=0;t<200&&!normal.foods;t++){normal.advance();gold.advance();}
 assert.equal(normal.foods,1);assert.equal(gold.foods,1);assert.equal(gold.score,normal.score*2);assert.equal(normal.state.length,9);assert.equal(gold.state.length,9);assert.equal(normal.state.food,gold.state.food);
});
