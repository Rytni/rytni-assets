async page=>{
 const failures=[],errors=[],headerLimitations=[],rows=[];let checks=0;const check=(ok,name,data)=>{checks++;if(!ok)failures.push({name,data});};
 for(const [w,h]of [[1920,1080],[1366,768],[844,390],[390,844],[360,800]]){
  const c=await page.context().browser().newContext({viewport:{width:w,height:h},isMobile:w<1000,hasTouch:w<1000}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/grib/**',async r=>r.fulfill({response:await p.request.get('http://127.0.0.1:8776/grib/'+/\/grib\/([^?]+)/.exec(r.request().url())[1])}));await p.goto('http://127.0.0.1:8776/docs/qa/snake-test-parity/host-fixture.html?arcade_preview=1&mobile=1');await p.waitForFunction(()=>window.hostFixtureReady);
  await p.evaluate(async()=>{const a=document.createElement('img');a.id='profileAvatar';a.src='http://127.0.0.1:8776/grib/mushroom-fly-v2/player/idle-1.webp';a.style='position:absolute;width:36px;height:36px;visibility:hidden;pointer-events:none';document.body.append(a);await a.decode();});
  for(const [name,level,points,title]of [['Илья',8,15790,'Ветеран каток'],['Александр',99,999999,'Очень длинное игровое звание'],['VeryLongNickname12345',999,99999999,'Очень длинное игровое звание']]){
   await p.evaluate(v=>{window.currentApplication={id:'preview',name:v[0],level:v[1],points:v[2],rank_name:v[3]};RytniArcadeHub.select('fly');},[name,level,points,title]);await p.evaluate(()=>RytniBrowserArcade.qaReady());
   const m=await p.locator('#msFlyWrap .ms-player-header').evaluate(e=>{const r=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};return {header:r(e),items:[...e.querySelectorAll('button,[data-player],.ms-player-test')].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').map(n=>({key:n.dataset.player||n.dataset.msAction||'TEST',...r(n)}))};});
   const outside=m.items.filter(n=>n.x<m.header.x-1||n.right>m.header.right+1||n.y<m.header.y-1||n.bottom>m.header.bottom+1);const overlaps=[];for(let i=0;i<m.items.length;i++)for(let j=i+1;j<m.items.length;j++){const a=m.items[i],b=m.items[j];if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push([a.key,b.key]);}
   check(!outside.length&&!overlaps.length,'participant stress '+w+' '+name,{m,outside,overlaps});check(m.header.h<=76,'header height bounded '+w,m);check(await p.evaluate(v=>innerWidth===v,w), 'participant fixture actual viewport '+w,w);if(outside.length||overlaps.length)headerLimitations.push({w,name,m,outside,overlaps});rows.push({w,name,level,points,title,m});if(w===390&&name.startsWith('Very'))await p.locator('#msFlyWrap').screenshot({path:'docs/qa/mushroom-fly-premium-v2-1/participant-stress.png',scale:'css'});
  }
  // Real backend-shaped long ranking data only in intercepted LOCAL source.
  await c.close();
 }
 return {checks,failures,errors,headerLimitations,rows};
}
