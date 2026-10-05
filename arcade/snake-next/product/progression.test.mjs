import test from 'node:test';
import assert from 'node:assert/strict';
import {TunnelSession} from '../gate-one/session.js';
import {config} from '../progressive-run/config.js';
import {capacity} from '../effect-playground/capacity-model.js';
import {geometry} from '../forest-training/renderer.js';
import {fitWorldLayout} from '../effect-playground/fit-world.js';
import {createState} from '../entry.js';
import {TIMING_VERSION,pressureRate} from '../effect-playground/capacity-model.js';
function occupancy(s){const route=[];for(let y=1;y<s.world.height-1;y++)for(let x=1;x<s.world.width-1;x++)route.push(y*112+(y%2?x:s.world.width-1-x));const body=route.slice(0,capacity(s).predictedExpansionLength).reverse(),delta=body[0]-body[1],direction=delta===1?1:delta===-1?3:delta===112?2:0;s.state=createState({seed:17,arena:s.arena,rules:s.rules,body,direction});s.state.movement={version:TIMING_VERSION,progress:0,rate:pressureRate(s)};}
test('mobile readability at50 beats60 at unchanged36px body',()=>{const widths=[];for(const [width,height] of [[50,20],[60,24]]){const s={world:{width,height},tick:0,state:{movePhase:0,cadence:14}};const l=fitWorldLayout(geometry(844,390,28,12,true,true),s,{head:{x:10,y:5},alpha:0},true).layout;widths.push(36*l.cell/68);}assert.ok(widths[0]>=7.5);assert.ok(widths[1]<7);});
test('product-only cap preserves15% natural trigger at30/40 but stays50; DEV remains60',()=>{const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',freeTrigger:15,density:0,maxWorldStage:2}});for(const expected of [1,2]){occupancy(s);s.advance();assert.equal(s.stage.index,expected);}occupancy(s);s.advance();assert.equal(s.stage.index,2);assert.equal(s.world.width,50);const dev=new TunnelSession({progression:{model:'fit-world-v2',freeTrigger:15}});for(let i=0;i<3;i++){dev.forceExpansion();dev.advance();}assert.equal(dev.world.width,60);});
test('invalid cap rejected without introducing default hash/config fields',()=>{assert.throws(()=>config({maxWorldStage:4}));assert.equal(Object.hasOwn(config(),'maxWorldStage'),false);});
