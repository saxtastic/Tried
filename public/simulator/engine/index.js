// Public surface. `REGIMES` is deliberately not re-exported bare: the lexicon
// and the institution module each define one, and they mean different things.

export { PRINCIPLES, weightOf, glossOf, tally } from './principles.js';
export {
  REGIMES as INTERPRETIVE_REGIMES,
  REGIME_GLOSS,
  indexLexicon,
  resolveSense,
  reaches,
  driftReport,
} from './lexicon.js';
export { LAYERS, selfDefeatRisk, reframe, remedialFrame } from './paradox.js';
export {
  REGIMES as POLICY_REGIMES,
  THEORIES,
  profile,
  necessitySilence,
  translate,
} from './institution.js';
export { TREATMENTS, onPoint, entrenchment, movesAgainst, findGaps } from './stare.js';
export { evaluate } from './predicates.js';
export { DEFEATERS, proponent, opponent } from './agents.js';
export { STANDARDS, adjudicate, disposition } from './judge.js';
export {
  PASSAGE_KINDS,
  GLITCHES,
  DECAYS,
  SUSTAINS,
  passage,
  itinerary,
  sensitivity,
} from './transitions.js';
export { buildContext, run, sweepInterpretations, sweepInstitutions, fullReport } from './simulate.js';
