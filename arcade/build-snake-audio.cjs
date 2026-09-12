// Offline, deterministic original PCM assets. Never synthesize on the render loop.
const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'../grib/mushroom-snake-v1/audio');fs.mkdirSync(out,{recursive:true});
const rate=22050,TAU=2*Math.PI;
function wav(name,seconds,sample){const n=Math.round(rate*seconds),b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.max(-.8,Math.min(.8,sample(i/rate,seconds)))*32767),44+i*2);fs.writeFileSync(path.join(out,name+'.wav'),b);}
function chime(t,f){return (Math.sin(TAU*f*t)+.22*Math.sin(TAU*f*2*t))*Math.exp(-t*9)*Math.min(1,t*180);}
wav('ambience',8,t=>{const frequencies=[220,275,330,440];let v=0;for(let i=0;i<4;i++)v+=Math.sin(TAU*frequencies[i]*t)*.026*(.8+.2*Math.cos(TAU*t/8));const k=Math.floor(t*2),note=[440,550,660,825,660,550,440,330,440,660,550,825,660,440,550,330][k];return v+chime(t%0.5,note)*.025;});
wav('pickup',.24,t=>chime(t,880)*.19);
wav('combo',.4,t=>chime(t,1100)*.15+(t>.08?chime(t-.08,1320)*.12:0));
wav('magnet',.65,t=>Math.sin(TAU*(330*t+400*t*t))*.17*Math.sin(Math.PI*t/.65)**2+chime(t,660)*.07);
wav('drunk',.55,t=>Math.sin(TAU*180*t+3*Math.sin(TAU*5*t))*.18*Math.sin(Math.PI*t/.55)**2);
wav('death',.65,t=>Math.sin(TAU*(350*t-140*t*t))*.16*Math.sin(Math.PI*t/.65)**2);
wav('warning',.36,t=>chime(t,520)*.13+(t>.18?chime(t-.18,520)*.13:0));
console.log('Snake: seven original WAV assets generated.');
