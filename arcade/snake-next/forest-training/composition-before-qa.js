async page=>{
 const context=await page.context().browser().newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const p=await context.newPage();await p.goto('http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
 await p.evaluate(async()=>{
  const g=forestTraining;g.stop();g.session=new g.preview.constructor();const s=g.session,{createState}=await import('/arcade/snake-next/entry.js');
  const body=[],push=(x,y)=>body.push(x+y*28);for(let y=8;y>=5;y--)push(7,y);for(let x=8;x<=16;x++)push(x,5);for(let y=4;y>=2;y--)push(16,y);for(let x=17;x<=22;x++)push(x,2);
  s.state=createState({seed:56103,rules:s.rules,arena:s.arena,body:body.reverse(),direction:1,food:79});s.score=12400;s.combo=3;s.tick=1500;
  s.effects=[{kind:'focus',ends:1812}];s.pickups=[{kind:'focus',cell:117,ends:2700},{kind:'rush',cell:218,ends:2700}];s.portal.phase='armed';g.status='playing';g.show();g.render();
 });
 const before=await p.evaluate(()=>({stage:document.querySelector('#game').getBoundingClientRect().toJSON(),hud:document.querySelector('#hud').getBoundingClientRect().toJSON(),layout:forestTraining.renderer.last}));
 await p.screenshot({path:'docs/qa/forest-training/composition-before.png'});
 await p.setViewportSize({width:1920,height:1440});const tall=await p.evaluate(()=>forestTraining.renderer.last);
 await context.close();return {before,tall};
}
