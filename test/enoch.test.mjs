import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const run = (args = []) =>
  JSON.parse(execFileSync('node', ['scripts/enoch.mjs', '--json', ...args], { encoding: 'utf8' }));

const integrity = JSON.parse(
  await readFile(new URL('../corpus/enoch/integrity.json', import.meta.url), 'utf8'),
);

test('Enoch is not a vantage, and the office says so in its own declaration', () => {
  assert.equal(integrity.not_a_vantage, true);
  assert.equal(run().not_a_vantage, true);
  assert.match(integrity.office, /parliamentarian/);
});

test('the defining refusal is the merits, not a subject-matter limit', () => {
  assert.ok(integrity.will_not_assert.some((x) => /Whether a claim is correct/i.test(x)));
  assert.ok(integrity.will_not_assert.some((x) => /Which vantage should have prevailed/i.test(x)));
  assert.match(integrity.declines, /takes no side, including the side that is obviously right/);
  assert.match(integrity.declines, /certifying its own participation/);
});

test('Enoch has answered no core question, and that zero is the qualification', async () => {
  const q = JSON.parse(await readFile(new URL('../fleet/questions.json', import.meta.url), 'utf8'));
  const answers = q.questions.flatMap((x) => x.answers ?? []).filter((a) => a.vantage === 'enoch');
  assert.equal(answers.length, 0, 'an officer that argued inside the protocol cannot certify it');

  const premise = JSON.parse(
    await readFile(new URL('../corpus/enoch/premises/no-standing-in-the-debate.json', import.meta.url), 'utf8'),
  );
  assert.equal(premise.basis, 'confirmed');
  assert.match(premise.why_it_matters, /qualification for the office/);
});

test('it accepts only what can be read off the record', () => {
  assert.deepEqual(integrity.bases_accepted, ['confirmed']);
  assert.match(integrity.note, /does not source, does not measure the world, and does not infer/);
});

test('the ledger is read from the record, not composed', () => {
  const a = run();
  const b = run();
  assert.deepEqual(a.ledger, b.ledger, 'two runs must agree');
  assert.ok(a.ledger.length >= 5);
  const kinds = new Set(a.ledger.map((x) => x.kind));
  assert.ok(kinds.has('correction'));
  assert.ok(kinds.has('history'));
});

test('a discrepancy is carried in the ledger as held open, never resolved', () => {
  const r = run();
  const held = r.ledger.filter((x) => x.kind === 'discrepancy_held_open');
  assert.ok(held.length >= 1, 'the Donald conveyance dates conflict and must stay conflicting');
  assert.match(held[0].entry, /1986/);
});

test('an unarbitrated question is ruled out of order without ruling on the answers', () => {
  const r = run();
  const q2 = r.rulings.find((x) => x.on === 'Q2-SURVIVAL');
  assert.ok(q2, 'answers standing with no arbitration is a point of order');
  assert.equal(q2.verdict, 'out_of_order');
  assert.match(q2.basis, /arbitration holds the opposition/);
  // The ruling must not evaluate the answers themselves.
  assert.ok(!/correct|right|better|stronger|wrong/i.test(q2.finding),
    'a point of order must not leak a view on the merits');
});

test('no ruling anywhere expresses a view on whether a claim is correct', () => {
  const r = run();
  for (const x of r.rulings) {
    assert.ok(!/\b(is correct|is wrong|should have won|is right)\b/i.test(`${x.finding} ${x.basis}`),
      `ruling on ${x.on} strays onto the merits`);
  }
  assert.match(r.refusal, /rules on order, never on merit/);
});

test('--strict fails while anything is out of order', () => {
  let code = 0;
  try {
    execFileSync('node', ['scripts/enoch.mjs', '--strict', '--no-color'], { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) { code = e.status; }
  const r = run();
  assert.equal(code, r.counts.out_of_order > 0 ? 1 : 0);
});

test('Enoch and the paralegal are distinct offices with distinct refusals', async () => {
  const para = JSON.parse(
    await readFile(new URL('../corpus/paralegal/integrity.json', import.meta.url), 'utf8'),
  );
  assert.notEqual(para.owns, integrity.owns);
  assert.ok(!para.not_a_vantage, 'the paralegal serves a claim; Enoch serves none');
  assert.match(para.declines, /Prediction/);
  assert.match(integrity.declines, /The debate itself/);
});
