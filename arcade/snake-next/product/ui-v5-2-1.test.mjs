import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {view} from './ui.js';
test('V5.2.1 Main owns one lowerStatusDock with attempts and both value cells',()=>{
 const html=view({screen:'main',hub:{attempts_remaining:3,best_score:99999999,my_rank:9999}},{});
 assert.equal((html.match(/lower-status-dock/g)||[]).length,1);
 assert.match(html, /lower-status-dock[^>]*>[\s\S]*attempt-tray[\s\S]*record-safe[\s\S]*rank-safe/);
 assert.equal((html.match(/class="token /g)||[]).length,5);
});
test('V5.2.1 bounded cell plates and container-only compact layout do not alter art',()=>{
 const css=readFileSync(new URL('./ui-v5-2.css',import.meta.url),'utf8').split('/* V5.2.1:')[1];
 assert.ok(css.includes('position:relative;inset:auto;width:100%'));
 assert.ok(css.includes('@container snake-stage (max-width:1200px)'));
 assert.ok(css.includes('bottom:10px'));assert.ok(css.includes('max-width:calc(100% - 24px)'));
 assert.ok(css.includes('.primary-stats b{background:none'));assert.ok(css.includes('.result-note{background:none'));
 assert.ok(!/url\(|@media|scale\(|filter:|blur\(/.test(css));
 const values=readFileSync(new URL('./record-place-value.js',import.meta.url),'utf8');
 assert.ok(values.includes('width-18'));assert.ok(!/fullscreenElement|innerWidth/.test(values));
});
