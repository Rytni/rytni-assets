import {createRules} from './rules.js';

/** Provisional Training candidates, all time is active simulation ticks. */
export function createTrainingRules(options={}) {
  return createRules({version:'snake-next-training-2',ticksPerCell:15,firstFoodAhead:5,
    calmTicks:600,mediumTicks:2700,fastTicks:7200,capTicks:14400,
    mediumFoods:10,fastFoods:20,capFoods:35,
    mediumCadence:10,fastCadence:8,capCadence:6,...options});
}
export function movementCadence(state,rules) {
  if(!rules.calmTicks||state.tick<rules.calmTicks)return rules.ticksPerCell;
  const foods=state.score/rules.foodScore;
  if(state.tick>=rules.capTicks||foods>=rules.capFoods)return rules.capCadence;
  if(state.tick>=rules.fastTicks||foods>=rules.fastFoods)return rules.fastCadence;
  if(state.tick>=rules.mediumTicks||foods>=rules.mediumFoods)return rules.mediumCadence;
  return rules.ticksPerCell;
}
