import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {ASSET_CONTRACT,EFFECT_NAMES,PICKUP_RULE,VFX_ALIASES} from './asset-contract.js';
import {AssetBank,assetFrame,effectAssets} from './asset-bank.js';
import {drawEffectsWorld} from './visuals.js';
import {cabinetPlayfield,fitCabinetSize,fitWorldLayout,playfieldUtilization} from './fit-world.js';
import {geometry} from '../forest-training/renderer.js';
import {TunnelSession} from '../gate-one/session.js';
import {TunnelMotion} from '../gate-one/motion.js';
import {WORLDS} from './capacity-model.js';

test('playfield derives from physical rails, independent of legacy arena/cells',()=>{
 for(const [w,h,mobile]of [[1920,1080,false],[1366,768,false],[844,390,true]]){
  const base=geometry(w,h,28,12,true,mobile),a=cabinetPlayfield(base,true),b=cabinetPlayfield({...base,arena:{x:1,y:2,w:3,h:4},scale:7,header:900,cell:123,cols:99,rows:3},true);
  assert.deepEqual(a.playfieldRect,b.playfieldRect);const p=a.playfieldRect;
  assert.ok(Math.abs(p.x-a.frame.x-57*a.scale-a.gutter)<1e-6);assert.ok(Math.abs(p.y-a.frame.y-66*a.scale-a.gutter)<1e-6);
  assert.ok(Math.abs(a.frame.x+a.frame.w-57*a.scale-a.gutter-p.x-p.w)<1e-6);
  assert.ok(Math.abs(a.frame.y+a.frame.h-66*a.scale-a.gutter-p.y-p.h)<1e-6);
  assert.ok(Math.abs(p.w/p.h-2.5)<1e-6);assert.ok(a.cabinet.x>=0&&a.cabinet.y>=0);assert.ok(a.cabinet.y+a.cabinet.h<=h+1e-6);
  assert.deepEqual(a.controlsArena,base.arena);
 }
 const size=fitCabinetSize(1366),base=geometry(size.w,size.h,28,12,false,false),l=cabinetPlayfield(base);
 assert.equal(l.cabinet.y,0);assert.ok(Math.abs(l.cabinet.h-size.h)<1e-6);
});
test('four square-cell worlds fill rect; visible wall envelope exceeds 95% both axes',()=>{
 for(const mobile of [false,true])for(const [width,height]of WORLDS){
  const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});s.world={...s.world,width,height};
  const base=geometry(mobile?844:1920,mobile?390:1080,28,12,true,mobile),l=fitWorldLayout(base,s,{head:{x:10,y:5},alpha:0},true).layout,u=playfieldUtilization(l);
  assert.ok(Math.abs(l.cell-l.field.w/width)<1e-6);assert.ok(Math.abs(l.cell-l.field.h/height)<1e-6);assert.ok(u.width>=.95&&u.height>=.95);assert.ok(Math.abs(u.logicalWidth-1)<1e-6);assert.ok(Math.abs(u.logicalHeight-1)<1e-6);
 }
});
test('nine pickup contracts plus semantic VFX, PNG-only, explicit pending approval',()=>{
 assert.equal(Object.keys(EFFECT_NAMES).length,9);
 for(const kind of Object.keys(EFFECT_NAMES))for(const role of ['field@1x','field-lod','hud','idle']){
  const a=ASSET_CONTRACT[kind+'.'+role];assert.ok(a);assert.equal(a.frames,role==='idle'?4:1);assert.equal(a.status,'awaiting-artwork');
 }
 for(const name of Object.values(VFX_ALIASES))assert.ok(ASSET_CONTRACT['vfx.'+name]);
 for(const key of ['guard-charged','portal-body-trail','harvest-third-burst','spore-burst','spore-trail','mist-puff'])assert.ok(ASSET_CONTRACT['vfx.'+key]);
 for(const a of Object.values(ASSET_CONTRACT)){assert.match(a.url,/\.png$/);assert.equal(a.sheetWidth,a.frames*a.frameWidth);assert.ok(a.content.x+a.content.w<=a.frameWidth);assert.ok(a.content.y+a.content.h<=a.frameHeight);}
});
test('approved PNG cache loads once, rejects bad sheets, no requests for pending',async()=>{
 let calls=0;const load=async()=>{calls++;return {width:64,height:64};},bank=new AssetBank(ASSET_CONTRACT,{'focus.field@1x':true},load);
 await bank.request('rush.field@1x');assert.equal(calls,0);await Promise.all([bank.preload(),bank.request('focus.field@1x')]);assert.equal(calls,1);assert.equal(bank.version,1);
 const bad=new AssetBank(ASSET_CONTRACT,{'focus.idle':true},load);assert.equal(await bad.request('focus.idle'),null);assert.match(bad.errors.get('focus.idle'),/dimensions/);await bad.request('focus.idle');assert.equal(calls,2);
});
test('authored LOD/idle uniform contain fitting and source frames; no procedural calls',async()=>{
 const keys=['focus.field@1x','focus.field-lod','focus.idle'],approval=Object.fromEntries(keys.map(k=>[k,true])),bank=new AssetBank(ASSET_CONTRACT,approval,async url=>{const a=Object.values(ASSET_CONTRACT).find(a=>a.url===url);return {width:a.sheetWidth,height:a.sheetHeight};});await bank.preload();
 const calls=[],ctx={globalAlpha:.5,save(){},restore(){},drawImage(...args){calls.push(args);}};
 assert.ok(bank.drawField(ctx,'focus',100,100,20,60,true));assert.equal(calls[0][0].width,24);const args=calls[0];assert.equal(args[7]/args[3],args[8]/args[4]);assert.equal(args[7],PICKUP_RULE.mobileMin);
 bank.drawField(ctx,'focus',100,100,68,45);assert.equal(calls[1][1],3*64+4);assert.equal(bank.drawField(ctx,'rush',1,1,68),false);
});
test('frame selection is deterministic, pause-stable, loops idle and clamps bursts',()=>{
 const idle=ASSET_CONTRACT['focus.idle'],burst=ASSET_CONTRACT['vfx.spore-burst'];assert.equal(assetFrame(idle,45),3);assert.equal(assetFrame(idle,60),0);assert.equal(assetFrame(burst,900,100),5);assert.equal(assetFrame(burst,100,100),0);
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}}),m=new TunnelMotion(s),h=s.hash();m.freeze(s,.4);const f=m.frame(s);assert.equal(assetFrame(idle,s.tick+f.alpha),assetFrame(idle,s.tick+m.frame(s,.9).alpha));assert.equal(s.hash(),h);
});
test('authored world routing covers all primary effect families without procedural fallback',()=>{
 const previous=effectAssets.ready;effectAssets.ready=new Map(Object.values(ASSET_CONTRACT).map(a=>[a.key,{key:a.key,width:a.sheetWidth,height:a.sheetHeight}]));
 try{
  const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});s.tick=100;
  // Renderer-only fixture, not an illegal stack in live simulation.
  s.effects=Object.keys(EFFECT_NAMES).map(kind=>({kind,started:0,ends:1000}));s.pickups=Object.keys(EFFECT_NAMES).map((kind,i)=>({kind,cell:112*3+i+4}));
  s.spores=[{cell:500,magnetTick:94}];s.director.warnings=[{cell:510,starts:118}];s.world.hazards=[{cell:520}];s.portals=[576,577];s.portalEdges=[{complete:false,move:2}];s.portalRewardMove=2;
  s.feedback=[{kind:'seed',cell:500,tick:98,harvest:true,strong:true,amount:100},{kind:'seed',cell:510,tick:98,spore:true,amount:25},{kind:'guard-used',cell:520,tick:98},{kind:'root-decay',cell:530,tick:98}];
  const route=Array.from({length:8},(_,i)=>({x:15-i,y:5})),frame={head:{x:15,y:5,dx:1,dy:0},route,alpha:.4,viewX:0,viewY:0},drawn=[],ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:k==='drawImage'?(im)=>drawn.push(im.key):()=>{},set:(o,k,v)=>(o[k]=v,true)}),l={arena:{x:0,y:0,w:1920,h:768},field:{x:0,y:0},compact:false},before=s.hash(),feedback=JSON.stringify(s.feedback);
  drawEffectsWorld(ctx,s,frame,c=>({x:c%112*68,y:Math.floor(c/112)*68}),68,{},l);
  for(const key of ['food-corrupted.field@1x','vfx.harvest-third-burst','vfx.focus-wisp','vfx.spore-idle','vfx.spore-trail','vfx.spore-burst','vfx.guard-charged','vfx.guard-plate','vfx.guard-break','vfx.portal-charged-ring','vfx.portal-body-trail','vfx.rush-ember','vfx.rush-thorn','vfx.corruption-particle','vfx.roots-crack','vfx.roots-sprout','vfx.roots-root','vfx.roots-decay','vfx.mist-puff'])assert.ok(drawn.includes(key),key);
  for(const kind of Object.keys(EFFECT_NAMES))assert.ok(drawn.includes(kind+'.idle'));
  assert.equal(s.hash(),before);assert.equal(JSON.stringify(s.feedback),feedback);
 }finally{effectAssets.ready=previous;}
});
test('locked timing/capacity/core/tunnel/V4/mechanics/touch CSS remain byte-identical',()=>{
 const root='arcade/snake-next/';for(const p of ['simulation/timing.js','simulation/step.js','effect-playground/capacity-model.js','gate-one/session.js','gate-one/motion.js','gate-one/ribbon.js','progressive-run/session.js','progressive-run/world.js','progressive-run/food.js','progressive-run/director.js','smooth-v4-proof/ribbon.js','forest-training/ribbon-raster.js','forest-training/ribbon-sprites.js','forest-training/style.css','effect-playground/style.css']){
  assert.equal(readFileSync(root+p,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','e097fe2:'+root+p],{encoding:'utf8'}).replace(/\r\n/g,'\n'),p);
 }
 for(const [file,start,end]of [['art.js','export function paintSprite','export function sprite('],['vfx-art.js','const palette=','export function drawVfx'],['readable-objects.js','','']]){
  const path=root+'effect-playground/'+file,now=readFileSync(path,'utf8').replace(/\r\n/g,'\n'),old=execFileSync('git',['show','e097fe2:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n');
  assert.equal(start?now.split(start)[1].split(end)[0]:now,start?old.split(start)[1].split(end)[0]:old,file+' frozen fallback');
 }
});
