import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {view,board} from './ui.js';
import {installProductShell} from './cabinet-shell.js';
import {TunnelSession} from '../gate-one/session.js';
const root=new URL('../../../grib/mushroom-snake-ui-v3/',import.meta.url);
test('all twenty authored icons have native48 transparent PNG contracts',()=>{
 const inv=JSON.parse(readFileSync(new URL('inventory.json',root)));assert.equal(inv.icons.length,20);
 for(const icon of inv.icons){const b=readFileSync(new URL('icons/'+icon+'-48.png',root));assert.equal(b.readUInt32BE(16),48);assert.equal(b.readUInt32BE(20),48);assert.equal(b[25],6);}
});
test('each product panel owns fixed corners and an independent themed crest',()=>{
 for(const [screen,theme] of [['pause','pause'],['confirm-restart','confirm'],['settings','settings'],['rules','guide']]){
  const html=view({screen,tab:screen==='settings'?'sound':'basics',run:{mode:'training'}},{master:.5,music:.5,sfx:.5});
  for(const c of ['tl','tr','bl','br'])assert.ok(html.includes('skin-'+c));assert.ok(html.includes('crest-'+theme+'.png'));assert.ok(!html.includes('board-frame.png'));
 }
 // V4.3 Ranking keeps ONE outer illustrated frame; rows no longer own a
 // second scroll-clipped panel/crest inside that frame.
 assert.ok(view({screen:'rating',hub:{leaderboard:[]}},{}).includes('crest-tournament.png'));
 assert.ok(!board({leaderboard:[]}).includes('panel-skin'));
});
test('primary/danger Russian actions use real caps and plain centers, never complete buttons',()=>{
 for(const [screen,kind] of [['pause','play'],['confirm-restart','danger']]){
  const html=view({screen,run:{mode:'training'}},{});assert.ok(html.includes('/buttons/'+kind+'-left.png'));assert.ok(html.includes('/buttons/'+kind+'-right.png'));assert.ok(html.includes('button-center'));assert.ok(!html.includes('button-play.png'));
 }
});
test('product shell has no lower rail and preserves canonical layout/hash without another clock',()=>{
 const session=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}}),canvas={style:{}};
 let appended=0;const root={append(){appended++;}};
 const game={root,session,renderer:{canvas,h:1080,last:{cabinet:{x:0,y:0,w:1920,h:974},scale:1.33}},render(){}};
 const before=session.hash(),layout=JSON.stringify(game.renderer.last);
 assert.equal(installProductShell(game),root);game.render();
 assert.equal(appended,0);assert.equal(session.hash(),before);assert.equal(JSON.stringify(game.renderer.last),layout);
 assert.equal(canvas.style.clipPath,'none');
 const source=readFileSync(new URL('./cabinet-shell.js',import.meta.url),'utf8');assert.ok(!/requestAnimationFrame|setTimeout|setInterval|Date\\.now|createElement/.test(source));
});
