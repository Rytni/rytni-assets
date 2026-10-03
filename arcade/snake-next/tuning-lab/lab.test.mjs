import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {PRESETS,validateProfile,targetSpeed,profileCadence,portalWindowOpen} from './config.js';
import {labSession} from './session.js';
import {Session} from '../forest-training/session.js';
import {createState} from '../entry.js';
import {validateFood} from '../simulation/food.js';
import {deathCause} from './telemetry.js';
import {bodyCell} from '../simulation/body.js';

test('A/B/C finite configs, grace ≥10s, smooth monotonic target, bounded canonical cadence',()=>{
 for(const p of Object.values(PRESETS)){assert.deepEqual(validateProfile(p),p);let prev=p.startSpeed;for(let tick=0;tick<600*60;tick+=60){const v=targetSpeed(p,tick);assert.ok(v>=prev&&v<=p.maxSpeed);assert.ok(tick>p.grace*60||v===p.startSpeed);assert.ok(Number.isInteger(profileCadence(p,tick)));prev=v;}}
 for(const patch of [{startSpeed:NaN},{maxSpeed:Infinity},{foodMin:2.5},{grace:0},{comboTimeout:-1},{portalWindow:45}])assert.throws(()=>validateProfile({...PRESETS.B,...patch}));
});
test('normal Training default retains exact c6587d3 behavior/hash; no DEV policy selected',async()=>{
 const file='arcade/snake-next/forest-training/session.js',source=execFileSync('git',['show','c6587d3:'+file],{encoding:'utf8'}).replace(/from '([^']+)'/g,(_,name)=>`from '${new URL(name,new URL('../forest-training/session.js',import.meta.url)).href}'`),old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const a=new Session(),b=new old.Session();assert.equal(a.hash(),b.hash());for(let t=0;t<500;t++){a.advance();b.advance();assert.equal(a.hash(),b.hash());}assert.equal(a.pacing,null);
});
test('profiles replay deterministically; first food replaces atomically, same growth; telemetry read-only',()=>{
 for(const p of Object.values(PRESETS)){const a=labSession(p),b=labSession(p);for(let t=0;t<300;t++){a.advance();b.advance();assert.equal(a.hash(),b.hash());if(a.status==='playing'){assert.ok(a.state.food>=0);assert.ok(validateFood(a.state,a.arena,a.state.food));}const hash=a.hash();a.telemetry.summary(a);a.telemetry.text(a);assert.equal(a.hash(),hash);}assert.ok(a.foods>=1);assert.equal(a.telemetry.foodFailures,0);assert.equal(a.telemetry.summary(a).maxReplacementTicks,0);}
});
test('food pacing selects preferred reachable cells where possible, never delays replacement',()=>{
 const s=labSession(PRESETS.A);while(!s.foods)s.advance();const head=bodyCell(s.state,0),food=s.state.food,w=s.arena.width,d=Math.abs(food%w-head%w)+Math.abs(Math.floor(food/w)-Math.floor(head/w));
 assert.ok(d>=PRESETS.A.foodMin&&d<=PRESETS.A.foodMax);assert.ok(validateFood(s.state,s.arena,food));assert.ok(!s.forbidden(food));assert.equal(s.telemetry.summary(s).maxReplacementTicks,0);
});
test('separate pickup schedules preserve 2+1 stack and ≤3 field items; no guaranteed event quota',()=>{
 for(const p of Object.values(PRESETS)){const s=labSession(p);s.tick=p.positiveInterval*60-1;s.advance();assert.ok(s.pickups.some(o=>o.kind!=='rush'));s.tick=p.negativeInterval*60-1;s.advance();assert.ok(s.pickups.some(o=>o.kind==='rush'));for(const k of ['focus','harvest','rush'])assert.ok(s.collect(k,100));assert.equal(s.effects.length,3);for(let n=0;n<30;n++){s.spawnPickup(true);s.spawnPickup(false);}assert.ok(s.pickups.length<=3);}
});
test('DEV portal availability windows do not alter transfer FSM phases/safety; cooldown configurable',()=>{
 const p=PRESETS.B;assert.equal(portalWindowOpen(p,29*60),false);assert.equal(portalWindowOpen(p,30*60),true);assert.equal(portalWindowOpen(p,40*60),false);assert.equal(portalWindowOpen(p,75*60),true);
 const s=labSession(p),entry=s.portals[0];s.state=createState({seed:1,arena:s.arena,rules:s.rules,body:Array.from({length:8},(_,i)=>entry-1-i),direction:1});s.tick=p.portalFirst*60;s.portal.phase='armed';
 for(let i=0;i<70;i++)s.advance();assert.ok(s.portal.transfers===1);assert.equal(s.telemetry.portalUses,1);assert.equal(s.portal.phase,'cooldown');
 s.portal.elapsed=p.portalCooldown*60-1;s.portalTick();assert.equal(s.portal.phase,'armed');s.portal.phase='entering';s.transitCommands=[{direction:2}];s.cancelPortal();assert.equal(s.portal.phase,'cooldown');assert.equal(s.transitCommands.length,0);
 const unsafe=labSession(p);const before=unsafe.hash();assert.equal(unsafe.transfer(0),false);assert.equal(unsafe.hash(),before);
});
test('fresh profile sessions have no old effects/portal/input/replay; death/timeout telemetry and causes',()=>{
 const a=labSession(PRESETS.A);a.collect('harvest',100);a.combo=3;a.lastFood=0;a.tick=PRESETS.A.comboTimeout*60;a.advance();assert.equal(a.telemetry.comboBreaks.at(-1).reason,'timeout');
 const b=labSession(PRESETS.B);assert.equal(b.tick,0);assert.equal(b.effects.length,0);assert.equal(b.pickups.length,0);assert.equal(b.portal.phase,'inactive');assert.equal(b.transitCommands.length,0);assert.equal(b.replay.length,0);
 for(const [reason,cell,cause] of [['self',10,'self'],['obstacle',0,'wall'],['obstacle',61,'obstacle'],['other',10,'other']]){b.state.reason=reason;b.state.events=[{type:'death',cell}];assert.equal(deathCause(b),cause);}
 const d=labSession(PRESETS.C);d.collect('rush',100);for(let i=0;i<500&&d.status==='playing';i++)d.advance();assert.ok(d.telemetry.death);assert.ok(d.telemetry.death.effects.includes('rush'));assert.ok(d.telemetry.text(d).includes('Preset C'));
});
test('food interval/distance telemetry, explicit restart combo break, and unsafe portal rejection evidence',()=>{
 const s=labSession(PRESETS.B);while(!s.foods)s.advance();s.state.food=bodyCell(s.state,0)+1;while(s.foods<2&&s.status==='playing')s.advance();
 const r=s.telemetry.summary(s);assert.equal(r.foods,2);assert.equal(r.averageFoodDistance,1);assert.ok(r.averageFoodSeconds>0);assert.equal(r.maxReplacementTicks,0);s.telemetry.finish(s,'preset-change');assert.equal(s.telemetry.comboBreaks.at(-1).reason,'preset-change');
 const unsafe=labSession(PRESETS.B);unsafe.portal.phase='teleport';unsafe.portal.exit=0;unsafe.advance();assert.equal(unsafe.portal.phase,'cooldown');assert.equal(unsafe.telemetry.portalRejected,1);assert.equal(unsafe.moves,0);
 const transit=labSession(PRESETS.B),entry=transit.portals[0];transit.state=createState({seed:1,arena:transit.arena,rules:transit.rules,body:Array.from({length:8},(_,i)=>entry-i),direction:1});transit.tick=(PRESETS.B.portalFirst+PRESETS.B.portalWindow)*60-2;transit.portal.phase='entering';transit.portal.entry=entry;transit.portal.exit=transit.portals[1];for(let i=0;i<16;i++)transit.advance();assert.equal(transit.portal.transfers,1,'Window expiration must not abort FSM transit');
});
