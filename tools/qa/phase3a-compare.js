async page=>{
  await page.setViewportSize({width:1366,height:768});
  const cdp=await page.context().newCDPSession(page),rows=[];
  try{for(const mode of ['dev','production']){
    await page.goto(`http://127.0.0.1:8771/arcade/snake-next/${mode==='dev'?'dev':'slice'}.html?qa=1`);await page.waitForFunction(()=>!!window.snakeDev?.qa);
    if(mode==='production'){await page.evaluate(()=>snakeNext.ready);await page.locator('[data-screen=main] [data-action=training]').click();}
    for(const rate of [1,4]){
      await cdp.send('Emulation.setCPUThrottlingRate',{rate});
      for(const length of [8,100,250,500,1200]){
        const result=await page.evaluate(async({length,mode})=>{
          const pause=snakeDev.pause;if(mode==='production')snakeDev.pause=function(...args){pause.apply(this,args);this.mixer.startMusic();};
          try{const row=await snakeDev.qa.benchmark(length);return{...row,audio:mode==='production'?snakeNext.mixer.summary():null,ambient:mode==='production'?snakeNext.assets.forest.ambient:null};}
          finally{snakeDev.pause=pause;if(mode==='production')snakeNext.mixer.stopAll();}
        },{length,mode});
        rows.push({mode,rate,...result});await page.evaluate(rows=>window.phase3aCompare=rows,rows);
      }
    }
    await page.evaluate(()=>snakeDev.main());
  }}finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();}
  await page.evaluate(rows=>{snakeDev.main();window.phase3aCompare=rows;},rows);
  return rows.map(({mode,rate,length,simulation,renderer,whole,consumptionWhole,outliers})=>({mode,rate,length,simP95:simulation.p95,renderP95:renderer.p95,wholeP95:whole.p95,eatP95:consumptionWhole.p95,max:Math.max(whole.max,consumptionWhole.max),outliers}));
}
