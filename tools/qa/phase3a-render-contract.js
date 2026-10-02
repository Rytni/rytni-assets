async page=>{
  await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);await page.evaluate(()=>snakeNext.ready);
  await page.locator('[data-screen=main] [data-action=training]').click();await page.locator('#pause').click();
  const contract=await page.evaluate(()=>{
    const a=snakeDev.arena,f=snakeNext.assets.forest,before=snakeDev.summary().hash;
    const hashCanvas=canvas=>{const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let h=2166136261;for(const b of bytes)h=Math.imul(h^b,16777619)>>>0;return h;};
    const original=f.prepare(a),first={floor:hashCanvas(original.floor),objects:hashCanvas(original.objects),decor:original.decor,obstacles:original.obstacles};
    f.cache.length=0;const reload=f.prepare(a),second={floor:hashCanvas(reload.floor),objects:hashCanvas(reload.objects),decor:reload.decor,obstacles:reload.obstacles};
    for(let i=0;i<50;i++)snakeDev.paint(0);
    const after=snakeDev.summary().hash;if(before!==after||JSON.stringify(first)!==JSON.stringify(second))throw Error('Visual bake changed state or regeneration');
    snakeDev.renderer.injectFault=true;snakeDev.paint(0);const failed=snakeDev.renderer.faults;snakeDev.paint(0);const c=snakeDev.canvas,bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let holes=0;for(let i=3;i<bytes.length;i+=4)if(bytes[i]!==255)holes++;
    if(failed!==1||snakeDev.renderer.faults!==1||holes||snakeDev.summary().hash!==before)throw Error('Fault recovery broke frame/state');
    return {before,after,first,second,cacheSize:f.cache.length,injectedFaults:failed,recoveredHoles:holes};
  });
  await page.screenshot({path:'.playwright-cli/phase3a/fault-recovered.png'});await page.evaluate(()=>snakeDev.main());await page.waitForFunction(()=>snakeNext.mixer.sources.size===0);await page.evaluate(contract=>window.phase3aRenderContract=contract,contract);return contract;
}
