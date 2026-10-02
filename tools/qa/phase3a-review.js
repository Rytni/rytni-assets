async page=>{
  const out='.playwright-cli/phase3a/review',shot=async name=>page.screenshot({path:`${out}/${name}.png`});
  await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);await page.evaluate(()=>snakeNext.ready);
  const act=async name=>page.locator(`[data-screen]:not([hidden]) [data-action=${name}]`).first().click();
  await page.mouse.click(20,30);await shot('main-desktop');await act('how');await page.mouse.click(20,30);await shot('how-desktop');await act('back');await act('settings');await page.mouse.click(20,30);await shot('settings-desktop');await act('back');
  await act('training');await page.waitForFunction(()=>snakeDev.state.tick>=20);await shot('forest-early');
  // Capture actual buffered visible contact; freeze only the accepted presentation alpha.
  await page.waitForFunction(()=>snakeDev.pendingPickup>0);const pickup=await page.evaluate(()=>{snakeDev.pause();snakeDev.show('geometry');snakeDev.renderer.draw({snapshots:snakeDev.snapshots,arena:snakeDev.arena,food:snakeDev.snapshots.previousFood,alpha:.999});return{tick:snakeDev.state.tick,score:snakeDev.state.score,logicalFood:snakeDev.state.food,visibleFood:snakeDev.snapshots.previousFood,alpha:.999};});await shot('food-contact');
  await page.evaluate(()=>snakeDev.qa.startAutoplay());await page.waitForFunction(()=>snakeDev.state.tick>=1600,null,{timeout:35000});await shot('forest-medium');await page.locator('#pause').click();await page.mouse.click(20,30);await shot('pause');
  for(const length of [250,1200]){await page.evaluate(length=>{snakeDev.qa.startLoop(length);snakeDev.pause();snakeDev.show('geometry');snakeDev.paint(0,true);},length);await shot(`forest-${length}`);await page.evaluate(()=>{snakeDev.renderer.camera.fixed=true;snakeDev.paint(0,true);});await shot(`forest-${length}-overview`);}
  for(const name of ['turn-right','s']){
    await page.evaluate(async name=>{snakeDev.start();snakeDev.pause();snakeDev.show('geometry');const {geometrySnapshots}=await import('./tests/browser-qa.js');snakeDev.renderer.draw({snapshots:geometrySnapshots(name),arena:snakeDev.arena,food:-1,alpha:.75,resetCamera:true});},name);
    const clip=await page.evaluate(()=>{const r=snakeDev.canvas.getBoundingClientRect(),c=snakeDev.renderer.camera,b=snakeDev.renderer.body;let x0=b.head.x-1,x1=b.head.x+1,y0=b.head.y-1,y1=b.head.y+1;for(let i=0;i<b.count*4;i+=2){x0=Math.min(x0,b.polygon[i]);x1=Math.max(x1,b.polygon[i]);y0=Math.min(y0,b.polygon[i+1]);y1=Math.max(y1,b.polygon[i+1]);}return{x:r.x+r.width/2+(x0-c.x)*c.scale-10,y:r.y+r.height/2+(y0-c.y)*c.scale-10,width:(x1-x0)*c.scale+20,height:(y1-y0)*c.scale+20};});
    await page.screenshot({path:`${out}/${name}-closeup.png`,clip});
  }
  await page.evaluate(()=>snakeDev.main());for(const [width,height]of [[360,800],[390,844],[430,932]]){await page.setViewportSize({width,height});await page.mouse.click(5,100);await shot(`main-portrait-${width}`);await act('training');await page.mouse.click(5,100);await shot(`prompt-${width}`);await act('main');}
  return {pickup,resources:await page.evaluate(()=>snakeDev.summary().resources)};
}
