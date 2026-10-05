import {effectText as pixelText} from './text.js';
import {drawObject,objectImage} from '../forest-training/objects.js';
import {drawPickup,spriteURL,LABELS} from './art.js';
import {DEFINITIONS} from '../progressive-run/director.js';
import {drawVfx} from './vfx-art.js';
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
 const size=Math.max(14,cell*.32),b=Math.sin(tick/37+id)*Math.min(2,cell*.035);
 drawVfx(ctx,'mote',x,y+b,size*1.45,tick,.22);drawVfx(ctx,'mote',x,y+b,size,tick);
}
export function drawEffectsWorld(ctx,s,frame,at,cell,art,l){
 const {arena}=l,t=s.tick+frame.alpha,q=cell/68,h={x:l.field.x+(frame.head.x-frame.viewX+.5)*cell,y:l.field.y+(frame.head.y-frame.viewY+.5)*cell};
 if(s.state.food>=0){const p=at(s.state.food),im=foodSprite(art,s),size=cell*.70,scale=size/Math.max(im.width,im.height);
  ctx.drawImage(im,Math.round(p.x-im.width*scale/2),Math.round(p.y-im.height*scale/2+Math.sin(t/67)*2*q),im.width*scale,im.height*scale);
  if(has(s,'harvest'))drawVfx(ctx,'crown',p.x,p.y-cell*.29,Math.max(12,cell*.3),t,.9);
  if(has(s,'harvest')||has(s,'weak'))for(let i=0;i<3;i++){const a=t/70+i*2.1;drawVfx(ctx,has(s,'weak')?'mold':'glint',p.x+Math.cos(a)*cell*.32,p.y+Math.sin(a)*cell*.32,Math.max(7,cell*.16),t+i*8,.65);}
 }
 for(const p of s.pickups)if(DEFINITIONS[p.kind]){const xy=at(p.cell);drawPickup(ctx,p.kind,xy.x,xy.y,cell,t,l.compact);}
 for(const p of s.spores){const xy=at(p.cell),a=p.magnetTick===undefined?0:clamp((t-p.magnetTick)/18),e=a*a*(3-2*a),bend=Math.sin(a*Math.PI)*cell*.18;
  const x=xy.x+(h.x-xy.x)*e+bend,y=xy.y+(h.y-xy.y)*e-bend;
  if(a>0)for(let j=1;j<=3;j++){const back=Math.max(0,a-j*.12),be=back*back*(3-2*back),bb=Math.sin(back*Math.PI)*cell*.18;drawVfx(ctx,'glint',xy.x+(h.x-xy.x)*be+bb,xy.y+(h.y-xy.y)*be-bb,Math.max(5,cell*.12),t+j*4,.4-j*.08);}
  drawMote(ctx,x,y,cell,t,p.cell);
 }
 for(const w of s.director.warnings){const p=at(w.cell),growth=clamp((t-w.starts+36)/36);drawVfx(ctx,'cracks',p.x,p.y,cell*.9,t,.75+.2*Math.sin(t/9));if(growth>0)drawVfx(ctx,'tips',p.x,p.y,cell*.85,t,growth);}
 for(const w of s.world.hazards){const p=at(w.cell);drawVfx(ctx,'roots',p.x,p.y,cell*.96,t);}
 for(const k of ['focus','guard'])if(has(s,k)){
  const dx=frame.head.dx,dy=frame.head.dy;
  if(k==='focus')for(let i=0;i<3;i++){const a=t/130+i*2.1,r=cell*.34;drawVfx(ctx,'wisp',h.x+Math.cos(a)*r,h.y+Math.sin(a)*r,Math.max(12,cell*.34),t+i*10,.85);}
  if(k==='guard'){drawPickup(ctx,'guard',h.x-dx*cell*.38,h.y-dy*cell*.38,Math.max(24,cell*.52),t,false);
   for(const side of [-1,1])drawVfx(ctx,'plate',h.x-dy*side*cell*.30+dx*cell*.08,h.y+dx*side*cell*.30+dy*cell*.08,Math.max(13,cell*.34),t);
  }
 }
 if(has(s,'rush')){for(let i=1;i<5;i++){const p=frame.route?.[Math.min(frame.route.length-1,i)];if(!p)continue;drawVfx(ctx,i%2?'ember':'thorn',l.field.x+(p.x-frame.viewX+.5)*cell+(i%2?16:-16)*q,l.field.y+(p.y-frame.viewY+.5)*cell,Math.max(10,cell*.3),t+i*7,.75-i*.1);}
 }
 const reward=s.feedback.findLast(f=>f.kind==='portal-reward'),trail=s.portalEdges?.some(e=>e.move===s.portalRewardMove&&!e.complete);
 if(has(s,'portalPrize')&&s.portalAvailable()||trail||reward&&s.tick-reward.tick<120)for(const c of s.portals){const p=at(c);drawVfx(ctx,'rune',p.x,p.y,cell*.55,t);for(let i=0;i<3;i++)drawVfx(ctx,i%2?'glint':'wisp',p.x+Math.sin(t/85+i*2.1)*cell*.28,p.y+Math.cos(t/85+i*2.1)*cell*.28,Math.max(7,cell*.2),t+i*5,.6);}
 if(trail||reward&&s.tick-reward.tick<120)for(const span of frame.spans||[{route:frame.route}])for(let i=1;i<Math.min(6,span.route?.length||0);i++){const p=span.route[i],xy=at(p.y*s.arena.width+p.x);drawVfx(ctx,'rune',xy.x,xy.y,Math.max(10,cell*.25),t+i*6,.65);}
 for(const f of s.feedback){const a=(t-f.tick)/60;if(a<0||a>.34)continue;const p=at(f.cell);
  if(['seed','portal-reward'].includes(f.kind)){
   const color=f.corrupt?'#c998d4':f.harvest||f.kind==='portal-reward'?'#ffdf72':'#f7efb5',count=f.strong?12:Math.min(10,4+(f.combo||1));
   if(f.kind==='seed'&&!f.spore&&a<.08){const im=foodSprite(art,s),w=cell*.65,height=cell*.30;ctx.drawImage(im,p.x-w/2,p.y-height/2,w,height);}
   for(let i=0;i<count;i++){const theta=i*Math.PI*2/count,r=cell*(.14+a*1.4);drawVfx(ctx,f.corrupt?'mold':'glint',p.x+Math.cos(theta)*r,p.y+Math.sin(theta)*r,Math.max(5,cell*(f.strong?.16:.10)),t+i*5,(1-a/.34)*.8);}
   pixelText(ctx,'+'+f.amount,Math.round(p.x),Math.round(p.y-cell*(.5+a)),Math.max(1,Math.floor(cell/28)+(f.combo>=6?1:0)),color,'center');
   // Decorative reaction only; the locked V4 silhouette/mask is untouched.
   ctx.fillStyle=color;ctx.fillRect(h.x-frame.head.dy*7*q,h.y+frame.head.dx*7*q,2*q,2*q);
  }else if(['root-decay','guard-used'].includes(f.kind)){for(let i=0;i<4;i++){const theta=i*Math.PI/2;drawVfx(ctx,f.kind==='guard-used'?'cracked':'decay',p.x+Math.cos(theta)*cell*a*2,p.y+Math.sin(theta)*cell*a*2,Math.max(14,cell*.4),t+i*3,1-a/.34);}}
  else if(f.effect==='weak'&&a<.3)for(let i=0;i<3;i++)drawVfx(ctx,'mold',h.x+Math.sin(i*2.1)*cell*a*2,h.y+Math.cos(i*2.1)*cell*a*2,Math.max(14,cell*.35),t+i*7,1-a/.3);
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
 // No effect pickup notice or explanatory prose in the steering area.
 const lastFood=s.feedback.findLast(f=>f.kind==='seed'&&!f.spore);if(lastFood?.maxReached&&t-lastFood.tick<60)pixelText(ctx,'MAX COMBO',Math.round(h.x),Math.round(h.y-cell*.85),Math.max(1,Math.floor(cell/32)),'#f4df8e','center');
}
export function effectSlots(root,s,compact=false){
 const positives=s.effects.filter(e=>DEFINITIONS[e.kind].positive),negative=s.effects.find(e=>!DEFINITIONS[e.kind].positive),slots=[positives[0],positives[1],negative],key=slots.map(e=>e?.kind||'_').join(',');
 if(root.dataset.progressEffects!==key||!root.children.length){root.dataset.progressEffects=key;root.innerHTML=slots.map((e,i)=>e?`<div class="effect ${i===2?'negative':'positive'}" data-effect="${e.kind}" aria-label="${LABELS[e.kind]}"><img alt="" src="${spriteURL(e.kind)}"><span>${LABELS[e.kind]}</span><b></b><i>${e.kind==='harvest'?'×2':''}</i></div>`:`<div class="effect-vacant ${i===2?'negative':'positive'}" aria-label="${i===2?'Дебафф':'Бонус'}: пусто"></div>`).join('');}
 for(const e of s.effects){const card=root.querySelector(`[data-effect="${e.kind}"]`),d=DEFINITIONS[e.kind];if(!card)continue;const remaining=Math.max(0,e.ends-s.tick);card.querySelector('b').textContent=d.charge?'1 ◆':Math.ceil(remaining/60)+'С';card.setAttribute('aria-label',`${LABELS[e.kind]} · ${card.querySelector('b').textContent}`);
  const age=s.tick-(e.started??-100),p=age>=0&&age<27?age/27:1,glow=p<1?Math.sin(p*Math.PI):0;
  card.dataset.pickupGlow=glow;card.style.boxShadow=glow?`inset 0 0 ${Math.round(3+glow*7)}px ${d.positive?'#d9e2a0':'#d18aab'}`:'';card.querySelector('img').style.transform=glow?`scale(${1+glow*.15})`:'';
 }
 const game=root.closest('#game'),combo=game?.querySelector('#combo')?.parentElement;if(combo){combo.style.boxShadow=has(s,'focus')?`inset 0 0 ${10+Math.round(Math.sin(s.tick/15)*2)}px #49aca6`:s.feedback.some(f=>f.kind==='seed'&&s.tick-f.tick<18)?'inset 0 0 12px #ac8c3c':'';}
}
export function drawEffectLabels(hud){
 const canvas=hud.querySelector('.hud-type');if(!canvas)return;const ctx=canvas.getContext('2d'),r=hud.getBoundingClientRect(),win=hud.ownerDocument.defaultView;
 for(const card of hud.querySelectorAll('.effect')){const box=card.getBoundingClientRect();ctx.save();ctx.beginPath();ctx.rect(box.x-r.x+2,box.y-r.y+2,box.width-4,box.height-4);ctx.clip();
  for(const n of card.querySelectorAll('span,b,i')){const b=n.getBoundingClientRect(),style=win.getComputedStyle(n),size=Math.max(1,Math.floor(parseFloat(style.fontSize)/7));ctx.clearRect(b.x-r.x,b.y-r.y,b.width,b.height);pixelText(ctx,n.textContent,Math.round(b.x-r.x+b.width/2),Math.round(b.y-r.y+(b.height-7*size)/2),size,n.matches('b')?'#fff0ba':'#e5d7ab','center');}
  if(Number(card.dataset.pickupGlow)>0){const icon=card.querySelector('img').getBoundingClientRect();drawVfx(ctx,'glint',icon.right-r.x-2,icon.y-r.y+3,10,0,Number(card.dataset.pickupGlow));}ctx.restore();
 }
}
