import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {StableCamera,LookAheadCamera} from './camera.js';
import {TunnelSession} from './session.js';
import {TunnelMotion} from './motion.js';
import {createState} from '../entry.js';

const state=()=>({world:{width:110,height:70},state:{cadence:10,movePhase:0},tick:0,moves:10,portalEdges:[]});
const frame=(x=40,y=20,d=1)=>({head:{x,y,dx:[0,1,0,-1][d],dy:[-1,0,1,0][d]},alpha:1,start:0});
const patterns={rightDownRight:[1,2,1],rightDownLeft:[1,2,3],downRightUpRight:[2,1,0,1],tightS:[1,2,1,0,1,2,1,0],squares:[1,2,3,0]};

test('all direction-only stress fixtures have exactly zero displacement inside either safe zone',()=>{
 for(const mobile of [false,true])for(const [name,directions]of Object.entries(patterns)){
  const s=state(),c=new StableCamera(),initial=c.update(frame(),s,mobile);
  for(let tick=1;tick<=1800;tick++){
   s.tick=tick;const v=c.update(frame(40,20,directions[tick%directions.length]),s,mobile);
   assert.equal(v.x,initial.x,name);assert.equal(v.y,initial.y,name);
  }
 }
});

test('position-only S/loop motion inside safe bounds is zero; outside follow is minimal and axis-independent',()=>{
 for(const mobile of [false,true]){
  const s=state(),c=new StableCamera(),v=c.update(frame(),s,mobile);
  for(let lap=0;lap<200;lap++)for(const [x,y,d]of [[40,20,1],[43,20,2],[43,22,3],[40,22,0],[40,20,1]]){
   s.tick++;const p=c.update(frame(x,y,d),s,mobile);assert.equal(p.x,v.x);assert.equal(p.y,v.y);
  }
  const right=v.x+v.safe.right+1.25,a=c.update(frame(right,20,1),s,mobile);
  assert.equal(a.x,v.x+1.25);assert.equal(a.y,v.y);
  const b=c.update(frame(right,20,2),s,mobile);assert.equal(b.x,a.x);assert.equal(b.y,a.y);
  const d=c.update(frame(right-2,20,3),s,mobile);assert.equal(d.x,a.x,'reversal inside zone must not recenter');
  const e=c.update(frame(right-2,a.y+v.safe.bottom+.375,2),s,mobile);assert.equal(e.x,a.x);assert.equal(e.y,a.y+.375);
  const f=c.update(frame(e.x+v.safe.left-.5,21,3),s,mobile);assert.equal(f.x,e.x-.5);assert.equal(f.y,e.y);
 }
});

test('world clamp and expansion never recenter; pause/resume render is identical',()=>{
 const s=state(),c=new StableCamera();let v=c.update(frame(2,2),s);assert.equal(v.x,0);assert.equal(v.y,0);
 v=c.update(frame(108,68),s);assert.equal(v.x,82);assert.equal(v.y,58);
 s.world={width:112,height:72};const frozen=c.update(frame(108,68),s);
 assert.equal(frozen.x,82);assert.equal(frozen.y,58);for(let i=0;i<100;i++)assert.deepEqual(c.update(frame(108,68),s),frozen);
 s.tick++;assert.deepEqual(c.update(frame(108,68),s),frozen);
});

test('camera rebases once when visual HEAD crosses a portal, not when transfer commits or tail exits',()=>{
 const s=new TunnelSession({seed:17,progression:{startStage:4,density:0}}),w=s.arena.width,cell=(x,y)=>y*w+x;
 s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:30},(_,i)=>cell(40-i,20)),direction:1,food:cell(65,8)});s.state.cadence=s.cadence();
 s.portals=[cell(41,20),cell(65,30)];s.portal.phase='armed';s.director.windowEnd=100000;s.preparePortals();s.director.next={positive:100000,negative:100000,portal:100000};
 const m=new TunnelMotion(s),c=new StableCamera(),initial=c.update(m.frame(s),s);
 s.state.movePhase=s.cadence()-1;s.advance();m.capture(s);assert.equal(s.portal.transfers,1);
 let rebases=0,previous=initial;
 for(let i=0;i<=s.cadence();i++){
  s.state.movePhase=i;const f=m.frame(s),before=s.hash(),v=c.update(f,s);assert.equal(s.hash(),before);
  if(v.x-previous.x>10)rebases++;
  if(f.start>0){assert.equal(v.x,initial.x);assert.equal(v.y,initial.y);}
  previous=v;
 }
 assert.equal(rebases,1);assert.ok(previous.x>50);const exit=previous;
 for(let i=0;i<20;i++){s.tick++;s.portalEdges[0].complete=i>10;assert.deepEqual(c.update(m.frame(s),s),exit);}
});

test('canonical 30-second loop replay/hash identical across stable, old and no-camera readers',()=>{
 const runs=Array.from({length:3},()=>new TunnelSession({seed:17,progression:{startStage:4,density:0}})),motions=[],cameras=[new StableCamera(),new LookAheadCamera(),null];
 for(const s of runs){const w=s.arena.width;s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>20*w+40-i),direction:1,food:8*w+65});s.state.cadence=s.cadence();s.director.next={positive:100000,negative:100000,portal:100000};motions.push(new TunnelMotion(s));}
 let sequence=0;
 for(let tick=0;tick<1800;tick++){
  const s=runs[0],r=s.moves%16,d=Math.floor(r/4)+1,dir=d%4,commands=s.state.direction!==dir?[{tick:1,sequence:++sequence,direction:dir}]:[];
  for(let i=0;i<3;i++){
   const s=runs[i];s.advance(commands);motions[i].capture(s);assert.equal(s.status,'playing');const before=s.hash();
   for(const fraction of [.1,.5,.9])cameras[i]?.update(motions[i].frame(s,fraction),s);
   assert.equal(s.hash(),before);assert.equal(s.hash(),runs[0].hash());
  }
 }
 assert.ok(runs[0].moves>=100);
});

test('Gate 1.1 art stays unchanged; viewport extent substitution only for FIT WORLD',()=>{
 const raw=readFileSync('arcade/snake-next/gate-one/environment.js','utf8').replace(/\r\n/g,'\n'),prior=execFileSync('git',['show','310faf0:arcade/snake-next/gate-one/environment.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 // Outer-wall placement/corner tiling is explicitly unlocked in Gate 2.3.1.
 // Native painter, historical opening walls, portal activity and reveal art are not.
 assert.equal(raw.split('function wallCell')[1].split('function borderCells')[0],prior.split('function wallCell')[1].split('function borderCells')[0]);
 // V4.2 product-only policy skips historical wall ART as well as the current
 // perimeter. The default DEV painter/reveal/portal implementation is retained.
 assert.equal(raw.split(' if(opening&&p<1){')[1].replace("l.perimeter===false?[]:borderCells(opening.from.width,opening.from.height)","borderCells(opening.from.width,opening.from.height)"),prior.split(' if(opening&&p<1){')[1]);
 const env=prior.replaceAll('view.cols','28').replaceAll('view.rows','12').replace('y<Math.ceil(view.y)+12-1','y<=Math.ceil(view.y)+10').replace('x<Math.ceil(view.x)+28-1','x<=Math.ceil(view.x)+26');
 assert.equal(createHash('sha256').update(env).digest('hex'),'1c02aa395013c6fd6b5ae4aa43c52ce33245c9e4b4a54e3464d280bf7ac7c51f');
 const path='arcade/snake-next/gate-one/camera.js',old=execFileSync('git',['show','a85a2ff:'+path],{encoding:'utf8'}).split('export class LookAheadCamera')[1];
 assert.equal(readFileSync(path,'utf8').split('export class LookAheadCamera')[1].replace(/\r\n/g,'\n'),old.replace(/\r\n/g,'\n'));
});
