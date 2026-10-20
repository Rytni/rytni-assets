const fs = require('node:fs');
const cp = require('node:child_process');
const phase = process.argv[2] || 'check';
if (!['check', 'live'].includes(phase)) throw Error('Expected check or live');
const result = cp.spawnSync('cmd.exe', ['/d', '/s', '/c',
  `playwright-cli -s=flylaunch run-code --filename=docs/qa/fly-training-launch/${phase}.js`],
  {encoding:'utf8', maxBuffer:8e6, timeout:180000});
const match = /### Result\r?\n([\s\S]*?)\r?\n###/.exec(result.stdout || '');
if (!match) throw Error(result.stdout + result.stderr);
const data = JSON.parse(match[1]);
fs.writeFileSync(__dirname + '/' + (phase === 'live' ? 'live-results' : 'results') + '.json', JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data, null, 2));
if (result.status || data.failures.length || data.errors.length) process.exitCode = 1;
