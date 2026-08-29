import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../sim/load.mjs';
import {
  PASSAGE_KINDS, GLITCHES, DECAYS, SUSTAINS, passage, itinerary, sensitivity,
} from '../public/simulator/engine/transitions.js';
import { fullReport } from '../public/simulator/engine/simulate.js';

const corpus = await loadCorpus();

test('a glitch carries evidentiary value; a clean production does not', () => {
  assert.equal(GLITCHES.clean.evidentiary_value, 0);
  for (const id of ['null_return', 'reconstructed', 'timed_out', 'partial', 'substituted']) {
    assert.ok(GLITCHES[id].evidentiary_value > 0, `${id} should be worth something as a finding`);
  }
  assert.ok(GLITCHES.null_return.evidentiary_value > GLITCHES.partial.evidentiary_value,
    'nothing produced says more than something withheld');
});

test('a sustain only offsets the decays it actually reaches', () => {
  const withCounsel = passage({
    kind: 'request_to_record', interval_days: 300,
    decays: ['capacity'], sustains: ['counsel'],
  });
  const withCommunity = passage({
    kind: 'request_to_record', interval_days: 300,
    decays: ['capacity'], sustains: ['community'],
  });
  assert.ok(withCounsel.uncovered.some((u) => u.id === 'capacity'),
    'representation does not restore capacity, and the model must not pretend it does');
  assert.equal(withCommunity.uncovered.length, 0, 'community reaches capacity');
  assert.ok(withCommunity.net_cost < withCounsel.net_cost);
});

test('community is modelled as asymmetric, and that is recorded as a strength', () => {
  assert.equal(SUSTAINS.community.reciprocity, 'asymmetric');
  assert.ok(SUSTAINS.community.strength >= Math.max(...Object.values(SUSTAINS).map((s) => s.strength)),
    'the term that scales across a long interval should score as the strongest');
  assert.match(SUSTAINS.community.gloss, /not capped/);
});

test('capacity is the heaviest decay and is uncovered by everything except people', () => {
  assert.ok(DECAYS.capacity.rate >= Math.max(...Object.values(DECAYS).map((d) => d.rate)));
  const reach = Object.entries(SUSTAINS).filter(([, s]) => s.sustains.includes('capacity')).map(([id]) => id);
  assert.deepEqual(reach, ['community'], 'only community reaches capacity');
});

test('a longer interval costs more, all else equal', () => {
  const short = passage({ kind: 'request_to_record', interval_days: 30, decays: ['evidence'], sustains: [] });
  const long = passage({ kind: 'request_to_record', interval_days: 600, decays: ['evidence'], sustains: [] });
  assert.ok(long.net_cost > short.net_cost);
});

test('the connective does not contradict its own verdict', () => {
  // A short passage with an uncovered decay is carried; the prose must not
  // simultaneously claim the interval took something unrecoverable.
  const short = passage({ kind: 'complaint_to_docket', interval_days: 20, decays: ['salience'], sustains: [] });
  if (short.carried) {
    assert.ok(!/no argument recovers/.test(short.connective),
      'a carried passage must not claim an unrecoverable loss');
  }
  const long = passage({ kind: 'request_to_record', interval_days: 700, decays: ['standing'], sustains: [] });
  assert.equal(long.carried, false);
  assert.match(long.connective, /no argument recovers/);
});

test('every passage produces a transition sentence naming both ends', () => {
  for (const kind of Object.keys(PASSAGE_KINDS)) {
    const p = passage({ kind, interval_days: 100, decays: ['memory'], sustains: ['community'] });
    assert.ok(p.connective.includes(PASSAGE_KINDS[kind].from), `${kind} connective omits its start`);
    assert.ok(p.connective.includes(PASSAGE_KINDS[kind].to), `${kind} connective omits its end`);
  }
});

test('a passage with nothing sustaining it says so plainly', () => {
  const p = passage({ kind: 'remedy_to_repair', interval_days: 400, decays: ['capacity'], sustains: [] });
  assert.match(p.connective, /Nothing is recorded as having carried/);
});

test('the itinerary names where the claim is lost, not merely that it was', () => {
  const it = itinerary(corpus.passages);
  assert.ok(it.legs.length >= 4);
  assert.equal(it.survived, false, 'the template case is lost in the intervals, which is the point of it');
  assert.ok(it.lost_at.length >= 1);
  assert.match(it.finding, /outlasted/);
});

test('the corpus passages are well formed', () => {
  for (const p of corpus.passages) {
    assert.ok(PASSAGE_KINDS[p.kind], `unknown passage kind ${p.kind}`);
    assert.ok(GLITCHES[p.glitch], `unknown glitch ${p.glitch}`);
    assert.ok(typeof p.interval_days === 'number' && p.interval_days > 0);
    for (const d of p.decays ?? []) assert.ok(DECAYS[d], `unknown decay ${d}`);
    for (const s of p.sustains ?? []) assert.ok(SUSTAINS[s], `unknown sustain ${s}`);
  }
});

test('passages feed the statutory challenge rather than decorating the report', () => {
  const r = fullReport(corpus);
  const vectors = r.disposition.statutory_challenge.map((v) => v.vector);
  assert.ok(vectors.includes('mandatory_retention'), 'a null return should demand a retention duty');
  assert.ok(vectors.includes('bound_the_interval'), 'a timed-out passage should demand a clock');
  assert.ok(vectors.includes('preserve_standing'), 'standing lost in an interval should demand it be frozen');
});

test('the itinerary is part of the full report', () => {
  const r = fullReport(corpus);
  assert.ok(r.itinerary.legs.length);
  assert.ok(r.itinerary.total_span);
  assert.ok(r.itinerary.glitches_worth_pleading.length, 'the glitches are pleadable findings in themselves');
});

// --- Provenance: the module must not launder stipulation as measurement. -----

test('every weight declares that it is stipulated and what would measure it', () => {
  for (const [id, d] of Object.entries(DECAYS)) {
    assert.equal(d.basis, 'stipulated', `${id} must declare its basis`);
    assert.ok(d.measurable_by, `${id} must say what would make it a measured number`);
  }
  for (const [id, s] of Object.entries(SUSTAINS)) {
    assert.equal(s.basis, 'stipulated', `${id} must declare its basis`);
    assert.ok(s.measurable_by, `${id} must say what would make it a measured number`);
  }
});

test('the itinerary carries its own provenance so no consumer can read it as measured', () => {
  const it = itinerary(corpus.passages);
  assert.equal(it.provenance.weights, 'stipulated');
  assert.match(it.provenance.reportable, /sensitivity/);
});

test('sensitivity refuses to call a construction a finding', () => {
  const s = sensitivity(corpus.passages);
  const byConstruction = s.claims.filter((c) => c.class === 'by_construction').map((c) => c.claim);
  assert.ok(
    byConstruction.some((c) => /only community/i.test(c)),
    'that only community reaches capacity is a definition, not a result, and must be classed as one',
  );
  assert.ok(
    byConstruction.some((c) => /heaviest decay/i.test(c)),
    'that capacity is heaviest follows from its rate being set highest',
  );
});

test('sensitivity actually perturbs and can distinguish robust from fragile', () => {
  const s = sensitivity(corpus.passages);
  assert.ok(s.perturbations.length >= 3);
  const factors = s.perturbations.map((p) => p.factor);
  assert.ok(Math.max(...factors) > Math.min(...factors), 'the weights must really move');
  const classes = new Set(s.claims.map((c) => c.class));
  assert.ok(classes.has('robust') || classes.has('fragile'),
    'the check must be capable of separating the two, not label everything by_construction');
});

test('the full report carries the sensitivity beside the itinerary', () => {
  const r = fullReport(corpus);
  assert.ok(r.passage_sensitivity?.claims?.length);
  assert.match(r.passage_sensitivity.note, /laundering/);
});
