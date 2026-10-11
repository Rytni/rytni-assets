import {KINDS,POSITIVE} from './art.js';
// Short original chimes through the EXISTING mixer/context/source limit.
export function installEffectSounds(audio){
 const ctx=audio.context;if(!ctx)return;
 for(const [index,kind]of KINDS.entries()){
  const positive=POSITIVE.has(kind),notes=positive?[72+index,76+index,79+index]:[49-index%3,46-index%3,43-index%3],b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.18),ctx.sampleRate),out=b.getChannelData(0);
  for(let i=0;i<out.length;i++){const t=i/ctx.sampleRate,j=Math.min(2,Math.floor(t/.06)),p=t%.06,f=440*2**((notes[j]-69)/12),env=Math.min(1,p/.004)*Math.max(0,1-p/.06),wave=Math.sin(2*Math.PI*f*t);out[i]=.35*env*(positive?wave*.8+Math.sin(2*Math.PI*f*2*t)*.2:wave*.65+Math.sin(2*Math.PI*f*1.07*t)*.35);}
  audio.buffers.set('effect-'+kind,b);
 }
}
