/** Bounded QA-only journal. No diagnostics or timestamps enter simulation. */
export function createPauseDiagnostics({enabled,window:win,screen,fullscreen}){
 const events=[],counts={};let pointer=null,lastPauseReason=null,display;
 if(enabled){
  display=win.document.createElement('output');display.id='pause-diagnostics';
  display.style.cssText='position:fixed;bottom:2px;right:2px;z-index:10000;max-width:55vw;font:11px monospace;color:#fff;background:#400c;padding:4px;pointer-events:none';
  display.textContent='QA pause: none';win.document.body.append(display);
 }
 const notePointer=e=>{if(enabled)pointer={type:e.pointerType,target:e.target.closest('[data-dir],[data-action]')?.outerHTML.slice(0,120)||e.target.tagName};};
 function record(reason='unknown'){
  if(!enabled)return;lastPauseReason=reason;counts[reason]=(counts[reason]||0)+1;
  events.push({timestamp:win.performance.now(),reason,screen:screen(),innerWidth:win.innerWidth,innerHeight:win.innerHeight,visualViewport:{width:win.visualViewport?.width,height:win.visualViewport?.height},...fullscreen(),orientation:win.innerWidth>win.innerHeight?'landscape':'portrait',pointer});
  if(events.length>200)events.shift();display.textContent=`QA pause: ${reason} · ${Object.values(counts).reduce((a,b)=>a+b,0)}`;
 }
 return {record,notePointer,events,counts,get lastPauseReason(){return lastPauseReason;}};
}
