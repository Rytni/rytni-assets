import test from 'node:test';import assert from 'node:assert/strict';
import {FixedClock} from '../simulation/clock.js';import {productClockDriver} from './clock-driver.js';
import {TunnelSession} from '../gate-one/session.js';
for(const gap of [100,150,250])test(`Product ${gap}ms recovery rebases without a canonical tick or catch-up`,()=>{
 const session=new TunnelSession({seed:17}),recovery=[];let now=0,wake,ticks=0;
 const clock=new FixedClock({onTick:()=>{ticks++;session.advance([]);}});
 const cancel=productClockDriver(e=>recovery.push(e))(clock,{now:()=>now,schedule:fn=>{wake=fn;return 1;},cancel:()=>{wake=null;}});
 const hash=session.hash();now=gap;wake();assert.equal(session.hash(),hash);assert.equal(ticks,0);assert.equal(clock.debt,0);assert.equal(clock.status,'running');assert.equal(clock.last,gap);assert.equal(recovery.length,1);assert.equal(recovery[0].gapMs,gap);
 now+=17;wake();assert.equal(ticks,1);cancel();assert.equal(wake,null);
});
test('Product cancelled/hidden timer never advances or recovers',()=>{let wake,ticks=0,recoveries=0;const clock=new FixedClock({onTick:()=>ticks++});const stop=productClockDriver(()=>recoveries++)(clock,{now:()=>0,schedule:fn=>{wake=fn;return 1;},cancel:()=>{}});stop();clock.pause();wake();assert.equal(ticks,0);assert.equal(recoveries,0);assert.equal(clock.status,'paused');});
