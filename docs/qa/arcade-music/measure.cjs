const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../grib/arcade-music-v1');
const score=JSON.parse(fs.readFileSync(path.join(root,'score.json'))),rows=[];
for(const track of score.tracks){
 const bytes=fs.readFileSync(path.join(root,track.file));
 const pcm=cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',path.join(root,track.file),'-f','f32le','-acodec','pcm_f32le','-'],{maxBuffer:20e6});
 let peak=0,sum=0;for(let i=0;i<pcm.length;i+=4){const v=pcm.readFloatLE(i);peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 const edge=Math.max(...[0,1].map(c=>Math.abs(pcm.readFloatLE(c*4)-pcm.readFloatLE(pcm.length-8+c*4))));
 rows.push({...track,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),decodedSeconds:pcm.length/8/44100,
  decodedPeakDb:20*Math.log10(peak),decodedRmsDb:20*Math.log10(Math.sqrt(sum/(pcm.length/4))),edgeDelta:edge});
 if(peak>=.99||edge>.025||Math.abs(pcm.length/8/44100-track.seconds)>.002)throw Error('Audio gate: '+JSON.stringify(rows.at(-1)));
}
if(new Set(rows.map(t=>t.sha256)).size!==8)throw Error('Duplicate songs');
const result={tracks:rows,totalBytes:rows.reduce((n,t)=>n+t.bytes,0),failures:[]};
fs.writeFileSync(__dirname+'/measurements.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({tracks:rows.length,totalBytes:result.totalBytes,worstLoopEdge:Math.max(...rows.map(t=>t.edgeDelta)),failures:[]},null,2));
