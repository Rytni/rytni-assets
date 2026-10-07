const CUES=['hover','click','pickup','combo','turn','death','result','pause','resume','arrival'];
/** Isolated adapter for the shared Master / Music / SFX channel contract.
 * Host mixer injection is deferred to public integration, never importing Fly. */
export class Mixer {
  constructor(){this.context=null;this.buffers=new Map();this.sources=new Set();this.volumes={master:.75,music:.50,sfx:.65};this.muted=false;this.music=null;this.lastHover=0;this.loading=null;this.error='';}
  async load(){
    if(this.loading)return this.loading;
    this.context=new AudioContext();this.master=this.context.createGain();this.master.connect(this.context.destination);
    this.musicBus=this.context.createGain();this.musicBus.connect(this.master);this.sfxBus=this.context.createGain();this.sfxBus.connect(this.master);this.apply();
    this.loading=Promise.all(['forest-theme',...CUES].map(async name=>{
      const ext=name==='forest-theme'?'ogg':'wav',response=await fetch(new URL(`../assets/audio/${name}-v1.${ext}`,import.meta.url));
      if(!response.ok)throw Error('Audio unavailable: '+name);const data=await response.arrayBuffer(),buffer=await this.context.decodeAudioData(data);this.buffers.set(name,buffer);
    })).then(()=>this).catch(error=>{this.error=error.message;throw error;});return this.loading;
  }
  apply(){if(!this.context)return;this.master.gain.value=this.muted?0:this.volumes.master;this.musicBus.gain.value=this.volumes.music;this.sfxBus.gain.value=this.volumes.sfx;}
  async unlock(){if(this.context&&this.context.state!=='running')await this.context.resume();}
  play(name,loop=false){
    if(!this.context||this.context.state!=='running'||this.muted||!this.buffers.has(name))return null;
    if(name==='hover'){const now=performance.now();if(now-this.lastHover<120)return null;this.lastHover=now;}
    if(this.sources.size>=8)return null;
    const source=this.context.createBufferSource();source.buffer=this.buffers.get(name);source.loop=loop;source.connect(loop?this.musicBus:this.sfxBus);this.sources.add(source);
    source.onended=()=>{this.sources.delete(source);source.disconnect();};source.start();return source;
  }
  startMusic(){if(!this.music)this.music=this.play('forest-theme',true);}
  stopAll(){for(const source of this.sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}this.sources.clear();this.music=null;}
  dispose(){this.stopAll();if(this.context){this.context.close();this.context=null;}}
  summary(){return{sources:this.sources.size,music:Number(!!this.music),context:this.context?.state||'none',decoded:this.buffers.size,error:this.error};}
}
