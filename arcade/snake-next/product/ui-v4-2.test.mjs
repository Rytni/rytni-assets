import test from 'node:test';import assert from 'node:assert/strict';import {view} from './ui.js';
test('Guide keeps book edges outside scrollable page contents',()=>{
 for(const tab of ['basics','bonuses','hazards']){const html=view({screen:'rules',tab},{});assert.equal((html.match(/class="page-content"/g)||[]).length,2);assert.ok(html.indexOf('page-skin')<html.indexOf('page-content'));}
});
test('record and rank have independent flexible value boxes for eight-digit scores',()=>{
 const html=view({screen:'main',hub:{best_score:99999999,my_rank:3000}},{});assert.ok(html.includes('score-value'));assert.ok(html.includes('rank-value'));assert.ok(html.includes('№3000'));assert.ok(html.includes('99 999 999'));
});
