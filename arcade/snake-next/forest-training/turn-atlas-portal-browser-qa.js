async page=>{
 const context=await page.context().browser().newContext({viewport:{width:1366,height:900}}),p=await context.newPage(),errors=[],failed=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html?turnAtlas=1');await p.waitForFunction(()=>window.tuningLab?.game);
 await p.evaluate(async()=>{
  const {createState}=await import('/arcade/snake-next/entry.js'),{bodyCell}=await import('/arcade/snake-next/simulation/body.js'),{labSession}=await import('/arcade/snake-next/tuning-lab/session.js'),{PRESETS}=await import('/arcade/snake-next/tuning-lab/config.js');
  const g=tuningLab.game,factory=g.sessionFactory;
  function configure(s){const entry=s.portals[0];s.tick=1800;s.portal.phase='armed';s.state=createState({seed:1,arena:s.arena,rules:s.rules,body:Array.from({length:8},(_,i)=>entry-1-i),direction:1,food:entry+2});s.state.cadence=s.cadence();return s;}
  const plain=configure(labSession(PRESETS.B)),stats={ticks:0,hashFailures:0,transfers:0,atomicReset:true,cardinal:true,phases:[],recoveries:0};window.portalMotion=stats;
  g.sessionFactory=options=>configure(factory(options));const tick=g.tick.bind(g);
  g.tick=()=>{
   const s=g.session,cell=bodyCell(s.state,0),x=cell%28,y=Math.floor(cell/28);
   if(s.portal.transfers&&s.state.movePhase>=s.cadence()-1){if(x===20&&s.state.direction===1)g.command(0);else if(y===4&&s.state.direction===0)g.command(3);else if(x===10&&s.state.direction===3)g.command(2);else if(y===8&&s.state.direction===2)g.command(1);}
   if(s.portal.transfers&&!stats.exitTurnQueued){g.command(0);stats.exitTurnQueued=true;}
   const before=s.state,commands=g.commands.slice();tick();plain.advance(commands);stats.ticks++;if(s.hash()!==plain.hash())stats.hashFailures++;
   if(!stats.phases.includes(s.portal.phase))stats.phases.push(s.portal.phase);stats.transfers=s.portal.transfers;
   const f=g.motion.frame(s);if(before!==s.state)stats.atomicReset&&=f.alpha===1&&g.motion.snapshots.previous[0]===g.motion.snapshots.current[0];
   for(let i=1;i<f.route.length;i++)stats.cardinal&&=Math.abs(f.route[i].x-f.route[i-1].x)+Math.abs(f.route[i].y-f.route[i-1].y)===1;
  };
  const pause=g.pause.bind(g);g.pause=()=>{if(g.clock?.status==='recovery')stats.recoveries++;pause();};
 });
 await p.bringToFront();await p.locator('[data-preset=B]').click();await p.waitForTimeout(8000);
 const result=await p.evaluate(()=>({...portalMotion,status:tuningLab.game.status,hash:tuningLab.current.hash()}));
 const pending=p.waitForEvent('download');await p.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.download='portal.json';a.click();},result);await(await pending).saveAs('docs/qa/smooth-v2-3/portal-results.json');await context.close();
 if(result.transfers!==1||result.hashFailures||!result.atomicReset||!result.cardinal||result.recoveries||errors.length||failed.length)throw Error(JSON.stringify({result,errors,failed}));return {result,errors,failed};
}
