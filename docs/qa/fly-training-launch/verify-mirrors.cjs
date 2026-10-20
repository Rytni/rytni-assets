const fs = require('node:fs');
const crypto = require('node:crypto');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const expected = JSON.parse(fs.readFileSync('giveaway-test/manifest.json', 'utf8'));
  const rows = [];
  for (const base of ['https://rytni.github.io/rytni-assets/giveaway-test/',
    'https://storage-1090.s3hoster.by/rytnistatictest/giveaway-test/']) {
    const response = await fetch(base + 'manifest.json?launch-check=' + Date.now(), {cache:'no-store'});
    if (!response.ok) throw Error('Manifest HTTP ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer()), manifest = JSON.parse(bytes);
    if (manifest.current.id !== expected.current.id) throw Error(base + ' still on ' + manifest.current.id);
    if (manifest.current.snake_runtime.id !== 'snake-next-78436309631c') throw Error('Snake changed');
    const bundleResponse = await fetch(base + manifest.current.file, {cache:'no-store'});
    if (!bundleResponse.ok) throw Error('Bundle HTTP ' + bundleResponse.status);
    const bundle = Buffer.from(await bundleResponse.arrayBuffer());
    if (hash(bundle) !== expected.current.sha256 || bundle.length !== expected.current.size)
      throw Error('Bundle integrity mismatch');
    if (!bundle.includes(Buffer.from('if(!forceTraining&&(!model.hub?.success')))
      throw Error('Training fix absent');
    rows.push({base, release:manifest.current.id, manifestSha256:hash(bytes),
      bundleSha256:hash(bundle), size:bundle.length, snake:manifest.current.snake_runtime.id});
  }
  if (rows[0].manifestSha256 !== rows[1].manifestSha256) throw Error('Manifest bytes differ');
  const productionSha256 = hash(fs.readFileSync('giveaway/manifest.json'));
  if (productionSha256 !== '0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591')
    throw Error('Production changed');
  const result = {rows, productionSha256, failures:[]};
  fs.writeFileSync(__dirname + '/mirrors.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
