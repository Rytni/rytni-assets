async page=>{
 if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text(),run=eval('('+source+')'),results=[];
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const mobile=viewport.width===844,ctx=await page.context().browser().newContext({viewport,hasTouch:mobile,isMobile:mobile}),p=await ctx.newPage();
  try{const r=await run(p,{live:false,viewport,tag:String(viewport.width)});results.push({viewport,...r});}
  catch(e){
   await p.screenshot({path:'docs/qa/snake-premium-ui-v5-implementation/candidate-failure.png'});
   const states=[];for(const f of p.frames())states.push({url:f.url(),state:await f.evaluate(()=>({screen:document.querySelector('#product')?.dataset.screen,size:[innerWidth,innerHeight],fs:!!document.fullscreenElement,text:document.querySelector('#menu')?.innerText?.slice(0,500)})).catch(()=>null)});
   throw Error(e.message+' '+JSON.stringify(states));
  }finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}
 }
 return results;
}
