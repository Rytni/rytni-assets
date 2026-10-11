async page=>{
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage();
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=result-record');await p.waitForFunction(()=>window.snakeProduct?.game);await p.waitForTimeout(800);
 const rows=await p.evaluate(()=>[...document.querySelectorAll('.result-scene,.result-scene *')].flatMap(e=>['', '::before','::after'].map(pseudo=>{const s=getComputedStyle(e,pseudo||null);return {tag:e.tagName,cls:e.className,pseudo,background:s.background,shadow:s.boxShadow,content:s.content};})).filter(r=>!r.background.includes('rgba(0, 0, 0, 0)')||r.shadow!=='none'||!['none','normal'].includes(r.content)));
 await p.addStyleTag({content:'.primary-stats img{visibility:hidden!important}'});await p.locator('#cabinet').screenshot({path:'docs/qa/snake-presentation-v5-3-2/result-no-png.png',scale:'css'});
 await c.close();return {checks:1,failures:[],errors:[],rows};
}
