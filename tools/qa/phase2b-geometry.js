async page=>{
  await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8771/arcade/snake-next/dev.html?qa=1');await page.waitForFunction(()=>!!snakeDev.qa);
  const out='.playwright-cli/phase2b/geometry',cases=[];
  const capture=async(name,alpha,length=8,grow=false)=>{
    await page.evaluate(({name,alpha,length,grow})=>snakeDev.qa.fixture(name,alpha,length,grow),{name,alpha,length,grow});
    const clip=await page.evaluate(()=>{
      const r=snakeDev.canvas.getBoundingClientRect(),b=snakeDev.renderer.body,c=snakeDev.renderer.camera,p=b.polygon;let minX=b.head.x-.6,maxX=b.head.x+.6,minY=b.head.y-.6,maxY=b.head.y+.6;
      for(let i=0;i<b.count*4;i+=2){minX=Math.min(minX,p[i]);maxX=Math.max(maxX,p[i]);minY=Math.min(minY,p[i+1]);maxY=Math.max(maxY,p[i+1]);}
      const x=Math.max(r.x,r.x+r.width/2+(minX-c.x)*c.scale-10),y=Math.max(r.y,r.y+r.height/2+(minY-c.y)*c.scale-10),right=Math.min(r.right,r.x+r.width/2+(maxX-c.x)*c.scale+10),bottom=Math.min(r.bottom,r.y+r.height/2+(maxY-c.y)*c.scale+18);
      return {x,y,width:Math.max(1,right-x),height:Math.max(1,bottom-y)};
    });
    const file=`${out}/${grow?'growth-':''}${name}-length-${length}-alpha-${alpha}.png`;await page.screenshot({path:file,clip});cases.push({name,alpha,length,grow,file});
  };
  for(const name of ['horizontal','vertical','turn-right','turn-down','turn-left','turn-up','u','s'])for(const alpha of [0,.25,.5,.75,.999])await capture(name,alpha);
  for(const name of ['horizontal','turn-down'])for(const alpha of [0,.25,.5,.75,.999])await capture(name,alpha,8,true);
  for(const length of [100,250,500,1200])for(const alpha of [0,.25,.5,.75,.999])await capture('horizontal',alpha,length);
  await page.evaluate(cases=>{snakeDev.main();window.phase2bGeometry=cases;},cases);return {count:cases.length,out};
}
