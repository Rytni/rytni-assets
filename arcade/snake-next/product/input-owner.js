import {keyboardCommand} from '../input/turns.js';

/** Sole embedded Product input owner. Standalone listeners are never installed. */
export function installProductInput(game,win,{action,event=()=>{}}){
 if(game.mode!=='product'||game.productInputOwner)throw Error('Product input ownership violation');
 const off=[],listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);off.push(()=>target.removeEventListener(type,fn,options));};
 const pad=game.root.querySelector('#pad');pad.classList.add('product-dpad');
 listen(pad,'pointerdown',e=>{
  const b=e.target.closest('[data-dir]');if(!b||game.status!=='playing')return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const direction=Number(b.dataset.dir);
  event('DPAD_POINTER_DOWN',{direction,pointerId:e.pointerId,pointerType:e.pointerType,source:'child-dpad',target:'#pad [data-dir="'+direction+'"]'});
  try{b.setPointerCapture(e.pointerId);}catch{}
  b.classList.add('pressed');const before=game.commands.length;
  game.command(direction);
  event('DIRECTION_ENQUEUE',{direction,enqueued:game.commands.length-before,source:'child-dpad'});
 },true);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(pad,type,()=>pad.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed')));
 listen(pad,'click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();},true);
 listen(game.root,'click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a)action(a);});
 listen(win,'keydown',e=>{
  if(e.target.matches('input,textarea'))return;
  if(['Escape','Space','KeyF','KeyR','Enter'].includes(e.code)){
   e.preventDefault();if(e.repeat)return;
   if(e.code==='KeyF')action('fullscreen');
   else if(e.code==='KeyR')action('restart');
   else if(e.code==='Enter'&&game.status==='result')action('play');
   else if(['Escape','Space'].includes(e.code))action(game.status==='playing'?'pause':'resume');
   return;
  }
  const command=keyboardCommand(e.code,{tick:1,sequence:++game.sequence,repeat:e.repeat});
  if(command){e.preventDefault();if(game.status==='playing')game.commands.push(command);}
 });
 const owner={dispose(){for(const remove of off.splice(0))remove();game.productInputOwner=null;}};
 game.productInputOwner=owner;return owner;
}
