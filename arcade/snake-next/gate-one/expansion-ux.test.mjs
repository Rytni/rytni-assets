import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {openingPhase,territoryReveal,drawEnvironment} from './environment.js';
import {TunnelSession} from './session.js';

test('one active second: closed → fracture → retraction → outward reveal',()=>{
 assert.deepEqual(openingPhase(0),{p:0,crack:0,retract:0,travel:0});
 assert.ok(openingPhase(8).crack>0);assert.equal(openingPhase(8).retract,0);
 assert.ok(openingPhase(24).retract>0);assert.ok(openingPhase(24).travel>0);
 assert.equal(openingPhase(60).retract,1);assert.equal(openingPhase(60).travel,1);
 const opening={from:{width:28,height:12},to:{width:36,height:18}};
 assert.equal(territoryReveal(24,8,opening,0).new,false);
 assert.equal(territoryReveal(30,8,opening,0).reveal,0);
 assert.ok(territoryReveal(28,8,opening,.3).reveal>territoryReveal(32,8,opening,.3).reveal);
 for(let x=27;x<35;x++)assert.equal(territoryReveal(x,8,opening,1).reveal,1);
 for(let y=11;y<17;y++)assert.equal(territoryReveal(8,y,opening,1).reveal,1);
});

test('environment is deterministic/read-only, and pause leaves pixels/phase unchanged',()=>{
 const s=new TunnelSession(),l={field:{x:0,y:0},arena:{x:68,y:68,w:26*68,h:10*68},cell:68},view={x:0,y:0,wallDistance:{left:10,right:5,top:4,bottom:5}},frame={head:{x:20,y:5},alpha:.5};
 const paint=()=>{const ops=[];let alpha=1,color='';const stack=[];const ctx={save(){stack.push([alpha,color]);},restore(){[alpha,color]=stack.pop();},translate(...v){ops.push(['translate',...v]);},scale(...v){ops.push(['scale',...v]);},fillRect(...v){ops.push([color,alpha,...v]);},strokeRect(...v){ops.push(['stroke',...v]);},set fillStyle(v){color=v;},get fillStyle(){return color;},set globalAlpha(v){alpha=v;},get globalAlpha(){return alpha;}};drawEnvironment(ctx,s,view,l,frame,false);assert.equal(alpha,1);return ops;};
 s.forceExpansion();s.advance();const hash=s.hash();for(const age of [0,8,24,40,60]){s.tick=s.openings[0].tick+age;const before=s.hash();assert.deepEqual(paint(),paint());assert.equal(s.hash(),before);}
 s.tick=s.openings[0].tick;assert.equal(s.hash(),hash);
});

test('all locked runtime modules and portal presentation remain byte-identical to a85a2ff',()=>{
 for(const file of ['gate-one/session.js','gate-one/motion.js','gate-one/ribbon.js','gate-one/audio.js','progressive-run/session.js','progressive-run/food.js','progressive-run/config.js','progressive-run/world.js','progressive-run/adapter.js','tuning-lab/config.js','forest-training/runtime.js','smooth-v4-proof/ribbon.js','simulation/step.js','input/turns.js']){
  const path='arcade/snake-next/'+file;assert.equal(readFileSync(path,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','a85a2ff:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
 }
 const path='arcade/snake-next/gate-one/environment.js',current=readFileSync(path,'utf8').split('export function drawPortalActivity')[1],base=execFileSync('git',['show','a85a2ff:'+path],{encoding:'utf8'}).split('export function drawPortalActivity')[1];assert.equal(current.replace(/\r\n/g,'\n'),base.replace(/\r\n/g,'\n'));
});
