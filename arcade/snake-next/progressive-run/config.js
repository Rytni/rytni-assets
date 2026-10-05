import {PRESETS,targetSpeed} from '../tuning-lab/config.js';
import {WORLDS} from '../effect-playground/capacity-model.js';

export const VERSION='progressive-dev-v1';
export const STRIDE=112,ROWS=56;
export const DEFAULTS=Object.freeze({startStage:0,pressure:-1,positiveInterval:10,negativeInterval:18,portalInterval:45,density:2,candidates:true,speedCaps:Object.freeze([6,6,7,8,8.5]),thresholds:Object.freeze([0,12,30,65,110]),endlessInterval:50});
export const STAGES=Object.freeze([
 {at:0,world:[28,12],biome:'forest',chapter:'Forest',multiplier:1},
 {at:12,world:[36,18],biome:'forest',chapter:'Forest growth',multiplier:1},
 {at:30,world:[48,24],biome:'caves',chapter:'Caves',multiplier:1.2},
 {at:65,world:[64,32],biome:'swamp',chapter:'Swamp',multiplier:1.45},
 {at:110,world:[80,40],biome:'forest',chapter:'Endless',multiplier:1.6}
]);
export function config(input={}){
 const c={...DEFAULTS,...input,speedCaps:[...(input.speedCaps||DEFAULTS.speedCaps)],thresholds:[...(input.thresholds||DEFAULTS.thresholds)]};
 if(c.model==='fit-world-v2'&&(c.startStage>3||![15,25,35].includes(c.freeTrigger??15)))throw Error('Invalid FIT WORLD V2 stage/trigger');
 for(const [key,lo,hi] of [['startStage',0,4],['pressure',-1,1],['positiveInterval',4,60],['negativeInterval',8,90],['portalInterval',24,120],['density',0,6]])if(!Number.isFinite(c[key])||c[key]<lo||c[key]>hi)throw Error('Invalid progressive '+key);
 if(!Number.isInteger(c.startStage)||!Number.isInteger(c.density)||c.speedCaps.length!==5||c.speedCaps.some((v,i)=>!Number.isFinite(v)||v<4.2||v>9||i&&v<c.speedCaps[i-1]))throw Error('Invalid stage/caps');
 if(c.thresholds.length!==5||c.thresholds[0]!==0||c.thresholds.some((v,i)=>!Number.isSafeInteger(v)||v<0||v>1000||i&&v<=c.thresholds[i-1])||!Number.isSafeInteger(c.endlessInterval)||c.endlessInterval<20||c.endlessInterval>200)throw Error('Invalid chapter thresholds');
 return Object.freeze({...c,speedCaps:Object.freeze(c.speedCaps),thresholds:Object.freeze(c.thresholds)});
}
export function stageAt(progress,c=DEFAULTS){
 if(c.model==='fit-world-v2'){const i=Math.min(3,c.startStage);return {...STAGES[i],world:WORLDS[i],index:i};}
 const thresholds=c.thresholds;if(progress<thresholds[4]){let i=0;while(i<3&&progress>=thresholds[i+1])i++;return {...STAGES[i],at:thresholds[i],index:i};}
 const cycle=Math.floor((progress-thresholds[4])/c.endlessInterval),index=4+cycle;
 return {index,at:thresholds[4]+cycle*c.endlessInterval,world:[Math.min(STRIDE,80+cycle*8),Math.min(ROWS,40+cycle*4)],biome:['forest','caves','swamp'][cycle%3],chapter:'Endless '+(cycle+1),multiplier:Math.min(2,1.6+cycle*.08)};
}
export function eventPressure(progress,c){return c.pressure>=0?c.pressure:Math.min(1,.12+progress/180*.88);}
export function speedTarget(tick,progress,c){
 const stage=stageAt(progress,c),cap=c.speedCaps[Math.min(4,stage.index)],late=Math.max(0,progress-c.thresholds[2])*.012,floor=[4.2,4.2,5.5,6.5,7.5][Math.min(4,stage.index)];
 return Math.min(cap,Math.max(floor,targetSpeed(PRESETS.B,tick)+Math.min(1.8,late)));
}
export const cadence=(tick,progress,c)=>Math.max(Math.ceil(60/c.speedCaps[Math.min(4,stageAt(progress,c).index)]),Math.round(60/speedTarget(tick,progress,c)));
