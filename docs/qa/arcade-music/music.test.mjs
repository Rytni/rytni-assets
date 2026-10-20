import test from 'node:test';
import assert from 'node:assert/strict';
import {MusicDirector,TRACKS,TRACK_SECONDS,CHAPTER_SECONDS,flyMusicCue,snakeMusicCue} from '../../../grib/arcade-music-v1/player.js';
class Param {
  constructor(value=1){this.value=value;this.events=[];}
  setValueAtTime(value,time){this.value=value;this.events.push(['set',value,time]);}
  linearRampToValueAtTime(value,time){this.value=value;this.events.push(['ramp',value,time]);}
  cancelScheduledValues(time){this.events.push(['cancel',time]);}
}
class Context {
  constructor(){this.state='running';this.currentTime=0;this.sources=[];}
  createGain(){return {gain:new Param(),connect(){},disconnect(){}};}
  createBufferSource(){const source={playbackRate:new Param(),detune:new Param(0),
    connect(){},disconnect(){},start(time,offset){this.startAt=time;this.offset=offset;},
    stop(time=0){this.stopAt=time;}};this.sources.push(source);return source;}
  async decodeAudioData(){return {duration:TRACK_SECONDS,length:Math.round(TRACK_SECONDS*44100),numberOfChannels:2};}
  advance(seconds){this.currentTime+=seconds;for(const s of this.sources)if(s.stopAt!==undefined&&s.stopAt<=this.currentTime)s.onended?.();}
}
const settle=async director=>{if(director.pending)await director.pending;};
const create=()=>{const context=new Context(),requests=[];
  const director=new MusicDirector(context,{}, {resolve:file=>file,fetcher:async url=>{
    requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}});
  return {context,director,requests};};
test('Default browser fetch retains the Window/global receiver',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async function(){assert.equal(this,globalThis);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  try{const director=new MusicDirector(new Context(),{}, {resolve:f=>f});director.sync('fly-skyline',0);await settle(director);assert.equal(director.voices.size,1);assert.equal(director.error,'');}
  finally{globalThis.fetch=original;}
});
test('Eight distinct compositions; musical chapters change track, never playback speed',()=>{
  assert.equal(TRACKS.length,8);assert.equal(new Set(TRACKS.map(t=>t.file)).size,8);
  assert.ok(TRACKS.every(t=>t.bpm===104));
  for(let i=0;i<4;i++){
    assert.equal(flyMusicCue(i*CHAPTER_SECONDS+.01),TRACKS[i].id);
    assert.equal(snakeMusicCue({tick:0,stage:{index:i}}),TRACKS[4+i].id);
  }
  assert.equal(flyMusicCue(1,80000),'fly-daydream');
  assert.equal(snakeMusicCue({tick:Math.ceil(CHAPTER_SECONDS*60),stage:{index:0}}),'snake-root');
});
test('Repeated ticks share one fetch/source; equal-tempo crossfade is bounded to two voices',async()=>{
  const {context,director,requests}=create();
  for(let i=0;i<1000;i++)director.sync('fly-skyline',i/60);
  await settle(director);assert.equal(requests.length,1);assert.equal(director.voices.size,1);
  director.sync('fly-cloudclub',75);await settle(director);
  assert.equal(director.voices.size,2);assert.equal(context.sources[0].stopAt,1.82);
  assert.deepEqual(director.summary().rates,[1,1]);
  context.advance(2);assert.equal(director.voices.size,1);
});
test('Pause cancels voices; resume uses active-clock position, not wall time or a fresh intro',async()=>{
  const {context,director}=create();director.sync('snake-moss',0);await settle(director);
  director.sync('snake-moss',13.5);director.pause();context.advance(400);
  assert.equal(director.summary().seconds,13.5);assert.equal(director.voices.size,0);
  director.sync('snake-moss',13.5);assert.equal(director.current.offset,13.5);
  assert.equal(director.current.source.playbackRate.value,1);
  director.sync('snake-moss',0);assert.equal(director.current.offset,0);
});
test('Rapid stage changes, restart and disposal do not accumulate voices/buffers',async()=>{
  const {director}=create();
  for(let i=0;i<20;i++){
    director.sync(TRACKS[4+i%4].id,i*2);await settle(director);
    assert.ok(director.voices.size<=2);assert.ok(director.cache.size<=2);
  }
  director.reset();assert.equal(director.voices.size,0);
  director.dispose();assert.equal(director.cache.size,0);
  director.sync('snake-root',0);assert.equal(director.voices.size,0);
});
test('In-flight decoding cannot resurrect music after pause/dispose',async()=>{
  const context=new Context();let deliver;
  const director=new MusicDirector(context,{}, {resolve:f=>f,fetcher:()=>new Promise(resolve=>{deliver=resolve;})});
  director.sync('fly-skyline',0);director.pause();
  deliver({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await settle(director);
  assert.equal(director.voices.size,0);
  director.sync('fly-skyline',10);assert.equal(director.voices.size,1);director.dispose();
  assert.equal(director.voices.size,0);
});
test('Music network failure is nonfatal and retries are bounded by active time',async()=>{
  const context=new Context();let calls=0;
  const director=new MusicDirector(context,{}, {resolve:f=>f,fetcher:async()=>{calls++;throw Error('offline');}});
  director.sync('fly-skyline',0);await settle(director);
  for(let i=0;i<500;i++)director.sync('fly-skyline',i/100);
  assert.equal(calls,1);assert.match(director.error,/offline/);
  director.sync('fly-skyline',16);await settle(director);assert.equal(calls,2);
});
