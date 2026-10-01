async page=>{
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/tests/perf.html');
  await page.waitForFunction(()=>!!window.snakeFoundationBench);
  const cdp=await page.context().newCDPSession(page),report={runtime:await page.evaluate(()=>navigator.userAgent),rows:[]};
  try {
    for(const rate of [1,4]){
      await cdp.send('Emulation.setCPUThrottlingRate',{rate});
      const result=await page.evaluate(()=>window.snakeFoundationBench());
      const timerSmoke=await page.evaluate(()=>window.snakeFoundationTimerSmoke());
      report.rows.push({rate,result,timerSmoke});
    }
  } finally {await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();}
  await page.evaluate(report=>window.__PHASE2A_PERF__=report,report);
  return report;
}
