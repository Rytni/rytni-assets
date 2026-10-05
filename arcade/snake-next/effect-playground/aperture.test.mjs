import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {cabinetPlayfield,fitWorldLayout} from './fit-world.js';
import {apertureEdgeGaps} from './aperture-qa.js';
import {drawEnvironment} from '../gate-one/environment.js';
import {geometry} from '../forest-training/renderer.js';
import {TunnelSession} from '../gate-one/session.js';
import {TunnelMotion} from '../gate-one/motion.js';

function raster(w,h,a,scale=1){
 const image={width:Math.ceil(w*scale),height:Math.ceil(h*scale),data:new Uint8ClampedArray(Math.ceil(w*scale)*Math.ceil(h*scale)*4)},stack=[];let m=[0,0,1,1],alpha=1;
 const ctx={save(){stack.push([m.slice(),alpha]);},restore(){[m,alpha]=stack.pop();},translate(x,y){m[0]+=x*m[2];m[1]+=y*m[3];},scale(x,y){m[2]*=x;m[3]*=y;},set fillStyle(v){},set globalAlpha(v){alpha=v;},get globalAlpha(){return alpha;},fillRect(x,y,w,h){
  if(alpha<=0)return;const l=Math.max(a.x,m[0]+x*m[2]),t=Math.max(a.y,m[1]+y*m[3]),r=Math.min(a.x+a.w,m[0]+(x+w)*m[2]),b=Math.min(a.y+a.h,m[1]+(y+h)*m[3]);if(r<=l||b<=t)return;
  for(let py=Math.max(0,Math.floor(t*scale));py<Math.min(image.height,Math.ceil(b*scale));py++)for(let px=Math.max(0,Math.floor(l*scale));px<Math.min(image.width,Math.ceil(r*scale));px++)image.data[(py*image.width+px)*4+3]=255;
 }};return {ctx,image};
}
test('validator rejects real double insets, empty render, missing side, and a deceptive full bbox',()=>{
 const a={x:10,y:10,w:80,h:40},r=raster(100,60,a);r.ctx.fillRect(18,18,64,24);let q=apertureEdgeGaps(r.image,a);assert.equal(q.gapLeft,8);assert.equal(q.gapRight,8);assert.equal(q.gapTop,8);assert.equal(q.gapBottom,8);assert.equal(q.pass,false);
 const e=raster(100,60,a);assert.equal(apertureEdgeGaps(e.image,a).pass,false);
 // Bounding box alone says full aperture. Middle of left edge is still absent.
 const p=raster(100,60,a);p.ctx.fillRect(10,10,80,3);p.ctx.fillRect(10,47,80,3);p.ctx.fillRect(87,10,3,40);q=apertureEdgeGaps(p.image,a);assert.deepEqual(q.inkBounds,{x:10,y:10,right:90,bottom:50,w:80,h:40});assert.equal(q.gapLeft,77);assert.equal(q.pass,false);
});
test('2px raster tolerance is an actual edge distance, not an inset percentage',()=>{
 for(const dpr of [1,1.5,2]){const a={x:10,y:10,w:80,h:40},r=raster(100,60,a,dpr);r.ctx.fillRect(11,11,78,38);const q=apertureEdgeGaps(r.image,a,dpr);assert.ok(q.pass);assert.ok(q.gapLeft<=1&&q.gapRight<=1&&q.gapTop<=1&&q.gapBottom<=1);}
});
test('aperture leaves original wood/HUD/cabinet/controls geometry exactly intact',async()=>{
 const p='arcade/snake-next/effect-playground/fit-world.js',source=execFileSync('git',['show','310faf0:'+p],{encoding:'utf8'}),old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const [w,h,mobile]of [[1920,1080,false],[1366,768,false],[844,390,true]]){const base=geometry(w,h,28,12,true,mobile),a=cabinetPlayfield(base,true),b=old.cabinetPlayfield(base,true);for(const key of ['frame','hud','cabinet','controlsArena'])assert.deepEqual(a[key],b[key],key);assert.equal(a.gutter,0);assert.deepEqual(a.arena,a.cabinetAperture);}
});
test('all four worlds/all biomes touch aperture; square grid, DPR 1/1.5/2, no hash write',()=>{
 for(const [w,h,mobile]of [[1920,1080,false],[1366,768,false],[844,390,true]])for(const [width,height]of [[30,12],[40,16],[50,20],[60,24]])for(const biome of ['forest','caves','swamp']){
  const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});s.world={...s.world,width,height,biome};const f={head:{x:10,y:5},alpha:0},before=s.hash(),{layout:l,view}=fitWorldLayout(geometry(w,h,28,12,true,mobile),s,f,true);
  assert.ok(Math.abs(l.playableGrid.w/(width-2)-l.playableGrid.h/(height-2))<1e-8);
  for(const dpr of [1,1.5,2]){const r=raster(w,h,l.cabinetAperture,dpr);drawEnvironment(r.ctx,s,view,l,f,false);const q=apertureEdgeGaps(r.image,l.cabinetAperture,dpr);assert.ok(q.pass,JSON.stringify({w,width,biome,dpr,...q}));}
  assert.equal(s.hash(),before);
 }
});
test('fit expansion remains active-time/read-only; pause/resume keeps same aperture and scale',()=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}}),m=new TunnelMotion(s),base=geometry(1366,768,28,12,true,false);s.forceExpansion();s.advance();m.capture(s);const alpha=m.freeze(s,.4),hash=s.hash(),a=fitWorldLayout(base,s,m.frame(s),true);assert.deepEqual(a,fitWorldLayout(base,s,m.frame(s,.9),true));m.resume();assert.equal(m.frame(s,.4).alpha,alpha);assert.equal(s.hash(),hash);
});
test('effect art, native wall painter, frame/floor, mechanics, scheduler, V4, objects and portals stay locked',()=>{
 // drawFrame source-padding trim is covered separately by visible-seam.test.
 const root='arcade/snake-next/';for(const file of ['effect-playground/art.js','effect-playground/vfx-art.js','effect-playground/visuals.js','effect-playground/asset-bank.js','effect-playground/asset-contract.js','effect-playground/asset-approvals.js','effect-playground/readable-objects.js','effect-playground/capacity-model.js','effect-playground/style.css','forest-training/board.js','forest-training/objects.js','forest-training/ribbon-raster.js','forest-training/ribbon-sprites.js','smooth-v4-proof/ribbon.js','simulation/step.js','simulation/timing.js','input/turns.js','gate-one/session.js','gate-one/motion.js','gate-one/ribbon.js','progressive-run/session.js','progressive-run/world.js','progressive-run/director.js','progressive-run/food.js']){
  const p=root+file;assert.equal(readFileSync(p,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','310faf0:'+p],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
 }
 const p=root+'gate-one/environment.js',now=readFileSync(p,'utf8').replace(/\r\n/g,'\n'),old=execFileSync('git',['show','310faf0:'+p],{encoding:'utf8'}).replace(/\r\n/g,'\n');assert.equal(now.split('function wallCell')[1].split('function borderCells')[0],old.split('function wallCell')[1].split('function borderCells')[0]);assert.equal(now.split(' if(opening&&p<1){')[1],old.split(' if(opening&&p<1){')[1]);
});
