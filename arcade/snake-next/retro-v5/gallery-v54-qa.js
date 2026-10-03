async page=>{
  const context=await page.context().browser().newContext({viewport:{width:844,height:390}}),p=await context.newPage();
  const errors=[],failed=[],httpErrors=[],warnings=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failed.push(r.url()));
  p.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
  p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')warnings.push(m.text())});
  await p.goto('http://127.0.0.1:8773/docs/qa/retro-v5-4/review.html');
  const images=await p.evaluate(async()=>{
    await Promise.all([...document.images].map(async i=>{try{await i.decode()}catch(e){throw Error(i.src+': '+e.message)}}));
    return [...document.images].map(i=>({file:i.getAttribute('src'),native:[i.naturalWidth,i.naturalHeight],shown:[i.getBoundingClientRect().width,i.getBoundingClientRect().height]}));
  });
  const shrunk=images.filter(i=>i.native[0]!==i.shown[0]||i.native[1]!==i.shown[1]);
  const result={viewport:'844x390',imageCount:images.length,shrunk,errors,failed,httpErrors,warnings};
  const pending=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'}));a.download='v54-gallery-qa.json';a.click()},result);
  await(await pending).saveAs('docs/qa/retro-v5-4/gallery-qa.json');await context.close();
  if(shrunk.length||errors.length||failed.length||httpErrors.length||warnings.length)throw Error(JSON.stringify(result));return result;
}
