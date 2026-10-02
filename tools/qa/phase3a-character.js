async page=>{
  await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8771/arcade/snake-next/character.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);
  const cases=[];
  for(const name of ['horizontal','vertical','turn-right','turn-down','turn-left','turn-up','u','s'])for(const alpha of [0,.25,.5,.75,.999]){
    await page.evaluate(({name,alpha})=>snakeDev.qa.fixture(name,alpha),{name,alpha});
    const clip=await page.evaluate(()=>{const r=snakeDev.canvas.getBoundingClientRect(),b=snakeDev.renderer.body,c=snakeDev.renderer.camera;let x0=b.head.x-.9,x1=b.head.x+.9,y0=b.head.y-.9,y1=b.head.y+.9;for(let i=0;i<b.count*4;i+=2){x0=Math.min(x0,b.polygon[i]);x1=Math.max(x1,b.polygon[i]);y0=Math.min(y0,b.polygon[i+1]);y1=Math.max(y1,b.polygon[i+1]);}return{x:r.x+r.width/2+(x0-c.x)*c.scale-8,y:r.y+r.height/2+(y0-c.y)*c.scale-8,width:(x1-x0)*c.scale+16,height:(y1-y0)*c.scale+24};});
    const path=`.playwright-cli/phase3a/geometry/${name}-${alpha}.png`;await page.screenshot({path,clip});cases.push({name,alpha,path});
  }
  for(const length of [100,250,1200])for(const alpha of [0,.25,.5,.75,.999]){await page.evaluate(({length,alpha})=>snakeDev.qa.fixture('horizontal',alpha,length),{length,alpha});await page.screenshot({path:`.playwright-cli/phase3a/geometry/length-${length}-${alpha}.png`});cases.push({length,alpha});}
  return{count:cases.length,faults:await page.evaluate(()=>snakeDev.renderer.faults),cases};
}
