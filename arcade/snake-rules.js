/* Local endless rules. Add biome records, not renderer branches, for future worlds. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MushroomSnakeRules=api;})(typeof globalThis==='object'?globalThis:this,()=>{
 'use strict';
 const BIOMES=Object.freeze([
  {id:'forest',name:'ЗЕЛЁНЫЙ ЛЕС',ground:'forest-ground-v1',atlas:null,palette:['#17352b','#86a65c'],ambience:{rate:1,gain:1},difficulty:0,spawn:{magnet:3,golden:2,ghost:2,fairy:1,time:2,drunk:1,hiccup:1,slime:1}},
  {id:'cave',name:'СВЕТЯЩИЕСЯ ПЕЩЕРЫ',ground:'cave-ground-v2',atlas:'cave-world-v1',palette:['#142332','#6cdbed'],ambience:{rate:.78,gain:.85},difficulty:.12,spawn:{magnet:2,golden:2,ghost:3,fairy:2,time:1,drunk:2,hiccup:1,slime:1}},
  {id:'swamp',name:'ГРИБНОЕ БОЛОТО',ground:'swamp-ground-v1',atlas:'swamp-world-v1',palette:['#253428','#cfdb83'],ambience:{rate:.9,gain:.9},difficulty:.2,spawn:{magnet:2,golden:3,ghost:2,fairy:1,time:2,drunk:1,hiccup:1,slime:3}}
 ]);
 const DIFFICULTY=Object.freeze({score:18000,length:180,distance:2600,time:360,weights:[.25,.2,.3,.25],speedStart:5.5,speedCap:12,slewPerTick:.00004,biomeSpan:180,transition:40,terrainDistance:1600});
 const SCORING=Object.freeze({food:100,comboCap:20,multiplierStep:.2,multiplierCap:5,windowStart:12,windowEnd:8,difficultyReward:.35,distancePerPoint:8,survivalPerPoint:8,milestones:[5,10,20]});
 const EVENTS=Object.freeze({first:75*60,cooldown:90*60,jitter:30*60,duration:18*60,groveWait:45*60,slots:6,bloomReward:1.5,groveReward:1.4,trailReward:1.25});
 const hash=(x,y,seed)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;};
 const difficulty=(score,length,steps,time)=>{const d=DIFFICULTY,w=d.weights;return w[0]*score/(score+d.score)+w[1]*Math.max(0,length-8)/(Math.max(0,length-8)+d.length)+w[2]*steps/(steps+d.distance)+w[3]*time/(time+d.time);};
 return {BIOMES,DIFFICULTY,SCORING,EVENTS,hash,difficulty};
});
