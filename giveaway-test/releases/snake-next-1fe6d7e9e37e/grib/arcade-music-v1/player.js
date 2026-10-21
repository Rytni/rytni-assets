// Shared presentation-only soundtrack. Uses the caller's existing context/music bus.
export const MUSIC_VERSION = 'arcade-chill-v1-snake-groove-v2';
export const BPM = 104;
export const TRACK_SECONDS = 64 * 60 / BPM;
export const CHAPTER_SECONDS = TRACK_SECONDS * 2;
export const TRACKS = Object.freeze([
  ['fly-skyline','Skyline Soda','fly'], ['fly-cloudclub','Cloud Club','fly'],
  ['fly-daydream','Daydream Delivery','fly'], ['fly-aurora','Aurora Avenue','fly'],
  ['snake-moss','Fern Arcade','snake'], ['snake-root','Velvet Mycelium','snake'],
  ['snake-crystal','Moonlit Steps','snake'], ['snake-spore','Neon Canopy','snake']
].map(([id,title,game]) => Object.freeze({id,title,game,file:id+'.mp3',bpm:BPM,seconds:TRACK_SECONDS})));
export function flyMusicCue(seconds=0, score=0) {
  const chapter = Math.max(Math.floor(Math.max(0,seconds)/CHAPTER_SECONDS), Math.floor(Math.max(0,score)/40000));
  return TRACKS[chapter % 4].id;
}
export function snakeMusicCue(session) {
  const seconds = Math.max(0,Number(session?.tick)||0)/60;
  const chapter = Math.max(0,Number(session?.stage?.index)||0) + Math.floor(seconds/CHAPTER_SECONDS);
  return TRACKS[4+chapter % 4].id;
}
export class MusicDirector {
  constructor(context, bus, {fetcher=(...args)=>globalThis.fetch(...args), resolve=file=>new URL(file,import.meta.url), fade=1.8}={}) {
    Object.assign(this,{context,bus,fetcher,resolve,fade});
    this.cache=new Map();this.voices=new Set();this.pending=null;this.current=null;
    this.wanted=null;this.seconds=0;this.origin=0;this.enabled=false;this.disposed=false;
    this.error='';this.retryAt=0;this.history=[];
  }
  sync(id, seconds=0) {
    if(this.disposed || !TRACKS.some(track=>track.id===id))return;
    seconds=Math.max(0,Number(seconds)||0);
    if(seconds<this.seconds-.05)this.reset();
    if(id!==this.wanted){for(const voice of [...this.voices])if(voice!==this.current)this.removeVoice(voice);
      this.wanted=id;this.origin=seconds;this.retryAt=0;}
    this.seconds=seconds;this.enabled=true;
    if(this.context.state!=='running')return;
    if(this.current?.id===id)return;
    const buffer=this.cache.get(id);
    if(buffer)this.switchTo(id,buffer);else this.loadWanted();
  }
  loadWanted() {
    if(this.pending || !this.wanted || this.disposed || this.seconds<this.retryAt)return;
    const id=this.wanted, track=TRACKS.find(t=>t.id===id);
    this.pending=(async()=>{
      const response=await this.fetcher(this.resolve(track.file));
      if(!response.ok)throw Error('Music unavailable: '+id);
      const buffer=await this.context.decodeAudioData(await response.arrayBuffer());
      if(this.disposed)return;
      this.trimCache(1);this.cache.set(id,buffer);this.error='';this.trimCache();
      if(this.enabled && this.wanted===id && this.context.state==='running')this.switchTo(id,buffer);
    })().catch(error=>{this.error=String(error.message||error);if(this.wanted===id)this.retryAt=this.seconds+15;})
      .finally(()=>{this.pending=null;if(this.enabled && this.wanted!==id)this.loadWanted();});
  }
  switchTo(id, buffer) {
    if(!this.enabled || this.disposed || this.current?.id===id)return;
    const now=this.context.currentTime, previous=this.current;
    // Rapid chapter changes never accumulate a chain of fading sources.
    for(const voice of [...this.voices])if(voice!==previous)this.removeVoice(voice);
    const source=this.context.createBufferSource(), gain=this.context.createGain();
    source.buffer=buffer;source.loop=true;source.loopEnd=Math.min(buffer.duration,TRACK_SECONDS);
    source.playbackRate.value=1;source.detune.value=0;
    source.connect(gain);gain.connect(this.bus);
    const offset=Math.max(0,this.seconds-this.origin)%source.loopEnd;
    const voice={id,source,gain,offset,started:now};
    this.voices.add(voice);this.current=voice;
    source.onended=()=>this.removeVoice(voice,false);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.6,now+(previous?this.fade:.3));
    source.start(now,offset);
    if(previous){const g=previous.gain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);
      g.linearRampToValueAtTime(0,now+this.fade);try{previous.source.stop(now+this.fade+.02);}catch{}}
    this.history.push(id);if(this.history.length>12)this.history.shift();this.trimCache();
  }
  removeVoice(voice, stop=true) {
    if(!this.voices.delete(voice))return;
    voice.source.onended=null;if(stop)try{voice.source.stop();}catch{}
    voice.source.disconnect();voice.gain.disconnect();
    if(this.current===voice)this.current=null;
    this.trimCache();
  }
  trimCache(limit=2) {
    for(const [id] of this.cache){if(this.cache.size<=limit)break;
      if(id!==this.wanted && ![...this.voices].some(v=>v.id===id))this.cache.delete(id);}
  }
  pause() {this.enabled=false;for(const voice of [...this.voices])this.removeVoice(voice);}
  reset() {this.pause();this.wanted=null;this.seconds=0;this.origin=0;this.retryAt=0;}
  dispose() {this.reset();this.disposed=true;this.cache.clear();}
  summary() {return {version:MUSIC_VERSION,track:this.current?.id||null,wanted:this.wanted,
    playing:this.enabled,seconds:this.seconds,origin:this.origin,voices:this.voices.size,
    decoded:this.cache.size,decodedBytes:[...this.cache.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0),
    rates:[...this.voices].map(v=>v.source.playbackRate.value),history:[...this.history],error:this.error};}
}
