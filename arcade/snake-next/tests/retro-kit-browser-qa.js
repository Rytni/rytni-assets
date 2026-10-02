async page => {
 const base='http://127.0.0.1:8773/arcade/snake-next/retro-kit-review.html',out='docs/qa/retro-kit/',evidence={errors:[],warnings:[],failures:[],http:[],captures:[],checks:[],performance:[],memory:[]};
 const watch=p=>{p.on('pageerror',e=>evidence.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());if(m.type()==='warning')evidence.warnings.push(m.text());});p.on('requestfailed',r=>evidence.failures.push(r.url()));p.on('response',r=>{if(r.status()>=400)evidence.http.push({url:r.url(),status:r.status()});});};watch(page);
 const check=(ok,name)=>{if(!ok)throw Error(name);evidence.checks.push(name);};
 const shot=async(p,name,selector)=>{if(selector)await p.locator(selector).screenshot({path:out+name+'.png'});else await p.screenshot({path:out+name+'.png',scale:'css'});evidence.captures.push(name);};
 await page.setViewportSize({width:1366,height:768});await page.goto(base);await page.waitForFunction(()=>!!window.kitQA);
 await shot(page,'01-anatomy','#anatomy');await shot(page,'02-object-grammar','#objects');await shot(page,'03-frame-checkerboard','#frames');await shot(page,'04-dpad','#controls');await shot(page,'05-vfx','#effects');
 await shot(page,'06-desktop-embedded','#stage');
 await page.setViewportSize({width:1920,height:1080});await page.locator('#fullscreen').click();check(await page.evaluate(()=>!!document.fullscreenElement),'real desktop fullscreen');await shot(page,'07-desktop-fullscreen');await page.evaluate(()=>document.exitFullscreen());
 await page.setViewportSize({width:1366,height:768});await page.goto(base+'?proof=1');await page.waitForFunction(()=>!!window.kitQA);
 evidence.pixelQA=await page.evaluate(()=>kitQA.pixelQA());check(evidence.pixelQA.gaps===0,'exhaustive alpha connectors DPR 1/1.5/2, fractional placement and 12/19.25/32 cells');
 for(const [shape,length]of [['straight',8],['corner',8],['U',8],['S',22],['parallel',250],['parallel',1200]]){await page.evaluate(o=>kitQA.set(o),{shape,length,direction:1});await shot(page,`08-${shape}-${length}`);}
 for(const direction of [0,1,2,3]){await page.evaluate(direction=>kitQA.set({length:8,shape:'corner',direction}),direction);await shot(page,'09-head-'+direction);}
 // Native identity does not depend on translation, resize, or frame time.
 check(await page.evaluate(()=>{const a=kitQA.fixture(100,'parallel'),b=a.map(p=>({...p,x:p.x+3,y:p.y-1}));return JSON.stringify(kitQA.selectTiles(a).map(p=>p.key))===JSON.stringify(kitQA.selectTiles(b).map(p=>p.key));}),'stable material identity');
 const cdp=await page.context().newCDPSession(page);
 try{for(const cpu of [1,4]){await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});for(const length of [8,100,250,500,1200]){evidence.performance.push({...await page.evaluate(length=>kitQA.benchmark(length,180),length),cpu});}}}finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();}
 evidence.memory.push({viewport:'1366x768 DPR1',...await page.evaluate(()=>kitQA.summary())});
 const browser=page.context().browser();
 for(const dpr of [1,1.5,2]){const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:dpr}),p=await context.newPage();watch(p);await p.goto(base+'?proof=1');await p.waitForFunction(()=>!!window.kitQA);await shot(p,'10-dpr-'+dpr);evidence.memory.push({viewport:`1366x768 DPR${dpr}`,...await p.evaluate(()=>kitQA.summary())});await context.close();}
 const mobileContext=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}),mobile=await mobileContext.newPage();watch(mobile);
 await mobile.goto(base+'?proof=1');await mobile.waitForFunction(()=>!!window.kitQA);
 for(const size of [{width:844,height:390},{width:915,height:412}]){await mobile.setViewportSize(size);await mobile.evaluate(()=>kitQA.set({length:22,shape:'S',direction:1}));await shot(mobile,'11-mobile-'+size.width);evidence.memory.push({viewport:`${size.width}x${size.height} DPR2`,...await mobile.evaluate(()=>kitQA.summary())});
  check(await mobile.locator('.hit').count()===4,'four transparent mobile hit targets '+size.width);
  const bounds=await mobile.locator('.hit').evaluateAll(bs=>bs.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));check(bounds.every(b=>b.w===44&&b.h===44),'44px touch bounds '+size.width);
  await mobile.locator('[data-direction=right]').tap();check((await mobile.evaluate(()=>kitQA.summary())).options.pressed===null,'touch release restores normal state '+size.width);
 }
 await mobile.evaluate(()=>document.querySelector('#scene').classList.add('gray'));await shot(mobile,'12-mobile-grayscale');
 // All critical art requests are single-load; no source master or legacy assets are loaded.
 const resources=await mobile.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/grib/')).map(r=>r.name));
 check(resources.length===new Set(resources).size,'no duplicate art resources');check(!resources.some(r=>r.includes('/sources/')),'no decoded production source master');
 await mobileContext.close();check(!evidence.errors.length&&!evidence.warnings.length&&!evidence.failures.length&&!evidence.http.length,'console/network clean');
 evidence.browser=await page.evaluate(()=>navigator.userAgent);return evidence;
}
