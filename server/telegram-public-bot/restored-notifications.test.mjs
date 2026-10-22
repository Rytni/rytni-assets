import test from 'node:test';
import assert from 'node:assert/strict';
import {restoredNotificationText as text,restoredMediaKind as media} from './restored-notifications.js';
test('sponsor chest is distinct from daily chest and contains no private values',()=>{
 assert.match(text('sponsor_chest'),/Сундук от спонсора снова доступен/);assert.equal(media('sponsor_chest'),'chest');
 assert.ok(!text('sponsor_chest',{points:123456,email:'private@example.invalid'}).includes('123456'));
});
for(const [kind,game] of [['arcade_fly','Mushroom Fly'],['arcade_snake','Mushroom Snake']]){
 test(game+' regular reminder is distinct from unclaimed sponsor credit',()=>{
  assert.match(text(kind,{opportunity:'regular'}),new RegExp(game));assert.match(text(kind,{opportunity:'regular'}),/Обычная рейтинговая попытка восстановилась/);
  assert.match(text(kind,{opportunity:'sponsor'}),/получите бонусную попытку кнопкой/);assert.equal(media(kind),'question');
 });
}
test('existing kinds retain their original captions/media; untrusted payload never becomes HTML',()=>{
 for(const kind of ['winner','chest','question','videos']){assert.equal(text(kind),null);assert.equal(media(kind),kind);}
 assert.ok(!text('arcade_snake',{opportunity:'<script>',name:'<script>'}).includes('<script>'));
});
