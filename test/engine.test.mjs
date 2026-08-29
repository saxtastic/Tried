import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../sim/load.mjs';
import {
  indexLexicon, reaches, driftReport, resolveSense,
} from '../public/simulator/engine/lexicon.js';
import { selfDefeatRisk, reframe, remedialFrame } from '../public/simulator/engine/paradox.js';
import { profile, necessitySilence, translate } from '../public/simulator/engine/institution.js';
import { entrenchment, movesAgainst, onPoint, findGaps } from '../public/simulator/engine/stare.js';
import { run, fullReport, sweepInterpretations, sweepInstitutions } from '../public/simulator/engine/simulate.js';

const corpus = await loadCorpus();

test('lexicon: a term is read differently depending on the regime', () => {
  const lex = indexLexicon(corpus.lexicon);
  const ctx = { enactedYear: 1964, caseYear: 2026 };
  const now = reaches(lex, 'discrimination', 'disparate_impact', { ...ctx, regime: 'contemporary' });
  const era = reaches(lex, 'discrimination', 'disparate_impact', { ...ctx, regime: 'enactment_era' });
  const purpose = reaches(lex, 'discrimination', 'disparate_impact', { ...ctx, regime: 'purposive' });
  assert.equal(now.hit, false, 'the contemporary sense no longer reaches effects');
  assert.equal(era.hit, true, 'the enacting-era sense did');
  assert.equal(purpose.hit, true, 'the purposive reading restores the reach');
});

test('lexicon: drift report names the narrowing event and what was lost', () => {
  const lex = indexLexicon(corpus.lexicon);
  const d = driftReport(lex, 'discrimination', { enactedYear: 1964, caseYear: 2026, regime: 'contemporary' });
  assert.equal(d.drifted, true);
  assert.equal(d.narrowedBy.year, 2001);
  assert.deepEqual(d.narrowedBy.lost, ['disparate_impact']);
});

test('lexicon: an undrifted term reports as undrifted', () => {
  const lex = indexLexicon(corpus.lexicon);
  const d = driftReport(lex, 'good_standing', { caseYear: 2026, regime: 'contemporary' });
  assert.equal(d.drifted, false);
});

test('lexicon: an unknown term does not throw', () => {
  const lex = indexLexicon(corpus.lexicon);
  assert.equal(resolveSense(lex, 'nonesuch', { regime: 'contemporary', caseYear: 2026 }), null);
  assert.equal(reaches(lex, 'nonesuch', 'anything', { regime: 'contemporary', caseYear: 2026 }).hit, false);
  assert.equal(driftReport(lex, 'nonesuch', { caseYear: 2026 }), null);
});

test('paradox: a constitutive attack is self-defeating and the reframe cures it', () => {
  const claim = corpus.claim;
  const before = selfDefeatRisk(claim);
  assert.ok(before > 0.5, 'the template pleads at the constitutive layer on purpose');
  const r = reframe(claim);
  assert.ok(r.after < 0.2, 'reframing moves the risk off the cliff');
  assert.ok(r.after < r.before);
  assert.equal(r.moved.length, 1);
  assert.equal(r.moved[0].original_layer, 'constitutive');
  assert.equal(r.moved[0].layer, 'warrant');
  assert.equal(r.claim.relief_requires_disavowal, false);
});

test('paradox: reframing does not mutate the original claim', () => {
  const claim = { attacks: [{ layer: 'constitutive', statement: 'x' }], relief_requires_disavowal: true };
  reframe(claim);
  assert.equal(claim.attacks[0].layer, 'constitutive');
  assert.equal(claim.relief_requires_disavowal, true);
});

test('paradox: a claim already pitched at the warrant carries no self-defeat risk', () => {
  const r = reframe({ attacks: [{ layer: 'warrant' }, { layer: 'competence' }] });
  assert.ok(r.before < 0.2);
  assert.equal(r.moved.length, 0);
});

test('paradox: the remedial dialectic resolves rather than restates the circle', () => {
  const d = remedialFrame({ remedy: 'reparation', instrument: 'the charter' });
  assert.equal(d.non_circular, true);
  assert.match(d.synthesis, /act of authority/);
});

test('institution: the necessity-silence conflict fires only on conflict plus silence', () => {
  const fired = necessitySilence(corpus.institution);
  assert.equal(fired.triggered, true);
  assert.equal(fired.remedy_vector, 'supply_an_intelligible_principle');

  const withStandard = necessitySilence({ ...corpus.institution, enabling_act_supplies_standard: true });
  assert.equal(withStandard.triggered, false, 'a standard in the enabling act makes the choice reviewable');

  const noConflict = necessitySilence({ ...corpus.institution, conflicts: [], policy_density: 0.35 });
  assert.equal(noConflict.triggered, false, 'density alone is not a conflict');
});

test('institution: regime is inferred from density and conflicts', () => {
  assert.equal(profile({ policy_density: 0.9, conflicts: [{}] }).regime, 'over_dense');
  assert.equal(profile({ policy_density: 0.9 }).regime, 'rigid');
  assert.equal(profile({ policy_density: 0.05 }).regime, 'absent');
  assert.equal(profile({ policy_density: 0.4 }).regime, 'loose');
  assert.equal(profile({ policy_density: 0.05, regime: 'rigid' }).regime, 'rigid', 'an explicit regime wins');
});

test('institution: theories are reported for every regime, with the actual one marked', () => {
  const t = translate('custom_and_estoppel', corpus.institution);
  assert.equal(t.rows.length, 4);
  assert.equal(t.rows.filter((r) => r.is_actual).length, 1);
  assert.equal(t.rows.find((r) => r.regime === 'loose').base_theory_status, 'native');
});

test('stare decisis: an entrenched adverse precedent routes to the legislature', () => {
  const sandoval = corpus.precedents.find((p) => p.id === 'sandoval');
  const e = entrenchment(sandoval);
  assert.equal(e.posture, 'entrenched');
  const m = movesAgainst(sandoval, {});
  assert.ok(m.moves.some((x) => x.move === 'route_to_legislature' && x.produces_statutory_vector));
});

test('stare decisis: a distinction available on the record is offered first', () => {
  const sandoval = corpus.precedents.find((p) => p.id === 'sandoval');
  const m = movesAgainst(sandoval, corpus.claim.facts);
  assert.equal(m.moves[0].move, 'distinguish');
});

test('stare decisis: coverage tags match by prefix in both directions', () => {
  const hits = onPoint(corpus.precedents, ['civil.private_right.disparate_impact']);
  assert.ok(hits.some((p) => p.id === 'sandoval'));
  assert.equal(onPoint(corpus.precedents, []).length, 0);
});

test('gaps: a plainly met factual element is not a question of first impression', () => {
  const met = findGaps({ element: { id: 'e', statement: 's', covers: ['nothing.covers.this'] }, precedents: corpus.precedents, status: 'met' });
  assert.equal(met.length, 0);
  const contested = findGaps({ element: { id: 'e', statement: 's', covers: ['nothing.covers.this'] }, precedents: corpus.precedents, status: 'contested' });
  assert.ok(contested.some((g) => g.class === 'first_impression'));
});

test('gaps: divided authority on the same question is registered as a split', () => {
  const g = findGaps({ element: { id: 'e', statement: 's', covers: ['admin.process_owed'] }, precedents: corpus.precedents, status: 'contested' });
  assert.ok(g.some((x) => x.class === 'conflicting_authority'), 'Goss and Horowitz divide on process owed');
});

test('judge: a claim with no private right is barred rather than decided on the merits', () => {
  const r = run(corpus);
  const impact = r.debates.find((d) => d.condition.id === 'civil.impact');
  assert.equal(impact.judgment.outcome, 'barred');
  assert.ok(impact.judgment.bars.some((b) => b.kind === 'no_private_right'));
  assert.match(impact.judgment.reasoning, /not a finding that the conduct was lawful/);
});

test('judge: a barred forum produces a statutory vector rather than a dead end', () => {
  const r = run(corpus);
  const vectors = r.disposition.statutory_challenge.map((v) => v.vector);
  assert.ok(vectors.includes('restore_private_right'));
  assert.ok(vectors.includes('supersede_precedent'));
  assert.ok(vectors.includes('supply_an_intelligible_principle'));
});

test('judge: every condition yields a thesis, an antithesis, and a synthesis', () => {
  const r = run(corpus);
  assert.ok(r.debates.length >= 7);
  for (const d of r.debates) {
    assert.ok(d.judgment.synthesis.thesis);
    assert.ok(d.judgment.synthesis.antithesis);
    assert.ok(d.judgment.synthesis.synthesis);
    assert.ok(d.judgment.principled.decisive.id);
  }
});

test('judge: synthesis does not claim an element the bench rejected', () => {
  const r = run(corpus, { regime: 'strict_textual' });
  for (const d of r.debates) {
    const unmet = d.judgment.elements.filter((e) => e.status === 'unmet').map((e) => e.statement);
    for (const u of unmet) {
      const beforeNarrowing = d.judgment.synthesis.synthesis.split('The rule is narrower than pleaded')[0];
      assert.ok(!beforeNarrowing.includes(u), `"${u}" was rejected but appears in the operative rule`);
    }
  }
});

test('agents: the opponent leads with its strongest defeater', () => {
  const r = run(corpus);
  for (const d of r.debates) {
    if (!d.con.defeaters.length) continue;
    const first = d.con.defeaters[0].strength;
    assert.ok(d.con.defeaters.every((x) => x.strength <= first));
  }
});

test('agents: the narrowest-reading move is weak where the governing sense supports the claim', () => {
  const r = run(corpus, { regime: 'contemporary' });
  const civil = r.debates.find((d) => d.condition.id === 'civil.intentional');
  const reach = civil.con.defeaters.find((x) => x.kind === 'interpretive_reach');
  assert.ok(reach, 'the move is still available');
  assert.ok(reach.strength < 0.5, 'but it does not carry the day against the governing sense');
  assert.ok(reach.concession, 'and it is reported with what it concedes');
});

test('agents: the necessity-silence argument is not attached to tracks it cannot help', () => {
  const r = run(corpus);
  const ip = r.debates.find((d) => d.condition.track === 'ip');
  assert.equal(ip.pro.necessity_silence, null);
  const gov = r.debates.find((d) => d.condition.track === 'governance');
  assert.ok(gov.pro.necessity_silence?.triggered);
});

test('sweep: the interpretive sweep detects that the outcome moves with the reading', () => {
  const s = sweepInterpretations(corpus);
  assert.equal(s.outcome_depends_on_regime, true);
  assert.equal(s.rows.length, 5);
  assert.match(s.finding, /definition rather than a better record/);
});

test('sweep: the institutional sweep runs every policy regime and names this one', () => {
  const s = sweepInstitutions(corpus);
  assert.equal(s.rows.length, 4);
  assert.equal(s.actual_regime, 'loose');
  assert.ok(s.rows.find((r) => r.regime === 'over_dense').vectors.includes('supply_an_intelligible_principle'));
});

test('simulate: runs are deterministic', () => {
  assert.deepEqual(run(corpus), run(corpus));
});

test('simulate: track filtering restricts the conditions run', () => {
  const r = run(corpus, { tracks: ['ip'] });
  assert.equal(r.debates.length, 1);
  assert.equal(r.debates[0].condition.track, 'ip');
});

test('simulate: the full report carries every layer', () => {
  const r = fullReport(corpus);
  for (const k of ['debates', 'disposition', 'interpretive_sweep', 'institutional_sweep', 'paradox', 'drift']) {
    assert.ok(r[k], `missing ${k}`);
  }
  assert.ok(r.disposition.governance.frame.standing_preserved);
});

test('corpus: every condition names a provision that exists and elements that test something', () => {
  const ids = new Set(corpus.provisions.map((p) => p.id));
  for (const c of corpus.conditions) {
    assert.ok(ids.has(c.provision), `${c.id} names an unknown provision ${c.provision}`);
    assert.ok(c.elements.length > 0, `${c.id} has no elements`);
    for (const e of c.elements) assert.ok(e.test, `${c.id}.${e.id} has no test`);
  }
});

test('corpus: every precedent declares which side it favours', () => {
  for (const p of corpus.precedents) {
    assert.ok(['claimant', 'respondent'].includes(p.favours), `${p.id} does not declare a side`);
  }
});

test('institution: an unrecognised regime falls back instead of faking one', () => {
  const p = profile({ regime: 'nonsense', policy_density: 0.9 });
  assert.equal(p.regime, 'rigid');
  assert.ok(p.claimant_theory, 'the profile still carries a full theory set');
});
