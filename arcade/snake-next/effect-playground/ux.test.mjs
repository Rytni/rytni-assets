import test from 'node:test';
import {withoutTimingAdditions} from '../tests/timing-lock.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {geometry} from '../forest-training/renderer.js';
import {fitWorldLayout,readability} from './fit-world.js';
import {paintVfx,VFX_KINDS} from './vfx-art.js';
import {TunnelSession} from '../gate-one/session.js';
import {TunnelMotion} from '../gate-one/motion.js';
const base=geometry(1882,1000,28,12,false,false),frame={head:{x:15,y:6},alpha:0};
test('all six FIT WORLD dimensions fit uniformly; head/direction never moves viewport',()=>{
 for(const [width,height]of [[28,12],[36,18],[48,24],[64,32],[80,40],[112,56]]){
  const s={world:{width,height},tick:0,state:{cadence:14,movePhase:0}},a=fitWorldLayout(base,s,frame),b=fitWorldLayout(base,s,{...frame,head:{x:width-2,y:height-2,dx:0,dy:1}}),l=a.layout;
  assert.deepEqual(a.layout,b.layout);assert.equal(a.view.x,0);assert.equal(a.view.y,0);assert.ok(l.playableGrid.w<=l.cabinetAperture.w+1e-7);assert.ok(l.playableGrid.h<=l.cabinetAperture.h+1e-7);assert.ok(Math.abs(l.field.w/width-l.field.h/height)<1e-9);assert.equal(readability(l.cell).body,l.cell*36/68);
 }
});
test('expansion starts at old fit, interpolates for one active second, freezes and resets atomically',()=>{
 const s={world:{width:36,height:18},tick:100,state:{cadence:14,movePhase:0},openings:[{tick:100,duration:60,from:{width:28,height:12}}]},old=fitWorldLayout(base,{...s,world:s.openings[0].from,openings:[]},frame).layout;
 const begin=fitWorldLayout(base,s,frame).layout;assert.equal(begin.cell,old.cell);assert.equal(begin.field.x,old.field.x);assert.equal(begin.field.y,old.field.y);
 let previous=begin.cell;for(let t=100;t<=160;t++){s.tick=t;const a=fitWorldLayout(base,s,frame);assert.ok(a.layout.cell<=previous+1e-9);assert.deepEqual(a,fitWorldLayout(base,s,frame));previous=a.layout.cell;}
 const end=fitWorldLayout(base,s,frame).layout;assert.equal(end.fitProgress,1);assert.ok(end.playableGrid.w<end.cabinetAperture.w);assert.ok(end.playableGrid.h<end.cabinetAperture.h);
 assert.equal(fitWorldLayout(base,{...s,tick:0,openings:[]},frame).layout.fitProgress,1);
});
test('FIT WORLD readers preserve canonical replay/hash through expansion',()=>{
 const a=new TunnelSession({seed:17}),b=new TunnelSession({seed:17}),m=new TunnelMotion(b);a.state.movePhase=b.state.movePhase=-20000;
 for(let tick=0;tick<180;tick++){if(tick===30){a.forceExpansion();b.forceExpansion();}a.advance();b.advance();m.capture(b);const before=b.hash();fitWorldLayout(base,b,m.frame(b));assert.equal(b.hash(),before);assert.equal(a.hash(),b.hash());}
});
test('authored VFX have bounded nonempty native masks and four cache phases',()=>{
 for(const kind of VFX_KINDS)for(let phase=0;phase<4;phase++){let count=0;paintVfx({set fillStyle(c){assert.match(c,/^#[0-9a-f]{6}$/i);},fillRect(x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=32&&y+h<=32);count+=w*h;}},kind,phase);assert.ok(count>30,kind);}
});
test('presentation contains no effect notice or obstacle type rectangles; core/effects remain byte-identical',()=>{
 const visuals=readFileSync('arcade/snake-next/effect-playground/visuals.js','utf8'),presentation=readFileSync('arcade/snake-next/progressive-run/presentation.js','utf8');assert.ok(!visuals.includes('const notice='));assert.ok(!presentation.includes("o.kind==='crystal'"));
 // Session's capacity/timing orchestration is explicitly unlocked in FIT V2;
 // its collision/body/spatial and remaining mechanics locks are checked below
 // and in fit-v2.test.mjs. Historical default session behavior remains tested.
 for(const f of ['progressive-run/director.js','progressive-run/config.js','progressive-run/world.js','progressive-run/food.js','gate-one/session.js','gate-one/motion.js','gate-one/camera.js','gate-one/ribbon.js','forest-training/runtime.js','forest-training/ribbon-sprites.js','forest-training/ribbon-raster.js','smooth-v4-proof/ribbon.js','tuning-lab/config.js','simulation/step.js','input/turns.js']){const p='arcade/snake-next/'+f;assert.equal(withoutTimingAdditions(f,readFileSync(p,'utf8')),execFileSync('git',['show','5ac5fd8:'+p],{encoding:'utf8'}).replace(/\r\n/g,'\n'),f);}
 const css=readFileSync('arcade/snake-next/forest-training/style.css','utf8');assert.equal(css.replace(/\r\n/g,'\n'),execFileSync('git',['show','764e180:arcade/snake-next/forest-training/style.css'],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
});
