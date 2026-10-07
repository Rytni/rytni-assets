async page=>{
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text(),run=eval('('+source+')'),results=[];
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const mobile=viewport.width===844,ctx=await page.context().browser().newContext({viewport,hasTouch:mobile,isMobile:mobile}),p=await ctx.newPage();
  try{const r=await run(p,{live:true,viewport,tag:String(viewport.width)});results.push({viewport,...r});}finally{await ctx.close();}
 }
 return results;
}
