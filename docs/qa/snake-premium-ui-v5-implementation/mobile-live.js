async page=>{
 if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
 const ctx=await page.context().browser().newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),p=await ctx.newPage();
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text();
 try{return await eval('('+source+')')(p,{live:true,viewport:{width:844,height:390},tag:'844'});}
 finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}
}
