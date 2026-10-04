async page=>{
 const context=await page.context().browser().newContext({viewport:{width:1366,height:900}}),p=await context.newPage(),results=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>tuningLab?.game);await p.bringToFront();
  for(const length of [8,30,250]){
   await p.evaluate(async length=>{
    const {loopFixture,cycle,directionBetween}=await import('/arcade/snake-next/tests/fixtures.js'),{createState}=await import('/arcade/snake-next/entry.js'),{bodyCell}=await import('/arcade/snake-next/simulation/body.js'),{labSession}=await import('/arcade/snake-next/tuning-lab/session.js'),{PRESETS}=await import('/arcade/snake-next/tuning-lab/config.js');
    const g=tuningLab.game;g.stop();g.tick=Object.getPrototypeOf(g).tick.bind(g);
    const f=loopFixture(length),path=cycle(14,20,7,2,96),offset=40;
    function session(){const s=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});s.view={x:0,y:0,cols:28,rows:12};s.state=createState({seed:123,arena:f.arena,rules:f.rules,body:Array.from({length},(_,i)=>path[(offset-i+path.length)%path.length]),direction:directionBetween(path[offset],path[(offset+1)%path.length],96),food:path[(offset+1)%path.length]});return s;}
    const plain=session();g.sessionFactory=session;window.ribbonClock={length,hashFailures:0,ticks:0,recoveries:0};const tick=g.tick;
    g.tick=()=>{const s=g.session,head=bodyCell(s.state,0),i=path.indexOf(head),d=directionBetween(head,path[(i+1)%path.length],96);if(s.state.movePhase>=s.cadence()-1)g.command(d);const commands=g.commands.slice();tick();plain.advance(commands);ribbonClock.ticks++;if(s.hash()!==plain.hash())ribbonClock.hashFailures++;};
    const pause=Object.getPrototypeOf(g).pause.bind(g);g.pause=()=>{if(g.clock?.status==='recovery')ribbonClock.recoveries++;pause();};g.start();
   },length);
   await p.waitForTimeout(2500);
   const result=await p.evaluate(()=>({...ribbonClock,status:tuningLab.game.status,foods:tuningLab.game.session.foods,hash:tuningLab.game.session.hash()}));results.push(result);
   if(result.status!=='playing'||result.recoveries||result.hashFailures||result.ticks<100)throw Error('Live clock regression '+JSON.stringify(result));
  }
  const result={results,errors};const pending=p.waitForEvent('download');await p.evaluate(result=>{const a=document.createElement('a');a.download='clock.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.click();},result);await(await pending).saveAs('docs/qa/smooth-v4-live/clock.json');return result;
 }finally{await context.close();}
}
