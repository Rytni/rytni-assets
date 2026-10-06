const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assemblerPath = path.join(__dirname, 'assemble-snake-next.cjs');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'snake-package-'));
  t.after(() => {const target=fs.realpathSync(root);assert.equal(path.dirname(target),fs.realpathSync(os.tmpdir()));assert.ok(path.basename(target).startsWith('snake-package-'));fs.rmSync(target, { recursive: true, force: true });});
  const put = (file, data) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data); };
  put('arcade/snake-next/product/index.html', '<link rel="stylesheet" href="./product.css"><iframe src="./frame.html?qa=1"></iframe><script type="module" src="./app.js"></script>');
  put('arcade/snake-next/product/frame.html', '<script type="module" src="../runtime/run.js"></script>');
  put('arcade/snake-next/product/product.css', 'body{background:url(/grib/mushroom-snake-menu-v1/a.png)}');
  put('arcade/snake-next/product/app.js', "import {value} from '../simulation/core.js';export const asset='/grib/mushroom-snake-menu-v1/a.png';");
  put('arcade/snake-next/simulation/core.js', 'export const value=1;');
  put('arcade/snake-next/runtime/run.js', 'export const playing=false;');
  put('grib/mushroom-snake-menu-v1/a.png', Buffer.from([1, 2, 3]));
  return { root, put };
}
function api() { assert.ok(fs.existsSync(assemblerPath), 'Snake Next packaging assembler exists'); return require(assemblerPath); }
test('immutable package closes imports, preserves assets, and changes identity with source bytes', t => {
  const {root,put}=fixture(t), {prepareRuntime,publishRuntime}=api();
  const first=prepareRuntime({root});
  assert.deepEqual(first.manifest.files.map(f=>f.file), ['grib/mushroom-snake-menu-v1/a.png','snake/product/app.js','snake/product/frame.html','snake/product/index.html','snake/product/product.css','snake/runtime/run.js','snake/simulation/core.js']);
  const descriptor=publishRuntime(first,{root});
  const runtimeDir=path.join(root,'giveaway-test',path.dirname(descriptor.file));
  assert.equal(fs.readFileSync(path.join(runtimeDir,'snake/product/product.css'),'utf8'),'body{background:url(../../grib/mushroom-snake-menu-v1/a.png)}');
  assert.ok(!fs.readFileSync(path.join(runtimeDir,'snake/product/index.html'),'utf8').includes('qa=1'));
  for(const f of first.manifest.files) { const bytes=fs.readFileSync(path.join(runtimeDir,f.file)); assert.equal(digest(bytes),f.sha256); assert.equal(bytes.length,f.size); }
  assert.equal(prepareRuntime({root}).manifest.id,first.manifest.id);
  put('arcade/snake-next/simulation/core.js','export const value=2;');
  assert.notEqual(prepareRuntime({root}).manifest.id,first.manifest.id);
});
test('missing imports and unapproved outside references fail closed', t => {
  const {root,put}=fixture(t), {prepareRuntime}=api();
  put('arcade/snake-next/product/app.js',"import './missing.js';");
  assert.throws(()=>prepareRuntime({root}),/Missing runtime dependency/);
  put('arcade/snake-next/product/app.js',"import '../../../outside.js';");
  assert.throws(()=>prepareRuntime({root}),/outside Snake Next/);
  put('arcade/snake-next/product/app.js',"fetch('http://localhost:8773/a.png');");
  assert.throws(()=>prepareRuntime({root}),/development URL/);
});
test('existing immutable bytes cannot be overwritten', t => {
  const {root}=fixture(t), {prepareRuntime,publishRuntime}=api(), runtime=prepareRuntime({root});
  const descriptor=publishRuntime(runtime,{root}), file=path.join(root,'giveaway-test',path.dirname(descriptor.file),'snake/product/app.js');
  fs.writeFileSync(file,'tampered');
  assert.throws(()=>publishRuntime(runtime,{root}),/Immutable runtime collision/);
  assert.equal(fs.readFileSync(file,'utf8'),'tampered');
});
test('runtime validation rejects changed bytes and forged identity before returning staging paths', t => {
  const {root}=fixture(t), assembler=api();
  assert.equal(typeof assembler.validateRuntime,'function','immutable runtime validator exists');
  const descriptor=assembler.publishRuntime(assembler.prepareRuntime({root}),{root});
  const paths=assembler.validateRuntime({root,descriptor});
  assert.equal(paths.length,8);
  assert.ok(paths.every(p=>p.startsWith('giveaway-test/releases/'+descriptor.id+'/')));
  assert.throws(()=>assembler.validateRuntime({root,descriptor:{...descriptor,id:'snake-next-000000000000'}}),/descriptor/);
  const file=path.join(root,'giveaway-test',path.dirname(descriptor.file),'snake/simulation/core.js');
  fs.writeFileSync(file,'forged');
  assert.throws(()=>assembler.validateRuntime({root,descriptor}),/hash\/size mismatch/);
});
test('asset inventories cannot select missing files or escape their frozen family', t => {
  const {root,put}=fixture(t),{prepareRuntime}=api();
  put('arcade/snake-next/product/app.js',"export const art='/grib/mushroom-snake-retro-v5/';");
  put('grib/mushroom-snake-retro-v5/inventory.json',JSON.stringify({assets:[{file:'missing.png'}]}));
  assert.throws(()=>prepareRuntime({root}),/inventory dependency/);
  put('grib/mushroom-snake-retro-v5/inventory.json',JSON.stringify({assets:[{file:'../mushroom-snake-menu-v1/a.png'}]}));
  assert.throws(()=>prepareRuntime({root}),/inventory dependency/);
});
test('one candidate operation binds the host URL to its exact runtime descriptor', t => {
  const {root,put}=fixture(t),assembler=api();
  put('arcade/snake-next/test-host.html','<script>window.runtime="__SNAKE_NEXT_RUNTIME_URL__";</script>');
  assert.equal(typeof assembler.assembleCandidate,'function','single-snapshot candidate assembler exists');
  const candidate=assembler.assembleCandidate({root});
  assert.equal(candidate.bundle,'<script>window.runtime="https://rytni.github.io/rytni-assets/giveaway-test/'+candidate.runtime.entry+'";</script>');
  assert.equal(assembler.validateRuntime({root,descriptor:candidate.runtime}).length,8);
});
test('Snake Hub artwork selects the same immutable artwork snapshot as the game', t => {
  const {root,put}=fixture(t),assembler=api();
  put('arcade/snake-next/test-host.html','<img src="https://rytni.github.io/rytni-assets/grib/mushroom-snake-menu-v1/a.png"><script>window.runtime="__SNAKE_NEXT_RUNTIME_URL__";</script>');
  const candidate=assembler.assembleCandidate({root});
  assert.ok(candidate.bundle.includes('https://rytni.github.io/rytni-assets/giveaway-test/releases/'+candidate.runtime.id+'/grib/mushroom-snake-menu-v1/a.png'));
});
test('module-relative dynamic stylesheets are included in immutable source closure', t => {
 const {root,put}=fixture(t),assembler=api();
 put('arcade/snake-next/product/app.js',"export const stylesheet=new URL('../runtime/theme.css',import.meta.url).href;");
 put('arcade/snake-next/runtime/theme.css','body{color:ivory}');
 assert.ok(assembler.prepareRuntime({root}).manifest.files.some(f=>f.file==='snake/runtime/theme.css'));
});
test('native UI nested inventories remain bounded and reject traversal or missing assets', t => {
 const {root,put}=fixture(t),{prepareRuntime}=api();
 put('arcade/snake-next/product/app.js',"export const art='/grib/mushroom-snake-ui-v3/';");
 put('grib/mushroom-snake-ui-v3/icons/close-48.png',Buffer.from([1,2]));
 put('grib/mushroom-snake-ui-v3/inventory.json',JSON.stringify({assets:[{file:'icons/close-48.png'}]}));
 assert.ok(prepareRuntime({root}).files.has('grib/mushroom-snake-ui-v3/icons/close-48.png'));
 for(const file of ['icons/../icons/close-48.png','/icons/close-48.png','icons/missing.png','../mushroom-snake-menu-v1/a.png']){
  put('grib/mushroom-snake-ui-v3/inventory.json',JSON.stringify({assets:[{file}]}));
  assert.throws(()=>prepareRuntime({root}),/inventory dependency/);
 }
});
test('premium Snake selector cover is frozen in the same runtime; Fly cover stays unchanged', t => {
 const {root,put}=fixture(t),assembler=api();
 put('arcade/snake-next/product/app.js',"export const art='/grib/mushroom-snake-ui-v3/';");
 put('grib/mushroom-snake-ui-v3/snake-cover.png',Buffer.from([4,5,6]));
 const fly='https://rytni.github.io/rytni-assets/grib/mushroom-snake-v1/fly-card.png';
 put('arcade/snake-next/test-host.html',`<img src="${fly}"><img src="https://rytni.github.io/rytni-assets/grib/mushroom-snake-ui-v3/snake-cover.png"><script>window.runtime="__SNAKE_NEXT_RUNTIME_URL__";</script>`);
 const candidate=assembler.assembleCandidate({root});
 assert.ok(candidate.bundle.includes(fly));
 assert.ok(candidate.bundle.includes('giveaway-test/releases/'+candidate.runtime.id+'/grib/mushroom-snake-ui-v3/snake-cover.png'));
});
