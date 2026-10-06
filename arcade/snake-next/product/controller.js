/** Product lifecycle only: authoritative attempts are owned by the adapter;
 * score and movement are owned by the canonical session behind the bridge. */
export class ProductController {
 constructor({backend,bridge,gate,release}){Object.assign(this,{backend,bridge,gate,release});this.requestPrefix=globalThis.crypto.randomUUID();this.screen='loading';this.hub=null;this.run=null;this.result=null;this.pending=null;this.listeners=new Set();this.serial=0;this.epoch=0;this.trainingSeed=79000;this.back='main';this.message='';this.tab='basics';this.disposed=false;}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 emit(){if(!this.disposed)for(const fn of this.listeners)fn(this);}
 show(screen){this.screen=screen;this.emit();}
 async refresh(preserve=false){const epoch=this.epoch,request=this.hubRequest=(this.hubRequest||0)+1;try{const hub=await this.backend.hub();if(epoch!==this.epoch||request!==this.hubRequest||this.disposed)return;this.hub=hub;const ready=hub.success&&hub.available!==false;if(!ready)this.message=hub.status==='not_authenticated'?'Сессия закончилась. Войдите снова через приложение. Тренировка доступна.':hub.status==='disabled'?'Аркада временно приостановлена. Тренировка доступна.':'Не удалось загрузить сезон. Попытки не менялись. Можно повторить или тренироваться.';if(!preserve)this.show(ready?'main':'error');else this.emit();}catch{if(epoch===this.epoch&&request===this.hubRequest){this.message='Не удалось загрузить сезон. Проверьте соединение.';if(!preserve)this.show('error');else this.emit();}}}
 async start(mode='ranked'){
  if(this.pending||this.disposed||this.screen==='playing'||this.screen==='pause')return;
  if(!this.gate.ready()){this.gateMode=mode;this.show('mobile-gate');return;}
  this.pending='start';const epoch=this.epoch;this.show('starting');
  try{
   await this.bridge.ready();if(epoch!==this.epoch||this.disposed)return;
   // Fullscreen may change while assets load: gate again before spending.
   if(!this.gate.ready()){this.gateMode=mode;this.show('mobile-gate');return;}
   let attempt;
   if(mode==='training')attempt={success:true,seed:++this.trainingSeed,attempt_id:null};
   else{
    if(!this.hub?.success||this.hub.available!==true){this.message='Рейтинговая игра пока недоступна. Обновите сессию или выберите тренировку.';this.show('error');return;}
    if(!this.startRequest&&!this.hub.attempts_remaining&&!this.hub.sponsor_attempt_credits){this.show('no-attempts');return;}
    this.startRequest??=this.requestPrefix+'-start-'+(++this.serial);
    attempt=await this.backend.start({release:this.release,requestId:this.startRequest});
   }
   if(epoch!==this.epoch||this.disposed)return;
   if(!attempt.success){const limit=['no_attempts','limit'].includes(attempt.status);this.message=limit?'Все попытки использованы.':attempt.status==='not_authenticated'?'Сессия закончилась. Войдите снова.':'Не удалось подтвердить старт. Повтор использует тот же запрос — двойного списания не будет.';this.show(limit?'no-attempts':'error');return;}
   if(mode==='ranked')this.startRequest=null;this.run=Object.freeze({...attempt,mode,release:this.release});this.result=null;this.submission=null;this.message='';
   if(!this.gate.ready()){this.gateMode='accepted-start';this.show('mobile-gate');}
   else{this.bridge.start(this.run.seed);this.show('playing');}
   // Hub reads must not hold the write lock while the canonical game runs.
   if(mode==='ranked')void this.refresh(true);
  }catch{if(epoch===this.epoch){this.message='Старт не подтверждён. Проверьте соединение и повторите; запрос защищён от повторного списания.';this.show('error');}}
  finally{this.pending=null;this.emit();}
 }
 pause(){if(this.screen!=='playing')return;this.bridge.pause();this.back='pause';this.show('pause');}
 async resume(){if(!this.run||this.result||!['pause','mobile-gate'].includes(this.screen))return;if(!this.gate.ready()){this.gateMode='resume';this.show('mobile-gate');return;}this.show('playing');this.bridge.resume();}
 async claim(){
  if(this.pending||this.disposed||this.run&&!this.result)return;
  if(!this.hub?.sponsor_attempt_available){this.message='Попытки от спонсора восстановятся '+formatReset(this.hub?.next_sponsor_attempt_at)+'.';this.emit();return;}
  if(!this.gate.ready()){this.gateMode='sponsor';this.show('mobile-gate');return;}
  this.pending='claim';this.emit();const epoch=this.epoch;
  try{this.claimRequest??=this.requestPrefix+'-sponsor-'+(++this.serial);const r=await this.backend.claim({release:this.release,requestId:this.claimRequest});if(epoch!==this.epoch||this.disposed)return;
   if(r.success){this.claimRequest=null;await this.refresh(true);this.message='Попытка от спонсора зачислена. Нажмите «Играть», когда будете готовы.';this.sponsorCredited=true;this.show('main');}
   else{this.message=r.status==='cooldown'?'Лимит спонсорских попыток достигнут. Следующая '+formatReset(r.next_sponsor_attempt_at)+'.':'Зачисление не подтверждено. Обычные попытки не затронуты; повтор безопасен.';this.show('error');}
  }catch{if(epoch===this.epoch){this.message='Не удалось подтвердить спонсорскую попытку. Повтор не зачислит её дважды.';this.show('error');}}finally{this.pending=null;this.emit();}
 }
 async finish(stats){
  if(this.pending||!this.run||this.result?.accepted||this.result?.training||this.disposed)return;
  const run=this.run,epoch=this.epoch;this.bridge.stop();this.pending='finish';this.back='main';this.show('finishing');
  this.submission??=Object.freeze({...stats,attempt_id:run.attempt_id,seed:run.seed,release:run.release,duration_ms:Math.round((stats.active_ticks??0)*1000/60)});
  let accepted=null;
  try{accepted=run.mode==='training'?{success:true,training:true}:await this.backend.finish(this.submission);}catch{accepted={success:false,status:'network'};}
  if(epoch===this.epoch&&!this.disposed){
   this.result={stats:this.submission,training:run.mode==='training',accepted:run.mode==='ranked'&&accepted.success===true,record:accepted.success===true&&accepted.record===true,response:accepted};
   if(this.result.accepted)await this.refresh(true);this.show('result');
  }
  this.pending=null;this.emit();
 }
 async action(action){
  if(this.pending&& !['gate-cancel'].includes(action))return;
  if(action==='play'||action==='play-again'||action==='retry-start'||action==='training'){if(this.run&&!this.result){this.pause();this.back='pause';this.show('confirm-restart');return;}await this.start(action==='training'?'training':'ranked');}
  else if(action==='sponsor')await this.claim();
  else if(action==='pause')this.pause();else if(action==='resume')await this.resume();
  else if(action==='rules'||action==='settings'||action==='rating'){if(this.screen==='playing')this.pause();this.back=this.screen==='pause'?'pause':this.screen==='result'?'result':'main';this.tab=action==='settings'?'sound':'basics';this.show(action);}
  else if(action==='back'||action==='cancel'){this.show(this.back);}
  else if(action==='restart'||action==='exit'){if(this.screen==='playing')this.pause();this.back='pause';this.show('confirm-'+action);}
  else if(action==='confirm'){
   if(this.screen==='confirm-exit'){this.abandon();}
   else if(this.screen==='confirm-restart'&&this.run){if(!this.gate.ready()){this.gateMode='restart';this.show('mobile-gate');return;}if(this.run.mode==='training')this.run=Object.freeze({...this.run,seed:++this.trainingSeed});this.result=null;this.submission=null;this.bridge.start(this.run.seed);this.show('playing');}
  }else if(action==='main'){if(this.run&&!this.result){this.pause();this.back='pause';this.show('confirm-exit');}else this.abandon();}
  else if(action==='refresh'){this.message='';await this.refresh();}
  else if(action==='retry-finish'){await this.finish(this.submission);}
  else if(action==='gate-confirm'){
   if(this.gatePending||!this.gateMode||this.screen!=='mobile-gate'||this.disposed)return;
   const mode=this.gateMode,epoch=this.epoch,request=this.gateRequest=(this.gateRequest||0)+1;this.gatePending=true;
   try{const ready=await this.gate.request();
    if(request!==this.gateRequest||epoch!==this.epoch||this.disposed||this.screen!=='mobile-gate'||this.gateMode!==mode)return;
    if(ready){this.gateMode=null;if(mode==='accepted-start'&&this.run){this.bridge.start(this.run.seed);this.show('playing');}else if(mode==='resume')await this.resume();else if(mode==='restart'){this.show('confirm-restart');await this.action('confirm');}else if(mode==='sponsor')await this.claim();else await this.start(mode);}
    else{this.message='Нужен полный экран и горизонтальное положение.'+(this.run?' Текущая попытка сохранена.':' Попытка ещё не тратится.');this.emit();}
   }finally{if(request===this.gateRequest)this.gatePending=false;}
  }else if(action==='gate-cancel'){this.gateRequest=(this.gateRequest||0)+1;this.gatePending=false;if(this.gateMode==='accepted-start'){this.abandon();}else{this.gateMode=null;this.show(this.run&&!this.result?'pause':'main');}}
 }
 abandon(){this.epoch++;this.bridge.stop();this.run=null;this.result=null;this.submission=null;this.back='main';this.message='';this.show('main');void this.refresh(true);}
 dispose(){this.epoch++;this.disposed=true;this.bridge.stop();this.listeners.clear();}
}
export function formatReset(value){if(!value)return 'после восстановления сезона';try{return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return 'позже';}}
