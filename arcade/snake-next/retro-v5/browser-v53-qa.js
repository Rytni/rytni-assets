async page=>{
  const browser=page.context().browser(),out='docs/qa/retro-v5-3/';
  const errors=[],failed=[],httpErrors=[],warnings=[],captures=[],connectors=[];
  for(const [width,height,mobile,dpr] of [[1920,1080,false,1],[844,390,true,1],[1366,768,false,1.5],[1366,768,false,2]]) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile});
    const p=await context.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push({type:m.type(),message:m.text()})});
    p.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()}));
    p.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
    await p.goto('http://127.0.0.1:8773/arcade/snake-next/retro-v5-review.html');
    await p.waitForFunction(()=>window.retroV5);
    await p.evaluate(()=>retroV5.reviewScene());
    const auditResult=await p.evaluate(async dpr=>{
      const {pieces,CELL}=await import('./retro-v5/geometry.mjs'),{audit}=await import('./retro-v5/qa.mjs');
      const sprites=new Map(pieces.map(piece=>[piece.mask,retroV5.art.images.get(piece.name+'-v0')]));
      return audit(dpr,mask=>{
        const canvas=document.createElement('canvas');canvas.width=canvas.height=CELL*dpr;
        const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
        ctx.drawImage(sprites.get(mask),0,0,canvas.width,canvas.height);
        const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        return Uint8Array.from({length:canvas.width*canvas.height},(_,i)=>+(data[i*4+3]>=128));
      });
    },dpr);
    if(!auditResult.pass)throw Error('Sprite connector failure DPR '+dpr);
    if(!connectors.some(a=>a.dpr===dpr))connectors.push(auditResult);
    if(dpr===1){
      const file=mobile?'mobile-844.png':'desktop-1920.png';
      await p.screenshot({path:out+file,scale:'css'});
      captures.push({file,width,height,mobile,layout:await p.evaluate(()=>({cell:retroV5.lastLayout.cell,canvas:{width:retroV5.canvas.width,height:retroV5.canvas.height}}))});
      if(mobile){
        await p.evaluate(()=>{retroV5.canvas.style.filter='grayscale(1)'});
        await p.screenshot({path:out+'mobile-grayscale.png',scale:'css'});
      }
    }
    await context.close();
  }
  const gc=await browser.newContext({viewport:{width:844,height:390}}),g=await gc.newPage();
  g.on('pageerror',e=>errors.push(e.message));
  g.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push({type:m.type(),message:m.text()})});
  g.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()}));
  g.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
  await g.goto('http://127.0.0.1:8773/docs/qa/retro-v5-3/review.html');
  const gallery=await g.evaluate(async()=>{
    await Promise.all([...document.images].map(async i=>{try{await i.decode()}catch(e){throw Error(i.src+': '+e.message)}}));
    const shrunk=[...document.images].filter(i=>i.naturalWidth!==i.getBoundingClientRect().width||i.naturalHeight!==i.getBoundingClientRect().height).map(i=>i.getAttribute('src'));
    return {images:document.images.length,shrunk};
  });
  await gc.close();if(gallery.shrunk.length)throw Error('Gallery shrank native images');
  const result={scope:'Snake art only; no gameplay benchmark or integration',captures,connectors,gallery,errors,failed,httpErrors,warnings};
  const downloadPromise=page.waitForEvent('download');
  await page.evaluate(result=>{
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'}));a.download='qa-results.json';a.click();
  },result);
  await (await downloadPromise).saveAs(out+'qa-results.json');
  if(errors.length||failed.length||httpErrors.length||warnings.length)throw Error(JSON.stringify(result));
  return result;
}
