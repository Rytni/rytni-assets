/* Original instrumental compositions. No downloaded samples or borrowed melodies.
 * Offline only: runtime plays mastered files and never synthesizes the soundtrack. */
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {execFileSync} = require('node:child_process');
const RATE = 32000, BPM = 104, BEAT = 60 / BPM, BARS = 16;
const LENGTH = Math.round(BARS * 4 * BEAT * RATE), TAU = Math.PI * 2;
const destination = path.resolve(__dirname, '../../grib/arcade-music-v1');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rytni-music-'));
const scores = [
  {id:'fly-skyline', title:'Skyline Soda', game:'fly', color:0,
    chords:[[50,54,57,61,64],[47,50,54,57,61],[43,47,50,54,57],[45,52,55,59,62]],
    lead:[78,81,76,null,74,78,73,null,71,74,78,76,null,74,73,69]},
  {id:'fly-cloudclub', title:'Cloud Club', game:'fly', color:1,
    chords:[[43,47,50,54,57],[45,48,52,55,59],[47,50,54,57,61],[48,52,55,59,62]],
    lead:[79,null,78,74,76,79,null,83,81,78,76,null,74,78,71,null]},
  {id:'fly-daydream', title:'Daydream Delivery', game:'fly', color:2,
    chords:[[52,55,59,62,66],[45,48,52,55,59],[50,54,57,61,64],[43,47,50,54,57]],
    lead:[83,78,null,79,76,null,74,71,74,78,81,null,79,78,74,null]},
  {id:'fly-aurora', title:'Aurora Avenue', game:'fly', color:3,
    chords:[[45,49,52,56,59],[42,45,49,52,56],[50,54,57,61,64],[52,59,62,66,69]],
    lead:[80,83,78,null,76,73,76,null,78,81,85,83,80,null,78,76]},
  {id:'snake-moss', title:'Moss Cassette', game:'snake', color:4,
    chords:[[45,48,52,55,59],[50,53,57,60,64],[43,50,53,57,60],[48,52,55,59,62]],
    lead:[76,79,74,null,72,76,null,71,69,72,76,74,null,72,71,null]},
  {id:'snake-root', title:'Root Circuit', game:'snake', color:5,
    chords:[[41,45,48,52,55],[48,52,55,59,62],[52,55,59,62,66],[45,48,52,55,59]],
    lead:[77,null,76,72,69,72,76,null,79,74,71,null,72,76,69,null]},
  {id:'snake-crystal', title:'Crystal Pocket', game:'snake', color:6,
    chords:[[48,51,55,58,62],[44,48,51,55,58],[51,55,58,62,65],[46,53,56,60,63]],
    lead:[79,74,75,null,72,70,74,null,79,82,77,74,null,75,72,null]},
  {id:'snake-spore', title:'Spore City', game:'snake', color:7,
    chords:[[50,53,57,60,64],[46,50,53,57,60],[41,45,48,52,55],[48,52,55,60,62]],
    lead:[81,null,77,76,74,72,null,69,74,77,79,null,76,72,74,null]}
];
function random(seed) {return () => {seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed>>>15, 1|seed);t ^= t + Math.imul(t ^ t>>>7, 61|t);return ((t ^ t>>>14)>>>0)/4294967296;};}
function compose(score) {
  const channels = [new Float32Array(LENGTH), new Float32Array(LENGTH)];
  const rnd = random(401 + score.color * 917), fly = score.game === 'fly';
  const add = (at, seconds, pan, render, gain) => {
    const start = Math.round(at * RATE), size = Math.round(seconds * RATE);
    const left = Math.sqrt((1-pan)/2), right = Math.sqrt((1+pan)/2);
    for (let i=0; i<size; i++) {
      const index = (start+i+LENGTH)%LENGTH, value = render(i/RATE, i)*gain;
      channels[0][index] += value*left; channels[1][index] += value*right;
    }
  };
  const note = (at, seconds, midi, gain, instrument='keys', pan=0) => {
    const f = 440*2**((midi-69)/12), w = TAU*f, phase = rnd()*TAU;
    add(at, seconds+.16, pan, t => {
      const envelope = Math.min(1,t/(instrument==='pad'?.08:.007))*Math.min(1,Math.max(0,(seconds+.16-t)/.16));
      if (instrument==='bass') return envelope*Math.exp(-t*3.2)*(Math.sin(w*t)+.19*Math.sin(2*w*t)*Math.exp(-t*5)+.045*Math.sin(3*w*t));
      if (instrument==='pad') return envelope*(Math.sin(w*t+phase)*.65+Math.sin(w*1.0018*t+phase)*.23+Math.sin(w*.998*t+phase)*.12)*.55;
      if (instrument==='pluck') return envelope*Math.exp(-t*6.5)*(Math.sin(w*t+1.2*Math.exp(-t*8)*Math.sin(2*w*t))+.12*Math.sin(w*3*t)*Math.exp(-t*10));
      // Round electric piano: soft tine attack, tremolo, no abrasive square wave.
      return envelope*Math.exp(-t*2.1)*(Math.sin(w*t+(.7+.12*(score.color%3))*Math.exp(-t*5)*Math.sin(2*w*t))+.12*Math.sin(3*w*t)*Math.exp(-t*9))*(.94+.06*Math.sin(TAU*4.5*t));
    }, gain);
  };
  const kick = at => add(at,.27,0,t=>Math.sin(TAU*(47*t+6.8*(1-Math.exp(-t*37))))*Math.exp(-t*21)*Math.min(1,t/.003),.24);
  const snare = at => {
    let smooth=0;
    add(at,.19,.06,t=>{const noise=rnd()*2-1;smooth+=.32*(noise-smooth);return (smooth*.7+Math.sin(TAU*173*t)*.22)*Math.exp(-t*27)*Math.min(1,t/.003);},.16);
    for(const delay of [0,.009,.018])add(at+delay,.075,-.09,t=>(rnd()*2-1)*Math.exp(-t*55)*Math.min(1,t/.002),.018);
  };
  const hat = (at, strong, pan) => {
    let last=0;
    add(at,strong?.085:.05,pan,t=>{const n=rnd()*2-1,high=n-last;last=n;return high*Math.exp(-t/(strong?.023:.014))*Math.min(1,t/.001);},strong?.017:.011);
  };
  for (let bar=0; bar<BARS; bar++) {
    const at = bar*4*BEAT, chord = score.chords[Math.floor(bar/2)%4], variation = bar>=8;
    const light = bar===7 || bar===15, swing = fly?.025:.045;
    // Modern pocket groove; alternating root/fifth bass, restrained high end.
    for (const beat of (fly?[0,1.75,2.5]:[0,1.5,2.75])) if (!light || beat===0) kick(at+beat*BEAT);
    snare(at+BEAT);snare(at+3*BEAT);
    for (let step=0; step<8; step++) if (!light || step%2===0)
      hat(at+(step*.5+(step%2?swing:0))*BEAT,step%2===1,(step%2?1:-1)*.38);
    const bassLine = score.color%2 ? [0,.75,1.75,2.5,3.5] : [0,1.25,2,2.75,3.5];
    bassLine.forEach((b,i)=>note(at+b*BEAT,(i===0?.6:.32)*BEAT,
      chord[0]-12+(i===3?7:0),.18,'bass',0));
    for (const [j,b] of [0,1.5,3.25].entries()) {
      if (light && j===2) continue;
      chord.slice(1).forEach((m,i)=>note(at+b*BEAT+i*.009,(j===0?1.05:.52)*BEAT,m+12,
        .040*(j===0?1:.72),'keys',(i-1.5)*.12));
    }
    if (bar%2===0) chord.slice(1).forEach((m,i)=>note(at,7.3*BEAT,m+12,.013,'pad',(i-1.5)*.32));
    // Different hooks and B phrases, with breathing spaces instead of constant lead.
    for (let j=0;j<2;j++) {
      const idx=bar*2+j, midi=score.lead[idx%16];
      if (midi===null || light && j===1) continue;
      const pitch=midi+(variation && idx%5===0?12:0), time=at+(j*2+.35+(score.color%2?.25:0))*BEAT;
      note(time,(j===0?.85:1.15)*BEAT,pitch,fly?.067:.056,score.color%3===1?'pluck':'keys',j===0?-.17:.19);
      // Quiet dotted echo is printed into the file, not an extra runtime voice.
      note(time+.75*BEAT,.6*BEAT,pitch,.012,'pluck',j===0?.48:-.48);
    }
    if (variation && bar%2===1 && !light) {
      [0,1,2].forEach((j)=>note(at+(2.5+j*.5)*BEAT,chord[0]===41?.18:.24,
        chord[j+1]+24,.019,'pluck',(j-1)*.35));
    }
  }
  // Printed short room/width, DC removal, gentle high-frequency roll-off and headroom.
  const dry=channels.map(c=>c.slice());
  const taps=[[.113,.10],[.181,.075],[.269,.05],[.347,.035]];
  for(let c=0;c<2;c++) {
    let low=0,dc=0;
    for(let i=0;i<LENGTH;i++) {
      let value=dry[c][i];
      for(const [delay,level] of taps)value+=dry[1-c][(i-Math.round(delay*RATE)+LENGTH)%LENGTH]*level;
      low+=.65*(value-low);dc+=.0015*(low-dc);
      channels[c][i]=Math.tanh((low-dc)*1.15)/1.15;
    }
  }
  // A 3ms printed cosine de-click protects the MP3 loop edge, not a runtime fade.
  for(const c of channels)for(let i=0;i<96;i++){
    const k=.5-.5*Math.cos(Math.PI*i/95);c[i]*=k;c[LENGTH-1-i]*=k;
  }
  let sum=0,peak=0;
  for(const c of channels)for(const v of c){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
  const rms=Math.sqrt(sum/(LENGTH*2)),level=Math.min(.63/peak,.105/rms);
  const wav=Buffer.alloc(44+LENGTH*4);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(RATE,24);wav.writeUInt32LE(RATE*4,28);
  wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(LENGTH*4,40);
  for(let i=0;i<LENGTH;i++)for(let c=0;c<2;c++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,channels[c][i]*level))*32767),44+(i*2+c)*2);
  const temporary=path.join(work,score.id+'.wav'),out=path.join(destination,score.id+'.mp3');
  fs.writeFileSync(temporary,wav);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',temporary,'-ar','44100',
    '-codec:a','libmp3lame','-b:a','128k','-map_metadata','-1','-write_xing','1',out]);
  fs.unlinkSync(temporary);
  return {id:score.id,title:score.title,game:score.game,file:score.id+'.mp3',bpm:BPM,bars:BARS,
    seconds:LENGTH/RATE,bytes:fs.statSync(out).size,peakDb:20*Math.log10(peak*level),rmsDb:20*Math.log10(rms*level)};
}
fs.mkdirSync(destination,{recursive:true});
const tracks=[];
for(const score of scores){tracks.push(compose(score));console.log('Rendered '+score.title);}
fs.writeFileSync(path.join(destination,'score.json'),JSON.stringify({version:'arcade-chill-v1',
  authorship:'Original offline composition and synthesis; no third-party samples.',tracks},null,2)+'\n');
fs.rmdirSync(work);
console.log(JSON.stringify({tracks:tracks.length,totalBytes:tracks.reduce((n,t)=>n+t.bytes,0)}));
