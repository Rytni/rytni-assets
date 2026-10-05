async page=>{
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>network.push(r.url()));
 await page.setViewportSize({width:1200,height:900});await page.goto('http://127.0.0.1:8775/docs/qa/effects-production-art-b/review.html');await page.waitForFunction(()=>window.vfxReview);
 for(const [kind,tick]of [['harvest',8],['focus',50],['spores',9],['guard',95],['portalPrize',45],['rush',30],['weak',8],['brambles',100],['mist',150]]){
  await page.evaluate(t=>vfxReview.setTick(t),tick);
  for(const mobile of [false,true])await page.locator(`#scene-${kind} canvas[data-mobile="${mobile}"]`).screenshot({path:`docs/qa/effects-production-art-b/${kind}-${mobile?'mobile':'desktop'}.png`});
 }
 const ready=await page.evaluate(()=>({loaded:vfxReview.bank.ready.size,errors:[...vfxReview.bank.errors],scenes:vfxReview.scenes.length}));
 if(errors.length||network.length||ready.errors.length||ready.loaded!==59||ready.scenes!==18)throw Error(JSON.stringify({errors,network,ready}));
 return {ready,errors,network};
}
