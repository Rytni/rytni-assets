async page => {
 const out='C:/Users/rytni/.codex/visualizations/snake-reset/',errors=[],network=[];
 const watch=p=>{
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  p.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));
  p.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
 };
 const setup=async(p,mobile=false)=>{
  watch(p);await p.goto('http://127.0.0.1:8825/?arcade_preview=1');
  await p.locator('[data-ms-action="game-snake"]').click();await p.locator('[data-ms-action="start"]').click();
  if(mobile)await p.locator('[data-ms-action="enter"]').click();
  await p.waitForFunction(()=>RytniMushroomSnake.state==='play');await p.evaluate(()=>RytniMushroomSnake.stop());
 };
 const install=async(p,path)=>p.evaluate(path=>{
  const s=RytniMushroomSnake,e=s.engine,cap=e.bx.length;e.reset(127,path.length);e.occupied.clear();
  for(let i=0;i<path.length;i++){const j=(e.head-i+cap)%cap;e.bx[j]=path[i][0];e.by[j]=path[i][1];e.occupied.add(path[i].join(','));}
  const tail=path[path.length-1],beforeTail=path[path.length-2],ghost=(e.head-path.length+cap)%cap;e.bx[ghost]=tail[0]+tail[0]-beforeTail[0];e.by[ghost]=tail[1]+tail[1]-beforeTail[1];
  e.x=path[0][0];e.y=path[0][1];const dx=path[0][0]-path[1][0],dy=path[0][1]-path[1][1];
  e.direction=e.previousDirection=dy<0?0:dx>0?1:dy>0?2:3;e.world.stream(e.x,e.y);e.phase=1;e.acc=0;e.interpolate(1);s.paint();s.hud();
 },path);
 const serpent=(length,width=24)=>{const path=[],half=Math.floor(width/2);let x=half,y=0,dir=-1,run=0;while(path.length<length){path.push([x,y]);if(run===width-1){y++;dir=-dir;run=0;}else{x+=dir;run++;}}return path;};
 const fixtures={
  straight:[[3,0],[2,0],[1,0],[0,0],[-1,0],[-2,0],[-3,0],[-4,0]],
  tailTurn:[[4,0],[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[-1,2]],
  fourTurns:[[2,0],[1,0],[1,1],[1,2],[0,2],[-1,2],[-1,1],[-1,0],[-2,0],[-3,0]],
  uShape:[[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2],[3,2]],
  sShape:[[3,0],[2,0],[1,0],[0,0],[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[-1,2]]
 };
 await page.setViewportSize({width:1366,height:768});await setup(page);
 for(const [name,path]of Object.entries(fixtures)){await install(page,path);await page.screenshot({path:out+'presentation-'+name+'.png'});}
 await install(page,serpent(100,20));await page.screenshot({path:out+'presentation-length-100.png'});
 await install(page,serpent(250,24));await page.screenshot({path:out+'presentation-length-250.png'});
 await page.setViewportSize({width:1920,height:1080});await page.locator('[data-ms-action="fullscreen"]:visible').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.waitForTimeout(150);
 await install(page,fixtures.sShape);await page.screenshot({path:out+'presentation-fullscreen.png'});
 for(const x of [0,16,32,48]){await install(page,fixtures.straight.map(([px,py])=>[px+x,py]));await page.screenshot({path:out+`presentation-boundary-${x}.png`});}
 const context=await page.context().browser().newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 let mobile;
 try{
  const p=await context.newPage();await setup(p,true);await install(p,fixtures.fourTurns);await p.screenshot({path:out+'presentation-mobile-landscape.png'});
  mobile=await p.evaluate(()=>{const d=document.getElementById('msDpad').getBoundingClientRect(),b=document.querySelector('#msDpad button').getBoundingClientRect(),hud=document.getElementById('msHud').getBoundingClientRect();return{dpad:[d.width,d.height],button:[b.width,b.height],background:getComputedStyle(document.getElementById('msDpad')).backgroundSize,hud:[hud.width,hud.height],overflow:document.documentElement.scrollWidth>innerWidth};});
 }finally{await context.close();}
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 return {fixtures:Object.keys(fixtures),lengths:[100,250],boundaries:[0,16,32,48],mobile,errors,network};
}
