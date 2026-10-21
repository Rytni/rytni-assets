/** Presentation lifecycle settle. Never advances or owns canonical ticks. */
export function createMobileLifecycle({invalid,suspend,resume,pause,setTimer=setTimeout,clearTimer=clearTimeout,delay=180}){
 let timer=null,held=false,heldReason=null;
 function check(reason){
  if(timer!==null)clearTimer(timer);
  const current=invalid(reason)||(held?invalid(heldReason):null);
  if(!current){if(held){held=false;resume();}timer=null;return;}
  heldReason=current;
  if(!held){held=true;suspend();}
  timer=setTimer(()=>{timer=null;const confirmed=invalid(heldReason);held=false;if(confirmed)pause(confirmed);else resume();},delay);
 }
 function dispose(){if(timer!==null)clearTimer(timer);timer=null;held=false;}
 return {check,dispose,get held(){return held;}};
}
