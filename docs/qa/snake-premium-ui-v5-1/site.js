async(page,{live=false}={})=>{
 if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
 let source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text();
 const probe=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-1/text-probe.js')).text();
 const textChecks=[];
 source=source.replaceAll('snake-premium-ui-v5-implementation/','snake-premium-ui-v5-1/');
 source=source.replace("await page.bringToFront();",`source=source.replace('const result=await f.evaluate',${JSON.stringify('const text=await f.evaluate('+probe+');if(text.errors.length)throw Error("text fit "+name+" "+JSON.stringify(text.errors));textChecks.push({name,...text});const result=await f.evaluate')});await page.bringToFront();`);
 const run=eval('('+source+')'),results=[];
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const mobile=viewport.width===844,ctx=await page.context().browser().newContext({viewport,hasTouch:mobile,isMobile:mobile}),p=await ctx.newPage();
  try{results.push({viewport,...await run(p,{live,viewport,tag:String(viewport.width)})});}
  finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}
 }
 return {results,textChecks,checks:results.reduce((n,r)=>n+r.checks,0),errors:results.flatMap(r=>r.errors),failed:results.flatMap(r=>r.failed)};
}
