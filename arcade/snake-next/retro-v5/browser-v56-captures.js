async page=>{
 const browser=page.context().browser(),out='docs/qa/retro-v5-6/',errors=[],failed=[],bad=[],warnings=[],captures=[];
 for(const [width,height,mobile]of [[1920,1080,false],[844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));
  p.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()})});p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')warnings.push(m.text())});
  try{await p.goto('http://127.0.0.1:8773/arcade/snake-next/retro-v5-review.html');await p.waitForFunction(()=>window.retroV5);await p.evaluate(()=>retroV5.reviewScene());
   const file=(mobile?'mobile-':'desktop-')+width+'.png';await p.screenshot({path:out+file,scale:'css'});captures.push({file,width,height,mobile,cell:await p.evaluate(()=>retroV5.lastLayout.cell)});
  }finally{await context.close()}
 }
 const result={scope:'Required art screenshots only; geometry/connector regression is the existing node suite',captures,errors,failed,bad,warnings};
 const pending=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'}));a.download='v56-captures.json';a.click()},result);
 await(await pending).saveAs(out+'capture-results.json');if(errors.length||failed.length||bad.length||warnings.length)throw Error(JSON.stringify(result));return result;
}
