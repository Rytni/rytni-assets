async page=>{
 const rows=[];for(const [w,h]of [[1920,1080],[1366,768],[1280,720],[1000,563],[999,562],[844,390],[720,405],[560,315],[480,270],[390,844]]){
  await page.setViewportSize({width:w,height:h});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await page.waitForFunction(()=>window.snakeProduct);await page.evaluate(async()=>{await document.fonts.ready;document.querySelector('#cabinet').classList.add('pseudo-fullscreen');});
  rows.push(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],sceneDisplay:getComputedStyle(document.querySelector('.title-scene')).display,icons:[...document.querySelectorAll('.shortcut img')].map(e=>e.src),attempts:getComputedStyle(document.querySelector('.attempt-tray')).backgroundImage,record:getComputedStyle(document.querySelector('.record-plaque')).backgroundImage})));
 }
 return {rows,pass:rows.every(r=>r.sceneDisplay==='block'&&r.icons.every(s=>s.includes('/mushroom-snake-ui-v5/'))&&r.attempts.includes('ui-v5/attempts.png')&&r.record.includes('ui-v5/record-rank.png')),finding:'Current source uses Premium V5 in every tested breakpoint; referenced screenshot cannot be dated or attributed without the original capture/build stamp.'};
}
