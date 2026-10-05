import {ASSET_CONTRACT} from '/arcade/snake-next/effect-playground/asset-contract.js';
import {effectAssets as bank} from '/arcade/snake-next/effect-playground/asset-bank.js';
import {DEV_VFX_CANDIDATES,enableDevVfx} from '/arcade/snake-next/effect-playground/vfx-candidates.js';
import {drawEffectsWorld} from '/arcade/snake-next/effect-playground/visuals.js';
import {drawWithFoodReaction} from '/arcade/snake-next/effect-playground/food-reaction.js';
import {loadArt} from '/arcade/snake-next/retro-v5/renderer.js';
import {loadObjects,drawObject} from '/arcade/snake-next/forest-training/objects.js';
import {loadBoard,boardVariant} from '/arcade/snake-next/forest-training/board.js';
import {RibbonSprites} from '/arcade/snake-next/forest-training/ribbon-sprites.js';
const [art,tiles,objects]=await Promise.all([loadArt(),loadBoard(),loadObjects(),enableDevVfx()]);art.objects=objects;
const ribbon=new RibbonSprites(art),animations=[],scenes=[];let collection='third';
const names=[['Harvest collection','harvest'],['Focus active','focus'],['Spore attraction + collection','spores'],['Guard break','guard'],['Charged portal traversal','portalPrize'],['Rush movement','rush'],['Corruption active','weak'],['Roots full lifecycle','brambles'],['Mist active','mist']];
function canvas(w,h,host){const c=document.createElement('canvas');c.width=w;c.height=h;host.append(c);return c;}
function scroll(host){const d=document.createElement('div');d.className='scroll';host.append(d);return d;}
for(const [name,kind]of names){
 const section=document.createElement('section');section.className='scene';section.id='scene-'+kind;section.innerHTML=`<h2>${name}</h2><small>Simulated presentation, not a gameplay outcome. Desktop / mobile runtime scale.</small>`;document.querySelector('#scenes').append(section);
 const link=document.createElement('a');link.href='#'+section.id;link.textContent=name;document.querySelector('#scene-index').append(link);
 if(kind==='harvest'){const label=document.createElement('label');label.innerHTML='Collection preview <select><option value="third">Harvest · every third mushroom</option><option value="gold">Harvest · ordinary golden mushroom</option><option value="red">Ordinary red mushroom · combo 1</option><option value="max">Ordinary red mushroom · max combo</option></select>';label.querySelector('select').onchange=e=>{collection=e.target.value;render();};section.append(label);}
 for(const mobile of [false,true]){const c=canvas(mobile?844:1020,mobile?390:480,scroll(section));c.dataset.kind=kind;c.dataset.mobile=mobile;scenes.push({c,kind,mobile});}
}
for(const key of Object.keys(DEV_VFX_CANDIDATES)){
 const a=ASSET_CONTRACT[key],section=document.createElement('section');section.id=key;section.innerHTML=`<h2>${key}</h2><small>${a.frameWidth}×${a.frameHeight} · ${a.frames} frames · sheet ${a.sheetWidth}×${a.sheetHeight} · anchor ${a.anchor.x},${a.anchor.y} · ${a.ticks} ticks/frame · ${a.loop?'loop':'one-shot'}</small>`;document.querySelector('#sheets').append(section);
 for(const scale of [1,4]){const image=document.createElement('img');image.src=a.url;image.width=a.sheetWidth*scale;image.height=a.sheetHeight*scale;image.alt=key+' '+scale+'× sheet';scroll(section).append(image);}
 const preview=document.createElement('div');preview.className='previews';section.append(preview);
 for(const scale of [1,4])animations.push({key,c:canvas(a.frameWidth*scale,a.frameHeight*scale,preview),scale,a});
 // Explicit native / mobile field use for every sheet, not just a contact sheet.
 const context=document.createElement('div');context.className='previews';section.append(context);
 for(const mobile of [false,true]){const c=canvas(260,160,context);animations.push({key,c,a,field:true,mobile});}
}
function floor(ctx,w,h,C){ctx.imageSmoothingEnabled=false;for(let y=0;y<h/C;y++)for(let x=0;x<w/C;x++)ctx.drawImage(tiles[boardVariant(x,y)],x*C,y*C,C,C);}
function drawScene({c,kind,mobile},tick){
 const ctx=c.getContext('2d'),C=mobile?25:60,W=c.width,H=c.height,head={x:W*.55+Math.sin(tick/90)*C*.5,y:H*.5,dx:1,dy:0},age=tick%180,headCell={x:head.x/C-.5,y:head.y/C-.5,dx:1,dy:0};
 ctx.clearRect(0,0,W,H);floor(ctx,W,H,C);
 const route=Array.from({length:9},(_,i)=>({x:headCell.x-i,y:headCell.y}));
 const stride=112,cell=(dx,dy)=>Math.floor(headCell.y+dy)*stride+Math.floor(headCell.x+dx),frame={route,start:0,end:7,head:headCell,alpha:0,viewX:0,viewY:0};
 const s={tick,arena:{width:stride},state:{food:cell(3,0)},effects:[{kind,ends:tick+100}],spores:[],pickups:[],director:{warnings:[]},world:{hazards:[]},portals:[],portalEdges:[],feedback:[],portalAvailable:()=>kind==='portalPrize'};
 if(kind==='harvest'){
  const golden=collection==='third'||collection==='gold';if(!golden)s.effects=[];
  if(age<21)s.feedback=[{kind:'seed',cell:cell(0,0),tick:tick-age,harvest:golden,strong:collection==='third',amount:golden?200:100,combo:collection==='max'?8:golden?4:1,maxReached:collection==='max'}];
 }
 if(kind==='spores'){const a=age%90;if(a<18)s.spores=Array.from({length:3},(_,i)=>({cell:cell(2+i,i%2?2:-1),magnetTick:tick-a}));else if(a<39)s.feedback=[{kind:'seed',spore:true,cell:cell(0,0),tick:tick-a+18,amount:25}];}
 if(kind==='guard'&&age>=90){s.effects=[];s.feedback=[{kind:'guard-used',cell:cell(0,0),tick:tick-age+90}];}
 if(kind==='portalPrize'){s.portals=[cell(2,1),cell(-6,1)];s.portalEdges=[{move:0,complete:age>=90}];s.portalRewardMove=0;for(const p of s.portals){const xy={x:(p%stride+.5)*C,y:(Math.floor(p/stride)+.5)*C};drawObject(ctx,art,'portal',xy.x,xy.y,C);}}
 if(kind==='weak'&&age<21)s.feedback=[{kind:'seed',cell:cell(0,0),tick:tick-age,corrupt:true,amount:60,combo:1}];
 if(kind==='brambles'){const p=cell(2,2);if(age<72)s.director.warnings=[{cell:p,starts:tick-age+72}];else if(age<144)s.world.hazards=[{cell:p}];else s.feedback=[{kind:'root-decay',cell:p,tick:tick-age+144}];}
 const view={x:0,y:0,cols:Math.ceil(W/C),rows:Math.ceil(H/C)},field={x:0,y:0};
 drawWithFoodReaction(ctx,s,frame,C,field,view,d=>ribbon.draw(d,frame,C,0,0,view));
 drawEffectsWorld(ctx,s,frame,p=>({x:(p%stride+.5)*C,y:(Math.floor(p/stride)+.5)*C}),C,art,{arena:{x:0,y:0,w:W,h:H},field,compact:mobile});
 // Actual approved pickup / HUD sprite at runtime footprint, no new art.
 bank.drawField(ctx,kind,C*1.2,C*1.2,C,tick,mobile);
 bank.draw(ctx,kind+'.hud',W-C*1.1,C*.7,mobile?20:32,tick);
}
let tick=0,paused=false;
const fieldSize={
 'harvest-sparkle':C=>Math.max(12,.30*C),'harvest-third-burst':C=>Math.max(24,.95*C),
 'focus-wisp':C=>Math.max(12,.34*C),'spore-idle':C=>Math.max(14,.32*C),'spore-trail':C=>Math.max(5,.12*C),'spore-burst':C=>Math.max(24,.95*C),
 'guard-plate':C=>Math.max(13,.34*C),'guard-charged':C=>Math.max(24,.52*C),'guard-break':C=>.96*C,
 'portal-charged-ring':C=>C,'portal-body-trail':C=>Math.max(10,.25*C),'rush-ember':C=>Math.max(10,.30*C),'rush-thorn':C=>Math.max(10,.30*C),
 'corruption-particle':C=>Math.max(14,.35*C),'roots-crack':C=>.90*C,'roots-sprout':C=>.85*C,'roots-root':C=>.96*C,'roots-decay':C=>.96*C,'mist-puff':C=>3.5*C
};
function render(){document.querySelector('#time').textContent=tick+' active preview ticks';
 for(const {key,c,a,field,mobile} of animations){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);if(field)floor(ctx,c.width,c.height,mobile?25:60);const t=a.loop?tick:tick%(a.ticks*a.frames+36),size=field?fieldSize[key.slice(4)](mobile?25:60):c.width;bank.draw(ctx,key,c.width/2,c.height/2,size,t);}
 for(const scene of scenes)drawScene(scene,tick);
}
document.querySelector('#pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'RESUME PREVIEW':'PAUSE PREVIEW';};
document.querySelector('#tick').oninput=e=>{paused=true;tick=Number(e.target.value);document.querySelector('#pause').textContent='RESUME PREVIEW';render();};
// Standalone review clock ONLY. This module is never imported by gameplay.
const timer=setInterval(()=>{if(!paused){tick=(tick+1)%360;document.querySelector('#tick').value=tick;render();}},1000/60);
window.addEventListener('pagehide',()=>{clearInterval(timer);ribbon.release();},{once:true});
window.vfxReview={bank,setTick(value){paused=true;tick=value;render();},get tick(){return tick;},scenes};render();
