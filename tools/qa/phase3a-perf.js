async page=>{
  await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);await page.evaluate(()=>snakeNext.ready);
  await page.getByRole('button',{name:'Тренировка',exact:true}).click();
  const cdp=await page.context().newCDPSession(page),rows=[];
  try{for(const rate of [1,4]){
    await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    for(const length of [8,100,250,500,1200]){
      const row=await page.evaluate(async length=>{
        const pause=snakeDev.pause;snakeDev.pause=function(...args){pause.apply(this,args);this.mixer.startMusic();};
        try{const result=await snakeDev.qa.benchmark(length);return{...result,audio:snakeNext.mixer.summary(),forestBakes:snakeNext.assets.forest.bakes,cacheSize:snakeNext.assets.forest.cache.length};}finally{snakeDev.pause=pause;snakeNext.mixer.stopAll();}
      },length);rows.push({rate,...row});await page.evaluate(rows=>window.phase3aPerf=rows,rows);
    }
  }}finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();}
  await page.evaluate(()=>snakeDev.main());return rows;
}
