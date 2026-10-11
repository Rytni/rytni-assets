async page=>{
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto('http://127.0.0.1:8776/docs/qa/snake-presentation-v5-3-2/review.html');
 await p.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
 let checks=0;for(const id of ['sound','game','result','main','art','live','fly']){await p.locator(`nav a[href="#${id}"]`).click();checks++;if(!p.url().endsWith('#'+id))errors.push('section '+id);}
 await c.close();return {checks,errors,failures:[]};
}
