import test from 'node:test';
import assert from 'node:assert/strict';
import {SnakeMotion} from './motion.js';
import {labSession} from '../tuning-lab/session.js';
import {PRESETS} from '../tuning-lab/config.js';
import {createState} from '../entry.js';
import {loopFixture} from '../tests/fixtures.js';
import {bodyCell,bodyCells} from '../simulation/body.js';

test('shared path-distance alpha, cardinal endpoints, continuous growth and long bodies',()=>{
 for(const length of [8,30,250,1200]){
  const f=loopFixture(length,1),s=labSession(PRESETS.B,{arena:f.arena,rules:f.rules}),motion=new SnakeMotion(s);
  s.state=f.state;motion.reset(s);
  const before=motion.frame(s),tail={...before.tail};
  // A real authoritative step creates the previous/current bracket.
  const next=bodyCell(s.state,0)+1;s.state.food=next;
  for(let n=0;n<30&&!motion.snapshots.moved;n++){s.advance();motion.capture(s);}
  assert.equal(s.state.length,length+1);const hash=s.hash();let prior;
  for(const alpha of [0,.1,.25,.5,.75,.9,1]){
   const frame=motion.frame(s,alpha*s.state.cadence-s.state.movePhase);
   assert.equal(frame.alpha,alpha);assert.equal(frame.end,length);
   assert.deepEqual(frame.tail,tail); // growth holds endpoint while span increases
   assert.ok(Number.isInteger(frame.head.x)||Number.isInteger(frame.head.y));
   for(let i=1;i<frame.route.length;i++)assert.equal(Math.abs(frame.route[i].x-frame.route[i-1].x)+Math.abs(frame.route[i].y-frame.route[i-1].y),1);
   if(prior)assert.ok(Math.abs(frame.head.x-prior.x)+Math.abs(frame.head.y-prior.y)<=.250001);prior=frame.head;
  }
  assert.equal(s.hash(),hash,'render reads may not alter canonical hash');
 }
});
test('mid-cell pause is exact; resume debt reset cannot jump backwards; restart and teleport reset atomically',()=>{
 const s=labSession(PRESETS.B),m=new SnakeMotion(s);for(let n=0;n<20;n++){s.advance();m.capture(s);}
 const a=m.freeze(s,.43),frame=m.frame(s,0);for(let n=0;n<10;n++)assert.deepEqual(m.frame(s,n),frame);
 m.resume();assert.equal(m.frame(s,0).alpha,a);assert.ok(m.frame(s,1).alpha>=a);
 s.state=createState({seed:1,arena:s.arena,rules:s.rules,body:bodyCells(s.state).map(c=>c+s.arena.width),direction:s.state.direction});m.capture(s);
 assert.equal(m.frame(s).alpha,1);assert.equal(m.snapshots.moved,false);assert.equal(m.snapshots.previous[0],m.snapshots.current[0]);
 const fresh=labSession(PRESETS.B);m.reset(fresh);assert.equal(m.snapshots.length,8);assert.equal(m.floor,0);assert.equal(m.frozen,null);
});
test('all FPS samples preserve B replay, collision and input queue; presentation never predicts a turn',()=>{
 const hashes=[];
 for(const fps of [60,90,120,144]){
  const s=labSession(PRESETS.B),m=new SnakeMotion(s);let tick=0;
  for(let frame=0;frame<fps*5;frame++){
   const target=Math.floor(frame*60/fps);
   while(tick<target){const commands=tick===20?[{tick:1,sequence:1,direction:2}]:tick===21?[{tick:1,sequence:2,direction:3}]:[];s.advance(commands);m.capture(s);tick++;}
   const hash=s.hash(),body=m.frame(s,frame*60/fps-target);assert.ok(body.alpha>=0&&body.alpha<=1);assert.equal(s.hash(),hash);
  }
  while(tick<300){s.advance();m.capture(s);tick++;}hashes.push(s.hash());
 }
 assert.equal(new Set(hashes).size,1);
});
test('real portal transfer resets geometry at destination, never spans world distance; slow effects cannot reverse alpha',()=>{
 const s=labSession(PRESETS.B),entry=s.portals[0];s.state=createState({seed:1,arena:s.arena,rules:s.rules,body:Array.from({length:8},(_,i)=>entry-1-i),direction:1});s.tick=PRESETS.B.portalFirst*60;s.portal.phase='armed';const m=new SnakeMotion(s);let changed=false;
 for(let i=0;i<60;i++){const before=s.state;s.advance();m.capture(s);const frame=m.frame(s,.5);if(before!==s.state){changed=true;assert.equal(frame.alpha,1);assert.equal(m.snapshots.previous[0],m.snapshots.current[0]);assert.equal(frame.head.x,bodyCell(s.state,0)%s.arena.width);assert.equal(frame.head.y,Math.floor(bodyCell(s.state,0)/s.arena.width));}for(let j=1;j<frame.route.length;j++)assert.equal(Math.abs(frame.route[j].x-frame.route[j-1].x)+Math.abs(frame.route[j].y-frame.route[j-1].y),1);}
 assert.ok(changed);assert.equal(s.portal.transfers,1);
 const a=labSession(PRESETS.B),m2=new SnakeMotion(a);for(let t=0;t<20;t++){a.advance();m2.capture(a);}const alpha=m2.sample(a,.8);a.state.cadence=18;assert.ok(m2.sample(a,0)>=alpha);
});
