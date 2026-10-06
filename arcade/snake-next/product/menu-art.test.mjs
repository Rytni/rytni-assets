import test from 'node:test';
import assert from 'node:assert/strict';
import {view,board} from './ui.js';
import {createMockBackend} from './backend.js';

// Catch mismatched availability: token ink must agree with authoritative counters.
test('physical attempt tokens distinguish available, spent and credited attempts',async()=>{
 const one=view({screen:'main',hub:await createMockBackend('one-attempt-left').hub()},{});
 assert.equal((one.match(/class="token available"/g)||[]).length,1);
 assert.equal((one.match(/class="token spent"/g)||[]).length,2);
 const credited=view({screen:'main',hub:await createMockBackend('sponsor-credit').hub()},{});
 assert.equal((credited.match(/class="token gift credited"/g)||[]).length,1);
 assert.ok(credited.includes('data-action="play"'));
 assert.ok(!credited.includes('data-action="sponsor"'));
});

// Catch wrong visual promotion/order without changing backend tie order.
test('top three receive podium treatment while all ten stay in backend order',()=>{
 const html=board({leaderboard:Array.from({length:10},(_,i)=>({place:i+1,name:'name'+(i+1),score:100-i,is_me:i===6}))});
 for(const place of [1,2,3])assert.ok(html.includes('podium-'+place));
 assert.ok(!html.includes('podium-4'));
 assert.ok(html.indexOf('name1')<html.indexOf('name2'));
 assert.ok(html.indexOf('name2')<html.indexOf('name3'));
 assert.ok(html.includes('is-me'));
});

// Catch accidental nine-equal-stats result or losing the canonical secondary data.
test('record result promotes only foods length combo and retains subordinate details',()=>{
 const html=view({screen:'result',hub:{best_score:12480,success:true,attempts_remaining:2},backend:{mode:'mock'},result:{accepted:true,record:true,response:{score:12480},stats:{score:12480,foods:24,length:32,max_combo:5,portal_uses:2,expansions:1,bonuses:9,world:[40,16],active_ticks:6840}}},{});
 assert.ok(html.includes('primary-stats'));
 assert.ok(html.includes('<details'));
 assert.ok(html.includes('Порталы 2'));
 assert.ok(html.includes('Расширения 1'));
 assert.ok(html.includes('Бонусы 9'));
 assert.ok(html.includes('result-hero.png'));
 for(const action of ['play-again','share','main'])assert.ok(html.includes('data-action="'+action+'"'));
});

// Catch orphaned current event-delegation hooks while replacing markup.
test('illustrated guide/settings preserve tabs, all nine icons and volume bindings',()=>{
 let count=0;
 for(const tab of ['bonuses','hazards']){
  const html=view({screen:'rules',tab},{});
  count+=(html.match(/-field\.png/g)||[]).length;
  for(const key of ['basics','bonuses','hazards'])assert.ok(html.includes('data-tab="'+key+'"'));
  assert.ok(html.includes('data-action="back"'));
 }
 assert.equal(count,9);
 const settings=view({screen:'settings',tab:'sound'},{master:.75,music:.5,sfx:.65});
 for(const key of ['master','music','sfx'])assert.ok(settings.includes('data-setting="'+key+'"'));
 assert.ok(settings.includes('value="0.75"'));
});
