import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { loadCorpus, CORPUS_DIR } from '../sim/load.mjs';
import { run } from '../public/simulator/engine/simulate.js';
import { necessitySilence, THEORIES, REGIMES } from '../public/simulator/engine/institution.js';
import { DEFEATERS } from '../public/simulator/engine/agents.js';

const corpus = await loadCorpus();
const trades = JSON.parse(await readFile(resolve(CORPUS_DIR, 'trades.json'), 'utf8'));

test('every trade entry is complete and honest about its limits', () => {
  assert.ok(trades.length >= 8);
  for (const t of trades) {
    for (const field of ['trade', 'framework', 'protocol', 'simulator_construct', 'maps_to_regime', 'convergence', 'what_it_confirms', 'what_it_adds', 'where_it_breaks']) {
      assert.ok(t[field], `${t.id} is missing ${field}`);
    }
    assert.ok(['strong', 'partial', 'divergent'].includes(t.convergence), `${t.id} has an unknown verdict`);
    assert.ok(Array.isArray(t.instruments) && t.instruments.length, `${t.id} names no instrument`);
    assert.ok(REGIMES[t.maps_to_regime], `${t.id} maps to an unknown policy regime`);
  }
});

test('the verification is not self-congratulatory: at least one divergence is recorded', () => {
  const divergent = trades.filter((t) => t.convergence === 'divergent');
  assert.ok(divergent.length >= 1, 'a check that only ever agrees with itself has verified nothing');
});

// --- The corrections the verification produced. -----------------------------

test('aviation: the necessity-silence conflict carries an operational test', () => {
  const ns = necessitySilence(corpus.institution);
  assert.equal(ns.triggered, true);
  assert.ok(ns.substitution_test, 'the construct must supply a way to prove discretion was compelled');
  assert.match(ns.substitution_test.question, /similarly trained/);
  assert.ok(ns.substitution_test.if_yes.includes('systemic'));

  const quiet = necessitySilence({ ...corpus.institution, enabling_act_supplies_standard: true });
  assert.equal(quiet.substitution_test, null, 'no test where the conflict does not fire');
});

test('accounting: a dense rulebook is modelled as a shield, not only as a sword', () => {
  assert.ok(THEORIES.structured_compliance, 'the respondent theory must exist');
  assert.ok(DEFEATERS.structured_compliance, 'the defeater must be registered');

  const rigid = run(corpus, { policyRegime: 'rigid' });
  const shields = rigid.debates.flatMap((d) => d.con.defeaters).filter((x) => x.kind === 'structured_compliance');
  assert.ok(shields.length, 'a rigid regime must raise the formal-compliance shield');
  assert.ok(shields[0].answer_available, 'and must carry the claimant\'s answer to it');
  assert.equal(shields[0].answer_available.move, 'purpose_and_recorded_judgment');

  const loose = run(corpus, { policyRegime: 'loose' });
  const looseShields = loose.debates.flatMap((d) => d.con.defeaters).filter((x) => x.kind === 'structured_compliance');
  assert.equal(looseShields.length, 0, 'a loose regime has no dense rulebook to hide behind');
});

test('accounting: the correction actually costs the claimant something in a rigid regime', () => {
  const rigid = run(corpus, { policyRegime: 'rigid' });
  const loose = run(corpus, { policyRegime: 'loose' });
  assert.ok(
    rigid.disposition.summary.established <= loose.disposition.summary.established,
    'a rigid rulebook should no longer read as unambiguously better for the claimant',
  );
});

test('medicine: deference is answered by demanding the peer standard', () => {
  const r = run(corpus);
  const deference = r.debates.flatMap((d) => d.con.defeaters).find((x) => x.kind === 'deference');
  assert.ok(deference, 'deference is still raised');
  assert.equal(deference.answer_available?.move, 'demand_the_peer_standard');
  assert.match(deference.answer_available.argument, /responsible body of practitioners/);
});

test('each construct a trade checks is one the simulator actually exhibits', () => {
  const constructs = new Set(trades.map((t) => t.simulator_construct));
  const known = new Set([
    ...Object.keys(THEORIES),
    ...Object.keys(DEFEATERS),
    'necessity_silence_conflict',
    'supply_an_intelligible_principle',
    'standard_of_review',
  ]);
  for (const c of constructs) {
    assert.ok(known.has(c), `trades.json checks "${c}", which the simulator does not have`);
  }
});
