async page => {
 const out=[];
 for(const [screen,name,w,h]of [['main','main-desktop',1280,720],['main','main-mobile',390,844],['status','status-board',1280,720],['ranking','ranking',1280,720],['pause','pause',844,390],['result','result',1280,720],['rules','how-to-play',1280,720],['settings-sound','settings-sound',1280,720],['settings-game','settings-game',1280,720]]){
  await page.setViewportSize({width:w,height:h});await page.goto('http://127.0.0.1:8776/docs/qa/mushroom-fly-premium-v2/concepts.html?screen='+screen);await page.waitForFunction(()=>window.conceptReady);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.waitForTimeout(200);
  await (screen==='status'?page.locator('.mf-status-console'):page).screenshot({path:'docs/qa/mushroom-fly-premium-v2/'+name+'.png',scale:'css'});out.push({name,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 return out;
}
