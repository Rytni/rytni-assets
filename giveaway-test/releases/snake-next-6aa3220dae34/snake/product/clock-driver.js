/** Product timing policy only. FixedClock and canonical ticks are unchanged. */
export function productClockDriver(onRecovery){
 return (clock,{now,schedule,cancel,intervalMs=4})=>{
  let active=true,handle=null;
  const wake=()=>{
   if(!active)return;
   const at=now(),gapMs=at-clock.last;
   clock.advance(at);
   if(clock.status==='recovery'){
    // FixedClock rejected this wake before any tick. Discard debt, do not
    // synthesize elapsed gameplay time, and keep the same canonical state.
    clock.resume(at);
    onRecovery?.({gapMs,at});
   }
   if(active&&clock.status==='running')handle=schedule(wake,intervalMs);
   else active=false;
  };
  clock.resume(now());handle=schedule(wake,intervalMs);
  return ()=>{active=false;if(handle!==null)cancel(handle);handle=null;};
 };
}
