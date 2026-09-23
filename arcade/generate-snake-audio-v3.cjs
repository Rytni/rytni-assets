// Offline PCM authoring for Mushroom Snake. The Fly mixer decodes these once.
const fs=require('node:fs'),path=require('node:path');
const RATE=22050,TAU=Math.PI*2,OUT=path.join(__dirname,'../grib/mushroom-snake-v2/audio');
fs.mkdirSync(OUT,{recursive:true});
const wrap=(i,n)=>(i+n)%n;
function buffer(seconds){return new Float64Array(Math.round(seconds*RATE));}
function add(dst,start,seconds,gain,sample){const offset=Math.round(start*RATE),count=Math.round(seconds*RATE);for(let i=0;i<count;i++){const t=i/RATE;dst[wrap(offset+i,dst.length)]+=gain*sample(t,i);}}
function pluck(f,t,decay=7){const env=Math.min(1,t/.008)*Math.exp(-decay*t);return env*(Math.sin(TAU*f*t)*.68+Math.sin(TAU*f*2*t)*.22+Math.sin(TAU*f*3*t)*.08);}
function bell(f,t,decay=5.5){const env=Math.min(1,t/.012)*Math.exp(-decay*t);return env*(Math.sin(TAU*f*t)*.7+Math.sin(TAU*f*2.01*t)*.23+Math.sin(TAU*f*3.97*t)*.07);}
function noise(i,seed=1){let n=Math.imul(i+seed,374761393);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/2147483648-1;}
function wav(name,data,{loop=false}={}){
 if(loop){const n=Math.round(RATE*.025),first=data[0];for(let i=0;i<n;i++){const k=data.length-n+i,a=(i+1)/n;data[k]=data[k]*(1-a)+first*a;}}
 else {const attack=Math.min(data.length,Math.round(RATE*.004)),release=Math.min(data.length,Math.round(RATE*.025));for(let i=0;i<attack;i++)data[i]*=i/attack;for(let i=0;i<release;i++)data[data.length-release+i]*=(release-1-i)/release;}
 let peak=0,sum=0;for(const v of data){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 const gain=Math.min(loop?1.8:1,.46/Math.max(peak,.001)),pcm=Buffer.alloc(44+data.length*2);pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(RATE,24);pcm.writeUInt32LE(RATE*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(data.length*2,40);
 for(let i=0;i<data.length;i++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,data[i]*gain))*32767),44+i*2);
 fs.writeFileSync(path.join(OUT,name+'-v3.wav'),pcm);
 return {name,seconds:data.length/RATE,peak:Number((peak*gain).toFixed(3)),rms:Number(Math.sqrt(sum/data.length)*gain).toFixed(3),seam:Number(Math.abs(data[0]-data.at(-1))*gain).toFixed(5)};
}
const reports=[];
const music=buffer(24),beat=.5;
// Twelve short woodland phrases; marimba/plucked-bell voices leave air between notes.
const melody=[659,784,880,784,659,587,523,0,587,659,784,659,523,587,659,0,440,523,659,784,880,784,659,587,523,659,784,0,587,659,523,440,659,784,988,784,659,587,523,0,587,659,784,659,523,440,523,0];
for(let i=0;i<melody.length;i++)if(melody[i])add(music,i*beat+.1,.52,.078*(i%4===0?1:.82),(t)=>pluck(melody[i],t,7.7));
const roots=[261.63,220,174.61,196,261.63,220,174.61,196,261.63,293.66,220,261.63];
for(let bar=0;bar<12;bar++){
 const at=bar*2+.02,root=roots[bar];
 add(music,at,.44,.019,t=>pluck(root,t,8));
 add(music,at+.05,.64,.014,t=>bell(root*2,t,6.3));
 add(music,at+1,.34,.01,t=>pluck(root*1.5,t,10));
 for(let beatIndex=0;beatIndex<4;beatIndex++)add(music,at+beatIndex*.5,.075,.0065,t=>noise(Math.floor(t*RATE),bar*7+beatIndex)*Math.exp(-t*65));
}
// A tiny wrapped early reflection warms the plucks without a continuous drone.
for(const delay of [.073,.149]){const shift=Math.round(delay*RATE),copy=music.slice();for(let i=0;i<music.length;i++)music[wrap(i+shift,music.length)]+=copy[i]*(delay<.1?.105:.065);}
reports.push(wav('ambience',music,{loop:true}));
function clip(name,seconds,voices){const data=buffer(seconds);for(const [start,duration,gain,fn]of voices)add(data,start,duration,gain,fn);reports.push(wav(name,data));}
clip('pickup',.23,[[0,.2,.24,t=>pluck(784+160*t,t,13)],[.045,.16,.08,t=>bell(1175,t,16)]]);
clip('combo',.4,[[0,.23,.16,t=>bell(784,t,10)],[.085,.23,.16,t=>bell(1047,t,10)],[.16,.2,.12,t=>bell(1318,t,12)]]);
clip('warning',.32,[[0,.23,.15,t=>pluck(392,t,9)],[.07,.18,.09,t=>pluck(311,t,11)]]);
clip('death',.64,[[0,.11,.18,(t,i)=>noise(i,59)*Math.exp(-t*44)],[0,.28,.19,t=>Math.sin(TAU*(280*t-170*t*t))*Math.exp(-t*13)],[.18,.39,.1,t=>bell(220,t,7)],[.3,.3,.065,t=>bell(164.81,t,8)]]);
clip('magnet',.42,[[0,.32,.15,t=>bell(523,t,10)],[.07,.3,.13,t=>bell(784,t,10)],[.15,.24,.1,t=>bell(1047,t,12)]]);
clip('golden',.48,[[0,.3,.16,t=>bell(659,t,10)],[.075,.3,.15,t=>bell(880,t,10)],[.15,.29,.14,t=>bell(1175,t,10)]]);
clip('ghost',.55,[[0,.45,.12,t=>bell(698,t,7)],[.095,.4,.1,t=>bell(1047,t,8)],[.19,.3,.075,t=>bell(1397,t,10)]]);
clip('ghost-warning',.24,[[0,.16,.1,t=>bell(622,t,15)],[.09,.13,.09,t=>bell(523,t,17)]]);
clip('fairy',.48,[[0,.35,.09,(t,i)=>(noise(i,97)*.3+Math.sin(TAU*(420*t+1300*t*t))*.7)*Math.exp(-t*9)],[.065,.35,.12,t=>bell(784,t,9)],[.15,.29,.1,t=>bell(1175,t,11)]]);
clip('time',.48,[[0,.34,.11,t=>bell(587,t,8)],[.12,.32,.1,t=>bell(880,t,9)],[.24,.21,.075,t=>bell(1175,t,12)]]);
clip('drunk',.31,[[0,.25,.14,t=>Math.sin(TAU*(310-95*t)*t+1.4*Math.sin(t*24))*Math.exp(-t*11)],[.07,.2,.065,t=>pluck(247,t,13)]]);
clip('hiccup',.22,[[0,.17,.15,t=>Math.sin(TAU*(270+400*t)*t)*Math.exp(-t*17)]]);
clip('hiccup-warning',.16,[[0,.12,.09,t=>pluck(494,t,22)]]);
for(const [n,f]of [[1,294],[2,330],[3,261.63]])clip('hiccup-'+n,.24,[[0,.18,.13,t=>Math.sin(TAU*(f+350*t)*t)*Math.exp(-t*16)],[.045,.15,.04,t=>pluck(f*1.5,t,17)]]);
clip('slime',.31,[[0,.22,.085,(t,i)=>noise(i,271)*Math.exp(-t*18)],[0,.27,.15,t=>Math.sin(TAU*(185-70*t)*t)*Math.exp(-t*12)]]);
console.log(JSON.stringify(reports,null,2));
