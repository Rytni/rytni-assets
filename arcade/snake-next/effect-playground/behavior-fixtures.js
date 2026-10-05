import {bodyCells} from '../simulation/body.js';
import {hazardSafe} from '../progressive-run/world.js';
import {ROOT_LIFECYCLE} from '../progressive-run/director.js';

// DEV-only canonical lifecycle fixtures. The blocked telegraph is deliberately
// near existing mandatory food; it stays at that cell and cannot become solid.
export function seedRootReview(s){
 const occupied=new Set(bodyCells(s.state)),legal=[];
 for(let y=1;y<s.world.height-1;y++)for(let x=1;x<s.world.width-1;x++){
  const c=y*s.arena.width+x;if(!s.arena.blocked(c)&&!occupied.has(c)&&!s.forbidden(c)&&c!==s.state.food)legal.push(c);
 }
 const food=s.state.food,w=s.arena.width,dist=c=>Math.abs(c%w-food%w)+Math.abs(Math.floor(c/w)-Math.floor(food/w));
 const blocked=legal.find(c=>food>=0&&dist(c)<=2),normal=legal.find(c=>c!==blocked&&hazardSafe(s,c));
 const starts=s.tick+ROOT_LIFECYCLE.telegraph;
 s.director.warnings=[normal,blocked].filter(c=>c!==undefined).map(cell=>({cell,born:s.tick,phase:'warning',starts,pendingDeadline:starts+ROOT_LIFECYCLE.grace}));
 s.director.hazardCooldown=s.tick+1200;
 s.devCommands.push({kind:'root-lifecycle-review',tick:s.tick,normal:normal??null,blocked:blocked??null});
 return {normal,blocked};
}
export function installVfxReview(root,getGame,clear,focus){
 for(const [mode,label]of [['rush','RUSH MOTION'],['roots','ROOT LIFECYCLE'],['mist','MIST']]){
  const b=document.createElement('button');b.dataset.vfxReview=mode;b.textContent=label;b.setAttribute('aria-pressed','false');
  b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{
   const g=getGame(),s=g?.session;if(!s?.world)return;clear();g.vfxReviewMode=mode;b.setAttribute('aria-pressed','true');
   const roots=mode==='roots'?seedRootReview(s):null;
   root.querySelector('#effect-playground-status').textContent=roots?`DEV canonical Roots · normal ${roots.normal??'unavailable'} / blocked near food ${roots.blocked??'unavailable'} · fixed cells; collect food to release pending`:`DEV ${label} · persistent render-only rehearsal · B mechanics/durations unchanged`;
   g.render();focus();
  });root.querySelector('.toolbar').append(b);
 }
}
