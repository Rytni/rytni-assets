import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {view} from './ui.js';
test('V5 runtime art is byte-identical to approved individual masters, not concepts',()=>{
 const inventory=JSON.parse(readFileSync(new URL('../../../grib/mushroom-snake-ui-v5/inventory.json',import.meta.url)));
 assert.equal(inventory.assets.length,26);
 for(const a of inventory.assets){const bytes=readFileSync(new URL('../../../grib/mushroom-snake-ui-v5/'+a.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.ok(bytes.equals(readFileSync(new URL('../../../'+a.source,import.meta.url))));}
});
test('every result route is a full scene with physical stats and unchanged retry/share routing',()=>{
 for(const training of [false,true])for(const accepted of [false,true]){
  const html=view({screen:'result',hub:{attempts_remaining:3,success:true,best_score:99999999},result:{training,accepted,record:accepted&&!training,response:{score:99999999},stats:{score:99999999,foods:200,length:250,max_combo:9}}},{});
  assert.ok(html.includes('result-scene'));assert.ok(!html.includes('fantasy-panel'));assert.ok(!html.includes('result-story'));assert.ok(html.includes('99 999 999'));
  for(const key of ['food','length','combo'])assert.ok(html.includes('ui-v5/stat-'+key+'.png'));
  assert.ok(html.includes('data-action="main"'));assert.equal(html.includes('data-action="share"'),accepted);if(!training&&!accepted)assert.ok(html.includes('data-action="retry-finish"'));
 }
});
test('V5 does not load diagnostics or rejected equivalent vector icons',()=>{
 for(const screen of ['main','result','settings','rating','pause','rules']){const html=view({screen,hub:{},result:{stats:{}}},{});assert.ok(!html.includes('/docs/qa/'));assert.ok(!html.includes('ui-v4-3/icons/'));}
 const css=readFileSync(new URL('./ui-v5.css',import.meta.url),'utf8');assert.ok(css.includes('max-width:1000px'));assert.ok(css.includes('safe-area-inset'));assert.ok(css.includes('image-rendering:auto!important'));assert.ok(!/blur\(|backdrop-filter|Date\.now/.test(css));
});
