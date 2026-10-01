import {benchmark} from './benchmark.js';
console.log(JSON.stringify({runtime:process.version,metric:'simulation only, every tick moves; no renderer',rows:benchmark()},null,2));
