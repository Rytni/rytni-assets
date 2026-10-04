// Reuse the exact archived witness planner, not a new gameplay controller.
import {readFileSync} from 'node:fs';
import {distances} from '../tuning-lab/measure.js';
import {bodyCells} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';
const source=readFileSync(new URL('./long-run.mjs',import.meta.url),'utf8');
export const choose=new Function('distances','bodyCells','neighbour',source.slice(source.indexOf('function choose'),source.indexOf('const runs=[];'))+';return choose;')(distances,bodyCells,neighbour);
