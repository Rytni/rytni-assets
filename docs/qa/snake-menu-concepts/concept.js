import {view} from './design-view.js';
import {createMockBackend} from '../../../arcade/snake-next/product/backend.js';
import {ProductBridge} from '../../../arcade/snake-next/product/bridge.js';
const params=new URLSearchParams(location.search),name=params.get('state')||'main',settings={master:.75,music:.5,sfx:.65,muted:false,quality:'full'};
const hub=await createMockBackend('ready').hub();
const c={screen:name==='leaderboard'?'rating':name==='result-record'?'result':name==='how-to-play'?'rules':name,hub,tab:name==='settings'?'sound':'basics',run:{mode:'ranked'},backend:{mode:'mock'},result:{accepted:true,record:true,response:{score:12480},stats:{score:12480,foods:24,length:32,max_combo:5,portal_uses:2,expansions:1,world:[40,16],active_ticks:6840,bonuses:9}}};
if(name==='result-record')c.hub={...hub,best_score:12480};
document.querySelector('#product').dataset.screen=c.screen;
document.querySelector('#menu').innerHTML=view(c,settings);
if(name==='pause'){
 document.querySelector('#cabinet').classList.add('paused-game');
 const bridge=new ProductBridge(document.querySelector('#game-frame'),{settings,onPause(){},onResult(){},onAction(){}});await bridge.ready();bridge.start(76194);bridge.pause();
}
await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));
window.conceptReady=true;
