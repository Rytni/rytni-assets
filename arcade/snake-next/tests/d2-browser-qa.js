// Playwright CLI: run-code --filename=arcade/snake-next/tests/d2-browser-qa.js
async page => {
  const dir='.playwright-cli/d2-proof',errors=[],failures=[],notFound=[],results=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push(r.url()));page.on('response',r=>{if(r.status()===404)notFound.push(r.url());});
  const assert=(v,m)=>{if(!v)throw Error(m);};
  await page.unrouteAll({behavior:'ignoreErrors'});await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8773/arcade/snake-next/d2-review.html?qa=1');
  await page.evaluate(async()=>{await d2QA.scene({shape:'straight',length:8});d2QA.phase(.5);});
  const probe=await page.evaluate(()=>d2QA.rasterProbe());assert(probe.holes===0,'Raster centerline has holes');
  // Actual drawn accents must ride with tissue, not stay painted on the world route.
  await page.evaluate(async()=>{await d2QA.scene({shape:'straight',length:30,speed:4});d2QA.phase(1);});
  const materialBefore=await page.evaluate(()=>d2Review.renderer.accents.filter(v=>v.distance<10).map(v=>({...v})));assert(materialBefore.length>0,'No visible material motion evidence');
  await page.evaluate(()=>d2QA.advance(15));
  for(const alpha of [0,.125,.5,.875,1]){
    const actual=await page.evaluate(a=>{d2QA.phase(a);return {start:d2Review.renderer.body.start,accents:d2Review.renderer.accents.map(v=>({...v}))};},alpha);
    for(const old of materialBefore){const v=actual.accents.find(v=>v.id===old.id);assert(v&&Math.abs(v.x-old.x-alpha)<1e-5&&Math.abs(v.y-old.y)<1e-5&&Math.abs(v.distance-actual.start-old.distance)<1e-5,'Material is world-locked or changes anatomy identity');}
    await page.screenshot({path:`${dir}/material-motion-a${alpha}.png`});
  }
  // Slow critical load: no canvas visible until all decodes finish.
  await page.route('**/mushroom-snake-d2-proof/*.png',async route=>{await page.waitForTimeout(120);await route.continue();});await page.reload();await page.locator('#start').click();await page.waitForFunction(()=>d2Review.ui==='loading');assert(await page.locator('canvas').evaluate(c=>getComputedStyle(c).visibility==='hidden'),'Canvas revealed during decode');await page.screenshot({path:`${dir}/loading.png`});await page.waitForFunction(()=>d2Review.ui==='playing');await page.unroute('**/mushroom-snake-d2-proof/*.png');
  for(const shape of ['straight','90','U','S','parallel'])for(const direction of [0,1,2,3]){
    await page.evaluate(async o=>{await d2QA.scene(o);d2Review.pause();d2QA.advance(15);}, {shape,length:shape==='straight'?8:30,direction,speed:4,automatic:false});
    for(const alpha of [.125,.5,.875]){
      const g=await page.evaluate(a=>d2QA.phase(a),alpha),r=await page.evaluate(()=>d2QA.rasterProbe());assert(r.holes===0,`${shape}/${direction}/${alpha} raster holes`);assert(r.outside===0,`${shape}/${direction}/${alpha} corridor escape`);
      if(shape!=='parallel')assert((g.head.dx>0?1:g.head.dx<0?3:g.head.dy>0?2:0)===direction,'Facing');
      if(direction===1||shape==='straight'){await page.screenshot({path:`${dir}/${shape}-dir${direction}-a${alpha}.png`});
        const box=await page.locator('canvas').boundingBox();for(const part of ['head','tail']){const p=g[part],x=box.x+g.transform.x+p.x*g.scale,y=box.y+g.transform.y+p.y*g.scale;const clip={x:Math.max(box.x,x-100),y:Math.max(box.y,y-70),width:Math.min(200,box.width-10),height:Math.min(140,box.height-10)};if(clip.x+clip.width<box.x+box.width&&clip.y+clip.height<box.y+box.height)await page.screenshot({path:`${dir}/${shape}-dir${direction}-${part}-a${alpha}.png`,clip});}
      }
    }
  }
  await page.evaluate(async()=>{await d2QA.scene({shape:'straight',length:8,speed:20});d2Review.pause();d2QA.advance(9);d2QA.phase(.5);});assert((await page.evaluate(()=>d2QA.summary())).length===9,'Growth');await page.screenshot({path:`${dir}/growth.png`});
  await page.evaluate(async()=>{await d2QA.scene({shape:'straight',length:8,direction:1,speed:4,foodDirection:2});d2Review.input(2);d2Review.pause();d2QA.advance(15);});assert((await page.evaluate(()=>d2QA.summary())).length===9,'Growth at turn');
  for(const a of [.125,.5,.875]){const g=await page.evaluate(a=>d2QA.phase(a),a),r=await page.evaluate(()=>d2QA.rasterProbe());assert(!r.holes&&!r.outside,'Growing turn junction');const box=await page.locator('canvas').boundingBox();await page.screenshot({path:`${dir}/growth-turn-a${a}.png`});for(const part of ['head','tail'])await page.screenshot({path:`${dir}/growth-turn-${part}-a${a}.png`,clip:{x:box.x+g.transform.x+g[part].x*g.scale-70,y:box.y+g.transform.y+g[part].y*g.scale-70,width:140,height:140}});}
  for(const length of [8,30,100,250,500,1200]){await page.evaluate(async length=>{await d2QA.scene({shape:'parallel',length,automatic:true});d2QA.phase(.5);},length);const probe=await page.evaluate(()=>d2QA.rasterProbe());assert(!probe.holes&&!probe.outside,`Length ${length}`);await page.screenshot({path:`${dir}/length-${length}.png`});}
  for(const grayscale of [false,true]){await page.evaluate(async gray=>{await d2QA.scene({shape:'stress',length:30,direction:1,speed:4,automatic:false});d2QA.view({grayscale:gray,debug:false});d2QA.phase(.5);},grayscale);await page.screenshot({path:`${dir}/stress-${grayscale?'grayscale':'normal'}.png`});}
  await page.evaluate(()=>d2QA.view({grayscale:false}));await page.locator('#fullscreen').click();assert(await page.evaluate(()=>!!document.fullscreenElement),'Fullscreen');await page.screenshot({path:`${dir}/desktop-fullscreen.png`});await page.keyboard.press('Escape');
  const browser=page.context().browser();
  for(const viewport of [{width:844,height:390},{width:915,height:412}])for(const dpr of [1,1.5,2]){
    const context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:true,hasTouch:true});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failures.push(r.url()));await p.goto('http://127.0.0.1:8773/arcade/snake-next/d2-review.html?qa=1');await p.evaluate(async()=>{await d2QA.scene({shape:'stress',length:30});d2QA.phase(.5);});await p.screenshot({path:`${dir}/mobile-${viewport.width}-dpr${dpr}.png`});const s=await p.evaluate(()=>d2QA.summary());assert(s.raster.totalBytes<=56*1048576,'Mobile memory');assert((await p.locator('[data-dir="1"]').boundingBox()).height>=44,'Touch target');results.push({viewport,dpr,...s});await context.close();
  }
  for(const dpr of [1,1.5,2]){const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:dpr});const p=await context.newPage();await p.goto('http://127.0.0.1:8773/arcade/snake-next/d2-review.html?qa=1');await p.evaluate(async()=>{await d2QA.scene({shape:'U',length:30});d2Review.pause();d2QA.advance(15);d2QA.phase(.5);});await p.screenshot({path:`${dir}/desktop-dpr${dpr}.png`});await context.close();}
  // Real live sequence rather than unrelated stills. Snake continues timer-based movement.
  await page.evaluate(async()=>{await d2QA.scene({shape:'parallel',length:30,speed:4,automatic:true});});for(let i=0;i<12;i++){await page.waitForTimeout(45);await page.screenshot({path:`${dir}/moving-${i}.png`});}
  await page.evaluate(()=>d2QA.stop());const stopped=await page.evaluate(()=>d2QA.summary());assert(!stopped.resources.raf&&!stopped.resources.timers&&!stopped.raster.backings&&!stopped.raster.ground,'Stop leak');
  assert(errors.length===0&&failures.length===0&&notFound.length===0,'Console/network');const report={pass:true,errors,failures,notFound,mobile:results,stopped};await page.evaluate(r=>window.d2QAReport=r,report);return report;
}
