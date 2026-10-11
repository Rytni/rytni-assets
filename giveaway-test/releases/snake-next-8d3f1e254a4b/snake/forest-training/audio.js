import {Mixer} from '../production/audio.js';
/** Same Master/Music/Effects mixer; only the four missing slice cues are added. */
export class ForestAudio extends Mixer {
  play(name,loop=false){
    const source=super.play(name,loop);if(!source)return null;
    // Worst-case eight-source mix retains headroom even with all sliders at 1.
    const gain=this.context.createGain();gain.gain.value=loop?.5:.16;
    source.disconnect();source.connect(gain);gain.connect(loop?this.musicBus:this.sfxBus);
    this.gains ||= new Map();this.gains.set(source,gain);const ended=source.onended;
    source.onended=()=>{ended();gain.disconnect();this.gains.delete(source);};return source;
  }
  stopAll(){super.stopAll();for(const gain of this.gains?.values()||[])gain.disconnect();this.gains?.clear();}
  async load(){
    if(this.forestLoading)return this.forestLoading;
    this.forestLoading=super.load().then(async()=>{
      await Promise.all(['buff','debuff','portal-enter','portal-exit'].map(async name=>{
        const response=await fetch(new URL('./audio/'+name+'.wav',import.meta.url));
        if(!response.ok)throw Error('Missing Forest audio: '+name);
        this.buffers.set(name,await this.context.decodeAudioData(await response.arrayBuffer()));
      }));return this;
    });return this.forestLoading;
  }
}
