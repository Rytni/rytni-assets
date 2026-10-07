async page=>{
 if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
 const ctx=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage();
 await p.addInitScript(()=>{
  window.__focusLog=[];for(const name of ['blur','focus','visibilitychange','resize','fullscreenchange'])addEventListener(name,()=>{window.__focusLog.push({event:name,time:Math.round(performance.now()),hasFocus:document.hasFocus(),hidden:document.hidden,screen:document.querySelector('#product')?.dataset.screen,fs:!!document.fullscreenElement});if(__focusLog.length>50)__focusLog.shift();},true);
 });
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text();
 // Read-only instrumentation: record the automatic pause caller and clock
 // state before the existing pause implementation resets its debt/status.
 const instrumented=source.replace("const run=eval('('+source+')')",`source=source.replace('if(mobile){check(await gf.locator',\`await gf.evaluate(()=>{const g=snakeProductGame,pause=g.pause;window.__pauseLog=[];g.pause=function(...args){__pauseLog.push({time:Math.round(performance.now()),gameStatus:this.status,clock:{status:this.clock?.status,reason:this.clock?.reason,debt:this.clock?.debt,last:this.clock?.last},hasFocus:document.hasFocus(),hidden:document.hidden,stack:new Error().stack});return pause.apply(this,args);};});if(mobile){check(await gf.locator\`);const run=eval('('+source+')')`);
 try{return await eval('('+instrumented+')')(p,{live:true,viewport:{width:1366,height:768},tag:'focus'});}
 catch(e){return {error:e.message,frames:await Promise.all(p.frames().map(async f=>({url:f.url(),focus:await f.evaluate(()=>({log:window.__focusLog,pauses:window.__pauseLog,hasFocus:document.hasFocus(),screen:document.querySelector('#product')?.dataset.screen})).catch(()=>null)})))};}
 finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}
}
