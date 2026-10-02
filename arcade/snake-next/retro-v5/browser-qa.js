async page=>{
  const base='http://127.0.0.1:8773',url=base+'/arcade/snake-next/retro-v5-review.html';
  const browser=page.context().browser(),context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
  const p=await context.newPage(),errors=[],failed=[],httpErrors=[];
  const collect=t=>{
    t.on('pageerror',e=>errors.push(e.message));
    t.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));
    t.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
  };collect(p);
  const assert=(ok,message)=>{if(!ok)throw Error(message)};
  await p.goto(url);await p.waitForFunction(()=>window.retroV5);
  await p.waitForFunction(()=>retroV5.eventLog.some(e=>e.kind==='portal'),{},{timeout:12000});
  const flow=await p.evaluate(()=>({moves:retroV5.moves,length:retroV5.state.length,score:retroV5.state.score,events:retroV5.eventLog,effects:retroV5.effects}));
  assert(flow.length>=9&&flow.score>=100,'Food/growth failed');
  for(const kind of ['seed','positive','negative','portal'])assert(flow.events.some(e=>e.kind===kind),'Missing '+kind);
  await p.keyboard.press('ArrowUp');await p.waitForFunction(()=>retroV5.state.direction===0);
  await p.keyboard.press('ArrowLeft');await p.waitForFunction(()=>retroV5.state.direction===3);
  await p.keyboard.press('Space');
  const paused=await p.evaluate(()=>retroV5.state.tick);await p.waitForTimeout(120);
  assert(await p.evaluate(()=>retroV5.state.tick)===paused,'Paused tick advanced');
  await p.keyboard.press('Space');await p.waitForFunction(t=>retroV5.state.tick>t,paused);
  await p.keyboard.press('r');
  assert(await p.evaluate(()=>retroV5.state.length===8&&retroV5.effects.length===0&&retroV5.eventLog.length===0),'Restart did not reset preview');
  await p.evaluate(()=>{retroV5.stop();for(let i=0;i<10000&&retroV5.state.status==='playing';i++)retroV5.tick()});
  assert(await p.evaluate(()=>retroV5.status==='dead'),'Canonical collision/result missing');
  await p.keyboard.press('Enter');await p.waitForFunction(()=>retroV5.status==='playing');
  await p.evaluate(()=>retroV5.pause());
  const before=await p.evaluate(()=>Array.from(retroV5.state.body));
  await p.setViewportSize({width:1920,height:1080});
  assert(await p.evaluate(a=>JSON.stringify(Array.from(retroV5.state.body))===JSON.stringify(a),before),'Resize mutated canonical body');
  await p.evaluate(()=>retroV5.reviewScene());
  await p.screenshot({path:'docs/qa/retro-v5-2/desktop-1920.png'});
  await p.setViewportSize({width:1366,height:768});await p.evaluate(()=>retroV5.reviewScene());
  await p.screenshot({path:'docs/qa/retro-v5-2/desktop-1366.png'});
  await p.locator('[data-action=fullscreen]').click();
  await p.waitForFunction(()=>document.fullscreenElement?.id==='stage');
  await p.evaluate(()=>retroV5.reviewScene());
  await p.screenshot({path:'docs/qa/retro-v5-2/fullscreen.png'});
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.fullscreenElement);
  await p.locator('#gray').check();
  await p.screenshot({path:'docs/qa/retro-v5-2/grayscale.png'});await p.locator('#gray').uncheck();
  const mobile=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true}),m=await mobile.newPage();collect(m);
  await m.goto(url);await m.waitForFunction(()=>window.retroV5);
  const pad=await m.evaluate(()=>retroV5.lastLayout.hits.find(h=>h.id==='up'));
  assert(pad.w===44&&pad.h===44,'Touch target below44');
  await m.touchscreen.tap(pad.x+22,pad.y+22);
  await m.waitForFunction(()=>retroV5.state.direction===0);
  const pause=await m.evaluate(()=>retroV5.lastLayout.hits.find(h=>h.id==='pause'));
  await m.touchscreen.tap(pause.x+pause.w/2,pause.y+pause.h/2);
  assert(await m.evaluate(()=>retroV5.status==='paused'),'Mobile pause failed');
  const resume=await m.evaluate(()=>retroV5.lastLayout.hits.find(h=>h.id==='resume'));
  await m.touchscreen.tap(resume.x+resume.w/2,resume.y+resume.h/2);
  assert(await m.evaluate(()=>retroV5.status==='playing'),'Mobile resume failed');
  await m.evaluate(()=>retroV5.reviewScene());await m.screenshot({path:'docs/qa/retro-v5-2/mobile-844.png'});
  await m.setViewportSize({width:915,height:412});await m.evaluate(()=>retroV5.reviewScene());
  await m.screenshot({path:'docs/qa/retro-v5-2/mobile-915.png'});
  const rasterQA=[];
  for(const dpr of [1,1.5,2]) {
    const c=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:dpr}),t=await c.newPage();collect(t);
    await t.goto(url);await t.waitForFunction(()=>window.retroV5);
    await t.evaluate(()=>retroV5.pause());
    const report=await t.evaluate(async dpr=>{
      const {pieces,CELL}=await import('./retro-v5/geometry.mjs'),{audit}=await import('./retro-v5/qa.mjs');
      const sprites=new Map(pieces.map(piece=>[piece.mask,retroV5.art.images.get(piece.name+'-v0')]));
      return audit(dpr,mask=>{
        const canvas=document.createElement('canvas');canvas.width=canvas.height=CELL*dpr;
        const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(sprites.get(mask),0,0,canvas.width,canvas.height);
        const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        return Uint8Array.from({length:canvas.width*canvas.height},(_,i)=>+(data[i*4+3]>=128));
      });
    },dpr);
    assert(report.pass,'Actual sprite connector failure DPR'+dpr);
    rasterQA.push(report);await c.close();
  }
  await p.setViewportSize({width:1366,height:768});
  const cdp=await context.newCDPSession(p),performance=[];
  for(const rate of [1,4]) {
    await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    for(const length of [8,100,250,500,1200]) {
      const sample=await p.evaluate(async length=>{
        retroV5.start(length);retroV5.stop();retroV5.status='playing';
        retroV5.recordPerf=false;
        for(let i=0;i<12;i++)retroV5.render();
        retroV5.metrics=[];retroV5.recordPerf=true;
        for(let i=0;i<64;i++){await new Promise(requestAnimationFrame);retroV5.render();}
        retroV5.recordPerf=false;
        const a=retroV5.metrics.slice().sort((a,b)=>a-b),q=p=>a[Math.min(a.length-1,Math.floor(a.length*p))];
        return {length,samples:a.length,p50:q(.5),p95:q(.95),max:a.at(-1),decodedMiB:retroV5.art.bytes/1048576,canvasMiB:retroV5.canvas.width*retroV5.canvas.height*4/1048576};
      },length);
      performance.push({cpuRate:rate,...sample});
    }
  }
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await p.evaluate(()=>retroV5.reviewScene());
  const result={flow,desktop:true,mobile:true,fullscreen:true,resizePreservesSimulation:true,connectorQA:rasterQA,performance,errors,failed,httpErrors,checkpoint:'Pre-checkpoint QA evidence; final local commit is reported separately',limitations:['Positive/negative timers are visual proof only; no speed or score modifications','Portal contact VFX only; no teleport mechanic','Menus and portrait flow are intentionally outside this isolated proof']};
  assert(errors.length===0&&failed.length===0&&httpErrors.length===0,'Console/network not clean');
  await page.goto('about:blank');
  const downloadPromise=page.waitForEvent('download');
  await page.evaluate(result=>{
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'}));a.download='qa-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },result);
  await (await downloadPromise).saveAs('docs/qa/retro-v5-2/qa-results.json');
  await page.goto(base+'/docs/qa/retro-v5-2/review.html');
  await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth));
  assert(await page.evaluate(()=>Array.from(document.images).every(i=>i.getBoundingClientRect().width===i.naturalWidth)),'Gallery shrinks native outputs');
  await mobile.close();await context.close();
  return {flow,connectorQA:rasterQA.map(r=>({dpr:r.dpr,pass:r.pass,gaps:r.gaps,mismatch:r.connectorMismatch,overlap:r.overlapPixels})),performance,errors,failed,httpErrors};
}
