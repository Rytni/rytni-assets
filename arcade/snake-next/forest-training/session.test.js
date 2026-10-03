import test from 'node:test';
import assert from 'node:assert/strict';
import {Session,baseCadence,EFFECTS} from './session.js';
import {createState} from '../entry.js';
import {bodyCells,occupied} from '../simulation/body.js';
import fs from 'node:fs';
import crypto from 'node:crypto';

test('all 165 approved V5.6 assets remain byte-identical to inventory',()=>{
  const root=new URL('../../../grib/mushroom-snake-retro-v5/',import.meta.url),inventory=JSON.parse(fs.readFileSync(new URL('inventory.json',root)));
  assert.equal(inventory.version,'retro-v5.6-art-review');
  for(const a of inventory.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(a.file,root))).digest('hex'),a.sha256,a.id);
});

test('food is one legal seed, atomic growth and replay remain deterministic',()=>{
  const a=new Session(),b=new Session();
  for(let i=0;i<200;i++){a.advance();b.advance();assert.equal(a.hash(),b.hash());
    if(a.status==='playing'){assert.ok(a.state.food>=0);assert.ok(!occupied(a.state,a.state.food));assert.ok(!a.forbidden(a.state.food));}}
  assert.equal(a.foods,1);assert.equal(a.state.length,9);assert.ok(a.score>=100);
});
test('15 seconds calm; progression is monotonic with one cadence tick per step',()=>{
  let previous=15;for(let t=0;t<20000;t++){const n=baseCadence(t,0);assert.ok(n<=previous);assert.ok(previous-n<=1);previous=n;if(t<900)assert.equal(n,15);}assert.equal(previous,6);
});
test('all effects, refresh, bounded legal 2+1, expiration',()=>{
  const s=new Session();for(const kind of Object.keys(EFFECTS))assert.ok(s.collect(kind,100));
  assert.equal(s.effects.length,3);const end=s.effects[0].ends;s.tick=50;s.collect('focus',100);assert.equal(s.effects.length,3);assert.equal(s.effects[0].ends,end+50);
  s.tick=800;s.advance();assert.equal(s.effects.length,0);
});
test('food repair excludes portal/pickup; full effect slots cannot spawn',()=>{
  const s=new Session();s.state.food=s.portals[0];s.repairFood();assert.ok(!s.forbidden(s.state.food));
  for(const kind of Object.keys(EFFECTS))s.collect(kind,100);for(let i=0;i<30;i++)s.spawnPickup();assert.equal(s.pickups.length,0);
});
test('30 alternating real portal FSM transfers preserve coherent canonical body and hashes',()=>{
  const s=new Session();s.tick=601;
  for(let i=0;i<30;i++){
    const entry=s.portals[i%2],direction=i%2?3:1;
    const body=Array.from({length:8},(_,n)=>entry+(direction===1?-n:n));
    s.state=createState({seed:1,arena:s.arena,rules:s.rules,body,direction});
    s.portal.phase='entering';s.portal.entry=entry;s.portal.exit=s.portals[(i+1)%2];s.portal.elapsed=0;
    for(let n=0;n<13;n++)s.advance();
    assert.equal(s.portal.phase,'exit-grace');assert.equal(s.portal.transfers,i+1);assert.equal(s.portal.rejected,0);
    const cells=bodyCells(s.state);assert.equal(new Set(cells).size,8);for(const c of cells)assert.ok(occupied(s.state,c));
  }
});
test('unsafe exit rejected without mutation; pause cancels entry; cooldown re-arms',()=>{
  const s=new Session();const before=bodyCells(s.state);assert.equal(s.transfer(0),false);assert.deepEqual(bodyCells(s.state),before);
  for(const phase of ['entering','teleport']){s.portal.phase=phase;s.cancelPortal();assert.equal(s.portal.phase,'cooldown');}
  s.portal.elapsed=89;s.advance();assert.equal(s.portal.phase,'armed');
});
test('restart is independent and death clears all effects and transient state',()=>{
  const s=new Session();s.collect('rush',100);for(let i=0;i<5000&&s.status!=='result';i++)s.advance();
  assert.equal(s.status,'result');assert.equal(s.effects.length,0);assert.equal(s.pickups.length,0);assert.equal(s.portal.phase,'inactive');
  assert.equal(new Session().hash(),new Session().hash());
});
test('actual cell pickup invokes mechanics; harvest changes award without changing core score',()=>{
  const s=new Session();s.collect('harvest',0);s.pickups=[{kind:'focus',cell:s.state.food,ends:1000}];
  for(let i=0;i<60;i++)s.advance();assert.equal(s.foods,1);assert.equal(s.score,200);assert.equal(s.state.score,100);assert.ok(s.effects.some(e=>e.kind==='focus'));assert.equal(s.pickups.length,0);
  assert.ok(s.cadence()>baseCadence(s.tick,s.foods));s.collect('rush',0);assert.equal(s.effects.length,3);
});
test('portal is triggered once by real movement; transfer preserves queue and canonical counters',()=>{
  const s=new Session(),entry=s.portals[0],body=Array.from({length:8},(_,i)=>entry-1-i);
  s.state=createState({seed:1,arena:s.arena,rules:s.rules,body,direction:1});s.tick=601;s.portal.phase='armed';
  for(let i=0;i<15;i++)s.advance();assert.equal(s.portal.phase,'entering');
  for(let i=0;i<13;i++)s.advance(i===2?[{sequence:1,direction:2,repeat:false}]:[]);
  assert.equal(s.portal.transfers,1);assert.equal(s.portal.phase,'exit-grace');assert.equal(s.state.turnCount,1);assert.equal(s.state.lastInputSequence,1);
  assert.equal(s.state.tick,16);assert.ok(s.state.food>=0&&!occupied(s.state,s.state.food));
});
test('all pause and restart portal phases have no asynchronous resources',()=>{
  for(const phase of ['inactive','armed','entering','teleport','exit-grace','cooldown']){
    const s=new Session();s.portal.phase=phase;s.cancelPortal();
    assert.ok(!['entering','teleport'].includes(s.portal.phase));assert.equal(s.transitCommands.length,0);
    assert.equal(new Session().portal.phase,'inactive');
  }
});
test('adapter replay includes transit input arrival and identical hashes at every active tick',()=>{
  const setup=()=>{const s=new Session(),entry=s.portals[0];s.state=createState({seed:1,arena:s.arena,rules:s.rules,body:Array.from({length:8},(_,i)=>entry-1-i),direction:1});s.tick=601;s.portal.phase='armed';return s;};
  const original=setup(),hashes=[];
  for(let i=0;i<65;i++){
    original.advance(i===18?[{tick:1,sequence:1,direction:2,repeat:false}]:[]);hashes.push(original.hash());
  }
  const replay=setup();for(let i=0;i<65;i++){replay.advance(original.replay.filter(e=>e.at===replay.tick+1).map(e=>e.command));assert.equal(replay.hash(),hashes[i]);}
});
