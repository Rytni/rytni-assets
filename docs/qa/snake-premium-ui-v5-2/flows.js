async page=>{
 let source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text();source=source.replaceAll('snake-premium-ui-v5-implementation/','snake-premium-ui-v5-2/');
 const run=eval('('+source+')'),results=[],failures=[];
 for(const viewport of [{width:1366,height:768},{width:844,height:390}]){const mobile=viewport.width===844,ctx=await page.context().browser().newContext({viewport,hasTouch:mobile,isMobile:mobile}),p=await ctx.newPage();try{results.push({viewport,...await run(p,{live:false,viewport,tag:String(viewport.width)})});}catch(e){failures.push({viewport,error:String(e)});}finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}}
 return {checks:results.reduce((n,r)=>n+r.checks,0),failures,errors:results.flatMap(r=>r.errors),failed:results.flatMap(r=>r.failed),results};
}
