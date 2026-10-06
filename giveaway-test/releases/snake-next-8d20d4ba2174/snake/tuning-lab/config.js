// DEV-only data. Never selected by the normal Training entry.
export const PRESETS=Object.freeze({
 A:Object.freeze({id:'A',startSpeed:3.7,maxSpeed:6,acceleration:.012,grace:15,foodMin:3,foodMax:8,positiveInterval:14,negativeInterval:26,portalFirst:45,portalInterval:60,portalWindow:8,portalCooldown:25,comboTimeout:16,comboStep:.12}),
 B:Object.freeze({id:'B',startSpeed:4.2,maxSpeed:7.5,acceleration:.035,grace:12,foodMin:5,foodMax:12,positiveInterval:10,negativeInterval:18,portalFirst:30,portalInterval:45,portalWindow:10,portalCooldown:20,comboTimeout:12,comboStep:.15}),
 C:Object.freeze({id:'C',startSpeed:4.8,maxSpeed:8.6,acceleration:.055,grace:10,foodMin:6,foodMax:18,positiveInterval:7,negativeInterval:12,portalFirst:24,portalInterval:35,portalWindow:10,portalCooldown:15,comboTimeout:10,comboStep:.20})
});
const ranges={startSpeed:[2,6],maxSpeed:[3,10],acceleration:[.001,.2],grace:[10,60],foodMin:[2,30],foodMax:[2,45],positiveInterval:[4,60],negativeInterval:[6,90],portalFirst:[15,120],portalInterval:[20,180],portalWindow:[3,15],portalCooldown:[5,120],comboTimeout:[4,30],comboStep:[0,.4]};
export function validateProfile(input){
 if(!input||!['A','B','C'].includes(input.id))throw Error('Unknown preset');
 const p={id:input.id};for(const [key,[lo,hi]] of Object.entries(ranges)){const n=input[key];if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)throw Error(`Invalid ${key}: ${lo}…${hi}`);p[key]=n;}
 if(p.startSpeed>p.maxSpeed||p.foodMin>p.foodMax||p.portalWindow>=p.portalInterval)throw Error('Invalid range ordering');
 for(const k of ['foodMin','foodMax'])if(!Number.isInteger(p[k]))throw Error('Food distances must be integer cells');
 return Object.freeze(p);
}
export function targetSpeed(p,tick){const dt=Math.max(0,tick/60-p.grace),span=p.maxSpeed-p.startSpeed;return span===0?p.startSpeed:p.startSpeed+span*(1-Math.exp(-p.acceleration*dt/span));}
export function profileCadence(p,tick){return Math.max(Math.ceil(60/p.maxSpeed),Math.round(60/targetSpeed(p,tick)));}
export function portalWindowOpen(p,tick){const elapsed=tick/60-p.portalFirst;return elapsed>=0&&elapsed%p.portalInterval<p.portalWindow;}
