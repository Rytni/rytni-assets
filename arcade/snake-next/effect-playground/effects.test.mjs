import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {TunnelSession} from '../gate-one/session.js';
import {DEFINITIONS} from '../progressive-run/director.js';
import {KINDS,paintSprite,POSITIVE} from './art.js';
import {createState} from '../entry.js';
import {bodyCell} from '../simulation/body.js';
import {foodLegal} from '../progressive-run/food.js';

test('natural biome learning pools omit Anchor/Decay; durations and categories are explicit',()=>{
 for(let stage=0;stage<=4;stage++){const s=new TunnelSession({progression:{startStage:stage}}),p=s.director.candidates(s,true),n=s.director.candidates(s,false);
  assert.ok(p.includes('guard'));assert.ok(!p.includes('anchor'));assert.ok(!n.includes('decay'));assert.equal(p.includes('spores'),stage>=2);assert.equal(n.includes('mist'),stage>=3);assert.equal(n.includes('weak'),stage>=3);assert.ok(n.includes('rush'));
 }
 assert.deepEqual(KINDS.map(k=>DEFINITIONS[k].duration/60),[16,15,15,35,40,10,12,8,10]);
 KINDS.forEach(k=>assert.equal(DEFINITIONS[k].positive,POSITIVE.has(k)));
});

test('nine native alpha silhouettes are distinct and category luminance differs in grayscale',()=>{
 const masks=[],luma=[];
 for(const kind of KINDS){const pixels=new Map(),ctx={fillStyle:'',fillRect(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)pixels.set(j*56+i,this.fillStyle);}};paintSprite(ctx,kind);
  assert.ok(pixels.size>300);assert.ok([...pixels.keys()].every(k=>k>=0&&k<56*56));masks.push(new Set(pixels.keys()));
  luma.push([...pixels.values()].reduce((sum,c)=>sum+.2126*parseInt(c.slice(1,3),16)+.7152*parseInt(c.slice(3,5),16)+.0722*parseInt(c.slice(5,7),16),0)/pixels.size);
 }
 for(let i=0;i<9;i++)for(let j=i+1;j<9;j++)assert.ok([...masks[i]].filter(k=>!masks[j].has(k)).length+[...masks[j]].filter(k=>!masks[i].has(k)).length>100,`${KINDS[i]} / ${KINDS[j]}`);
 assert.ok(Math.min(...luma.slice(0,5))>Math.max(...luma.slice(5)));
});

test('Focus slows only its window and freezes combo; natural 2+1 caps and charge refresh hold',()=>{
 const s=new TunnelSession(),base=s.cadence();s.state.movePhase=-20000;s.combo=4;s.lastFood=s.tick;s.collect('focus',0);
 assert.equal(s.cadence(),Math.round(base*1.22));for(let i=0;i<850;i++)s.advance();assert.equal(s.combo,4);
 assert.ok(s.collect('guard',0));assert.ok(!s.collect('harvest',0));assert.ok(s.collect('weak',0));assert.ok(!s.collect('rush',0));
 s.collect('guard',0);assert.equal(s.effects.find(e=>e.kind==='guard').ends,s.tick+2100);
 assert.equal(s.effectNotices.at(-1).kind,'guard');
});

test('Bloom emits 2–3 legal motes, magnets over 18 ticks and awards biome value once',()=>{
 const s=new TunnelSession(),head=bodyCell(s.state,0);s.state.movePhase=-20000;s.collect('spores',head);s.director.sporeDrop(s);assert.ok(s.spores.length>=2&&s.spores.length<=3);
 assert.ok(s.spores.every(p=>!s.arena.blocked(p.cell)&&p.ends-s.tick===330));
 s.spores=[{cell:head+s.arena.width,ends:s.tick+330,born:s.tick}];const score=s.score,food=s.state.food;s.advance();assert.equal(s.spores.length,1);assert.equal(s.spores[0].magnetTick,s.tick);
 for(let i=0;i<18;i++)s.advance();assert.equal(s.spores.length,0);assert.equal(s.score-score,25);assert.equal(s.state.food,food);s.advance();assert.equal(s.score-score,25);
 s.effects=[];s.collect('spores',head);assert.equal(s.effectNotices.at(-1).tutorial,false);
});

test('Harvest doubles value, every third window mushroom bursts, Corruption multiplies .6',()=>{
 const award=(k)=>{const s=new TunnelSession();for(const e of k)s.collect(e,0);while(!s.foods)s.advance();return s;};
 const base=award([]),gold=award(['harvest']),bad=award(['weak']),both=award(['harvest','weak']);
 assert.equal(gold.score,base.score*2);assert.equal(bad.score,Math.round(base.score*.6));assert.equal(both.score,Math.round(gold.score*.6));assert.equal(gold.feedback.find(f=>f.kind==='seed').harvest,true);
 gold.effects.find(e=>e.kind==='harvest').collected=2;gold.state.food=bodyCell(gold.state,0)+1;gold.state.movePhase=gold.cadence()-1;gold.advance();assert.equal(gold.feedback.findLast(f=>f.kind==='seed').strong,true);assert.ok(foodLegal(gold,gold.state.food));
});

test('Portal+ rewards successful head traversal once; body completion does not award again',()=>{
 const s=new TunnelSession({progression:{startStage:4,density:0}}),w=s.arena.width,c=(x,y)=>y*w+x;
 s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>c(30-i,12)),direction:1,food:c(65,8)});s.state.cadence=s.cadence();s.portals=[c(31,12),c(53,12)];s.portal.phase='armed';s.director.windowEnd=100000;s.preparePortals();s.collect('portalPrize',0);s.state.movePhase=s.cadence()-1;s.advance();
 assert.equal(s.portal.transfers,1);assert.ok(s.events.some(e=>e.kind==='portal-reward'));assert.ok(!s.effects.some(e=>e.kind==='portalPrize'));const score=s.score;assert.ok(score>0);
 s.state.movePhase=-20000;for(let i=0;i<30;i++)s.advance();assert.equal(s.score,score);
});

test('Guard survives Forest expansion but expires on actual biome change',()=>{
 const s=new TunnelSession();s.state.movePhase=-20000;s.collect('guard',0);s.forceExpansion();s.advance();assert.ok(s.effects.some(e=>e.kind==='guard'));s.forceExpansion();s.advance();assert.equal(s.stage.biome,'caves');assert.ok(!s.effects.some(e=>e.kind==='guard'));
});

test('locked motion, camera, tunnel, borders, world, food, core and B stay byte-identical',()=>{
 for(const file of ['gate-one/session.js','gate-one/motion.js','gate-one/camera.js','gate-one/ribbon.js','progressive-run/world.js','progressive-run/food.js','progressive-run/config.js','forest-training/runtime.js','forest-training/session.js','forest-training/motion.js','forest-training/renderer.js','forest-training/ribbon-raster.js','forest-training/ribbon-sprites.js','tuning-lab/config.js','simulation/step.js','input/turns.js']){
  const p='arcade/snake-next/'+file;assert.equal(readFileSync(p,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','85a1702:'+p],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
 }
});
