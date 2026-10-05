import {EffectRibbonSprites} from './effect-ribbon.js';
import {EFFECT_KINDS} from './material.js';
import {RibbonSprites} from '../../forest-training/ribbon-sprites.js';
import {TunnelRibbon} from '../../gate-one/ribbon.js';
import {boardVariant,loadBoard} from '../../forest-training/board.js';
import {geometry} from '../../forest-training/renderer.js';
import {fitWorldLayout} from '../../effect-playground/fit-world.js';
import {expand} from '../../smooth-v4-proof/fixtures.js';
import {LABELS} from '../../effect-playground/art.js';

const FIXTURES={desktop30:{viewport:[1920,1080],world:[30,12]},mobile30:{viewport:[844,390],world:[30,12]},mobile40:{viewport:[844,390],world:[40,16]},mobile50:{viewport:[844,390],world:[50,20]},mobile60:{viewport:[844,390],world:[60,24]}};
const PAIRS=[['harvest','focus'],['harvest','guard'],['focus','portalPrize'],['spores','guard'],['harvest','rush'],['harvest','weak'],['guard','brambles'],['focus','mist']];
const COMBINATIONS=[['harvest','guard','weak'],['spores','portalPrize','rush'],['focus','harvest','mist'],['guard','portalPrize','brambles']];
const DETAIL={harvest:'Тёплая золотистая мякоть. Родные прожилки и объём сохраняются.',rush:'Рыжий материал и горячая кромка внутри силуэта. Без огненного следа.',weak:'Порча: холодная сливовая мякоть и шляпка. Цвет остаётся различимым вместе с положительными узорами.',spores:'Розовые споровые вкрапления на теле; точки собираемых спор остаются в мире.',guard:'Изумрудные броневые чешуйки с мягкими золотыми швами. Всё находится внутри тела.',portalPrize:'Фиолетовые поперечные полосы и золотые знаки; разрывы портала остаются разрывами.',focus:'Спокойная голубая кромка с медленным дыханием.',mist:'Холодная серо-голубая кромка на теле; мировой туман сохраняется отдельно.',brambles:'Тёмная угловатая корневая прожилка внутри мякоти; мировые корни не заменяются.'};
const $=id=>document.getElementById(id),effect=$('effect');
for(const kinds of [...EFFECT_KINDS.map(k=>[k]),...PAIRS,...COMBINATIONS]){const o=document.createElement('option');o.value=kinds.join(',');o.textContent=kinds.map(k=>LABELS[k]||k).join(' + ');effect.append(o);}
effect.value='harvest';let age=20,playing=false,lastTime=0,debt=0;

async function load(){
 const images=new Map();await Promise.all(Array.from({length:8},async(_,i)=>{const im=new Image();im.src='/grib/mushroom-snake-retro-v5/straight-0-v'+i+'.png';await im.decode();images.set('straight-0-v'+i,im);}));
 const art={images,board:await loadBoard()},baseV4=new RibbonSprites(art),activeV4=new EffectRibbonSprites(art),base=new TunnelRibbon(baseV4),active=new TunnelRibbon(activeV4);
 function draw(){
  const fixture=FIXTURES[$('fixture').value],{viewport:[w,h],world:[width,height]}=fixture,mobile=h<500,dx=(width-30)/2,dy=(height-12)/2;
  const route=expand([[25,2],[25,3],[4,3],[4,6],[25,6],[25,9],[4,9]]).map(p=>({x:p.x+dx,y:p.y+dy}));
  const frame={route,start:1.5,end:30.5,alpha:.5,head:{x:24.5+dx,y:3+dy,dx:1,dy:0},moves:100,length:30};
  if($('portal').checked)frame.spans=[{offset:0,end:14,route:route.slice(0,16)},{offset:18,end:route.length-1,route:route.slice(18)}];
  const s={tick:age,state:{seed:18,movePhase:0,cadence:10},world:{width,height},effects:age<30?effect.value.split(',').map(kind=>({kind,started:0,ends:30})):[]};
  // Priming is review-only and makes arbitrary slider jumps reproducible;
  // the live compositor sees the actual effects stream from Session.
  activeV4.material.tracks.clear();activeV4.material.key='';activeV4.material.tick=0;
  if(age>=30)activeV4.setSession({...s,tick:29,effects:effect.value.split(',').map(kind=>({kind,started:0,ends:30}))});
  activeV4.setSession(s,{quality:mobile?'mobile':'desktop'});
  const l=fitWorldLayout(geometry(w,h,28,12,true,mobile),s,frame,true).layout,cell=l.cell,cw=Math.ceil(width*cell),ch=Math.ceil(height*cell),view={x:0,y:0,cols:width,rows:height};
  $('panes').style.gridTemplateColumns=mobile?'':'1fr';
  for(const [id,ribbon] of [['base',base],['active',active]]){
   const canvas=$(id);canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){const left=Math.round(x*cell),top=Math.round(y*cell);ctx.drawImage(art.board[boardVariant(x,y)],left,top,Math.round((x+1)*cell)-left,Math.round((y+1)*cell)-top);}
   ribbon.draw(ctx,frame,cell,0,0,view);
  }
  $('age').value=age;$('tick').value=age;$('active-title').textContent='Active · '+effect.selectedOptions[0].textContent;
  $('description').textContent=effect.value.split(',').map(k=>DETAIL[k]).join(' ');
  $('metrics').textContent=`${mobile?'Mobile':'Desktop'} ${w}×${h} · поле ${width}×${height} · клетка ${cell.toFixed(2)} px · тело ${(cell*36/68).toFixed(2)} px · длина 30 · тик ${age} · ${playing?'переход':'пауза'}`;
  window.effectSkinQA.metrics={fixture:$('fixture').value,viewport:[w,h],world:[width,height],cell,body:cell*36/68,length:30,tick:age,paused:!playing,kinds:effect.value.split(','),materialKey:activeV4.materialKey};
 }
 window.effectSkinQA={ready:true,set({fixture,kinds,tick,paused=true,portal=false}={}){
  if(fixture)$('fixture').value=fixture;
  if(kinds){if(kinds.some(k=>!EFFECT_KINDS.includes(k)))throw Error('Unknown effect fixture');const value=kinds.join(',');
   if(![...effect.options].some(o=>o.value===value)){const o=document.createElement('option');o.value=value;o.textContent=kinds.map(k=>LABELS[k]).join(' + ');effect.append(o);}effect.value=value;
  }
  if(tick!==undefined)age=Math.max(0,Math.min(45,tick));playing=!paused;$('portal').checked=portal;$('play').textContent=playing?'Пауза':'Запустить переход';draw();return this.metrics;
 },snapshot(){return this.metrics;},draw};
 for(const id of ['fixture','effect','portal'])$(id).addEventListener('change',draw);
 $('tick').addEventListener('input',()=>{age=Number($('tick').value);playing=false;$('play').textContent='Запустить переход';draw();});
 $('play').addEventListener('click',()=>{playing=!playing;if(playing&&age>=45)age=0;lastTime=performance.now();debt=0;$('play').textContent=playing?'Пауза':'Запустить переход';draw();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;$('play').textContent='Запустить переход';draw();}});
 draw();
 function loop(now){if(playing){debt+=Math.min(100,now-lastTime);while(debt>=1000/60){age++;debt-=1000/60;}if(age>=45){age=45;playing=false;$('play').textContent='Запустить переход';}draw();}lastTime=now;requestAnimationFrame(loop);}requestAnimationFrame(loop);
}
load().catch(error=>{$('metrics').textContent='Не удалось загрузить обзор: '+error.message;window.effectSkinQA={ready:false,error:String(error)};});
