async page => {
 const base='http://127.0.0.1:8773',out='docs/qa/retro-v3',errors=[],failed=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});
 const captures=[],memory=[];
 for(const [name,w,h,embedded]of [['desktop-1920',1920,1080,false],['embedded-1366',1366,768,true],['mobile-844',844,390,false],['mobile-915',915,412,false]]){
  await page.setViewportSize({width:w,height:h});
  await page.goto(base+'/arcade/snake-next/retro-v3-proof.html?capture=1'+(embedded?'&embedded=1':''));
  await page.waitForFunction(()=>window.retroV3?.ready);await page.evaluate(()=>window.retroV3.freeze(180));
  await page.screenshot({path:out+'/'+name+'.png',scale:'css'});captures.push(name+'.png');
  memory.push({name,...await page.evaluate(()=>window.retroV3.metrics())});
 }
 await page.setViewportSize({width:1400,height:720});
 for(const sheet of ['anatomy','objects','hud','vfx']){
  await page.goto(base+'/arcade/snake-next/retro-v3-proof.html?capture=1&sheet='+sheet);await page.waitForFunction(()=>window.retroV3?.ready);await page.screenshot({path:out+'/'+sheet+'.png',scale:'css'});captures.push(sheet+'.png');
 }
 const pixel=await page.evaluate(()=>{const q=window.retroV3.pixelQA();return {...q,failed:q.failed.slice(0,8)};});
 await page.setViewportSize({width:1366,height:768});await page.goto(base+'/arcade/snake-next/retro-v3-proof.html?capture=1');await page.waitForFunction(()=>window.retroV3?.ready);
 const desktop=await page.evaluate(()=>window.retroV3.benchmark(1200,120));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const cpu4=await page.evaluate(()=>window.retroV3.benchmark(1200,120));await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();
 // Real presentation fullscreen request; only visual animation pause, no gameplay added.
 await page.getByRole('button',{name:'Fullscreen proof',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);
 await page.getByRole('button',{name:'Pause visual animation'}).click();await page.getByRole('button',{name:'Fullscreen proof',exact:true}).click();await page.waitForFunction(()=>!document.fullscreenElement);
 // Duplicate loading is checked in the same document, not across normal navigation.
 const duplicate=await page.evaluate(async()=>{const before=performance.getEntriesByType('resource').length;const {loadKit}=await import('/arcade/snake-next/retro-v3/renderer.js');await loadKit();await loadKit();return performance.getEntriesByType('resource').length-before;});
 return {captures,pixel,memory,performance:{desktop,cpu4},fullscreen:true,repeatLoadNewRequests:duplicate,applicationErrors:errors,requestFailures:failed,httpErrors:bad};
}
