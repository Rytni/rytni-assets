async page => {
 const context=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await context.newPage();
 try{await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.locator('[data-stage="0"]').click();await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();g.render();});await p.locator('#training').screenshot({path:'docs/qa/effect-ux/mobile-before.png',scale:'css'});return 'before captured';}finally{await context.close();}
}
