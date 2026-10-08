// Keep every distinct rendered measurement, drop duplicated text rows from
// numeric combinations. Check names/counts/failures remain complete.
const fs=require('node:fs');
module.exports=function compact(data){if(!data.inventory?.[0]?.rows)return data;const unique=new Map();for(const sample of data.inventory)for(const row of sample.rows){const key=JSON.stringify(row);if(!unique.has(key))unique.set(key,{state:sample.name,...row});}data.inventory=[...unique.values()];data.inventoryDescription='Distinct actual rendered text measurements; repeated identical rows deduplicated. All scenario gate outcomes retained.';return data;};
if(require.main===module)for(const phase of ['before','after']){const file=__dirname+'/'+phase+'.json',data=module.exports(JSON.parse(fs.readFileSync(file)));fs.writeFileSync(file,JSON.stringify(data)+'\n');}
