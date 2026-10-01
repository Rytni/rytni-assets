/** Main-thread fixed accumulator; scheduler is separate from RAF rendering. */
export class FixedClock {
  constructor({tickHz=60,maxCatchUpTicks=5,onTick}) {
    if(!Number.isInteger(tickHz)||tickHz<1||!Number.isInteger(maxCatchUpTicks)||maxCatchUpTicks<1||typeof onTick!=='function')throw Error('Invalid clock');
    this.tickMs=1000/tickHz;this.maxCatchUpTicks=maxCatchUpTicks;this.onTick=onTick;this.last=null;this.debt=0;this.status='running';this.reason=null;
  }
  advance(now) {
    if(!Number.isFinite(now)||this.last!==null&&now<this.last)throw Error('Clock must be monotonic');
    if(this.status!=='running')return 0;
    if(this.last===null){this.last=now;return 0;}
    this.debt+=now-this.last;this.last=now;
    const due=Math.floor((this.debt+1e-7)/this.tickMs);
    if(due>this.maxCatchUpTicks){this.status='recovery';this.reason='scheduler-lag';this.debt=0;return 0;}
    let count=0;while(this.debt+1e-7>=this.tickMs){this.debt-=this.tickMs;this.onTick();count++;if(this.status!=='running')break;}
    if(this.debt<0)this.debt=0;return count;
  }
  pause() {this.status='paused';this.last=null;this.debt=0;}
  resume(now) {if(!Number.isFinite(now))throw Error('Invalid resume');this.status='running';this.reason=null;this.last=now;this.debt=0;}
}
/** Injectable timer driver: no DOM/RAF/Worker dependency, owned cleanup. */
export function startMainThreadClock(clock,{now,schedule,cancel,intervalMs=4}) {
  let handle=null,active=true;
  const wake=()=>{if(!active)return;clock.advance(now());if(clock.status==='running')handle=schedule(wake,intervalMs);else active=false;};
  clock.resume(now());handle=schedule(wake,intervalMs);
  return ()=>{active=false;if(handle!==null)cancel(handle);handle=null;};
}
