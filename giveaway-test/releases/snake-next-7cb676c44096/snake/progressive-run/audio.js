// Temporary, independently composed melodies/instrumentation. No final music
// assets, playback-rate recolors, new AudioContext, timer or RAF owner.
const MELODIES={forest:[60,64,67,64,62,65,69,65,60,67,72,67,62,65,64,60],caves:[48,55,58,53,46,53,56,51,48,60,55,58,46,53,51,48],swamp:[45,48,52,51,43,46,50,49,45,57,52,51,43,46,49,45]};
function buffer(ctx,notes,kind){const rate=ctx.sampleRate,b=ctx.createBuffer(1,rate*8,rate),out=b.getChannelData(0);for(let i=0;i<out.length;i++){const t=i/rate,k=Math.floor(t/.5)%notes.length,phase=t%.5,f=440*2**((notes[k]-69)/12),env=Math.min(1,phase/.015)*Math.max(0,1-phase/.45);const v=Math.sin(2*Math.PI*f*t);out[i]=.13*env*(kind==='caves'?v*.65+Math.sin(2*Math.PI*f*2*t)*.35:kind==='swamp'?(v>0?1:-1)*.65+Math.sin(2*Math.PI*f/2*t)*.35:v);}return b;}
export function installBiomeAudio(audio,getSession){
 const originalStart=audio.startMusic.bind(audio),originalStop=audio.stopAll.bind(audio);let biome=null,loops=[];
 for(const [kind,notes] of Object.entries(MELODIES))audio.buffers.set('dev-'+kind,buffer(audio.context,notes,kind));
 const names=['anchor','spores','guard','portalPrize','weak','decay','brambles','mist'];
 names.forEach((name,i)=>audio.buffers.set('dev-'+name,buffer(audio.context,[72+i,76+i,79+i],i<4?'forest':'swamp')));
 // Keep cues short even though the temporary melody builder is shared.
 names.forEach(name=>{const src=audio.buffers.get('dev-'+name),b=audio.context.createBuffer(1,Math.floor(audio.context.sampleRate*.18),audio.context.sampleRate);b.copyToChannel(src.getChannelData(0).subarray(0,b.length),0);audio.buffers.set('dev-'+name,b);});
 const switchTo=kind=>{if(biome===kind&&loops.length||audio.muted||audio.context.state!=='running')return;
  // A rapid DEV stage change must not accumulate previously fading loops.
  for(const fading of [...audio.sources])if(fading.loop&&!loops.includes(fading)){try{fading.stop();}catch{}fading.disconnect();audio.gains.get(fading)?.disconnect();audio.gains.delete(fading);audio.sources.delete(fading);}
  const source=audio.play(kind==='forest'?'forest-theme':'dev-'+kind,true);if(!source)return;const now=audio.context.currentTime,gain=audio.gains.get(source).gain;gain.cancelScheduledValues(now);gain.setValueAtTime(0,now);gain.linearRampToValueAtTime(.5,now+2);
  for(const old of loops){const g=audio.gains.get(old)?.gain;if(g){g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+2);}try{old.stop(now+2);}catch{}}
  loops=[source];audio.music=source;biome=kind;
 };
 audio.startMusic=()=>{const s=getSession();if(s?.world)switchTo(s.stage.biome);else originalStart();};
 audio.stopAll=()=>{originalStop();loops=[];biome=null;};
 return {sync:s=>{if(s?.world)switchTo(s.stage.biome);},cue:kind=>audio.play('dev-'+kind),summary:()=>({biome,loops:loops.length,sources:audio.sources.size}),release:()=>audio.stopAll()};
}
