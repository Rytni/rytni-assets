import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {view} from './ui.js';
test('V5.2 uses independent attempt headings and shared measured score/rank slots',()=>{
 const h=view({screen:'main',hub:{attempts_remaining:3,sponsor_attempts_used:0,sponsor_attempt_credits:0,best_score:99999999,my_rank:9999}},{});
 assert.ok(h.includes('ЕЖЕДНЕВНЫЕ'));assert.ok(h.includes('ОТ СПОНСОРА'));assert.equal((h.match(/data-record-place/g)||[]).length,2);assert.ok(!h.includes('value-wide'));
 const component=readFileSync(new URL('./record-place-value.js',import.meta.url),'utf8');assert.ok(component.includes('document.fonts.ready'));assert.ok(component.includes('getBoundingClientRect().width'));assert.ok(component.includes('[26,24,22,20,18,16]'));assert.ok(!/fullscreenElement|pseudo-fullscreen/.test(component));
});
test('V5.2 typography has nonshrinking TOP3 and real frame-safe Settings grid',()=>{
 const css=readFileSync(new URL('./ui-v5-2.css',import.meta.url),'utf8');assert.ok(css.includes('padding-bottom:3px'));assert.ok(css.includes('flex:none'));assert.ok(css.includes('padding-inline:48px'));assert.ok(css.includes('grid-template-columns:48px minmax(0,1fr) 140px'));assert.ok(css.includes('position:static'));assert.ok(css.includes('max-width:800px'));assert.ok(!/url\(|blur\(|scale\(/.test(css));
});
test('host header uses real application data and textContent, clean Fly cover fills card',()=>{
 const host=readFileSync(new URL('../test-host.html',import.meta.url),'utf8');assert.ok(host.includes('currentApplication'));assert.ok(host.includes('e.textContent=text'));assert.ok(host.includes('profileAvatar'));assert.ok(host.includes('object-fit:cover;object-position:50% 50%'));assert.ok(!host.includes('TEST · рейтинг демонстрационный'));assert.ok(!host.includes('participant_number:'));assert.ok(!host.includes('15790'));
});
