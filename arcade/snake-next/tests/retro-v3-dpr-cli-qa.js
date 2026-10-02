async page => {
 const browser=page.context().browser(),result=[];
 for(const dpr of [1,1.5,2]){
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:dpr,isMobile:true,hasTouch:true});const p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8773/arcade/snake-next/retro-v3-proof.html?capture=1');await p.waitForFunction(()=>window.retroV3?.ready);
  const metrics=await p.evaluate(()=>window.retroV3.metrics());
  const buttons=await p.locator('button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {name:b.getAttribute('aria-label'),w:r.width,h:r.height};}));
  if(buttons.some(b=>b.w<44||b.h<44))throw Error('Unsafe proof hit target');
  const right=p.getByRole('button',{name:'Preview right touch button'});await right.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch'});await right.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});
  if(dpr===2)await p.screenshot({path:'docs/qa/retro-v3/mobile-dpr2.png',scale:'device'});
  result.push({dpr,metrics,buttons,errors});await context.close();
 }
 await page.goto('http://127.0.0.1:8773/docs/qa/retro-v3/review.html');
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 return {dprCases:result,galleryImages:await page.locator('img').count()};
}
