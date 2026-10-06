import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {view} from './ui.js';
const inv=JSON.parse(readFileSync(new URL('../../../grib/mushroom-snake-ui-v4/inventory.json',import.meta.url)));
test('new native UI icons are independent48px PNGs, not runtime scaled atlas',()=>{
 assert.equal(inv.icons.length,20);for(const key of inv.icons){const a=inv.assets.find(a=>a.file===`icons/${key}-48.png`);assert.deepEqual(a.size,[48,48]);assert.ok(a.alpha_ratio>.08&&a.alpha_ratio<.8);}
});
test('visible center and edge ink gates reject a transparent join even when aspect passes',()=>{
 for(const kind of ['play','wood','danger'])assert.ok(inv.assets.find(a=>a.file===`buttons/${kind}-center.png`).alpha_ratio>.45);
 for(const side of ['top','bottom','left','right'])assert.ok(inv.assets.find(a=>a.file===`panels/${side}.png`).alpha_ratio>.06);
});
test('Main has explicit identity, actions, information and leaderboard zones; UI controls keep handlers',()=>{
 const html=view({screen:'main',hub:{success:true,attempts_remaining:3},hostSwitch:true},{muted:false});
 for(const cls of ['main-identity','main-choices','main-info','tournament-board'])assert.ok(html.includes(cls));
 for(const action of ['play','training','rules','settings','rating','mute','fullscreen','other-game'])assert.ok(html.includes(`data-action="${action}"`));
 assert.ok(html.includes('mushroom-snake-ui-v4/hero.png'));
});
test('volume channels remain present behind a native accessible44px disclosure',()=>{
 const html=view({screen:'settings',tab:'sound'},{master:.7,music:.5,sfx:.6});assert.ok(html.includes('sound-mix'));for(const key of ['master','music','sfx'])assert.ok(html.includes(`data-setting="${key}"`));
 assert.ok(readFileSync(new URL('./ui-v4.css',import.meta.url),'utf8').includes('.settings-row input{min-height:44px}'));
});
