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

// -- the workflow that runs it --------------------------------------------
//
// What is NOT covered here: the exit codes `--known-open` produces. Testing
// those means running the runner, and gate G1 is `npm test`, so a test that ran
// it would run itself. The three refusals were exercised by hand on 2026-09-01
// — unknown id → 1, stale allowance → 1, uncovered failure → 1, covered-only →
// 0 — and that is a measurement this suite does not repeat. What it can hold is
// the drift that would actually happen: the workflow naming an id the protocol
// no longer has.

const workflow = await readFile(new URL('../.github/workflows/gates.yml', import.meta.url), 'utf8');

test('the workflow runs the protocol and reports what is outstanding', () => {
  assert.match(workflow, /npm run complete/, 'CI must run the protocol, not a hand-picked subset of it');
  assert.match(workflow, /npm run outstanding/, 'every check produces the list of outstanding requests and clarifications');
  assert.match(workflow, /GITHUB_STEP_SUMMARY/, 'the result has to be readable without opening a log');
});

test('every id the workflow holds open is an id the protocol still has', () => {
  const ids = new Set([...protocol.gates, ...protocol.retests, ...protocol.benchmarks].map((x) => x.id));
  const declared = [...workflow.matchAll(/--known-open\s+([A-Za-z0-9, ]+?)(?:\s*\||\s*$)/gm)]
    .flatMap((m) => m[1].split(/[,\s]+/))
    .filter(Boolean);
  assert.ok(declared.length, 'if the workflow stops holding anything open, delete this expectation with it');
  for (const id of declared) {
    assert.ok(ids.has(id), `the workflow waits on "${id}", which the protocol no longer declares — rename it or drop the allowance`);
  }
});

test('the allowance lives in the workflow and never in the protocol', () => {
  const serialised = JSON.stringify(protocol);
  assert.ok(
    !/known[_-]?open|allowance|excused|waived/i.test(serialised),
    'a record that can excuse a failure against itself is the structured-compliance shield, not a protocol',
  );
});

test('the runner refuses an allowance that is wrong, stale, or too narrow', () => {
  assert.match(runner, /no such id/, 'an allowance naming nothing must fail rather than look like coverage');
  assert.match(runner, /stale allowance/, 'an allowance for something now passing must fail until it is deleted');
  assert.match(runner, /not covered/, 'a failure outside the allowance must fail');
  assert.match(runner, /never the verdict/, 'the allowance must be documented as touching the exit code only');
});
