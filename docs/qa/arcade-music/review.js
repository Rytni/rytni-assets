import {MusicDirector,TRACKS,CHAPTER_SECONDS} from '../../../grib/arcade-music-v1/player.js';
const $=id=>document.getElementById(id), players=[];
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
 $('play-snake').href='https://rytni.live/testpodari';$('play-snake').textContent='Открыть обе игры на TEST';$('play-fly').hidden=true;
}
let context,bus,director,game='fly',chapter=0,seconds=0,paused=false;
const stopFiles=()=>players.forEach(audio=>audio.pause());
const remember=()=>{if(director?.current){const voice=director.current;seconds=director.origin+voice.offset+context.currentTime-voice.started;director.sync(voice.id,seconds);}};
for(const track of TRACKS){
 const card=document.createElement('article'),heading=document.createElement('h3'),text=document.createElement('p'),audio=document.createElement('audio');
 heading.textContent=track.title;text.textContent=`${track.game==='fly'?'Fly':'Snake'} · тема ${TRACKS.filter(t=>t.game===track.game).indexOf(track)+1} · 37 секунд · 104 BPM`;
 audio.controls=true;audio.preload='none';audio.loop=true;audio.volume=.25;audio.src=new URL('../../../grib/arcade-music-v1/'+track.file,import.meta.url);
 audio.addEventListener('play',()=>{for(const other of players)if(other!==audio)other.pause();director?.pause();paused=true;});
 players.push(audio);card.append(heading,text,audio);$(track.game+'-tracks').append(card);
}
async function play(){
 stopFiles();context??=new AudioContext();if(!bus){bus=context.createGain();bus.connect(context.destination);director=new MusicDirector(context,bus);}
 await context.resume();bus.gain.value=Number($('volume').value);paused=false;
 const track=TRACKS.filter(t=>t.game===game)[chapter%4];director.sync(track.id,seconds);
 $('now').textContent=(game==='fly'?'Fly':'Snake')+' · '+track.title+' · ×1';
 $('state').textContent='Загрузка композиции…';
 if(director.pending)await director.pending;
 $('state').textContent=' '+(director.error||`Источников: ${director.voices.size}; декодировано: ${director.cache.size}/2`);
 for(const id of ['next','pause','stop'])$(id).disabled=false;$('pause').textContent='Пауза';
}
for(const name of ['fly','snake'])$(name).onclick=()=>{game=name;chapter=0;seconds=0;director?.reset();void play();};
$('next').onclick=()=>{chapter++;seconds+=CHAPTER_SECONDS;void play();};
$('pause').onclick=async()=>{if(paused){await play();}else{remember();director?.pause();await context?.suspend();paused=true;$('pause').textContent='Продолжить';}};
$('stop').onclick=()=>{director?.reset();stopFiles();void context?.suspend();paused=true;$('now').textContent='Остановлено';};
$('volume').oninput=()=>{const value=Number($('volume').value);if(bus)bus.gain.value=value;players.forEach(audio=>audio.volume=value*.6);};
document.addEventListener('visibilitychange',()=>{if(document.hidden){remember();director?.pause();stopFiles();void context?.suspend();paused=true;$('pause').textContent='Продолжить';}});
window.addEventListener('pagehide',()=>{director?.dispose();stopFiles();void context?.close();});
