import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {view} from './ui.js';
const h={success:true,attempts_remaining:3,best_score:6840,my_rank:7,leaderboard:Array.from({length:10},(_,i)=>({place:i+1,name:'P'+i,score:20000-i,is_me:i===6}))};
test('Main previews only three; dedicated ranking keeps10 and existing order',()=>{
 const m=view({screen:'main',hub:h},{}),r=view({screen:'rating',hub:h},{});
 assert.ok(m.includes('ТОП–3'));assert.ok(!m.includes('ТОП–10'));assert.ok(!m.includes('P3'));assert.ok(r.includes('P9'));assert.ok(r.includes('is-me'));
 assert.ok(m.includes('ОТКРЫТЬ РЕЙТИНГ'));assert.ok(m.indexOf('motto')<m.indexOf('menu-hero'));
});
test('three guide tabs have two nine-slice parchment pages, approved art and no green cards',()=>{
 for(const tab of ['basics','bonuses','hazards']){const s=view({screen:'rules',tab},{});assert.equal((s.match(/class="book-page /g)||[]).length,2);assert.equal((s.match(/class="page-corner /g)||[]).length,8);assert.ok(!s.includes('manual-effects'));}
 const b=view({screen:'rules',tab:'basics'},{});assert.equal((b.match(/<article>/g)||[]).length,4);assert.ok(b.includes('keyboard.png')&&b.includes('dpad.png'));
});
test('known-good Fly cover is byte-identical to approved historical source',()=>{
 const bytes=f=>readFileSync(new URL('../../../grib/'+f,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(sha(bytes('mushroom-snake-v1/fly-card.png')),'66bb95fb7bdd815770a1a4a36fbb718f4cef5e3474ae76e86f247c706580e7df');assert.ok(bytes('mushroom-snake-v1/fly-card.png').equals(bytes('mushroom-snake-ui-v4-1/fly-cover.png')));
});
