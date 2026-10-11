async page=>{
 const rows=[],failures=[],errors=[];let checks=0;const dir='docs/qa/snake-presentation-v5-3-2/';
 for(const [width,height]of [[1920,1080],[1366,768],[720,405],[390,844],[412,915]]){
  const mobile=width<500,c=await page.context().browser().newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=settings');await p.waitForFunction(()=>window.snakeProduct?.game);
  for(const tab of ['sound','game']){
   await p.locator(`[data-tab=${tab}]`).click();await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));});await p.waitForTimeout(550);
   const row=await p.evaluate(async()=>{
    const rect=e=>e.getBoundingClientRect().toJSON(),panel=document.querySelector('.panel-settings,.mobile-settings'),skin=panel.querySelector('.skin-wood'),icons=[...panel.querySelectorAll('.setting-icon,.mobile-setting label img,.mobile-setting h3 img')];
    let samples=[];
    if(skin){const r=rect(skin),img=new Image();img.src='/grib/mushroom-snake-ui-v5/material-glass.png';await img.decode();const scale=Math.max(r.width/img.width,r.height/img.height),cw=Math.ceil(r.width),ch=Math.ceil(r.height),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const ctx=cv.getContext('2d');ctx.drawImage(img,(r.width-img.width*scale)/2,(r.height-img.height*scale)/2,img.width*scale,img.height*scale);const pixels=ctx.getImageData(0,0,cw,ch).data;
     // Raster-traced inner metal edge of the 438x330 approved master:
     // diagonal bevel (90,35)->(32,95), then x=32 through regular rows.
     // Use the conservative maximum across the WHOLE icon, not the outer
     // rail's stronger contrast edge, and account for actual cover cropping.
     const offsetX=(r.width-img.width*scale)/2,offsetY=(r.height-img.height*scale)/2;
     samples=icons.map(icon=>{const b=rect(icon),sourceY=(b.top-r.top-offsetY)/scale,sourceX=sourceY<95?Math.max(32,90-(sourceY-35)*58/60):32,edge=offsetX+sourceX*scale;return {icon:b,sourceY,sourceX,visibleMetalX:r.x+edge,clearance:b.x-r.x-edge,method:'raster-traced inner bevel; final cover transform'};});
    }else{const b=rect(panel);samples=icons.map(i=>({icon:rect(i),visibleMetalX:b.x+5,clearance:rect(i).x-b.x-5}));}
    const body=rect(panel.querySelector('.panel-body,.mobile-content'));
    return {layout:document.querySelector('#cabinet').className,ranges:[...document.querySelectorAll('[data-setting]')].map(i=>({key:i.dataset.setting,visible:!!i.getClientRects().length&&rect(i).top>=body.top&&rect(i).bottom<=body.bottom+.5,height:rect(i).height,value:i.value})),quality:!!panel.querySelector('[data-action=quality]'),fullscreen:!!panel.querySelector('[data-action=fullscreen]'),details:!!panel.querySelector('details'),overflow:document.documentElement.scrollWidth>innerWidth||panel.scrollWidth>panel.clientWidth,samples,panel:rect(panel)};
   });rows.push({width,height,tab,...row});checks++;
   if(row.overflow||row.details||tab==='sound'&&(row.ranges.length!==3||row.quality||row.fullscreen||row.ranges.some(r=>!r.visible||r.height<44))||tab==='game'&&(row.ranges.length||!row.quality||!row.fullscreen)||row.samples.some(s=>s.clearance<(mobile?20:24)))failures.push({width,tab,row});
   await p.locator('#cabinet').screenshot({path:dir+`settings-${tab}-${width}.png`,scale:'css'});
   if(width===1366&&tab==='game'){await p.evaluate(samples=>{for(const s of samples){const line=document.createElement('div');line.className='qa-ink-line';line.style.cssText=`position:fixed;left:${s.visibleMetalX}px;top:${s.icon.y}px;height:${s.icon.height}px;border-left:2px solid red;z-index:99999;pointer-events:none`;document.body.append(line);const box=document.createElement('div');box.className='qa-ink-line';box.style.cssText=`position:fixed;left:${s.icon.x}px;top:${s.icon.y}px;width:${s.icon.width}px;height:${s.icon.height}px;outline:1px solid cyan;z-index:99999;pointer-events:none`;document.body.append(box);}},row.samples);await p.locator('#cabinet').screenshot({path:dir+'settings-ink-safe-diagnostic.png',scale:'css'});await p.evaluate(()=>document.querySelectorAll('.qa-ink-line').forEach(e=>e.remove()));}
   if(tab==='sound'){await p.locator('[data-setting=master]').fill('0.8');const value=await p.locator('#value-master').textContent();checks++;if(value!=='80%')failures.push({width,value});}
  }
  await c.close();
 }
 for(const [width,height]of [[1920,1080],[1366,768],[844,390]]){
  const c=await page.context().browser().newContext({viewport:{width,height}}),p=await c.newPage();
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=result-record');await p.waitForFunction(()=>window.snakeProduct?.game);await p.waitForTimeout(750);
  const result=await p.evaluate(()=>({clips:[...document.querySelectorAll('.primary-stats img')].map(i=>getComputedStyle(i).clipPath),backing:getComputedStyle(document.querySelector('.primary-stats')).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth}));checks++;if(result.clips.some(c=>c==='none')||result.overflow||result.backing!=='rgba(0, 0, 0, 0)')failures.push({width,result});rows.push({width,result});
  await p.locator('#cabinet').screenshot({path:dir+`after-result-record-${width}.png`,scale:'css'});
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.game);await p.waitForTimeout(650);checks++;if(await p.locator('.tournament-preview .board-own').count())failures.push({width,duplicate:true});await p.locator('#cabinet').screenshot({path:dir+`main-${width}.png`,scale:'css'});await c.close();
 }
 return {checks,failures,errors,rows};
}
