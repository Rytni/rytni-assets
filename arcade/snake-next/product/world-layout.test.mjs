import test from 'node:test';import assert from 'node:assert/strict';import {productWorldLayout as fitWorldLayout} from './world-layout.js';import {TunnelSession} from '../gate-one/session.js';
import {foodLegal,foodField} from '../progressive-run/food.js';import {drawEnvironment} from '../gate-one/environment.js';
const base={w:1920,h:1080,mobile:false,arena:{x:0,y:0,w:1920,h:1080}};
const frame={head:{x:10,y:5},alpha:0};
test('product grid uses aperture with no environment-wall thickness reservation',()=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2'}}),hash=s.hash(),l=fitWorldLayout(base,s,frame,true).layout;
 const a=l.cabinetAperture;assert.equal(l.cell,Math.min(a.w/28,a.h/10));assert.equal(s.hash(),hash);
});
test('wall collision and valid reachable food are unchanged at each product world',()=>{
 for(const startStage of [0,1,2]){
  const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',startStage,maxWorldStage:2}}),{width,height}=s.world;
  const hash=s.hash();fitWorldLayout(base,s,frame,true);
  assert.ok(s.arena.blocked(5*112));assert.ok(s.arena.blocked(5*112+width-1));assert.ok(s.arena.blocked(8));assert.ok(s.arena.blocked((height-1)*112+8));
  assert.ok(foodLegal(s,s.state.food));assert.ok(foodField(s).seen[s.state.food]);assert.equal(s.hash(),hash);
 }
});
test('product disables all environmental wall ink including old expansion walls',()=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2'}});s.forceExpansion();s.advance();
 const f={...frame,alpha:.25},l=fitWorldLayout(base,s,f,true).layout,view={x:0,y:0,cols:s.world.width,rows:s.world.height};
 let transforms=0,floor=0;const ctx={save(){},restore(){},translate(){transforms++;},scale(){transforms++;},fillRect(){floor++;},strokeRect(){}};
 drawEnvironment(ctx,s,view,l,f);assert.equal(transforms,0);assert.ok(floor>0,'floor reveal still draws');
 const h=s.hash();drawEnvironment(ctx,s,view,l,f);assert.equal(s.hash(),h);
});
test('all world sizes keep square cells, fixed wood and legal interior aligned',()=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2'}}),rects=[];
 for(const [width,height] of [[30,12],[40,16],[50,20]]){
  const l=fitWorldLayout(base,{...s,world:{...s.world,width,height},openings:[]},frame,true).layout,a=l.cabinetAperture,g=l.playableGrid;
  assert.ok(Math.abs(g.w/(width-2)-g.h/(height-2))<1e-9);assert.ok(Math.abs(g.x-a.x-(a.w-g.w)/2)<1e-9);assert.ok(g.y>=a.y-1e-9&&g.y+g.h<=a.y+a.h+1e-9);assert.equal(l.perimeter,false);rects.push(l.frame);
 }assert.deepEqual(rects[0],rects[1]);assert.deepEqual(rects[1],rects[2]);
});
test('expansion zoom is continuous from old layout to new, without hash mutation',()=>{
 const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2'}}),from={width:30,height:12},to={...s.world,width:40,height:16};
 const at=tick=>fitWorldLayout(base,{...s,tick,world:to,openings:[{from,to,tick:0,duration:60}]},frame,true).layout;
 const old=fitWorldLayout(base,{...s,world:from,openings:[]},frame,true).layout,newL=fitWorldLayout(base,{...s,world:to,openings:[]},frame,true).layout;
 assert.equal(at(0).cell,old.cell);assert.equal(at(60).cell,newL.cell);assert.ok(at(30).cell<old.cell&&at(30).cell>newL.cell);assert.deepEqual(at(0).frame,at(60).frame);
});
