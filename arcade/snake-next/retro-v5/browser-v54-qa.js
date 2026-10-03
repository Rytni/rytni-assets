async page=>{
  const browser=page.context().browser(),out='docs/qa/retro-v5-4/';
  const errors=[],failed=[],httpErrors=[],warnings=[],captures=[],connectors=[];
  const collect=p=>{
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push({type:m.type(),message:m.text()})});
    p.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()}));
    p.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
  };
  for(const [width,height,mobile,dpr] of [[1920,1080,false,1],[1366,768,false,1],[844,390,true,1],[915,412,true,1],[1366,768,false,1.5],[1366,768,false,2]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile}),p=await context.newPage();collect(p);
    await p.goto('http://127.0.0.1:8773/arcade/snake-next/retro-v5-review.html');await p.waitForFunction(()=>window.retroV5);
    await p.evaluate(()=>retroV5.reviewScene());
    if(!connectors.some(r=>r.dpr===dpr)){
      const result=await p.evaluate(async dpr=>{
        const {pieces,CELL}=await import('./retro-v5/geometry.mjs'),{audit}=await import('./retro-v5/qa.mjs');
        const sprites=new Map(pieces.map(piece=>[piece.mask,retroV5.art.images.get(piece.name+'-v0')]));
        return audit(dpr,mask=>{
          const c=document.createElement('canvas');c.width=c.height=CELL*dpr;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(sprites.get(mask),0,0,c.width,c.height);
          const data=ctx.getImageData(0,0,c.width,c.height).data;return Uint8Array.from({length:c.width*c.height},(_,i)=>+(data[i*4+3]>=128));
        });
      },dpr);
      if(!result.pass)throw Error('Connector failure '+dpr);connectors.push(result);
    }
    if(dpr===1){
      const file=(mobile?'mobile-':'desktop-')+width+'.png';await p.screenshot({path:out+file,scale:'css'});
      captures.push({file,width,height,mobile,cell:await p.evaluate(()=>retroV5.lastLayout.cell)});
      if(width===844||width===1920){
        await p.evaluate(()=>retroV5.canvas.style.filter='grayscale(1)');await p.screenshot({path:out+(mobile?'mobile':'desktop')+'-grayscale.png',scale:'css'});
      }
    }
    await context.close();
  }
  const result={scope:'Snake-only manual art, screenshot and connector regression; no benchmark',captures,connectors,errors,failed,httpErrors,warnings};
  const pending=page.waitForEvent('download');
  await page.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'}));a.download='v54-qa.json';a.click()},result);
  await(await pending).saveAs(out+'qa-results.json');
  if(errors.length||failed.length||httpErrors.length||warnings.length)throw Error(JSON.stringify(result));return result;
}
