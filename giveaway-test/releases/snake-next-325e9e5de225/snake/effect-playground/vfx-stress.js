import {bodyCell} from '../simulation/body.js';
export function vfxReviewSession(s,mode){
 if(!s?.world||!['rush','mist'].includes(mode))return s;
 // Explicit DEV persistent render rehearsal, not a duration/balance change.
 return Object.assign(Object.create(s),{effects:[{kind:mode,ends:s.tick+1}]});
}
// Isolated Lab diagnostic ONLY. A read-only facade, never canonical events,
// topology, rewards or effects. One active tick drives all transient phases.
export function vfxStressSession(s,startTick){
 if(startTick===null||startTick===undefined||!s?.world)return s;
 const age=Math.max(0,s.tick-startTick),phase=age%144,head=bodyCell(s.state,0),stride=s.arena.width;
 return stressFacade(s,head,stride,phase);
}
export function stressFacade(s,head,stride,phase){
 const x=head%stride,y=Math.floor(head/stride),cell=(dx,dy)=>(Math.max(1,Math.min(s.world.height-2,y+dy)))*stride+Math.max(1,Math.min(s.world.width-2,x+dx)),eventTick=s.tick-phase%36;
 return Object.assign(Object.create(s),{
  effects:[{kind:'focus',ends:s.tick+1},{kind:'guard',ends:s.tick+1},{kind:'rush',ends:s.tick+1}],
  spores:[{cell:cell(3,-1)},{cell:cell(4,1),magnetTick:s.tick-phase%36}],
  feedback:[{kind:'seed',cell:cell(0,0),tick:eventTick,amount:200,harvest:true,strong:true,combo:8,maxReached:true},{kind:'seed',cell:cell(1,0),tick:eventTick,amount:25,spore:true},{kind:'guard-used',cell:cell(-1,0),tick:eventTick},{kind:'portal-reward',cell:cell(3,1),tick:eventTick,amount:200}],
  director:Object.assign(Object.create(s.director),{warnings:phase<100?[{cell:cell(5,1),starts:s.tick+100-phase}]:[]})
 });
}
