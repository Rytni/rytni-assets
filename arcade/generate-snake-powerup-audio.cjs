const fs=require('fs');
const path=require('path');

const RATE=44100;
const OUTPUT=path.join(__dirname,'..','grib','mushroom-snake-v2','audio');

function wav(name,seconds,sample){
  const count=Math.ceil(seconds*RATE),data=Buffer.alloc(count*2),seed={value:0x51a7};
  for(let i=0;i<count;i++){
    const t=i/RATE,attack=Math.min(1,t/.018),release=Math.min(1,(seconds-t)/.08),env=Math.max(0,attack*release);
    const value=Math.max(-1,Math.min(1,sample(t,env,seed)));
    data.writeInt16LE(Math.round(value*32767),i*2);
  }
  const out=Buffer.alloc(44+data.length);
  out.write('RIFF',0);out.writeUInt32LE(36+data.length,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);
  out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(RATE,24);out.writeUInt32LE(RATE*2,28);
  out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(data.length,40);data.copy(out,44);
  fs.writeFileSync(path.join(OUTPUT,name+'.wav'),out);
}
function sine(f,t){return Math.sin(Math.PI*2*f*t);}
function noise(seed){seed.value=(Math.imul(seed.value,1664525)+1013904223)>>>0;return seed.value/2147483648-1;}
function bell(notes,t,env){let value=0;for(let i=0;i<notes.length;i++){const start=i*.07;if(t>=start)value+=sine(notes[i],t-start)*Math.exp(-(t-start)*9);}return value*env/Math.max(1,notes.length*.62);}

fs.mkdirSync(OUTPUT,{recursive:true});
wav('magnet',.48,(t,e)=>e*(.45*sine(260+620*t,t)+.28*sine(520+940*t,t))*Math.exp(-t*2.2));
wav('golden',.62,(t,e)=>bell([659,880,1175,1568],t,e)*1.15);
wav('ghost',.72,(t,e)=>e*(.34*sine(470-170*t,t)+.22*sine(705-255*t,t))*Math.exp(-t*1.8));
wav('ghost-warning',.24,(t,e)=>e*.55*sine(t<.12?740:520,t));
wav('fairy',.66,(t,e)=>e*(.34*sine(380+1250*t,t)+.24*sine(760+540*t,t))*Math.exp(-t*1.5));
wav('time',.62,(t,e)=>e*(.33*sine(520-240*t,t)+.24*sine(1040-480*t,t))*Math.exp(-t*1.7));
wav('drunk',.5,(t,e)=>e*(.38*sine(320+70*Math.sin(t*31),t)+.18*sine(190,t))*Math.exp(-t*2));
wav('hiccup',.22,(t,e)=>e*.62*sine(230+900*t,t)*Math.exp(-t*4));
wav('hiccup-warning',.18,(t,e)=>e*.42*sine(610,t)*Math.exp(-t*5));
wav('hiccup-1',.2,(t,e)=>e*.68*sine(210+1050*t,t)*Math.exp(-t*4));
wav('hiccup-2',.23,(t,e)=>e*.64*sine(245+940*t,t)*Math.exp(-t*3.6));
wav('hiccup-3',.19,(t,e)=>e*.7*sine(185+1200*t,t)*Math.exp(-t*4.5));
wav('slime',.52,(t,e,s)=>e*(.34*sine(150-60*t,t)+.2*noise(s))*Math.exp(-t*4));
console.log(`Generated ${fs.readdirSync(OUTPUT).filter(n=>n.endsWith('.wav')).length} Snake effect clips in ${OUTPUT}`);
