import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {view,board} from './ui.js';
test('functional icons use approved V5 object masters, while pickups and Guide remain approved',()=>{
 const html=view({screen:'main',hub:{attempts_remaining:3}},{});for(const key of ['guide','ranking','settings','sound-on','fullscreen'])assert.ok(html.includes('mushroom-snake-ui-v5/'+key+'.png'),key);
 for(const key of ['guide','ranking','settings','sound-on','sound-off','fullscreen','exit-fullscreen','back','close','home','restart','share'])assert.ok(existsSync(new URL('../../../grib/mushroom-snake-ui-v5/'+key+'.png',import.meta.url)),key);
 const guide=view({screen:'rules',tab:'basics'},{});assert.ok(guide.includes('mushroom-snake-ui-v4-1/book/'));assert.ok(guide.includes('mushroom-snake-ui-v4-1/icons/keyboard.png'));assert.ok(guide.includes('mushroom-snake-ui-v5/close.png'));
});
test('Ranking fixes podium and summary; only4–10 list scrolls, data order/escaping preserved',()=>{
 const html=board({my_rank:7,best_score:99999999,leaderboard:Array.from({length:10},(_,i)=>({place:i+1,name:i===6?'<script>':'Игрок',score:99999999-i,is_me:i===6}))});assert.equal((html.match(/<li /g)||[]).length,10);assert.ok(html.indexOf('ranking-podium')<html.indexOf('ranking-list'));assert.ok(html.includes('ranking-summary'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('is-me'));assert.ok(html.includes('is-leader'));
 const css=readFileSync(new URL('./ui-v4-3.css',import.meta.url),'utf8');assert.ok(css.includes('.panel-rating .panel-body{overflow:hidden'));assert.ok(css.includes('.leaderboard.ranking-list{min-height:0;overflow:auto'));assert.ok(!/blur\(|backdrop-filter|requestAnimationFrame|Date\.now/.test(css));assert.ok(css.includes('--button-label-optical-y:1px'));
});
