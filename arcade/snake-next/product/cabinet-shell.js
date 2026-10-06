import {capacity,effectiveRate} from '../effect-playground/capacity-model.js';
const UI='/grib/mushroom-snake-ui-v4/';
// Read-only presentation: no world/FIT geometry change and no extra RAF/timer.
export function installProductShell(game){
 const rail=game.root.ownerDocument.createElement('footer');rail.className='product-lower-rail';rail.hidden=true;rail.setAttribute('aria-label','Состояние леса');
 rail.innerHTML=`<img src="${UI}icons/attempt-48.png" width="48" height="48" alt=""><div><strong data-rail-biome>ЛЕС</strong><span data-rail-world></span></div><div><small>СВОБОДНО</small><b data-rail-free></b></div><div><small>СКОРОСТЬ</small><b data-rail-speed></b></div><img src="${UI}icons/rank-48.png" width="48" height="48" alt="">`;
 game.root.append(rail);
 const render=game.render.bind(game);game.render=()=>{render();const l=game.renderer.last,s=game.session;
  if(!l||!s?.world){rail.hidden=true;return;}
  const cabinetBottom=Math.round(l.cabinet.y+l.cabinet.h),remaining=Math.max(0,game.renderer.h-cabinetBottom),height=Math.min(64,remaining),top=game.renderer.h-height;
  rail.hidden=remaining<=32||game.portrait;
  if(rail.hidden)return;
  Object.assign(rail.style,{top:top+'px',height:height+'px',left:Math.round(l.cabinet.x)+'px',width:Math.round(l.cabinet.w)+'px'});
  // The approved straight bottom strip ends 38 native px above the corner
  // canvas bottom. Bridge ONLY that empty center; keep corner mushrooms intact.
  rail.style.setProperty('--rail-bridge',Math.round(38*l.scale+Math.max(0,remaining-height))+'px');
  rail.style.setProperty('--rail-surplus',Math.max(0,remaining-height)+'px');
  rail.style.setProperty('--rail-corner',Math.round(128*l.scale)+'px');
  rail.querySelector('[data-rail-biome]').textContent={forest:'ЛЕС',caves:'ПЕЩЕРЫ',swamp:'БОЛОТО'}[s.world.biome]||'ЛЕС';
  rail.querySelector('[data-rail-world]').textContent=`${s.world.width} × ${s.world.height}`;
  rail.querySelector('[data-rail-free]').textContent=Math.round(capacity(s).freeRatio*100)+'%';
  rail.querySelector('[data-rail-speed]').textContent=(effectiveRate(s)/1e6).toFixed(1);
 };
 return rail;
}
