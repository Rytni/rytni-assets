async page=>{
 const context=await page.context().browser().newContext(),p=await context.newPage(),rows=[];
 for(const [name,width,stress] of [['wide',740,false],['medium',440,false],['stress',360,true]]){
  await p.goto(`http://127.0.0.1:8776/docs/qa/snake-v5-3-1/status-concept.html?width=${width}${stress?'&stress=1':''}`);
  await p.locator('.player-status-board').waitFor();await p.waitForTimeout(150);
  rows.push(await p.locator('.player-status-board').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,grid:getComputedStyle(e.querySelector('.status-grid')).gridTemplateColumns,values:[...e.querySelectorAll('strong')].map(v=>({text:v.textContent,width:v.getBoundingClientRect().width,parent:v.parentElement.getBoundingClientRect().width}))})));
  await p.locator('.player-status-board').screenshot({path:`docs/qa/snake-v5-3-1/status-board-${name}.png`,scale:'css'});
 }
 await context.close();return rows;
}
