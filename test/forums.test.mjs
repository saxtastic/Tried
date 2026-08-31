import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../sim/load.mjs';
import { FORUMS, reconciliationRoutes, classify } from '../public/simulator/engine/forums.js';
import { fullReport } from '../public/simulator/engine/simulate.js';

const corpus = await loadCorpus();

test('forums are ranked by concession required, not by likelihood of success', () => {
  const r = reconciliationRoutes();
  const ranks = r.routes.map((x) => x.concession_rank);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), 'routes must come back in concession order');
  assert.equal(r.routes[0].id, 'tort', 'the route that asks for nothing sorts first');
  assert.equal(FORUMS.legislative.concession_rank, 5, 'asking the authority to grant is the most expensive');
});

test('tort is modelled as requiring no concession, and legislative as requiring the most', () => {
  assert.match(FORUMS.tort.concession_required, /does not ask, it executes/);
  assert.match(FORUMS.legislative.concession_required, /requires the governing authority to grant/);
  assert.ok(FORUMS.tort.concession_rank < FORUMS.administrative.concession_rank);
  assert.ok(FORUMS.administrative.concession_rank < FORUMS.legislative.concession_rank);
});

test('a route is blocked for a stated reason rather than silently dropped', () => {
  const noAssets = reconciliationRoutes({ respondent_has_assets: false });
  const tort = noAssets.routes.find((r) => r.id === 'tort');
  assert.equal(tort.available, false);
  assert.match(tort.unavailable_because, /piece of paper/);
  assert.ok(noAssets.least_concession.id !== 'tort', 'a blocked route cannot be the recommendation');
});

test('the education-funding route closes when the provision is not rights-creating', () => {
  const r = reconciliationRoutes({ provision_is_rights_creating: false });
  const ed = r.routes.find((x) => x.id === 'education_funding');
  assert.equal(ed.available, false);
  assert.match(ed.unavailable_because, /speaks to the agency rather than to persons/);
});

test('the template case is pleaded mostly in high-concession forums', () => {
  const r = fullReport(corpus);
  const high = r.forums.per_condition.filter((c) => c.concession_rank >= 3);
  assert.ok(high.length >= 4, 'this is the diagnosis the module exists to surface');
  const low = r.forums.per_condition.filter((c) => c.concession_rank === 0);
  assert.ok(low.length <= 1, 'almost nothing sits in the forum that asks for nothing');
});

test('Donald v. UKA is in the corpus as the worked example, sourced and honest about what is owed', () => {
  const d = corpus.precedents.find((p) => p.id === 'donald_uka');
  assert.ok(d, 'the case must be in the precedent corpus');
  assert.equal(d.favours, 'claimant');
  assert.equal(d.provenance.basis, 'sourced');
  assert.ok(d.provenance.sources.length >= 2, 'more than one source for a claim this load-bearing');
  assert.ok(d.provenance.discrepancy, 'the conflicting transfer date must be recorded, not smoothed over');
  assert.ok(d.provenance.owed, 'and what is still owed must be named');
  assert.match(d.rationale, /agency/i);
  assert.equal(FORUMS.tort.worked_example, 'donald_uka');
});

test('the divisive-concepts provision is marked as paraphrase, not text', () => {
  const p = corpus.provisions.find((x) => x.id === 'tn_divisive_concepts');
  assert.ok(p);
  assert.equal(p.provenance.basis, 'none', 'a paraphrase from search summaries is not a sourced statute');
  assert.match(p.text, /OWED/, 'the text field must not contain a paraphrase dressed as text');
  assert.ok(p.paraphrase, 'the paraphrase lives in its own field where it cannot be mistaken for the statute');
  assert.ok(p.provenance.blocked_by, 'and why it could not be retrieved');
});

test('classify names the forum a condition sits in and what it costs', () => {
  const c = classify({ id: 'x', track: 'governance' });
  assert.equal(c.forum, 'administrative');
  assert.ok(c.concession_rank >= 4);
  assert.match(c.note, /tort, contract or fiduciary/);
});
