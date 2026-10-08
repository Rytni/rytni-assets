import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {view} from './ui.js';
test('V5.1 declares eight shared typography roles and one optical correction without art replacement',()=>{
 const css=readFileSync(new URL('./ui-v5-1.css',import.meta.url),'utf8');
 for(const role of ['score','screen','section','button','ui','value','secondary','micro'])assert.ok(css.includes('--type-'+role+':'));
 assert.ok(css.includes('--button-label-optical-y:3px'));assert.ok(css.includes('place-items:center'));assert.ok(css.includes('.btn.btn-icon .button-label{display:none}'));
 assert.ok(css.includes('grid-template-rows:repeat(3,minmax(0,1fr))'));assert.ok(css.includes('.preview-leaders li{align-self:center}'));
 assert.ok(!/url\(|image-rendering|scale\(|blur\(|Date\.now|requestAnimationFrame/.test(css));
});
test('V5.1 keeps one status and valid result actions; no debug-like telemetry or misleading success',()=>{
 for(const training of [false,true])for(const accepted of [false,true]){
  const html=view({screen:'result',hub:{best_score:99999999,success:true,attempts_remaining:2},result:{training,accepted,response:{score:100},stats:{score:100,portal_uses:3}}},{});
  assert.equal((html.match(/class="result-note"/g)||[]).length,1);assert.ok(!html.includes('result-audit'));assert.ok(!html.includes('Порталы'));
  assert.equal(html.includes('data-action="share"'),accepted);assert.equal(html.includes('Сохранён · Рекорд:'),!training&&accepted);
 }
});
test('visible buttons and tabs share a label wrapper; settings disclosure owns three actual sliders',()=>{
 const html=view({screen:'settings',tab:'sound'}, {master:.5,music:.5,sfx:.5});
 assert.ok(!html.includes('Настроить громкость'));assert.equal((html.match(/type="range"/g)||[]).length,3);
 assert.ok(html.includes('Предупреждения и эффекты игры'));
 for(const match of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g))if(!match[0].includes('panel-close'))assert.ok(match[1].includes('button-label'));
});
