/** Original procedural PCM: plucky D-minor arcade motif, no asset preload or audio timer. */
export function musicPCM(rate=22050){const beat=60/112/2,duration=beat*32,out=new Float32Array(Math.ceil(duration*rate)),melody=[62,65,69,72,74,72,69,65,62,65,67,69,72,69,67,65,62,65,69,72,74,77,74,72,69,67,65,62,65,69,67,62];
 const note=(m,start,dur,amp)=>{const freq=440*2**((m-69)/12);for(let i=0;i<dur*rate;i++){const at=Math.floor(start*rate)+i;if(at>=out.length)break;const t=i/rate,envelope=Math.min(1,t/.007)*Math.exp(-t*13)*(Math.min(1,(dur-t)/.03)),a=t*freq*Math.PI*2;out[at]+=amp*envelope*(Math.sin(a)+.2*Math.sin(a*2)+.11*Math.sin(a*3));}};
 melody.forEach((m,i)=>note(m,i*beat,beat*.85,.18));for(let i=0;i<16;i++)note([38,38,41,43][Math.floor(i/4)],i*beat*2,beat*.9,.12);return out;
}
export class RetroAudio {
 constructor(){this.ctx=null;this.sources=new Set();this.buffers=new Map();this.enabled=true;this.bytes=0;this.epoch=0;}
 unlock(){if(!this.ctx)this.ctx=new AudioContext();return this.ctx.state==='suspended'?this.ctx.resume().catch(()=>{}):Promise.resolve();}
 buffer(key,pcm,rate=22050){if(this.buffers.has(key))return this.buffers.get(key);const b=this.ctx.createBuffer(1,pcm.length,rate);b.copyToChannel(pcm,0);this.buffers.set(key,b);this.bytes+=pcm.byteLength;return b;}
 play(buffer,volume,loop=false){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=loop;gain.gain.value=volume;source.connect(gain).connect(this.ctx.destination);this.sources.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.sources.delete(source);};source.start();return source;}
 music(){if(!this.enabled||this.musicSource)return;const ready=this.unlock(),ctx=this.ctx,epoch=this.epoch,start=()=>{if(ctx!==this.ctx||epoch!==this.epoch||!this.enabled||this.musicSource||ctx.state!=='running')return;this.musicSource=this.play(this.buffer('forest',this.buffers.has('forest')?null:musicPCM()),.42,true);};if(ctx.state==='running')start();else ready.then(start);}
 effect(kind){if(!this.ctx||!this.enabled)return;const configs={food:[740,1100,.18],positive:[660,1320,.23],negative:[260,150,.24],enter:[820,310,.28],exit:[310,950,.28],death:[190,55,.36],ui:[520,640,.06],turn:[440,500,.04]},[from,to,duration]=configs[kind]||configs.ui,key=`sfx:${kind}`;
  let buffer=this.buffers.get(key);if(!buffer){const rate=22050,pcm=new Float32Array(Math.ceil(duration*rate));let phase=0;for(let i=0;i<pcm.length;i++){const t=i/rate,k=t/duration;phase+=2*Math.PI*(from+(to-from)*k)/rate;pcm[i]=.3*Math.sin(phase)*Math.min(1,t/.004)*Math.min(1,(duration-t)/.025)*Math.exp(-k*3);}buffer=this.buffer(key,pcm);}this.play(buffer,.5);}
 stop(){this.epoch++;for(const s of this.sources){try{s.stop();}catch{}s.disconnect();}this.sources.clear();this.musicSource=null;}
 dispose(){this.stop();this.ctx?.close().catch(()=>{});this.ctx=null;this.buffers.clear();this.bytes=0;}
}
