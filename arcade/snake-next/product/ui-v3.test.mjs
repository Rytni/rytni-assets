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
 assert.ok(board({leaderboard:[]}).includes('crest-tournament.png'));
});
test('primary/danger Russian actions use real caps and plain centers, never complete buttons',()=>{
 for(const [screen,kind] of [['pause','play'],['confirm-restart','danger']]){
  const html=view({screen,run:{mode:'training'}},{});assert.ok(html.includes('/buttons/'+kind+'-left.png'));assert.ok(html.includes('/buttons/'+kind+'-right.png'));assert.ok(html.includes('button-center'));assert.ok(!html.includes('button-play.png'));
 }
});
test('lower cabinet rail reads canonical state without a clock, write, or geometry change',()=>{
 const elements=new Map(),styles={};
 const rail={setAttribute(){},querySelector(key){if(!elements.has(key))elements.set(key,{});return elements.get(key);},style:{setProperty(k,v){styles[k]=v;}}};
 const session=new TunnelSession({seed:17,progression:{model:'fit-world-v2',density:0}});
 const game={root:{ownerDocument:{createElement:()=>rail},append(){}},session,portrait:false,renderer:{h:1080,last:{cabinet:{x:0,y:0,w:1920,h:974},scale:1.33}},render(){}};
 const before=session.hash(),layout=JSON.stringify(game.renderer.last);
 installProductShell(game);game.render();
 assert.equal(session.hash(),before);assert.equal(JSON.stringify(game.renderer.last),layout);
 assert.equal(rail.hidden,false);assert.equal(rail.style.height,'64px');assert.equal(styles['--rail-bridge'],'93px');
 game.renderer.h=990;game.render();assert.equal(rail.hidden,true);
 const source=readFileSync(new URL('./cabinet-shell.js',import.meta.url),'utf8');assert.ok(!/requestAnimationFrame|setTimeout|setInterval|Date\.now/.test(source));
});
