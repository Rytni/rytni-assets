import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ASSET_CONTRACT} from './asset-contract.js';
import {APPROVED_ASSETS} from './asset-approvals.js';
import {DEV_VFX_CANDIDATES} from './vfx-candidates.js';
import {AssetBank,assetFrame,effectAssets} from './asset-bank.js';
import {focusPositions,foodSquash,rootWarningPhase} from './vfx-presentation.js';
import {capSquash,drawWithFoodReaction} from './food-reaction.js';
import {drawEffectsWorld} from './visuals.js';
import {TunnelSession} from '../gate-one/session.js';
import {TunnelMotion} from '../gate-one/motion.js';

test('19 exact candidate sheets; final human approvals stay pickup-only',()=>{
 const keys=Object.keys(DEV_VFX_CANDIDATES);assert.equal(keys.length,19);assert.equal(Object.keys(APPROVED_ASSETS).length,40);
 assert.deepEqual(keys.sort(),Object.keys(ASSET_CONTRACT).filter(k=>k.startsWith('vfx.')).sort());
 for(const key of keys){const a=ASSET_CONTRACT[key],bytes=readFileSync('.'+a.url);assert.equal(bytes[25],6);assert.equal(bytes.readUInt32BE(16),a.sheetWidth);assert.equal(bytes.readUInt32BE(20),a.sheetHeight);assert.deepEqual(a.anchor,{x:a.frameWidth/2,y:a.frameHeight/2});assert.equal(APPROVED_ASSETS[key],undefined);}
});
test('DEV admission caches all 59 once; default bank still refuses candidates',async()=>{
 const calls=[],load=async url=>{calls.push(url);const a=Object.values(ASSET_CONTRACT).find(a=>a.url===url);return {width:a.sheetWidth,height:a.sheetHeight};};
 const ordinary=new AssetBank(ASSET_CONTRACT,APPROVED_ASSETS,load);assert.equal(await ordinary.request('vfx.focus-wisp'),null);assert.equal(calls.length,0);
 const dev=new AssetBank(ASSET_CONTRACT,{...APPROVED_ASSETS,...DEV_VFX_CANDIDATES},load);await dev.preload();await dev.preload();assert.equal(calls.length,59);assert.equal(dev.errors.size,0);
});
test('frame cadence + event origin + pause invariant, all 19 sheets',()=>{
 for(const key of Object.keys(DEV_VFX_CANDIDATES)){const a=ASSET_CONTRACT[key];for(const fps of [60,90,120,144])for(let tick=0;tick<180;tick++){
  const expected=a.loop?Math.floor(tick/a.ticks)%a.frames:Math.min(a.frames-1,Math.floor(tick/a.ticks));
  for(let j=0;j<Math.ceil(fps/60);j++)assert.equal(assetFrame(a,100+tick,100),expected);
 }assert.equal(assetFrame(a,104,100),assetFrame(a,104,100));}
});
test('exactly three non-circular front wisps, four directions; phased root warning',()=>{
 for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]])for(let tick=0;tick<180;tick++){
  const p=focusPositions({x:0,y:0,dx,dy},68,tick);assert.equal(p.length,3);assert.ok(p.every(q=>Math.hypot(q.x,q.y)<1.5*68));assert.ok(p.every(q=>q.x*dx+q.y*dy<0));assert.ok(p.every(q=>Math.hypot(q.x,q.y)>20));
 }
 assert.equal(rootWarningPhase(60,120).sprout,false);assert.equal(rootWarningPhase(84,120).sprout,true);assert.equal(rootWarningPhase(119,120).sprout,true);
});
test('food reactions bounded and expire; no change on ordinary straight drawing',()=>{
 for(let a=0;a<21;a+=.25){assert.ok(foodSquash(a)>=.77);assert.ok(capSquash(a)>=.965&&capSquash(a)<=1);}
 assert.equal(foodSquash(5),1);assert.equal(capSquash(18),1);let calls=0;const ctx={};drawWithFoodReaction(ctx,{feedback:[],tick:0},{alpha:.4},68,{}, {},c=>{assert.equal(c,ctx);calls++;});assert.equal(calls,1);
});
test('world rendering read-only, pause-stable, expired one-shots absent, restart clean',()=>{
 const previous=effectAssets.ready;effectAssets.ready=new Map(Object.values(ASSET_CONTRACT).map(a=>[a.key,{key:a.key,width:a.sheetWidth,height:a.sheetHeight}]));
 try{
  const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});s.tick=100;s.effects=[{kind:'focus',ends:900},{kind:'guard',ends:900},{kind:'rush',ends:900}];s.state.food=-1;
  s.spores=[{cell:500,magnetTick:94}];s.director.warnings=[{cell:510,starts:118}];s.world.hazards=[{cell:520}];s.portals=[576,577];s.portalEdges=[{complete:false,move:2}];s.portalRewardMove=2;
  s.feedback=[{kind:'seed',cell:500,tick:98,harvest:true,strong:true,amount:100},{kind:'seed',cell:510,tick:98,spore:true,amount:25},{kind:'guard-used',cell:520,tick:98},{kind:'root-decay',cell:530,tick:98}];
  const m=new TunnelMotion(s);m.freeze(s,.4);const frame={head:{x:15,y:5,dx:1,dy:0},route:Array.from({length:8},(_,i)=>({x:15-i,y:5})),start:0,end:6,alpha:.4,viewX:0,viewY:0},draws=[],ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:k==='drawImage'?(im,...a)=>draws.push([im.key,...a]):()=>{},set:(o,k,v)=>(o[k]=v,true)}),l={arena:{x:0,y:0,w:1920,h:768},field:{x:0,y:0},compact:false},before=s.hash(),fx=JSON.stringify(s.feedback);
  const render=()=>drawEffectsWorld(ctx,s,frame,c=>({x:c%112*68,y:Math.floor(c/112)*68}),68,{},l);
  render();assert.equal(s.hash(),before);assert.equal(JSON.stringify(s.feedback),fx);const frozen=JSON.stringify(draws);draws.length=0;render();assert.equal(JSON.stringify(draws),frozen);
  assert.equal(draws.filter(d=>d[0]==='vfx.focus-wisp').length,3);
  s.feedback=s.feedback.map(f=>({...f,tick:50}));draws.length=0;render();assert.ok(!draws.some(d=>['vfx.harvest-third-burst','vfx.spore-burst','vfx.guard-break','vfx.roots-decay'].includes(d[0])));
  const fresh=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});assert.deepEqual(fresh.feedback,[]);assert.deepEqual(fresh.spores,[]);
 }finally{effectAssets.ready=previous;}
});
test('all locked mechanics, renderer geometry, pickup/food pixels stay byte-identical',()=>{
 const paths=['asset-contract.js','asset-approvals.js','capacity-model.js','style.css'].map(p=>'arcade/snake-next/effect-playground/'+p);
 // Root lifecycle and terminal cleanup are authorized by the behavior review;
 // behavior.test.mjs separately locks every unrelated Director/session section.
 paths.push(...['simulation/step.js','simulation/timing.js','gate-one/session.js','gate-one/motion.js','gate-one/ribbon.js','progressive-run/food.js','progressive-run/world.js','forest-training/ribbon-raster.js','forest-training/ribbon-sprites.js','smooth-v4-proof/ribbon.js','forest-training/style.css'].map(p=>'arcade/snake-next/'+p));
 for(const a of Object.values(ASSET_CONTRACT).filter(a=>!a.key.startsWith('vfx.')))paths.push(a.url.slice(1));
 for(const p of paths)assert.deepEqual(readFileSync(p),execFileSync('git',['show','9a99036:'+p]),p);
 for(const p of ['vfx-presentation.js','food-reaction.js','vfx-candidates.js'])assert.doesNotMatch(readFileSync('arcade/snake-next/effect-playground/'+p,'utf8'),/Date\.now|requestAnimationFrame|setInterval|setTimeout|Math\.random/);
});
