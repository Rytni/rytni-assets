/** QA-only bounded physical trace. Never read by gameplay or timing policy. */
export function createPauseDiagnostics({enabled,window:win,screen,fullscreen,game=()=>null,child=()=>null}){
 const events=[],counts={},counters={dpadPointerDown:0,directionCommandsEnqueued:0,schedulerRecoveries:0};
 let pointer=null,recentGameplayPointer=null,lastPauseReason=null,lastSchedulerGapMs=null,lastSchedulerRecoveryAt=null,display;
 const key='snake-product-input-trace-v531',limit=300;
 if(enabled){
  try{events.push(...JSON.parse(win.sessionStorage.getItem(key)||'[]').slice(-limit));}catch{}
  display=win.document.createElement('aside');display.id='pause-diagnostics';
  display.style.cssText='position:fixed;bottom:2px;right:2px;z-index:10000;max-width:70vw;font:10px monospace;color:#fff;background:#400c;padding:3px';
  const output=win.document.createElement('output');output.textContent='QA pause: none';output.style.pointerEvents='none';display.append(output);
  const copy=win.document.createElement('button');copy.type='button';copy.textContent='COPY INPUT TRACE';copy.style.cssText='font:10px monospace;min-height:24px;padding:3px;color:white;background:#123;border:1px solid #a98';
  copy.addEventListener('click',async()=>{const text=JSON.stringify(snapshot(),null,2);persist();try{await win.navigator.clipboard.writeText(text);copy.textContent='COPIED';}catch{const area=win.document.createElement('textarea');area.value=text;area.readOnly=true;area.style.cssText='position:fixed;inset:10%;z-index:10001';(win.document.querySelector('#cabinet')||win.document.body).append(area);area.select();area.addEventListener('blur',()=>area.remove(),{once:true});}});
  // Remain inside the fullscreen owner, not outside its visible subtree.
  display.append(copy);(win.document.querySelector('#cabinet')||win.document.body).append(display);
 }
 function persist(){if(enabled)try{win.sessionStorage.setItem(key,JSON.stringify(events));}catch{}}
 const notePointer=e=>{if(enabled)pointer={type:e.pointerType,target:e.target.closest('[data-dir],[data-action]')?.outerHTML.slice(0,120)||e.target.tagName};};
 function event(type,detail={}){
  if(!enabled)return;
  const timestamp=win.performance.now(),g=game(),cw=child();
  if(type==='DPAD_POINTER_DOWN'){counters.dpadPointerDown++;recentGameplayPointer={timestamp,direction:detail.direction,pointerId:detail.pointerId,pointerType:detail.pointerType};}
  if(type==='DIRECTION_ENQUEUE')counters.directionCommandsEnqueued+=detail.enqueued||0;
  if(type==='SCHEDULER_RECOVERY'){counters.schedulerRecoveries++;lastSchedulerGapMs=detail.gapMs;lastSchedulerRecoveryAt=timestamp;}
  const delta=recentGameplayPointer?timestamp-recentGameplayPointer.timestamp:null;
  events.push({type,timestamp,timeOrigin:win.performance.timeOrigin,screen:screen(),gameStatus:g?.status||null,
   parentViewport:{width:win.innerWidth,height:win.innerHeight},innerWidth:win.innerWidth,innerHeight:win.innerHeight,
   visualViewport:{width:win.visualViewport?.width,height:win.visualViewport?.height},
   childViewport:cw?{width:cw.innerWidth,height:cw.innerHeight,hidden:cw.document.hidden,fullscreen:!!cw.document.fullscreenElement}:null,
   hidden:win.document.hidden,orientation:win.innerWidth>win.innerHeight?'landscape':'portrait',...fullscreen(),pointer,
   recentDpadAt:recentGameplayPointer?.timestamp??null,deltaFromDpadMs:delta,
   recentGameplayPointer:delta!==null&&delta<=500?recentGameplayPointer:null,pauseReason:detail.reason||null,...detail});
  if(events.length>limit)events.splice(0,events.length-limit);
  // No synchronous storage work in the recovery/input hot path. Persist at
  // lifecycle boundaries or on Copy; memory remains bounded between them.
  if(['PAUSE_COMMITTED','VISIBILITY_PARENT','PAGEHIDE_PARENT'].includes(type))persist();
  if(['DPAD_POINTER_DOWN','DIRECTION_ENQUEUE','SCHEDULER_RECOVERY','PAUSE_COMMITTED'].includes(type))display.querySelector('output').textContent=`QA pause: ${lastPauseReason||'none'} · D ${counters.dpadPointerDown}/${counters.directionCommandsEnqueued} · R ${counters.schedulerRecoveries} · gap ${lastSchedulerGapMs?.toFixed(0)||'—'}ms · Δ ${delta?.toFixed(0)||'—'}ms `;
 }
 function record(reason='unknown'){
  if(!enabled)return;lastPauseReason=reason;counts[reason]=(counts[reason]||0)+1;
  event('PAUSE_COMMITTED',{reason});
 }
 function snapshot(){return {version:'V5.3.1',lastPauseReason,counters:{...counters},lastSchedulerGapMs,lastSchedulerRecoveryAt,recentGameplayPointer,events:[...events]};}
 return {record,event,notePointer,persist,snapshot,events,counts,counters,get dpadPointerDown(){return counters.dpadPointerDown;},get directionCommandsEnqueued(){return counters.directionCommandsEnqueued;},get schedulerRecoveries(){return counters.schedulerRecoveries;},get recentDpadAt(){return recentGameplayPointer?.timestamp??null;},get deltaFromDpadMs(){return recentGameplayPointer?win.performance.now()-recentGameplayPointer.timestamp:null;},get lastPauseReason(){return lastPauseReason;},get recentGameplayPointer(){return recentGameplayPointer;},get lastSchedulerGapMs(){return lastSchedulerGapMs;},get lastSchedulerRecoveryAt(){return lastSchedulerRecoveryAt;}};
}
