import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {APPROVED_ASSETS} from './asset-approvals.js';
import {ASSET_CONTRACT,EFFECT_NAMES} from './asset-contract.js';
import {AssetBank,assetFrame} from './asset-bank.js';
import {TunnelSession} from '../gate-one/session.js';
import {ART_FIXTURES,placeAllPickups} from './production-fixtures.js';
import {bodyCells} from '../simulation/body.js';

test('exactly 40 existing reviewed PNGs approved; no future or VFX key',()=>{
 const expected=Object.keys(EFFECT_NAMES).flatMap(k=>['field@1x','field-lod','hud','idle'].map(r=>k+'.'+r));
 for(const food of ['golden','corrupted'])for(const r of ['field@1x','field-lod'])expected.push('food-'+food+'.'+r);
 assert.deepEqual(Object.keys(APPROVED_ASSETS).sort(),expected.sort());
 for(const k of expected){assert.equal(APPROVED_ASSETS[k],true);const c=ASSET_CONTRACT[k];assert.ok(c);const data=readFileSync('.'+c.url);assert.equal(data[25],6);assert.equal(data.readUInt32BE(16),c.sheetWidth);assert.equal(data.readUInt32BE(20),c.sheetHeight);}
 assert.ok(!Object.keys(APPROVED_ASSETS).some(k=>k.startsWith('vfx.')));
});
test('approved cache loads 40 once and refuses all Pass B VFX',async()=>{
 const calls=[];const bank=new AssetBank(ASSET_CONTRACT,APPROVED_ASSETS,async url=>{calls.push(url);const c=Object.values(ASSET_CONTRACT).find(c=>c.url===url);return {width:c.sheetWidth,height:c.sheetHeight};});
 await bank.preload();await bank.preload();assert.equal(calls.length,40);assert.equal(bank.errors.size,0);
 for(const k of Object.keys(ASSET_CONTRACT).filter(k=>k.startsWith('vfx.')))assert.equal(await bank.request(k),null);
 assert.equal(calls.length,40);
});
test('all nine staged pickups are unique legal cells in five canonical preview fixtures',()=>{
 assert.equal(Object.keys(ART_FIXTURES).length,5);
 for(const f of Object.values(ART_FIXTURES)){
  const s=new TunnelSession({seed:17,progression:{model:'fit-world-v2',startStage:f.stage,density:2}}),body=new Set(bodyCells(s.state));
  const coreBefore=JSON.stringify(s.state),dims=[s.world.width,s.world.height];placeAllPickups(s);
  assert.equal(s.pickups.length,9);assert.equal(new Set(s.pickups.map(p=>p.cell)).size,9);
  for(const p of s.pickups){assert.ok(!s.arena.blocked(p.cell));assert.ok(!body.has(p.cell));assert.notEqual(p.cell,s.state.food);assert.ok(!s.portals.includes(p.cell));}
  assert.equal(JSON.stringify(s.state),coreBefore);assert.deepEqual([s.world.width,s.world.height],dims);
 }
});
test('idle selection depends only on canonical active ticks, not render FPS',()=>{
 const spec=ASSET_CONTRACT['harvest.idle'];for(const fps of [60,90,120,144])for(let tick=0;tick<90;tick++){const phases=Array.from({length:Math.ceil(fps/60)},()=>assetFrame(spec,tick));assert.ok(phases.every(p=>p===Math.floor(tick/15)%4));}
 assert.equal(assetFrame(spec,44),2);assert.equal(assetFrame(spec,45),3);
});
test('only Harvest LOD delivery pixels changed from approved 8788006',()=>{
 for(const c of Object.values(ASSET_CONTRACT).filter(c=>!c.key.startsWith('vfx.'))){const path=c.url.slice(1);if(path.endsWith('/harvest-lod.png'))continue;assert.deepEqual(readFileSync(path),execFileSync('git',['show','8788006:'+path]),path);}
});
