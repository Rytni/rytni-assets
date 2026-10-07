async page => {
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-ui-v4-3/site-qa.js')).text(),run=eval('('+source+')'),results=[];
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const mobile=viewport.width===844,ctx=await page.context().browser().newContext({viewport,hasTouch:mobile,isMobile:mobile}),p=await ctx.newPage();
  try{const r=await run(p,{live:true,viewport,tag:viewport.width===1920||mobile?undefined:String(viewport.width)});results.push({viewport,checks:r.checks,errors:r.errors,failed:r.failed,baseline:r.baseline,forbidden:r.forbidden,runtime:r.runtime});}
  finally{await ctx.close();}
 }
 return results;
}
