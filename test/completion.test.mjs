import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// The protocol is checked here; the runner is NOT executed from a test.
// Gate G1 is `npm test`, so a test that ran the runner would run itself. What
// can be asserted without recursion is that the record is well formed and that
// every check it names actually exists — which is the failure mode that would
// otherwise show up as a silent `test_retest` nobody reads.

const protocol = JSON.parse(
  await readFile(new URL('../corpus/enoch/protocol/completion.json', import.meta.url), 'utf8'),
);
const runner = await readFile(new URL('../scripts/completion.mjs', import.meta.url), 'utf8');

test('completion resolves three ways and no others', () => {
  assert.deepEqual(Object.keys(protocol.definition.verdicts).sort(), ['complete', 'incomplete', 'test_retest']);
  for (const [name, gloss] of Object.entries(protocol.definition.verdicts)) {
    assert.ok(gloss.length > 40, `${name} needs a real definition, not a label`);
  }
  assert.match(protocol.definition.verdicts.test_retest, /names the measurement/);
});

test('every gate names a command and who administers it', () => {
  assert.ok(protocol.gates.length, 'a protocol with no gates asserts nothing');
  for (const g of protocol.gates) {
    assert.ok(Array.isArray(g.run) && g.run.length, `${g.id} must name a command`);
    assert.ok(g.asserts, `${g.id} must say what passing it establishes`);
    assert.ok(g.administered_by, `${g.id} must name an administrator`);
  }
});

test('every retest compares two runs of a producer that writes something checkable', () => {
  assert.ok(protocol.retests.length, 'retest is a gate here, not a nicety');
  for (const t of protocol.retests) {
    assert.ok(Array.isArray(t.run) && t.run.length, `${t.id} must name a producer`);
    assert.match(t.asserts, /identical|same|byte/i, `${t.id} must assert stability, not merely success`);
  }
  assert.match(protocol.definition.retest_rule, /byte-identical/);
});

test('every benchmark names a check the runner actually implements', () => {
  const implemented = new Set([...runner.matchAll(/^  (\w+)\(bm\)/gm)].map((m) => m[1]));
  assert.ok(implemented.size, 'the check vocabulary could not be read out of the runner');
  for (const b of protocol.benchmarks) {
    assert.ok(b.check, `${b.id} must name a check`);
    assert.ok(implemented.has(b.check), `${b.id} names check "${b.check}", which the runner does not implement`);
    assert.ok(b.project, `${b.id} must say whose it is`);
    assert.ok(b.statement && b.met_when, `${b.id} must state the claim and what would satisfy it`);
  }
});

test('the protocol carries no executable code — a record must not decide what passes it', () => {
  const serialised = JSON.stringify(protocol);
  assert.ok(!/=>|function\s*\(/.test(serialised), 'the protocol is data; the check vocabulary lives in the runner');
});

test('the protocol declares what it refuses to score', () => {
  assert.ok(protocol.not_benchmarks?.length >= 3, 'a definition of completion that scores everything is scoring opinions');
  assert.match(protocol.not_benchmarks.join(' '), /owner/i);
});

test('nothing in the protocol lets a script answer a question put to a person', () => {
  const bm = protocol.benchmarks.find((b) => b.check === 'owner_items_are_owed');
  assert.ok(bm, 'the owner-items benchmark must exist');
  assert.match(protocol.administration.owner, /never derived/);
  assert.match(protocol.definition.why_not_a_checklist, /awaiting_owner/);
});

test('a skipped gate is never reported as a passed gate', () => {
  assert.match(runner, /A skipped gate is not a passed gate/);
  assert.match(runner, /skipped\.length \? "test_retest"|unread\.length \|\| skipped\.length/);
});
