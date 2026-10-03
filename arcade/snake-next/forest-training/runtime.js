import {loadArt} from '../retro-v5/renderer.js';
import {loadObjects} from './objects.js';
import {loadBoard} from './board.js';
import {FixedClock,startMainThreadClock,keyboardCommand} from '../entry.js';
import {Session,EFFECTS} from './session.js';
import {ForestRenderer,cabinetSize} from './renderer.js';
import {drawHudType} from './hud-type.js';
import {ForestAudio} from './audio.js';

export class TrainingGame {
  constructor(root,art,audio){
    this.root=root;this.art=art;this.audio=audio;this.renderer=new ForestRenderer(root.querySelector('canvas'),art);
    const logo=art.images.get('logo');logo.className='logo';logo.alt='Mushroom Snake';root.querySelector('.logo').replaceWith(logo);
    this.sessionFactory=options=>new Session(options);
    this.touch=matchMedia('(pointer:coarse)').matches;this.session=null;this.preview=new Session();this.status='main';this.sequence=0;
    this.raf=0;this.cancelTimer=null;this.commands=[];this.listeners=[];this.log=[];this.starts=0;this.effectKey='';this.settingsFrom='main';
    this.listen(root,'click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action)this.action(action);});
    this.listen(root,'input',e=>{if(e.target.dataset.volume){this.audio.volumes[e.target.dataset.volume]=Number(e.target.value);this.audio.apply();}});
    this.listen(window,'keydown',e=>{
      if(e.target.matches('input'))return;
      if(e.code==='Escape'&&document.fullscreenElement){e.preventDefault();this.fullscreen();return;}
      if(['Escape','Space','KeyF','KeyR','Enter'].includes(e.code)){
        e.preventDefault();if(e.repeat)return;
        if(e.code==='KeyF')this.fullscreen();else if(e.code==='KeyR')this.start();else if(e.code==='Enter'&&this.status==='result')this.start();
        else if(this.status==='playing')this.pause();else if(this.status==='paused')this.resume();else if(this.status==='settings')this.action('back');
        return;
      }
      const command=keyboardCommand(e.code,{tick:1,sequence:++this.sequence,repeat:e.repeat});
      if(command){e.preventDefault();if(this.status==='playing')this.commands.push(command);}
    });
    const pad=root.querySelector('#pad');
    this.listen(pad,'pointerdown',e=>{const b=e.target.closest('[data-dir]');if(!b)return;e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('pressed');this.command(Number(b.dataset.dir));});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])this.listen(pad,event,()=>pad.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed')));
    this.listen(window,'resize',()=>this.resize());this.listen(document,'fullscreenchange',()=>this.resize());
    this.listen(document,'visibilitychange',()=>{if(document.hidden)this.pause();});this.listen(window,'blur',()=>this.pause());
    this.listen(window,'pagehide',()=>this.dispose());this.resize();this.show();this.render();
  }
  listen(target,type,fn){target.addEventListener(type,fn);this.listeners.push(()=>target.removeEventListener(type,fn));}
  command(direction){if(this.status==='playing')this.commands.push({tick:1,sequence:++this.sequence,direction,repeat:false});}
  action(action){
    if(action==='fullscreen'){this.fullscreen();return;}
    this.audio.play('click');
    if(action==='start'||action==='restart')this.start();
    else if(action==='main')this.main();
    else if(action==='pause')this.status==='playing'?this.pause():this.status==='paused'?this.resume():null;
    else if(action==='resume')this.resume();
    else if(action==='settings'){if(['playing','dying'].includes(this.status))this.pause();this.settingsFrom=this.status;this.status='settings';this.show();}
    else if(action==='help'){this.settingsFrom='main';this.status='help';this.show();}
    else if(action==='back'){this.status=this.settingsFrom==='paused'?'paused':'main';this.show();}
    else if(action==='mute'){this.audio.muted=!this.audio.muted;this.audio.apply();this.show();}
  }
  start(){
    if(this.portrait){this.show();return;}
    this.stop();this.session=this.sessionFactory({touch:this.touch});this.starts++;this.commands=[];this.sequence=0;this.log=[];this.status='playing';
    this.clock=new FixedClock({onTick:()=>this.tick(),maxCatchUpTicks:5});
    this.audio.unlock().then(()=>{if(this.status==='playing')this.audio.startMusic();}).catch(e=>{this.audio.error=String(e)});
    this.run();this.show();
  }
  run(){
    if(this.cancelTimer||this.raf)return;
    this.cancelTimer=startMainThreadClock(this.clock,{now:()=>performance.now(),schedule:setTimeout,cancel:clearTimeout});
    const frame=()=>{
      this.raf=0;if(!['playing','dying'].includes(this.status))return;
      if(this.clock.status==='recovery'){this.pause();return;}
      this.render();this.raf=requestAnimationFrame(frame);
    };this.raf=requestAnimationFrame(frame);this.render();
  }
  tick(){
    if(!this.session||!['playing','dying'].includes(this.status))return;
    const commands=this.commands.splice(0);this.session.advance(commands);this.status=this.session.status;
    for(const e of this.session.events){
      this.log.push(e);if(this.log.length>2000)this.log.shift();
      if(e.kind==='seed'){this.audio.play(e.combo>1?'combo':'pickup');}
      else if(e.kind==='positive')this.audio.play('buff');else if(e.kind==='negative')this.audio.play('debuff');
      else if(e.kind==='portal-enter')this.audio.play('portal-enter');else if(e.kind==='portal-exit')this.audio.play('portal-exit');
      else if(e.kind==='death'){this.audio.stopAll();this.audio.play('death');}
      else if(e.kind==='result'){this.stop();this.audio.play('result');this.show();}
      if(e.kind!=='seed'&&e.kind!=='result')this.session.feedback.push({kind:e.kind.startsWith('portal')?'portal':e.kind==='death'?'negative':e.kind,cell:e.cell,tick:this.session.tick,label:e.kind==='portal-rejected'?'ВЫХОД ЗАНЯТ':''});
    }
  }
  stop(){if(this.cancelTimer)this.cancelTimer();this.cancelTimer=null;if(this.clock)this.clock.pause();if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.audio.stopAll();}
  pause(){if(!['playing','dying'].includes(this.status))return;this.stop();this.session.cancelPortal();this.commands=[];this.status='paused';this.show();this.render();}
  resume(){if(!this.session||this.portrait||this.status!=='paused')return;this.commands=[];this.status=this.session.status;this.audio.unlock().then(()=>{if(this.status==='playing')this.audio.startMusic();});this.run();this.show();}
  main(){this.stop();this.session=null;this.clock=null;this.commands=[];this.log=[];this.status='main';this.settingsFrom='main';this.renderer.release();this.show();this.render();}
  resize(){
    this.portrait=matchMedia('(orientation:portrait)').matches;
    this.compact=matchMedia('(max-height:500px) and (orientation:landscape)').matches;
    const w=Math.round(this.root.getBoundingClientRect().width);
    this.root.style.setProperty('--cabinet-height',cabinetSize(w,this.compact).h+'px');
    this.root.classList.toggle('compact',this.compact);
    if(this.portrait)this.pause();const r=this.root.getBoundingClientRect();
    this.renderer.resize(Math.round(r.width),Math.round(r.height),devicePixelRatio||1);this.show();this.render();
  }
  render(){
    const l=this.renderer.render(this.session,{preview:this.preview,status:this.status,touch:this.touch,fullscreen:document.fullscreenElement===this.root,compact:this.compact});
    this.root.style.setProperty('--header',l.header+'px');
    const hud=this.root.querySelector('#hud');Object.assign(hud.style,{left:l.hud.x+'px',top:l.hud.y+'px',width:l.hud.w+'px',height:l.hud.h+'px'});
    const pad=this.root.querySelector('#pad');pad.hidden=!this.touch||this.portrait||this.status!=='playing';
    pad.style.left=Math.round(l.field.x+l.cell*3.5-46)+'px';pad.style.top=Math.round(l.field.y+l.cell*9-46)+'px';
    const s=this.session;this.root.querySelector('#score').textContent=s?.score||0;this.root.querySelector('#length').textContent=s?.state.length||8;this.root.querySelector('#combo').textContent='×'+Math.max(1,s?.combo||1);
    const effects=s?.effects||[],key=effects.map(e=>e.kind).join(',');
    if(this.effectKey!==key||!this.root.querySelector('#effects').children.length){
      this.effectKey=key;this.root.querySelector('#effects').innerHTML=effects.map(e=>`<div class="effect ${EFFECTS[e.kind].positive?'':'negative'}" data-effect="${e.kind}" aria-label="${EFFECTS[e.kind].label}"><img alt="" src="/grib/mushroom-snake-retro-v5/${EFFECTS[e.kind].positive?'positive':'negative'}.png"><span>${EFFECTS[e.kind].label}</span><b></b><progress aria-label="Оставшееся время" max="1" value="1"></progress></div>`).join('')+Array.from({length:Math.max(0,3-effects.length)},()=>'<div class="effect-vacant" aria-hidden="true"></div>').join('');
    }
    for(const e of effects){const card=this.root.querySelector(`[data-effect="${e.kind}"]`),remaining=Math.max(0,e.ends-s.tick);card.querySelector('b').textContent=this.compact?Math.ceil(remaining/60)+'С':(remaining/60).toFixed(1);card.querySelector('progress').value=Math.min(1,remaining/EFFECTS[e.kind].duration);}
    drawHudType(hud);
  }
  show(){
    const panel=this.root.querySelector('#overlay');panel.hidden=['playing','dying'].includes(this.status)&&!this.portrait;
    if(panel.hidden)return;
    const data=this.portrait?['Разверните экран','Для лесной тренировки нужен landscape. Управление: WASD / стрелки или D-pad.',[['fullscreen','Полный экран']]]:
      this.status==='main'?['Mushroom Snake','Тренировка в лесу · Собирайте грибы, растите и держите ритм.',[['start','Тренировка'],['help','Как играть?'],['settings','Настройки']]]:
      this.status==='paused'?['Пауза','Лес подождёт. Эффекты и portal поставлены на паузу.',[['resume','Продолжить'],['settings','Настройки'],['restart','Начать заново'],['main','Главное меню']]]:
      this.status==='result'?['Результат',`Счёт: ${this.session?.score||0} · Грибы: ${this.session?.foods||0} · Длина: ${this.session?.state.length||8}`, [['restart','Ещё раз'],['main','Главное меню']]]:
      this.status==='settings'?['Настройки','', [['mute',this.audio.muted?'Включить звук':'Выключить звук'],['back','Назад']]]:
      ['Как играть?','WASD / стрелки — поворот. Space — пауза. Гриб даёт рост и combo. Фокус замедляет движение, Урожай даёт ×2 очки, Спешка ускоряет. Portal открывается через 10 секунд и переносит Snake, если выход безопасен.',[['back','Назад']]];
    this.root.querySelector('#heading').textContent=data[0];this.root.querySelector('#copy').textContent=data[1];
    if(this.status==='settings'&&!this.portrait)this.root.querySelector('#copy').innerHTML=Object.entries({master:'Master',music:'Music',sfx:'Effects'}).map(([key,label])=>`<label class="volume">${label}<input aria-label="${label}" data-volume="${key}" type="range" min="0" max="1" step=".05" value="${this.audio.volumes[key]}"></label>`).join('');
    this.root.querySelector('#actions').innerHTML=data[2].map(([action,label])=>`<button data-action="${action}">${label}</button>`).join('');
  }
  async fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await this.root.requestFullscreen();}catch(e){this.fullscreenError=String(e);}}
  summary(){return {status:this.status,session:this.session?.summary()||null,starts:this.starts,raf:Number(!!this.raf),timers:Number(!!this.cancelTimer),activeSessions:Number(!!this.session),audio:this.audio.summary(),raster:{decodedBytes:this.art.bytes,...this.renderer.memory()},fullscreenError:this.fullscreenError||''};}
  dispose(){this.stop();this.status='disposed';this.session=null;this.clock=null;this.renderer.release();for(const off of this.listeners.splice(0))off();this.audio.dispose();}
}
const root=document.querySelector('#game');
try{
  const audio=new ForestAudio(),[art,board,objects]=await Promise.all([loadArt(),loadBoard(),loadObjects(),audio.load()]);art.board=board;art.objects=objects;art.bytes+=objects.bytes;
  root.hidden=false;document.querySelector('#loading').hidden=true;
  const game=new TrainingGame(root,art,audio);
  if(new URLSearchParams(location.search).has('qa'))window.forestTraining=game;
}catch(error){document.querySelector('#loading').textContent='Не удалось загрузить лес. Обновите страницу.';console.error(error);}
