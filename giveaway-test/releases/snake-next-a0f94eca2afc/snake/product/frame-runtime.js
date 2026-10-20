import {trainingGame} from '../forest-training/runtime.js';
// Module evaluation waits for the existing art/audio bootstrap. No QA query
// or alternate simulation is needed for the product lifecycle adapter.
if(trainingGame?.mode!=='product')throw Error('Product frame requires explicit embedded mode');
window.snakeProductGame=trainingGame;
