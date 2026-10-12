const activeManifestSchema={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:rytni:active-manifest:3","type":"object","additionalProperties":false,"properties":{"schema_version":{"const":3},"account_key":{"type":"string","pattern":"^[a-z][a-z0-9-]{0,63}$"},"username":{"type":"string","pattern":"^[a-z0-9_.]{1,24}$"},"media_kit_slug":{"type":"string","pattern":"^[a-z][a-z0-9-]{0,63}$"},"release_id":{"type":"string","pattern":"^[a-f0-9]{64}$"},"release_sha256":{"type":"string","pattern":"^[a-f0-9]{64}$"},"release_url":{"type":"string","format":"uri"},"published_at":{"type":"string","format":"date-time"},"data_updated_at":{"type":"string","format":"date"},"period":{"type":"object","additionalProperties":false,"properties":{"type":{"const":"CALENDAR_WINDOW"},"start":{"type":"string","format":"date"},"end":{"type":"string","format":"date"},"days":{"type":"integer","minimum":1,"maximum":365},"boundaries":{"const":"INCLUSIVE"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"normalized_timezone":{"type":["string","null"]}},"required":["type","start","end","days","boundaries","source_timezone","normalized_timezone"]},"previous_release_id":{"type":["string","null"],"pattern":"^[a-f0-9]{64}$"}},"required":["schema_version","account_key","username","media_kit_slug","release_id","release_sha256","release_url","published_at","data_updated_at","period","previous_release_id"]};
export const publicSchema={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:rytni:public-media-kit:2","type":"object","additionalProperties":false,"properties":{"schema_version":{"const":2},"account_key":{"type":"string","pattern":"^[a-z][a-z0-9-]{0,63}$"},"username":{"type":"string","pattern":"^[a-z0-9_.]{1,24}$"},"media_kit_slug":{"type":"string","pattern":"^[a-z][a-z0-9-]{0,63}$"},"generated_at":{"type":"string","format":"date-time"},"freshness":{"type":"object","additionalProperties":false,"properties":{"status":{"enum":["FRESH","PARTIAL","STALE"]},"data_as_of_date":{"type":"string","format":"date"},"stale_after_days":{"type":"integer","minimum":1}},"required":["status","data_as_of_date","stale_after_days"]},"current":{"type":"object","additionalProperties":false,"properties":{"followers":{"type":"object","additionalProperties":false,"properties":{"value":{"type":"integer","minimum":0},"as_of_date":{"type":"string","format":"date"},"captured_at":{"type":"string","format":"date-time"},"source":{"const":"DATA_EXPORT"},"precision":{"const":"DATE_ONLY"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]}},"required":["value","as_of_date","captured_at","source","precision","source_timezone"]}},"required":["followers"]},"period":{"type":"object","additionalProperties":false,"properties":{"period_type":{"const":"CALENDAR_WINDOW"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"boundaries":{"const":"INCLUSIVE"},"calendar_days":{"type":"integer","minimum":1,"maximum":365},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"normalized_timezone":{"type":["string","null"]},"captured_at":{"type":"string","format":"date-time"},"metrics":{"type":"object","additionalProperties":false,"properties":{"views":{"type":"object","additionalProperties":false,"properties":{"value":{"type":"integer","minimum":0},"captured_at":{"type":"string","format":"date-time"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"source":{"const":"DATA_EXPORT"}},"required":["value","captured_at","period_start","period_end","source_timezone","source"]},"likes":{"type":"object","additionalProperties":false,"properties":{"value":{"type":"integer","minimum":0},"captured_at":{"type":"string","format":"date-time"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"source":{"const":"DATA_EXPORT"}},"required":["value","captured_at","period_start","period_end","source_timezone","source"]},"comments":{"type":"object","additionalProperties":false,"properties":{"value":{"type":"integer","minimum":0},"captured_at":{"type":"string","format":"date-time"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"source":{"const":"DATA_EXPORT"}},"required":["value","captured_at","period_start","period_end","source_timezone","source"]},"shares":{"type":"object","additionalProperties":false,"properties":{"value":{"type":"integer","minimum":0},"captured_at":{"type":"string","format":"date-time"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"source":{"const":"DATA_EXPORT"}},"required":["value","captured_at","period_start","period_end","source_timezone","source"]},"profile_views":{"type":"object","additionalProperties":false,"properties":{"value":{"type":"integer","minimum":0},"captured_at":{"type":"string","format":"date-time"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"source":{"const":"DATA_EXPORT"}},"required":["value","captured_at","period_start","period_end","source_timezone","source"]}},"required":[]}},"required":["period_type","period_start","period_end","boundaries","calendar_days","source_timezone","normalized_timezone","captured_at","metrics"]},"audience":{"type":"object","additionalProperties":false,"properties":{"population":{"const":"followers"},"captured_at":{"type":"string","format":"date-time"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"gender":{"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","additionalProperties":false,"properties":{"label":{"type":"string","pattern":"^(male|female|other)$"},"fraction":{"type":"number","minimum":0,"maximum":1}},"required":["label","fraction"]}},"age":{"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","additionalProperties":false,"properties":{"label":{"type":"string","pattern":"^(?:[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\\+)$"},"fraction":{"type":"number","minimum":0,"maximum":1}},"required":["label","fraction"]}},"geography":{"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","additionalProperties":false,"properties":{"label":{"type":"string","pattern":"^(?:[A-Z]{2}|OTHER)$"},"fraction":{"type":"number","minimum":0,"maximum":1}},"required":["label","fraction"]}}},"required":["population","captured_at","source_timezone"]},"history":{"type":"object","additionalProperties":false,"properties":{"followers":{"type":"array","maxItems":1500,"items":{"type":"object","additionalProperties":false,"properties":{"date":{"type":"string","format":"date"},"value":{"type":"integer","minimum":0}},"required":["date","value"]}},"period_snapshots":{"type":"array","maxItems":1500,"items":{"type":"object","additionalProperties":false,"properties":{"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"calendar_days":{"type":"integer","minimum":1},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"captured_at":{"type":"string","format":"date-time"},"metrics":{"type":"object","additionalProperties":false,"properties":{"views":{"type":"integer","minimum":0},"likes":{"type":"integer","minimum":0},"comments":{"type":"integer","minimum":0},"shares":{"type":"integer","minimum":0},"profile_views":{"type":"integer","minimum":0}},"required":[]}},"required":["period_start","period_end","calendar_days","source_timezone","captured_at","metrics"]}},"daily_series":{"type":"array","maxItems":365,"items":{"type":"object","additionalProperties":false,"properties":{"date":{"type":"string","format":"date"},"source_timezone":{"enum":["SOURCE_TIMEZONE_UNKNOWN","UTC","Europe/Minsk"]},"metrics":{"type":"object","additionalProperties":false,"properties":{"views":{"type":"integer","minimum":0},"likes":{"type":"integer","minimum":0},"comments":{"type":"integer","minimum":0},"shares":{"type":"integer","minimum":0},"profile_views":{"type":"integer","minimum":0}},"required":[]}},"required":["date","source_timezone","metrics"]}}},"required":["followers","period_snapshots","daily_series"]}},"required":["schema_version","account_key","username","media_kit_slug","generated_at","freshness","current","period","audience","history"]};
// Scoped Tilda-compatible prototype. All output uses textContent / SVG DOM APIs.
const MAX_BYTES = 2_000_000;
const labels = {
  ru: {followers:"Подписчики",views:"Просмотры",likes:"Лайки",comments:"Комментарии",shares:"Shares",profile_views:"Просмотры профиля",
    accumulated:"История накапливается",fallback:"Показаны последние сохранённые данные",stale:"Данные давно не обновлялись",
    period:"Статистика за",asof:"Данные на",captured:"Импортировано",unknown:"Часовой пояс отчёта не указан",history:"История подписчиков"},
  en: {followers:"Followers",views:"Views",likes:"Likes",comments:"Comments",shares:"Shares",profile_views:"Profile views",
    accumulated:"History is accumulating",fallback:"Showing last known good data",stale:"Data is out of date",
    period:"Statistics for",asof:"Data as of",captured:"Imported",unknown:"Report timezone unavailable",history:"Follower history"}
};

export function validateSchema(value, schema, path="$") {
  if ("const" in schema && value !== schema.const) throw Error(path+": const");
  if (schema.enum && !schema.enum.includes(value)) throw Error(path+": enum");
  if (schema.type) {
    const allowed=Array.isArray(schema.type)?schema.type:[schema.type];
    const actual=value===null?"null":Array.isArray(value)?"array":typeof value;
    if (!allowed.some(type=>type==="integer"?Number.isInteger(value):type==="object"?
        actual==="object" && value!==null:actual===type)) throw Error(path+": type");
  }
  if (typeof value==="number") {
    if (!Number.isFinite(value) || ("minimum" in schema && value<schema.minimum) ||
        ("maximum" in schema && value>schema.maximum)) throw Error(path+": number");
  }
  if (typeof value==="string") {
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) throw Error(path+": pattern");
    if (schema.format==="date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        new Date(value+"T00:00:00Z").toISOString().slice(0,10)!==value)) throw Error(path+": date");
    if (schema.format==="date-time" && (!/(?:Z|\+00:00)$/.test(value) ||
        !Number.isFinite(Date.parse(value)))) throw Error(path+": timestamp");
  }
  if (Array.isArray(value)) {
    if (("minItems" in schema && value.length<schema.minItems) ||
        ("maxItems" in schema && value.length>schema.maxItems)) throw Error(path+": items");
    value.forEach((item,index)=>validateSchema(item,schema.items,path+"["+index+"]"));
  } else if (value && typeof value==="object") {
    for (const key of schema.required||[]) if (!(key in value)) throw Error(path+": missing "+key);
    for (const key of Object.keys(value)) {
      if (!(key in (schema.properties||{}))) {
        if (schema.additionalProperties===false) throw Error(path+": extra "+key);
      } else validateSchema(value[key],schema.properties[key],path+"."+key);
    }
  }
}

export function validatePayload(payload,schema,expected) {
  validateSchema(payload,schema);
  if (payload.account_key!==expected.key || payload.username!==expected.username ||
      payload.media_kit_slug!==expected.slug) throw Error("Account mismatch");
  const p=payload.period;
  if ((Date.parse(p.period_end)-Date.parse(p.period_start))/86400000+1!==p.calendar_days)
    throw Error("Calendar period mismatch");
  if (p.source_timezone==="SOURCE_TIMEZONE_UNKNOWN" && p.normalized_timezone!==null)
    throw Error("Unknown timezone normalized");
  if(p.source_timezone!=="SOURCE_TIMEZONE_UNKNOWN" && p.normalized_timezone!==p.source_timezone)
    throw Error("Timezone mismatch");
  const generated=Date.parse(payload.generated_at),generatedDate=payload.generated_at.slice(0,10);
  for(const reading of [payload.current.followers,p,payload.audience,...Object.values(p.metrics)])
    if(Date.parse(reading.captured_at)>generated)throw Error("Future capture");
  if(p.period_end>generatedDate || payload.current.followers.as_of_date>generatedDate)
    throw Error("Future observation");
  for(const metric of Object.values(p.metrics))
    if(metric.period_start>metric.period_end)throw Error("Metric period mismatch");
  if (payload.current.followers.value<=0) throw Error("Followers sanity failure");
  for (const group of ["gender","age","geography"]) {
    const rows=payload.audience[group]||[];
    if(new Set(rows.map(r=>r.label)).size!==rows.length) throw Error("Duplicate buckets");
    const sum=rows.reduce((s,r)=>s+r.fraction,0);
    if(rows.length && (sum>1.015 || (group!=="geography" && sum<0.985))) throw Error("Distribution mismatch");
  }
  for(const group of ["followers","daily_series"]){
    const days=payload.history[group].map(r=>r.date);
    if(days.some((day,i)=>i>0 && day<=days[i-1]))throw Error("Unordered history");
  }
  return payload;
}

async function textFetch(url, timeoutMs) {
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetch(url,{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const reader=response.body.getReader(), chunks=[];
    let size=0;
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>MAX_BYTES){await reader.cancel();throw Error("Payload exceeds limit");}
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);
    let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return {bytes,text:new TextDecoder("utf-8",{fatal:true}).decode(bytes)};
  } finally {clearTimeout(timer);}
}

export async function loadManifest(url,schema,expected,timeoutMs=10000) {
  const manifest=JSON.parse((await textFetch(url,timeoutMs)).text);
  if(manifest.schema_version===3){
    validateSchema(manifest,activeManifestSchema);
    if(manifest.account_key!==expected.key||manifest.username!==expected.username||manifest.media_kit_slug!==expected.slug)
      throw Error('Manifest account mismatch');
    const canonicalBase='https://rytni.github.io/rytni-assets/data/media-kits/'+expected.key+'/releases/';
    if(manifest.release_id!==manifest.release_sha256||manifest.release_url!==canonicalBase+manifest.release_id+'.json')
      throw Error('Manifest target mismatch');
    const period=manifest.period;
    if((Date.parse(period.end)-Date.parse(period.start))/86400000+1!==period.days ||
       period.normalized_timezone!==(period.source_timezone==='SOURCE_TIMEZONE_UNKNOWN'?null:period.source_timezone))
      throw Error('Manifest period mismatch');
    let failure;
    for(const digest of [manifest.release_id,manifest.previous_release_id].filter(Boolean)){
      try{
        const result=await loadSnapshot(canonicalBase+digest+'.json',schema,expected,timeoutMs);
        if(digest===manifest.release_id){
          const p=result.payload.period;
          if(manifest.data_updated_at!==result.payload.freshness.data_as_of_date||period.start!==p.period_start||
             period.end!==p.period_end||period.days!==p.calendar_days||period.source_timezone!==p.source_timezone)
            throw Error('Manifest metadata differs from target');
        }
        return {...result,previous:digest!==manifest.release_id};
      }catch(error){failure=error;}
    }
    throw failure;
  }
  const allowed=["schema_version","account_key","username","media_kit_slug","current","previous"];
  if(Object.keys(manifest).sort().join()!==allowed.sort().join() || manifest.schema_version!==2 ||
     manifest.account_key!==expected.key || manifest.username!==expected.username ||
     manifest.media_kit_slug!==expected.slug || !/^[a-f0-9]{64}$/.test(manifest.current) ||
     (manifest.previous!==null && !/^[a-f0-9]{64}$/.test(manifest.previous)))throw Error("Manifest mismatch");
  const base=new URL(".",new URL(url,location.href));
  let failure;
  for(const digest of [manifest.current,manifest.previous].filter(Boolean)){
    try{
      const result=await textFetch(new URL("releases/"+digest+".json",base),timeoutMs);
      const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",result.bytes))]
        .map(v=>v.toString(16).padStart(2,"0")).join("");
      if(hash!==digest)throw Error("Checksum mismatch");
      return {payload:validatePayload(JSON.parse(result.text),schema,expected),previous:digest!==manifest.current};
    }catch(error){failure=error;}
  }
  throw failure;
}

export async function loadSnapshot(url,schema,expected,timeoutMs=10000) {
  const digest=new URL(url,location.href).pathname.match(/\/([a-f0-9]{64})\.json$/)?.[1];
  if(!digest)throw Error("Immutable snapshot URL requires SHA256 filename");
  const result=await textFetch(url,timeoutMs);
  const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",result.bytes))]
    .map(v=>v.toString(16).padStart(2,"0")).join("");
  if(hash!==digest)throw Error("Checksum mismatch");
  return {payload:validatePayload(JSON.parse(result.text),schema,expected),previous:false};
}

export function followerChart(container,rows,language="ru",seriesTitle=null) {
  container.replaceChildren();
  const text=labels[language]||labels.ru;
  const message=document.createElement("p");
  if(rows.length<2){message.textContent=text.accumulated;container.append(message);return;}
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
  const chartLabel=seriesTitle||text.history;
  svg.setAttribute("viewBox","0 0 600 190");svg.setAttribute("role","img");svg.setAttribute("aria-label",chartLabel);
  const min=Math.min(...rows.map(r=>r.value)),max=Math.max(...rows.map(r=>r.value)),range=max-min||1;
  const firstDay=Date.parse(rows[0].date),span=Date.parse(rows.at(-1).date)-firstDay||1;
  const positions=rows.map(r=>[20+(Date.parse(r.date)-firstDay)*560/span,160-(r.value-min)*125/range]);
  const path=document.createElementNS(ns,"path");
  path.setAttribute("d",positions.map((p,i)=>(i?"L":"M")+p.join(",")).join(" "));
  path.setAttribute("fill","none");path.setAttribute("stroke","currentColor");path.setAttribute("stroke-width","2");
  svg.append(path);
  rows.forEach((row,i)=>{
    const point=document.createElementNS(ns,"circle");
    point.setAttribute("cx",positions[i][0]);point.setAttribute("cy",positions[i][1]);point.setAttribute("r","4");
    point.setAttribute("tabindex","0");point.setAttribute("fill","currentColor");
    const title=document.createElementNS(ns,"title");
    title.textContent=row.date+": "+row.value.toLocaleString();point.append(title);
    point.addEventListener("focus",()=>{message.textContent=title.textContent;});
    point.addEventListener("pointerdown",()=>{message.textContent=title.textContent;});
    svg.append(point);
  });
  message.setAttribute("aria-live","polite");container.append(svg,message);
  const table=document.createElement("table");
  for(const row of rows){
    const tr=document.createElement("tr");
    for(const value of [row.date,row.value.toLocaleString()]){const td=document.createElement("td");td.textContent=value;tr.append(td);}
    table.append(tr);
  }
  const details=document.createElement("details"),summary=document.createElement("summary");
  summary.textContent=chartLabel;details.append(summary,table);container.append(details);
}

export function mountMediaKit({root,schema,expected,manifestUrl,snapshotUrl,bootstrap,language="ru",timeoutMs=10000,renderData}) {
  let lang=language,lkg=null,lastFailed=false;
  const cacheKey="rytni-media-kit-v2:"+expected.key+":"+expected.username+":"+expected.slug;
  const dateText=value=>new Intl.DateTimeFormat(lang==="en"?"en-GB":"ru-RU",
    {dateStyle:"long",timeZone:"UTC"}).format(new Date(value+"T00:00:00Z"));
  const status=root.querySelector("[data-mk-status]");
  function render(payload,failed=false){
    lastFailed=failed;
    if(renderData){renderData(payload,{language:lang,failed});return;}
    const words=labels[lang]||labels.ru;
    const readings={followers:payload.current.followers,...payload.period.metrics};
    for(const key of ["followers","views","likes","comments","shares","profile_views"]){
      const node=root.querySelector('[data-mk="'+key+'"]'),reading=readings[key];
      if(!node||!reading)continue; // Preserve existing HTML/LKG instead of zeroing.
      node.textContent=new Intl.NumberFormat(lang==="en"?"en-GB":"ru-RU",
        {notation:"compact",maximumFractionDigits:1}).format(reading.value);
      node.title=new Intl.NumberFormat(lang==="en"?"en-GB":"ru-RU").format(reading.value);
      root.querySelector('[data-mk-label="'+key+'"]').textContent=words[key];
      const metadata=root.querySelector('[data-mk-date="'+key+'"]');
      metadata.textContent=key==="followers"?words.asof+" "+dateText(reading.as_of_date):
        dateText(reading.period_start)+" — "+dateText(reading.period_end);
    }
    root.querySelector("[data-mk-period]").textContent=words.period+" "+
      dateText(payload.period.period_start)+" — "+dateText(payload.period.period_end);
    root.querySelector("[data-mk-updated]").textContent=words.asof+" "+dateText(payload.freshness.data_as_of_date);
    const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Minsk"}).format(new Date());
    const stale=(Date.parse(today)-Date.parse(payload.freshness.data_as_of_date))/86400000>payload.freshness.stale_after_days;
    status.textContent=[failed?words.fallback:"",stale?words.stale:"",
      payload.period.source_timezone==="SOURCE_TIMEZONE_UNKNOWN"?words.unknown:""].filter(Boolean).join(" · ");
    status.dataset.state=failed?"FALLBACK":stale?"STALE":"READY";
    followerChart(root.querySelector("[data-mk-chart]"),payload.history.followers,lang);
  }
  function accept(payload,failed=false){
    validatePayload(payload,schema,expected);lkg=payload;render(payload,failed);
    try{localStorage.setItem(cacheKey,JSON.stringify(payload));}catch{}
  }
  if(bootstrap)accept(bootstrap);
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey)||"null");
    if(cached){validatePayload(cached,schema,expected);if(!lkg||cached.generated_at>lkg.generated_at)accept(cached);}
  }catch{}
  async function refresh(){
    try{
      const {payload,previous}=await (snapshotUrl?loadSnapshot(snapshotUrl,schema,expected,timeoutMs):
        loadManifest(manifestUrl,schema,expected,timeoutMs));
      accept(payload,previous);return {status:previous?"PREVIOUS_RELEASE":"READY"};
    }catch{
      if(lkg)render(lkg,true);else{status.textContent=(labels[lang]||labels.ru).fallback;status.dataset.state="FALLBACK";}
      return {status:"FALLBACK"};
    }
  }
  return {refresh,setLanguage(value){lang=value==="en"?"en":"ru";if(lkg)render(lkg,lastFailed);}};
}


const countryNames={ru:{RU:'Россия',UA:'Украина',BY:'Беларусь',KZ:'Казахстан',MD:'Молдова',DE:'Германия',PL:'Польша',KG:'Кыргызстан',LV:'Латвия',US:'США',OTHER:'Другие страны'},
  en:{RU:'Russia',UA:'Ukraine',BY:'Belarus',KZ:'Kazakhstan',MD:'Moldova',DE:'Germany',PL:'Poland',KG:'Kyrgyzstan',LV:'Latvia',US:'United States',OTHER:'Other countries'}};
const genderNames={ru:{male:'Мужчины',female:'Женщины',other:'Другое'},en:{male:'Male',female:'Female',other:'Other'}};

export function mountTildaMediaKit({root,expected,manifestUrl,bootstrap,schema,timeoutMs=12000}){
  function renderData(payload,{language,failed}){
    const lang=language==='en'?'en':'ru',locale=lang==='en'?'en-GB':'ru-RU';
    const date=value=>new Intl.DateTimeFormat(locale,{dateStyle:'long',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
    const precise=value=>new Intl.NumberFormat(locale).format(value);
    const compact=value=>new Intl.NumberFormat('en-GB',{notation:'compact',maximumFractionDigits:value>=1000000?1:0}).format(value);
    const readings={followers:payload.current.followers,...payload.period.metrics};
    for(const key of ['followers','views','likes','comments','shares','profile_views']){
      const reading=readings[key];if(!reading)continue;
      root.querySelectorAll('[data-mk="'+key+'"]').forEach(node=>{
        node.textContent=compact(reading.value);node.title=precise(reading.value);
        node.setAttribute('aria-label',precise(reading.value));node.dataset.value=String(reading.value);
      });
      root.querySelectorAll('[data-mk-date="'+key+'"]').forEach(node=>{
        node.textContent=key==='followers'?(lang==='en'?'As of ':'На ')+date(reading.as_of_date):
          reading.period_start+' — '+reading.period_end;
      });
    }
    const p=payload.period;
    root.querySelector('[data-mk-period]').textContent=(lang==='en'?'Statistics for ':'Статистика за ')+date(p.period_start)+' — '+date(p.period_end);
    root.querySelector('[data-mk-updated]').textContent=(lang==='en'?'Data updated: ':'Данные обновлены: ')+date(payload.freshness.data_as_of_date);
    for(const [key,ru,en] of [['followers','подписчиков TikTok','TikTok followers'],['views','просмотров за указанный период','views in the stated period'],['likes','лайков за указанный период','likes in the stated period']])
      root.querySelector('[data-mk-hero-label="'+key+'"]').textContent=lang==='en'?en:ru;
    for(const group of ['gender','age','geography']){
      const container=root.querySelector('[data-mk-audience="'+group+'"]'),buckets=payload.audience[group];
      if(!container||!buckets)continue;
      container.replaceChildren();
      for(const bucket of buckets){
        const row=document.createElement('div');row.className='row';row.dataset.label=bucket.label;
        const label=document.createElement('span');
        label.textContent=group==='gender'?genderNames[lang][bucket.label]:group==='geography'?(countryNames[lang][bucket.label]||bucket.label):bucket.label;
        const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('i');
        fill.style.width=(bucket.fraction*100)+'%';bar.append(fill);
        const value=document.createElement('b');value.textContent=new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1}).format(bucket.fraction);
        row.append(label,bar,value);container.append(row);
      }
    }
    const status=root.querySelector('[data-mk-status]');
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Minsk'}).format(new Date());
    const stale=(Date.parse(today)-Date.parse(payload.freshness.data_as_of_date))/86400000>payload.freshness.stale_after_days;
    status.dataset.state=failed?'FALLBACK':stale?'STALE':'LIVE';
    status.textContent=[failed?(lang==='en'?'Showing last verified values':'Показаны последние проверенные данные'):'',
      stale?(lang==='en'?'Data is out of date':'Данные давно не обновлялись'):''].filter(Boolean).join(' · ');
    root.dataset.mkAccount=expected.key;root.dataset.mkDataAsOf=payload.freshness.data_as_of_date;
    const titles=lang==='en'?['Follower history','Daily video views']:['История подписчиков','Просмотры по дням'];
    root.querySelectorAll('[data-mk-chart-title]').forEach((node,i)=>node.textContent=titles[i]);
    followerChart(root.querySelector('[data-mk-chart="followers"]'),payload.history.followers,lang,titles[0]);
    followerChart(root.querySelector('[data-mk-chart="views"]'),payload.history.daily_series.filter(row=>row.metrics.views!==undefined).map(row=>({date:row.date,value:row.metrics.views})),lang,titles[1]);
    root.querySelector('[data-mk-chart-note]').textContent=lang==='en'?'Actual daily observations for the stated dates.':'Фактические значения по дням за указанные даты.';
  }
  const adapter=mountMediaKit({root,schema,expected,manifestUrl,bootstrap,timeoutMs,renderData,
    language:document.documentElement.lang==='en'?'en':'ru'});
  document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>adapter.setLanguage(button.dataset.lang)));
  adapter.refresh();
  return adapter;
}
