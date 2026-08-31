import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { loadCorpus } from '../sim/load.mjs';
import { STAGES, stratify, register } from '../public/simulator/engine/attempts.js';
import { COUNTERCLAIMS, counterclaims } from '../public/simulator/engine/agents.js';
import { fullReport } from '../public/simulator/engine/simulate.js';

const corpus = await loadCorpus();

test('untried is reported as an absence, never scored as a failure', () => {
  const d = stratify({ forum: 'tort', theory: 't', attempts: [] });
  assert.equal(d.status, 'untried');
  assert.equal(d.count, 0);
  assert.match(d.reading, /Untried is not closed/);
  assert.equal(d.confidence, 'none — depends entirely on how the search was scoped');
  assert.ok(d.owed, 'an untried door must name what search would settle it');
});

test('a door that never survives a threshold motion reads as closed on a rule', () => {
  const d = stratify({
    forum: 'education_funding', theory: 't',
    attempts: [
      { who: 'a', reached: 'filed', stopped_by: 'no private right of action' },
      { who: 'b', reached: 'filed', stopped_by: 'no private right of action' },
    ],
  });
  assert.equal(d.status, 'closed_early');
  assert.deepEqual(d.dominant_bar, { bar: 'no private right of action', times: 2 });
  assert.match(d.reading, /legislative target rather than a litigation one/);
});

test('a door with an executed remedy is distinguished from one that merely survived', () => {
  const executed = stratify({ forum: 'tort', theory: 't', attempts: [{ who: 'a', reached: 'remedy_executed' }] });
  const survived = stratify({ forum: 'tort', theory: 't', attempts: [{ who: 'a', reached: 'survived_dismissal' }] });
  assert.equal(executed.status, 'open');
  assert.equal(survived.status, 'partially_open');
  assert.ok(executed.furthest_index > survived.furthest_index);
  assert.equal(STAGES[STAGES.length - 1], 'remedy_executed', 'collecting is the last stage, not winning');
});

test('the register reports its own coverage and refuses to imply completeness', () => {
  const r = register(corpus.doors);
  assert.ok(r.coverage.of > 0);
  assert.ok(r.coverage.ratio < 1, 'the bundled register is deliberately incomplete');
  assert.equal(r.coverage.basis, 'none');
  assert.match(r.coverage.owed, /docket search/);
  assert.match(r.finding, /unsearched, never as unattempted/);
});

test('every untried door in the corpus names what search is owed', () => {
  for (const d of corpus.doors) {
    if ((d.attempts ?? []).length === 0) {
      assert.ok(d.owed, `${d.id} is untried and does not say what would settle it`);
      assert.match(d.note, /UNTRIED/, `${d.id} must say so in plain words`);
    }
  }
});

test('Donald is the one door recorded as opened and executed', () => {
  const r = register(corpus.doors);
  const open = r.rows.filter((x) => x.status === 'open');
  assert.equal(open.length, 1);
  assert.equal(open[0].id, 'tort.agency_vs_organisation');
  assert.equal(open[0].attempts[0].reached, 'remedy_executed');
  assert.ok(open[0].attempts[0].source.startsWith('https://'));
});

test('counterclaims are modelled on exposure and interact with the passage sustains', () => {
  const none = counterclaims({ facts: {} });
  assert.equal(none.raised.length, 0);
  assert.match(none.finding, /changes the moment the account is published/);

  const published = counterclaims({ facts: { account_published: { value: true } } });
  assert.equal(published.raised[0].id, 'defamation');
  assert.equal(published.raised[0].interacts_with, 'passage.sustain.public_record');
  assert.ok(published.exposure > 0);

  assert.equal(COUNTERCLAIMS.interference.interacts_with, 'passage.sustain.community',
    'the community sustain has a cost and the model must carry it');
});

test('the paralegal officer refuses prediction and holds the unsearched distinction', async () => {
  const i = JSON.parse(await readFile(new URL('../corpus/paralegal/integrity.json', import.meta.url), 'utf8'));
  assert.equal(i.officer, 'paralegal');
  assert.ok(i.will_not_assert.some((x) => /untried door will work/i.test(x)));
  assert.ok(i.will_not_assert.some((x) => /absence of a result/i.test(x)));
  assert.match(i.declines, /Prediction/);
  assert.deepEqual(i.bases_accepted, ['confirmed', 'sourced']);
  assert.ok(i.the_distinction_this_officer_exists_to_hold);
});

test('the full report carries the register and the counterclaims', () => {
  const r = fullReport(corpus);
  assert.ok(r.doors.rows.length >= 8);
  assert.ok(r.doors.counts.untried >= 1);
  assert.ok(r.counterclaims);
  assert.equal(r.counterclaims.unmodelled_before, true);
});
