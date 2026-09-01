import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const run = (args = []) =>
  JSON.parse(execFileSync('node', ['scripts/outstanding.mjs', '--json', ...args], { encoding: 'utf8' }));

test('the list is derived from the record, not maintained by hand', () => {
  const a = run();
  const b = run();
  assert.deepEqual(a, b, 'two runs over an unchanged tree must agree');
  assert.ok(a.total > 0);
});

test('everything owed a source is found wherever it lives', () => {
  const r = run();
  const files = new Set(r.owed.map((x) => x.file));
  assert.ok(files.has('public/simulator/corpus/trades.json'), 'the authored convergence verdicts');
  assert.ok(files.has('public/simulator/corpus/provisions.json'), 'the statute recorded as paraphrase');
  assert.ok([...files].some((f) => f.startsWith('corpus/')), 'officer premises held at basis none');
});

test('a node with basis none is reported once, not twice', () => {
  const r = run();
  const donald = r.owed.filter((x) => x.file.includes('donald-transfer-date'));
  assert.equal(donald.length, 1, 'basis:none plus owed on one node is one item');
  assert.equal(donald[0].kind, 'basis_none');
  assert.match(donald[0].detail, /conveyance date/);
});

test('untried doors are reported as owed a search, with what would settle them', () => {
  const r = run();
  assert.ok(r.owedSearch.length >= 4);
  for (const d of r.owedSearch) {
    assert.ok(d.detail && d.detail.length > 20, `${d.id} must say what search is owed`);
    assert.ok(d.theory);
  }
});

test('unanswered vantages and missing arbitrations surface as awaiting', () => {
  const r = run();
  const ids = r.awaitingVantage.map((x) => x.id);
  assert.ok(ids.includes('Q2-SURVIVAL'), 'Q2 has no arbitration and an unanswered vantage');
  const arb = r.awaitingVantage.find((x) => x.kind === 'awaiting_arbitration');
  assert.ok(arb, 'an arbitration that was never written is an outstanding item');
});

test('questions put to the owner are declared, since they cannot be derived', async () => {
  const r = run();
  assert.ok(r.awaitingOwner.length >= 3);
  for (const q of r.awaitingOwner) {
    assert.ok(q.question, 'each must be a question');
    assert.ok(q.detail, 'each must carry enough context to answer without scrolling back');
    assert.ok(q.asked_at, 'each must record when it was asked');
    assert.equal(typeof q.blocking, 'boolean', 'blocking or not must be stated, not implied');
  }
  const project = JSON.parse(await readFile(new URL('../fleet/projects/simulator.json', import.meta.url), 'utf8'));
  assert.equal(project.awaiting_owner.length, r.awaitingOwner.length, 'the script reads the project fragment');
});

test('--strict fails while anything awaits the owner', () => {
  let code = 0;
  try {
    execFileSync('node', ['scripts/outstanding.mjs', '--strict', '--no-color'], { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  assert.equal(code, 1, 'an unanswered question to a person should be able to gate a build');
});

test('an answered question is recorded as answered rather than deleted', () => {
  // This assertion used to check the other half of the same invariant: that a
  // word nobody could transcribe sat in awaiting_owner as an open clarification
  // rather than being guessed at silently. The owner answered it on 2026-09-01
  // — the office is Enoch — and the question was moved to `resolved` rather
  // than removed, because a question that vanishes when it is answered leaves
  // no way to check afterwards what the answer was.
  const project = JSON.parse(readFileSync(new URL('../fleet/projects/simulator.json', import.meta.url), 'utf8'));
  const name = (project.resolved ?? []).find((q) => /paralegal role actually called/i.test(q.question));
  assert.ok(name, 'an answered question is kept with its answer, not deleted');
  assert.match(name.answer, /Enoch/);
  assert.ok(name.resolved_by && name.resolved_at, 'a resolution names who resolved it and when');

  const open = new Set(run().awaitingOwner.map((q) => q.id));
  for (const r of project.resolved ?? []) {
    assert.ok(r.answer && r.resolved_by && r.what_changed, `${r.id} is resolved and must carry the answer, the resolver and what changed`);
    assert.ok(!open.has(r.id), `${r.id} is in both lists — resolved and still awaiting the owner`);
  }
});
