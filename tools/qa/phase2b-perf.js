async page=>{
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/dev.html?qa=1');await page.waitForFunction(()=>!!snakeDev.qa);
  const cdp=await page.context().newCDPSession(page),rows=[];
  try{for(const rate of [1,4]){
    await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    for(const length of [8,100,250,500,1200])rows.push({rate,...await page.evaluate(length=>snakeDev.qa.benchmark(length),length)});
  }}finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();}
  await page.evaluate(rows=>{snakeDev.main();window.phase2bPerf=rows;},rows);return rows;
}
