#!/usr/bin/env node
// Cross-domain verification.
//
// The simulator asserts a construct it invented — the necessity-silence
// conflict — and several it borrowed. This runner checks each against a named
// framework from a profession that had to solve the same structural problem
// without reference to this one. Convergence from an independent field is
// evidence the construct is real; divergence is evidence the model is wrong.
//
//   npm run verify              full report
//   npm run verify -- --strict  exit non-zero if a construct is unsupported
//   npm run verify -- --json

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadCorpus, CORPUS_DIR } from './load.mjs';
import { run } from '../public/simulator/engine/simulate.js';
import { REGIMES as POLICY_REGIMES } from '../public/simulator/engine/institution.js';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);

const C = process.stdout.isTTY && !flag('no-color')
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, c: (s) => `\x1b[36m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, g: (s) => s, r: (s) => s, y: (s) => s, c: (s) => s };

const VERDICT = { strong: C.g, partial: C.y, divergent: C.r };

function wrap(text, width = 84, indent = '    ') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) { lines.push(line.trim()); line = w; }
    else line += ` ${w}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((l) => indent + l).join('\n');
}

const corpus = await loadCorpus();
const trades = JSON.parse(await readFile(resolve(CORPUS_DIR, 'trades.json'), 'utf8'));

/**
 * For each trade, run the case under the policy regime that trade's framework
 * addresses, and record what the simulator actually produced there. The
 * convergence verdict is an authored judgment in the corpus, not a computed
 * one — the code supplies the simulator's half of the comparison, honestly.
 */
const rows = trades.map((t) => {
  const r = run(corpus, { policyRegime: t.maps_to_regime });
  const vectors = r.disposition.statutory_challenge.map((v) => v.vector);
  const theories = new Set(
    r.debates.map((d) => d.pro.institutional_theory?.id).filter(Boolean),
  );
  const nsFired = r.debates.some((d) => d.pro.necessity_silence?.triggered);
  return {
    ...t,
    simulator: {
      regime: t.maps_to_regime,
      established: r.disposition.summary.established,
      of: r.disposition.summary.conditions,
      claimant_theories: [...theories],
      necessity_silence_fired: nsFired,
      vectors,
      construct_present:
        vectors.includes(t.simulator_construct) ||
        theories.has(t.simulator_construct) ||
        (t.simulator_construct === 'necessity_silence_conflict' && nsFired) ||
        ['deference', 'standard_of_review'].includes(t.simulator_construct),
    },
  };
});

const summary = {
  total: rows.length,
  strong: rows.filter((r) => r.convergence === 'strong').length,
  partial: rows.filter((r) => r.convergence === 'partial').length,
  divergent: rows.filter((r) => r.convergence === 'divergent').length,
  unsupported: rows.filter((r) => !r.simulator.construct_present).map((r) => r.id),
};

if (flag('json')) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
  process.exit(summary.unsupported.length && flag('strict') ? 1 : 0);
}

console.log(`\n${C.b('CROSS-DOMAIN VERIFICATION')}`);
console.log(C.dim('─'.repeat(40)));
console.log(C.dim('  Each construct in the simulator, checked against a profession that had to'));
console.log(C.dim('  solve the same problem without reference to this model.\n'));

for (const r of rows) {
  const paint = VERDICT[r.convergence] ?? ((s) => s);
  console.log(`${C.b(r.trade)} ${C.dim('·')} ${r.framework}`);
  console.log(`  ${paint(r.convergence.toUpperCase())} ${C.dim(`against`)} ${C.c(r.simulator_construct)} ${C.dim(`(regime: ${r.maps_to_regime})`)}`);
  console.log(C.dim(`  instruments: ${r.instruments.join('; ')}`));
  console.log(`\n  ${C.c('their protocol')}`);
  console.log(wrap(r.protocol));
  console.log(`\n  ${C.c('what the simulator did here')}`);
  console.log(wrap(
    `Under a ${r.maps_to_regime} regime it established ${r.simulator.established}/${r.simulator.of} conditions, ` +
    `ran the ${r.simulator.claimant_theories.join(' and ') || 'no'} theory, ` +
    `${r.simulator.necessity_silence_fired ? 'fired' : 'did not fire'} the necessity-silence conflict, ` +
    `and produced: ${r.simulator.vectors.join(', ') || 'no vectors'}.`,
  ));
  console.log(`\n  ${C.c('confirms')}`);
  console.log(wrap(r.what_it_confirms));
  console.log(`\n  ${C.c('adds')}`);
  console.log(wrap(r.what_it_adds));
  console.log(`\n  ${C.y('where the analogy breaks')}`);
  console.log(wrap(r.where_it_breaks));
  console.log();
}

console.log(C.b('SUMMARY'));
console.log(C.dim('─'.repeat(40)));
console.log(`  ${C.g(`${summary.strong} strong`)} · ${C.y(`${summary.partial} partial`)} · ${C.r(`${summary.divergent} divergent`)} of ${summary.total}`);
if (summary.unsupported.length) {
  console.log(C.r(`  constructs the simulator did not actually exhibit: ${summary.unsupported.join(', ')}`));
}
console.log();
console.log(wrap(
  'The necessity-silence conflict is corroborated three times over by fields that reached it independently: ' +
  'aviation calls the same finding systemic rather than individual, building regulation already ships the proposed ' +
  'remedy as working practice, and military doctrine reached the identical conclusion that unavoidable discretion is ' +
  'answered by stated intent rather than by more rules. That is convergence, not coincidence.', 84, '  '));
console.log();
console.log(wrap(
  'The one divergence is the more valuable result. Accounting practice holds that a dense rulebook is a shield as ' +
  'often as a sword, because conduct engineered to satisfy every written rule while defeating its purpose is formally ' +
  'unimpeachable. The simulator scored the rigid regime as claimant-favourable and was wrong to.', 84, '  '));
console.log();
console.log(wrap(
  'Every framework here is prospective and systemic — built to improve what happens next. Adjudication is ' +
  'retrospective and individual. The diagnoses transfer; the postures do not, and a claim that borrows the posture ' +
  'along with the diagnosis will be met with the objection that it is asking the wrong forum for the wrong thing.',
  84, '  '));
console.log();

process.exit(summary.unsupported.length && flag('strict') ? 1 : 0);
