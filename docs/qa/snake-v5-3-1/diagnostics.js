async page=>{
 const c=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await c.newPage(),failures=[],errors=[];p.on('pageerror',e=>errors.push(e.message));await c.grantPermissions(['clipboard-read','clipboard-write']);
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.game);await p.locator('[data-action=training]').click();await p.waitForFunction(()=>snakeProduct.controller.screen==='playing');
 const f=p.frames().find(f=>f.url().includes('/product/frame.html'));await f.locator('[data-dir="2"]').tap();await f.evaluate(()=>{const at=performance.now();while(performance.now()-at<150){};});await p.waitForFunction(()=>snakePauseDiagnostics.schedulerRecoveries>=1);await f.evaluate(()=>snakeProductGame.stop());
 const trace=await p.evaluate(()=>snakePauseDiagnostics.snapshot()),recovery=trace.events.find(e=>e.type==='SCHEDULER_RECOVERY');
 if(!recovery?.recentGameplayPointer||recovery.deltaFromDpadMs>500||recovery.gapMs<100||trace.counters.dpadPointerDown!==trace.counters.directionCommandsEnqueued)failures.push({trace});
 await p.getByRole('button',{name:'COPY INPUT TRACE'}).click();
 const copy=await p.evaluate(async()=>({data:JSON.parse(await navigator.clipboard.readText()),screen:snakeProduct.controller.screen,inside:document.querySelector('#cabinet').contains(document.querySelector('#pause-diagnostics')),stored:JSON.parse(sessionStorage.getItem('snake-product-input-trace-v531')).length}));
 if(copy.data.version!=='V5.3.1'||copy.screen!=='playing'||!copy.inside||copy.stored<1||copy.stored>300)failures.push({copy});
 await f.locator('[data-dir="1"]').tap();const counters=await p.evaluate(()=>({...snakePauseDiagnostics.counters}));if(counters.dpadPointerDown!==2||counters.directionCommandsEnqueued!==2)failures.push({counters});
 await p.screenshot({path:'docs/qa/snake-v5-3-1/mobile-trace.png',scale:'css'});
 await p.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('QA clipboard denial');};});
 await p.locator('#pause-diagnostics button').click();await p.waitForSelector('#cabinet textarea');
 const fallback=await p.locator('#cabinet textarea').evaluate(e=>({inside:document.fullscreenElement.contains(e),version:JSON.parse(e.value).version,visible:e.getBoundingClientRect().width>0}));
 if(!fallback.inside||!fallback.visible||fallback.version!=='V5.3.1')failures.push({fallback});
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.game);if(await p.locator('#pause-diagnostics').count())failures.push({normalUi:'has diagnostics'});
 await c.close();return {checks:5,failures,errors,recovery,counters,fallback,copy:{screen:copy.screen,inside:copy.inside,stored:copy.stored,version:copy.data.version}};
}
