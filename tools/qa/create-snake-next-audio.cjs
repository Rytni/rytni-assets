/* Original score/SFX source. No borrowed samples, melodies or legacy assets. */
const fs=require('node:fs'),path=require('node:path');
const RATE=44100,DIR=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'../../.playwright-cli/phase3a/sources/audio');
function track(seconds){return new Float32Array(Math.round(seconds*RATE));}
function tone(out,start,seconds,midi,gain,type='flute',pan=0){
  const frequency=440*2**((midi-69)/12),samples=Math.floor(seconds*RATE),at=Math.round(start*RATE);
  for(let i=0;i<samples;i++){
    const t=i/RATE,envelope=Math.min(1,t/.012)*Math.min(1,(seconds-t)/.045),phase=2*Math.PI*frequency*t;
    let v=type==='pluck'?(Math.sin(phase)+.25*Math.sin(phase*2)+.10*Math.sin(phase*3))*Math.exp(-t*7):type==='bass'?Math.sin(phase)*Math.exp(-t*3):Math.sin(phase)+.17*Math.sin(phase*2)+.055*Math.sin(phase*3);
    out[(at+i)%out.length]+=gain*v*envelope;
  }
}
function wav(name,out,peak=.60){
  let max=0,sum=0;for(const s of out){max=Math.max(max,Math.abs(s));sum+=s*s;}
  const scale=max?peak/max:1,data=Buffer.alloc(44+out.length*2);data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(RATE,24);data.writeUInt32LE(RATE*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(out.length*2,40);
  for(let i=0;i<out.length;i++)data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,out[i]*scale))*32767),44+i*2);
  fs.writeFileSync(path.join(DIR,name+'.wav'),data);return{name,seconds:out.length/RATE,peak,peakDb:20*Math.log10(peak),rmsDb:20*Math.log10(Math.sqrt(sum/out.length)*scale)};
}
fs.mkdirSync(DIR,{recursive:true});const results=[],beat=60/96,music=track(80);
// 32 bars ×4 beats at96BPM =80s. Four original eight-bar phrases.
// D-major / B-minor / G-major / A with melodic inversion and a quiet bridge.
const chords=[[50,54,57],[47,50,54],[43,47,50],[45,49,52]];
const phrases=[
  [74,78,81,78,76,74,71,74,78,76,74,69,71,74,76,73],
  [78,81,83,81,78,76,74,71,74,78,76,74,73,71,69,73],
  [74,71,69,66,67,71,74,71,73,76,78,76,74,73,71,69],
  [78,76,74,78,81,78,76,74,71,74,78,76,73,76,69,73]
];
for(let bar=0;bar<32;bar++){
  const phrase=Math.floor(bar/8),chord=chords[bar%4],start=bar*4*beat;
  for(let b=0;b<4;b++){
    tone(music,start+b*beat,.35,chord[b%3],.075,'bass');
    for(let half=0;half<2;half++)tone(music,start+(b+half*.5)*beat,.28,chord[(b+half)%3]+24,phrase===2?.018:.035,'pluck');
    // Gentle original wood-block pulse, no continuous drone.
    if(b===0||b===2)tone(music,start+b*beat,.06,38,.025,'pluck');
  }
  const motif=phrases[phrase],index=(bar%8)*2;
  tone(music,start+.12*beat,1.30*beat,motif[index],phrase===2?.085:.11,'flute');
  tone(music,start+2*beat,1.42*beat,motif[index+1],phrase===2?.08:.105,'flute');
  if(bar%4===3){tone(music,start+3.50*beat,.32*beat,motif[index+1]+2,.045,'pluck');}
}
// Tone tails wrap mathematically across the boundary; every note has a smooth
// envelope. PCM loop duration is exact, not a concatenated MP3 encoder gap.
results.push(wav('forest-theme-v1',music,.50));
const sfx={hover:[[0,.07,81,.22]],click:[[0,.08,69,.4],[.055,.11,76,.3]],pickup:[[0,.11,76,.35],[.065,.14,81,.35],[.14,.17,86,.25]],combo:[[0,.13,81,.3],[.1,.17,88,.28]],turn:[[0,.035,62,.10]],death:[[0,.16,50,.4],[.10,.20,43,.35],[.23,.22,38,.25]],result:[[0,.14,69,.3],[.12,.17,73,.3],[.27,.22,78,.27]],pause:[[0,.1,76,.22],[.08,.12,69,.20]],resume:[[0,.1,69,.22],[.08,.12,76,.20]],arrival:[[0,.14,74,.25],[.12,.18,78,.23],[.26,.22,81,.20]]};
for(const [name,notes]of Object.entries(sfx)){const out=track(Math.max(...notes.map(n=>n[0]+n[1]))+.03);for(const n of notes)tone(out,...n,'pluck');results.push(wav(name+'-v1',out,name==='hover'||name==='turn'?.18:.50));}
console.log(JSON.stringify({author:'Original Codex composition, 2026-10-02',tempo:96,bars:32,results},null,2));
