import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {view} from './ui.js';
const settings={master:.8,music:.65,sfx:.9,muted:false,quality:'full'};
test('both layouts have real exclusive Sound/Game pages',()=>{
 for(const layout of ['desktop','mobile-portrait']){
  const sound=view({screen:'settings',tab:'sound',layout},settings),game=view({screen:'settings',tab:'game',layout},settings);
  for(const key of ['master','music','sfx']){assert(sound.includes(`data-setting="${key}"`));assert(!game.includes(`data-setting="${key}"`));assert(sound.includes(`id="value-${key}"`));}
  for(const action of ['quality','fullscreen']){assert(!sound.includes(`data-action="${action}"`));assert(game.includes(`data-action="${action}"`));}
  assert(!sound.includes('<details'));assert(sound.includes('data-action="mute"'));
 }
});
test('Main preview has no duplicate own summary; full Ranking retains it',()=>{
 const hub={success:true,available:true,attempts_remaining:3,my_rank:7,best_score:6840,leaderboard:[]};
 const main=view({screen:'main',hub},settings);assert(!main.includes('board-own'));assert(!main.includes('Ваше место:'));
 const rank=view({screen:'rating',hub},settings);assert(rank.includes('Ваше место: №7'));assert(rank.includes('Рекорд:'));
});
test('Result crops baked number plates without rewriting approved trophy masters',()=>{
 const css=fs.readFileSync(new URL('./ui-v5-3-2.css',import.meta.url),'utf8');assert(css.includes('clip-path:inset(0 0 20% 0)'));assert(css.includes('clip-path:inset(0 0 17% 0)'));
 const html=view({screen:'result',result:{training:true,stats:{foods:24,length:32,max_combo:5}}},settings);
 for(const key of ['food','length','combo'])assert(html.includes(`stat-${key}.png`));
});
test('host uses one shared player-header component and hides technical note only in TEST host',()=>{
 const host=fs.readFileSync(new URL('../test-host.html',import.meta.url),'utf8');assert.equal((host.match(/innerHTML=playerHeader\(\)/g)||[]).length,2);
 assert(!host.includes('<small>Mushroom Fly</small>'));assert(host.includes('#msFlyWrap .rytni-arcade-note{display:none}'));
 assert(host.includes('arcade-backdrop-mobile.png'));assert(host.includes('object-fit:cover'));assert(host.includes('refreshPlayer();},'));
});
