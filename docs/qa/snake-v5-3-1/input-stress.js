async page=>{
 const context=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await context.addInitScript(()=>{window.productListenerAudit=[];const add=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,fn,options){if(location.pathname.endsWith('/product/frame.html')&&['pointerdown','blur','visibilitychange','keydown','resize','fullscreenchange','pagehide'].includes(type))productListenerAudit.push({type,target:this===window?'window':this===document?'document':this.id||this.tagName,stack:new Error().stack});return add.call(this,type,fn,options);};});
 const p=await context.newPage(),errors=[],failures=[],stress=[];let checks=0;
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.game);
 await p.locator('[data-action=training]').click();await p.waitForFunction(()=>snakeProduct.controller.screen==='playing');
 const f=p.frames().find(f=>f.url().includes('/product/frame.html'));
 const ownership=await f.evaluate(()=>({mode:snakeProductGame.mode,owner:!!snakeProductGame.productInputOwner,listeners:productListenerAudit}));
 checks++;if(ownership.mode!=='product'||!ownership.owner||ownership.listeners.filter(e=>e.target==='pad'&&e.type==='pointerdown').length!==1||ownership.listeners.some(e=>e.stack.includes('TrainingGame.listen')&&!['resize','fullscreenchange'].includes(e.type)))failures.push({ownership});
 await f.evaluate(()=>snakeProductGame.stop());
 // Isolated input receipts, no invulnerability/collision changes. Subsequent
 // resize/stall groups use the real running timer in fresh canonical fixtures.
 for(let i=0;i<300;i++)await f.locator(`[data-dir="${i%4}"]`).tap();
 for(let i=0;i<300;i++)await f.locator(`[data-dir="${[2,1,0,3][i%4]}"]`).tap();
 await f.evaluate(()=>{window.focus();document.querySelector('[data-dir="0"]').focus();window.dispatchEvent(new Event('blur'));});
 await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await p.waitForTimeout(210);
 const first=await p.evaluate(()=>({screen:snakeProduct.controller.screen,queued:snakeProduct.game.commands.length,counters:{...snakePauseDiagnostics.counters},counts:{...snakePauseDiagnostics.counts}}));checks++;if(first.screen!=='playing'||first.queued!==600||first.counters.dpadPointerDown!==600||first.counters.directionCommandsEnqueued!==600||Object.keys(first.counts).length)failures.push({first});
 const parity=await f.evaluate(()=>{const actual=snakeProductGame.commands,expected=[...Array.from({length:300},(_,i)=>i%4),...Array.from({length:300},(_,i)=>[2,1,0,3][i%4])].map((direction,i)=>({tick:1,sequence:i+1,direction,repeat:false})),Session=snakeProductGame.session.constructor,a=new Session({seed:17}),b=new Session({seed:17});for(let i=0;i<60;i++){a.advance(actual.slice(i*10,i*10+10));b.advance(expected.slice(i*10,i*10+10));}return {a:a.hash(),b:b.hash(),equal:a.hash()===b.hash(),directionsMatch:actual.length===expected.length&&actual.every((c,i)=>c.direction===expected[i].direction)};});checks++;if(!parity.equal||!parity.directionsMatch)failures.push({parity});
 for(let i=0;i<100;i++){
  await p.evaluate(i=>snakeProduct.bridge.start(1700+i),i);
  await p.setViewportSize({width:844,height:[390,376,362][i%3]});
  await f.locator(`[data-dir="${i%2?1:2}"]`).tap();
  await f.locator(`[data-dir="${i%2?1:2}"]`).focus();
  const state=await p.evaluate(()=>({screen:snakeProduct.controller.screen,status:snakeProduct.game.status,scroll:[scrollX,scrollY],full:!!document.fullscreenElement||document.querySelector('#cabinet').classList.contains('pseudo-fullscreen')}));
  if(state.screen!=='playing'||state.status!=='playing'||state.scroll.some(Boolean)||!state.full)failures.push({resize:i,state});
 }
 checks++;
 await p.setViewportSize({width:844,height:390});
 await p.evaluate(()=>{window.stallReceipts=[];const original=snakePauseDiagnostics.event;snakePauseDiagnostics.event=(type,data)=>{if(type==='SCHEDULER_RECOVERY')stallReceipts.push({gapMs:data.gapMs,before:snakeProduct.game.stallBefore,hash:snakeProduct.game.session.hash(),tick:snakeProduct.game.session.tick,debt:snakeProduct.game.clock.debt,status:snakeProduct.game.status,screen:snakeProduct.controller.screen});original(type,data);};});
 for(let i=0;i<100;i++){
  await p.evaluate(i=>snakeProduct.bridge.start(2700+i),i);
  await f.locator(`[data-dir="${i%2?1:2}"]`).tap();
  const count=await p.evaluate(()=>stallReceipts.length);
  await f.evaluate(ms=>{const g=snakeProductGame;g.stallBefore={hash:g.session.hash(),tick:g.session.tick};const at=performance.now();while(performance.now()-at<ms){};},[100,150,250][i%3]);
  await p.waitForFunction(n=>stallReceipts.length>n,count);
 }
 const receipts=await p.evaluate(()=>stallReceipts);checks++;if(receipts.length!==100||receipts.some(r=>r.hash!==r.before.hash||r.tick!==r.before.tick||r.debt!==0||r.status!=='playing'||r.screen!=='playing'))failures.push({receipts});
 const after=await p.evaluate(()=>({screen:snakeProduct.controller.screen,counters:{...snakePauseDiagnostics.counters},counts:{...snakePauseDiagnostics.counts},lastSchedulerGapMs:snakePauseDiagnostics.lastSchedulerGapMs,trace:snakePauseDiagnostics.snapshot(),scroll:[scrollX,scrollY],full:!!document.fullscreenElement||document.querySelector('#cabinet').classList.contains('pseudo-fullscreen')}));
 checks++;if(after.screen!=='playing'||after.counters.dpadPointerDown!==800||after.counters.directionCommandsEnqueued!==800||after.counters.schedulerRecoveries<100||Object.keys(after.counts).length||after.scroll.some(Boolean)||!after.full)failures.push({after});
 await p.evaluate(()=>snakeProduct.bridge.start(17));await f.evaluate(()=>snakeProductGame.stop());await p.screenshot({path:'docs/qa/snake-v5-3-1/mobile-gameplay.png',scale:'css'});
 // Legitimate persistent lifecycle signals still pause; no blanket suppression.
 await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>snakeProduct.controller.screen==='mobile-gate');checks++;if(await p.evaluate(()=>snakePauseDiagnostics.lastPauseReason)!=='orientation-portrait')failures.push({orientation:'not paused'});
 stress.push({taps:800,normal:300,rapid:300,heightChanges:100,stalls:100,unexpectedPauses:after.counts,directionCounts:after.counters,parity,stallGaps:receipts.map(r=>r.gapMs)});
 await context.close();return {checks,failures,errors,ownership,receipts,after,stress};
}
