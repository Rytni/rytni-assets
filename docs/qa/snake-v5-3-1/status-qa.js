async page=>{
 const context=await page.context().browser().newContext(),p=await context.newPage(),rows=[],failures=[],errors=[];let checks=0;
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 for(const [width,height]of [[720,405],[1080,608],[1366,768],[1920,1080]]){
  await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.game);
  for(const [index,[score,rank]]of [[6840,7],[0,1],[105596,99],[999999,999],[9999999,3000],[99999999,9999]].entries()){
   await p.evaluate(({score,rank})=>{snakeProduct.controller.hub.best_score=score;snakeProduct.controller.hub.my_rank=rank;snakeProduct.controller.emit();},{score,rank});
   await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));});await p.waitForTimeout(280);
   const result=await p.evaluate(()=>{
    const board=document.querySelector('.player-status-board'),rect=board.getBoundingClientRect(),intersects=r=>r.left<rect.right&&r.right>rect.left&&r.top<rect.bottom&&r.bottom>rect.top;
    const text=[...board.querySelectorAll('small,b,strong')].map(e=>{const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect(),block=e.closest('.status-block').getBoundingClientRect();return {text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize),fits:r.left>=block.left+3&&r.right<=block.right-3&&r.top>=rect.top+6&&r.bottom<=rect.bottom-6};});
    return {board:rect.toJSON(),cabinet:document.querySelector('#cabinet').getBoundingClientRect().toJSON(),columns:getComputedStyle(board.querySelector('.status-grid')).gridTemplateColumns,text,overflow:board.scrollWidth>board.clientWidth,legacy:!!document.querySelector('.lower-status-dock,.title-scene .attempt-tray,.title-scene .record-plaque'),overlap:[...document.querySelectorAll('.menu-hero,.main-identity .brand,.main-choices .actions>.btn,.menu-shortcuts,.compact-actions,.tournament-preview')].filter(e=>intersects(e.getBoundingClientRect())).map(e=>e.className),horizontal:document.documentElement.scrollWidth>document.documentElement.clientWidth};
   });
   checks++;if(result.legacy||result.overflow||result.horizontal||result.overlap.length||result.text.some(t=>!t.fits||t.font<12)||result.board.left<result.cabinet.left+10||result.board.right>result.cabinet.right-10||result.board.bottom>result.cabinet.bottom-10)failures.push({width,score,rank,result});rows.push({width,height,score,rank,result});
   if(index===0||index===5)await p.locator('#cabinet').screenshot({path:`docs/qa/snake-v5-3-1/desktop-${width}-${index===0?'normal':'stress'}.png`,scale:'css'});
  }
 }
 await context.close();return {checks,failures,errors,rows};
}
