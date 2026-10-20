// Progression selects complete authored tracks. The engine still owns time/state.
// Short existing cues remain SFX, never soundtrack or tempo controls.
function cueBuffer(ctx,note,kind){const rate=ctx.sampleRate,b=ctx.createBuffer(1,Math.floor(rate*.18),rate),out=b.getChannelData(0),f=440*2**((note-69)/12);for(let i=0;i<out.length;i++){const t=i/rate,env=Math.min(1,t/.015)*Math.max(0,1-t/.45),v=Math.sin(2*Math.PI*f*t);out[i]=.13*env*(kind==='swamp'?(v>0?1:-1)*.65+Math.sin(2*Math.PI*f/2*t)*.35:v);}return b;}
export function installBiomeAudio(audio,getSession){
 audio.musicSession=getSession;
 const names=['anchor','spores','guard','portalPrize','weak','decay','brambles','mist'];
 names.forEach((name,i)=>audio.buffers.set('dev-'+name,cueBuffer(audio.context,72+i,i<4?'forest':'swamp')));
 return {sync:s=>audio.syncMusic(s),cue:kind=>audio.play('dev-'+kind),
  summary:()=>({biome:getSession()?.stage?.biome||null,loops:audio.soundtrack?.voices.size||0,...audio.summary()}),
  release:()=>audio.stopAll()};
}
