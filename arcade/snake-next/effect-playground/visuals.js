import {effectText as pixelText} from './text.js';
import {drawObject,objectImage} from '../forest-training/objects.js';
import {drawPickup,spriteURL,LABELS} from './art.js';
import {DEFINITIONS} from '../progressive-run/director.js';
export const DETAILS={harvest:'ГРИБЫ ×2 · 16 С',focus:'СПОКОЙНЕЕ · КОМБО ЗАМОРОЖЕНО · 15 С',spores:'СОБИРАЙ СВЕТЯЩИЕСЯ СПОРЫ',guard:'ЩИТ · 1 ЗАРЯД',portalPrize:'НАЙДИ ПОРТАЛ · БОНУС',rush:'СКОРОСТЬ ↑ · 10 С',weak:'ОЧКИ −40% · 12 С',brambles:'КОРНИ · СЛЕДИ ЗА ТРЕЩИНАМИ',mist:'ОБЗОР СУЖЕН · 10 С'};
const has=(s,k)=>s.effects.some(e=>e.kind===k),clamp=n=>Math.max(0,Math.min(1,n));
const corruptCache=new WeakMap();
let cloud;
function fogCloud(){if(cloud)return cloud;cloud=document.createElement('canvas');cloud.width=40;cloud.height=24;const ctx=cloud.getContext('2d');
 for(let y=0;y<24;y+=2)for(let x=0;x<40;x+=2){const d=Math.min(((x-13)/14)**2+((y-12)/10)**2,((x-26)/12)**2+((y-10)/8)**2);if(d>1||d>.72&&(x/2+y/2)%3===0)continue;ctx.globalAlpha=(1-d*.65)*.85;ctx.fillStyle=d<.4?'#adb9b0':'#8fa7a6';ctx.fillRect(x,y,2,2);}return cloud;}
export function foodSprite(art,s){
 if(!has(s,'weak'))return objectImage(art,has(s,'harvest')?'food-gold':'food-red');
 const im=objectImage(art,'food-red');if(!corruptCache.has(im)){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4)if(d.data[i]>d.data[i+1]*1.25){d.data[i]=Math.round(d.data[i]*.43);d.data[i+1]=Math.round(d.data[i+1]*.45);d.data[i+2]=Math.min(180,Math.round(d.data[i]*1.6+40));}x.putImageData(d,0,0);corruptCache.set(im,c);}return corruptCache.get(im);
}
function sparkle(ctx,x,y,size,c){ctx.fillStyle=c;ctx.fillRect(x-size/2,y-size*1.5,size,size*3);ctx.fillRect(x-size*1.5,y-size/2,size*3,size);}
export function drawMote(ctx,x,y,cell,tick,id=0){
 const q=cell/68,r=8*q,b=Math.sin(tick/37+id)*2*q;
 ctx.fillStyle='#75bcb8';ctx.globalAlpha=.22;ctx.fillRect(x-r*1.4,y-r*1.4+b,r*2.8,r*2.8);ctx.globalAlpha=1;
 sparkle(ctx,Math.round(x),Math.round(y+b),Math.max(1,3*q),'#87dccb');sparkle(ctx,Math.round(x),Math.round(y+b),Math.max(1,1.5*q),'#fffbd8');
}
export function drawEffectsWorld(ctx,s,frame,at,cell,art,l){
 const {arena}=l,t=s.tick+frame.alpha,q=cell/68,h={x:l.field.x+(frame.head.x-frame.viewX+.5)*cell,y:l.field.y+(frame.head.y-frame.viewY+.5)*cell};
 if(s.state.food>=0){const p=at(s.state.food),im=foodSprite(art,s),size=cell*.70,scale=size/Math.max(im.width,im.height);
  ctx.drawImage(im,Math.round(p.x-im.width*scale/2),Math.round(p.y-im.height*scale/2+Math.sin(t/67)*2*q),im.width*scale,im.height*scale);
  if(has(s,'harvest')||has(s,'weak'))for(let i=0;i<4;i++){const a=t/70+i*Math.PI/2;ctx.globalAlpha=.6;sparkle(ctx,p.x+Math.cos(a)*cell*.32,p.y+Math.sin(a)*cell*.32,Math.max(1,q),has(s,'weak')?'#ab79c2':'#f0d26b');}ctx.globalAlpha=1;
 }
 for(const p of s.pickups)if(DEFINITIONS[p.kind]){const xy=at(p.cell);drawPickup(ctx,p.kind,xy.x,xy.y,cell,t,l.compact);}
 for(const p of s.spores){const xy=at(p.cell),a=p.magnetTick===undefined?0:clamp((t-p.magnetTick)/18),e=a*a*(3-2*a),bend=Math.sin(a*Math.PI)*cell*.18;
  drawMote(ctx,xy.x+(h.x-xy.x)*e+bend,xy.y+(h.y-xy.y)*e-bend,cell,t,p.cell);
 }
 for(const w of s.director.warnings){const p=at(w.cell),growth=clamp((t-w.starts+30)/30);ctx.fillStyle='#d59b5c';for(let i=0;i<4;i++)ctx.fillRect(p.x-cell*.32+i*cell*.18,p.y+(i%2?-.15:.12)*cell,cell*.17,Math.max(2,q*3));ctx.globalAlpha=.55+.25*Math.sin(t/7);sparkle(ctx,p.x,p.y,Math.max(1,2*q),'#f5bc7a');ctx.globalAlpha=1;if(growth>0){ctx.save();ctx.beginPath();ctx.rect(p.x-cell*.5,p.y+cell*.4-growth*cell*.85,cell,cell);ctx.clip();drawPickup(ctx,'brambles',p.x,p.y,cell,t,l.compact);ctx.restore();}}
 for(const w of s.world.hazards){const p=at(w.cell);drawPickup(ctx,'brambles',p.x,p.y,cell,t,l.compact);}
 for(const k of ['focus','guard'])if(has(s,k)){
  const color=k==='focus'?'#91e9e3':'#add777',r=cell*(k==='guard'?.39:.35);ctx.fillStyle=color;
  for(let i=0;i<16;i++){const a=i*Math.PI/8,rr=r+(k==='focus'?Math.sin(t/13+i)*q:0);ctx.fillRect(Math.round(h.x+Math.cos(a)*rr),Math.round(h.y+Math.sin(a)*rr),2*q,2*q);}
  if(k==='guard'){drawPickup(ctx,'guard',h.x-frame.head.dx*cell*.45,h.y-frame.head.dy*cell*.45,cell*.5,t,false);}
 }
 if(has(s,'rush')){ctx.fillStyle='#ed8650';for(let i=1;i<6;i++){const p=frame.route?.[Math.min(frame.route.length-1,i)];if(!p)continue;ctx.globalAlpha=.6-i*.07;ctx.fillRect(l.field.x+(p.x-frame.viewX+.5)*cell+(i%2?16:-16)*q,l.field.y+(p.y-frame.viewY+.5)*cell,3*q,2*q);}ctx.globalAlpha=1;
  ctx.fillStyle='#c9654e';for(let i=0;i<4;i++){const x=arena.x+((t*3+i*197)%(arena.w-20));ctx.globalAlpha=.35;ctx.fillRect(x,arena.y+5,12*q,2*q);ctx.fillRect(x,arena.y+arena.h-7,12*q,2*q);}ctx.globalAlpha=1;
 }
 const reward=s.feedback.findLast(f=>f.kind==='portal-reward'),trail=s.portalEdges?.some(e=>e.move===s.portalRewardMove&&!e.complete);
 if(has(s,'portalPrize')&&s.portalAvailable()||trail||reward&&s.tick-reward.tick<120)for(const c of s.portals){const p=at(c);ctx.fillStyle='#d8e896';for(let i=0;i<12;i++){const a=t/75+i*Math.PI/6;ctx.fillRect(p.x+Math.cos(a)*cell*.22,p.y+Math.sin(a)*cell*.22,2*q,2*q);}}
 if(trail||reward&&s.tick-reward.tick<120){ctx.fillStyle='#a5e9cf';for(let i=1;i<8;i++){const p=frame.route?.[i];if(p){const xy=at(p.y*s.arena.width+p.x);ctx.fillRect(xy.x,xy.y+Math.sin(t/8+i)*cell*.2,3*q,3*q);}}}
 for(const f of s.feedback){const a=(t-f.tick)/60;if(a<0||a>.34)continue;const p=at(f.cell);
  if(['seed','portal-reward'].includes(f.kind)){
   const color=f.corrupt?'#c998d4':f.harvest||f.kind==='portal-reward'?'#ffdf72':'#f7efb5',count=f.strong?12:Math.min(10,4+(f.combo||1));
   if(f.kind==='seed'&&!f.spore&&a<.08){const im=foodSprite(art,s),w=cell*.65,height=cell*.30;ctx.drawImage(im,p.x-w/2,p.y-height/2,w,height);}
   for(let i=0;i<count;i++){const theta=i*Math.PI*2/count,r=cell*(.14+a*1.4);ctx.globalAlpha=(1-a/.34)*.8;ctx.fillStyle=color;ctx.fillRect(p.x+Math.cos(theta)*r,p.y+Math.sin(theta)*r,2*q,2*q);}ctx.globalAlpha=1;
   pixelText(ctx,'+'+f.amount,Math.round(p.x),Math.round(p.y-cell*(.5+a)),Math.max(1,Math.floor(cell/28)+(f.combo>=6?1:0)),color,'center');
   // Decorative reaction only; the locked V4 silhouette/mask is untouched.
   ctx.fillStyle=color;ctx.fillRect(h.x-frame.head.dy*7*q,h.y+frame.head.dx*7*q,2*q,2*q);
  }else if(['root-decay','guard-used'].includes(f.kind)){for(let i=0;i<12;i++){const theta=i*Math.PI/6;ctx.fillStyle=i%2?'#bcd28c':'#7d714c';ctx.globalAlpha=1-a/.34;ctx.fillRect(p.x+Math.cos(theta)*cell*a*2,p.y+Math.sin(theta)*cell*a*2,3*q,3*q);}ctx.globalAlpha=1;}
 }
 if(has(s,'mist')){
  // Layered native cloud puffs drift inward from ALL edges. No noise field,
  // rectangular bands, blur/filter, or extra animation clock. Hard clear disk.
  ctx.save();ctx.beginPath();ctx.rect(arena.x,arena.y,arena.w,arena.h);ctx.moveTo(h.x+4.5*cell,h.y);ctx.arc(h.x,h.y,4.5*cell,0,Math.PI*2);ctx.clip('evenodd');
  for(let side=0;side<4;side++)for(let layer=0;layer<2;layer++)for(let i=0;i<(side<2?8:4);i++){
   const p=(t/(240+layer*45)+i*.137+side*.19+layer*.4)%1,travel=p*cell*3.6,size=cell*(3.1+(i%3)*.4),count=side<2?8:4;
   const x=side<2?arena.x+(i+.5)/count*arena.w+(layer?cell*.35:0):side===2?arena.x+travel:arena.x+arena.w-travel;
   const y=side>=2?arena.y+(i+.5)/count*arena.h:side===0?arena.y+travel:arena.y+arena.h-travel;
   const density=clamp((Math.hypot(x-h.x,y-h.y)/cell-3.5)/5);ctx.globalAlpha=Math.sin(p*Math.PI)*(.42+layer*.12)*density;
   ctx.drawImage(fogCloud(),Math.round(x-size/2),Math.round(y-size*.3),size,size*.6);
  }ctx.restore();ctx.globalAlpha=1;
  // Goals remain discernible beyond the clear safety radius.
  if(s.state.food>=0){const p=at(s.state.food),im=foodSprite(art,s),scale=cell*.7/Math.max(im.width,im.height);if(Math.hypot(p.x-h.x,p.y-h.y)>4.5*cell){ctx.globalAlpha=.8;ctx.drawImage(im,Math.round(p.x-im.width*scale/2),Math.round(p.y-im.height*scale/2+Math.sin(t/67)*2*q),im.width*scale,im.height*scale);ctx.globalAlpha=1;sparkle(ctx,p.x,p.y-cell*.27,Math.max(1,q),'#e7d9a6');}}
  if(s.portalAvailable()||s.portalEdges.some(e=>!e.complete))for(const c of s.portals){const p=at(c);if(Math.hypot(p.x-h.x,p.y-h.y)>4.5*cell){ctx.globalAlpha=.6;drawObject(ctx,art,'portal',p.x,p.y,cell);ctx.globalAlpha=1;}}
 }
 const notice=s.effectNotices.at(-1);if(notice&&t-notice.tick<78){
  const k=notice.kind,positive=DEFINITIONS[k].positive,scale=Math.max(1,Math.floor(cell/32)),w=Math.min(arena.w*.9,520*scale),x=arena.x+arena.w/2,y=arena.y+cell*.12;
  ctx.fillStyle=positive?'#12382eea':'#301a32ef';ctx.fillRect(x-w/2,y,w,30*scale);ctx.strokeStyle=positive?'#cbd79a':'#b9778e';ctx.lineWidth=2;ctx.strokeRect(x-w/2,y,w,30*scale);
  pixelText(ctx,(positive?'+ ':'! ')+(k==='harvest'?'ЗОЛОТОЙ УРОЖАЙ':LABELS[k]||DEFINITIONS[k].label),Math.round(x),Math.round(y+3*scale),scale,positive?'#f2e7a3':'#ffb4c6','center');
  const detail=notice.tutorial?DETAILS.spores:DETAILS[k];pixelText(ctx,detail,Math.round(x),Math.round(y+17*scale),scale,'#e7e6ce','center');
 }
 const lastFood=s.feedback.findLast(f=>f.kind==='seed'&&!f.spore);if(lastFood?.maxReached&&t-lastFood.tick<60)pixelText(ctx,'MAX COMBO',Math.round(h.x),Math.round(h.y-cell*.85),Math.max(1,Math.floor(cell/32)),'#f4df8e','center');
}
export function effectSlots(root,s,compact=false){
 const positives=s.effects.filter(e=>DEFINITIONS[e.kind].positive),negative=s.effects.find(e=>!DEFINITIONS[e.kind].positive),slots=[positives[0],positives[1],negative],key=slots.map(e=>e?.kind||'_').join(',');
 if(root.dataset.progressEffects!==key||!root.children.length){root.dataset.progressEffects=key;root.innerHTML=slots.map((e,i)=>e?`<div class="effect ${i===2?'negative':'positive'}" data-effect="${e.kind}" title="${DETAILS[e.kind]}" aria-label="${LABELS[e.kind]} · ${DETAILS[e.kind]}"><img alt="" src="${spriteURL(e.kind)}"><span>${LABELS[e.kind]}</span><b></b><em>${e.kind==='weak'?'ОЧКИ −40%':e.kind==='harvest'?'ГРИБЫ ×2':''}</em><progress max="1" value="1"></progress></div>`:`<div class="effect-vacant ${i===2?'negative':'positive'}" aria-label="${i===2?'Дебафф':'Бонус'}: пусто"></div>`).join('');}
 for(const e of s.effects){const card=root.querySelector(`[data-effect="${e.kind}"]`),d=DEFINITIONS[e.kind];if(!card)continue;const remaining=Math.max(0,e.ends-s.tick);card.querySelector('b').textContent=d.charge?'1 ◆':Math.ceil(remaining/60)+'С';card.querySelector('progress').value=d.charge?1:remaining/d.duration;card.style.boxShadow=e.kind==='rush'?`inset 0 0 8px #${Math.sin(s.tick/8)>0?'914658':'442039'}`:'';}
 for(const e of s.effects){const label=root.querySelector(`[data-effect="${e.kind}"] span`);if(label)label.textContent=(LABELS[e.kind]||DEFINITIONS[e.kind].label)+(compact&&e.kind==='weak'?' −40%':compact&&e.kind==='harvest'?' ×2':'');}
 const game=root.closest('#game'),combo=game?.querySelector('#combo')?.parentElement;if(combo){combo.style.boxShadow=has(s,'focus')?`inset 0 0 ${10+Math.round(Math.sin(s.tick/15)*2)}px #49aca6`:s.feedback.some(f=>f.kind==='seed'&&s.tick-f.tick<18)?'inset 0 0 12px #ac8c3c':'';}
}
export function drawEffectLabels(hud){
 const canvas=hud.querySelector('.hud-type');if(!canvas)return;const ctx=canvas.getContext('2d'),r=hud.getBoundingClientRect(),win=hud.ownerDocument.defaultView;
 for(const n of hud.querySelectorAll('.effect span,.effect b')){const b=n.getBoundingClientRect(),style=win.getComputedStyle(n),size=Math.max(1,Math.floor(parseFloat(style.fontSize)/7));ctx.clearRect(b.x-r.x,b.y-r.y,b.width,b.height);pixelText(ctx,n.textContent,Math.round(b.x-r.x+b.width/2),Math.round(b.y-r.y+(b.height-7*size)/2),size,n.matches('b')?'#fff0ba':'#e5d7ab','center');}
}
