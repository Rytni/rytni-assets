async page => {
 const base='http://127.0.0.1:8775/docs/qa/snake-menu-concepts/concept.html';
 const cases=[['main-desktop','main',1920,1080],['main-mobile','main',844,390],['pause','pause',1366,768],['result-record','result-record',1920,1080],['leaderboard','leaderboard',1366,768],['how-to-play','how-to-play',1366,768],['settings','settings',1366,768]];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [file,state,width,height] of cases){
  await page.setViewportSize({width,height});await page.goto(base+'?state='+state);
  await page.waitForFunction(()=>window.conceptReady);
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
  await page.screenshot({path:'docs/qa/snake-menu-concepts/'+file+'.png',scale:'css'});
 }
 return {captured:cases.length,errors};
}
