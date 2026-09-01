import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { renderRadarBundle, RADAR_BUNDLE_PATH } from '../scripts/build-corpus.mjs';
import { board, score, RETURNS, EFFORT } from '../public/radar/engine/radar.js';
import { classify, deadlineOf, RETURN_RULES, EFFORT_RULES } from '../public/radar/engine/classify.js';

const read = async (f) => JSON.parse(await readFile(new URL(`../public/radar/corpus/${f}`, import.meta.url), 'utf8'));
const openCalls = await read('open-calls.json');
const locations = await read('locations.json');
const roles = await read('roles.json');

const TODAY = new Date('2026-09-01T00:00:00Z');

// -- the bundle --------------------------------------------------------------

test('the generated radar bundle is in step with the JSON it is built from', async () => {
  const onDisk = await readFile(RADAR_BUNDLE_PATH, 'utf8');
  assert.equal(
    onDisk,
    await renderRadarBundle(),
    'public/radar/corpus.bundle.js is stale — run `npm run build:corpus` after editing public/radar/corpus/*.json',
  );
});

test('the radar page does not reach for the network and sets no inline styles', async () => {
  const app = await readFile(new URL('../public/radar/app.js', import.meta.url), 'utf8');
  assert.ok(!/\bfetch\s*\(/.test(app), 'app.js must not fetch — the venue CSP is default-src none with no connect-src');
  assert.ok(!/XMLHttpRequest/.test(app), 'app.js must not use XHR for the same reason');
  assert.ok(
    !/setAttribute\(\s*['"]style['"]/.test(app),
    'inline style attributes are refused under style-src self; assign through CSSOM instead',
  );
});

// -- the derivation ----------------------------------------------------------

test('a rolling deadline is recorded as recurring and never becomes a date', () => {
  for (const text of ['Rolling (quarterly)', 'Ongoing', 'Year-round', 'Rolling']) {
    const d = deadlineOf(text);
    assert.equal(d.iso, null, `${text} must not be turned into a date`);
    assert.equal(d.recurring, true);
  }
});

test('a deadline with no year says so rather than passing off the guess', () => {
  const d = deadlineOf('March 15', { year: 2026 });
  assert.equal(d.iso, '2026-03-15');
  assert.equal(d.assumed_year, true);
  const c = classify({ deadline_text: 'March 15' }, { year: 2026 });
  assert.match(c.provenance.deadline_iso.note, /YEAR ASSUMED/);
});

test('an unreadable deadline stays unscheduled and owes a date', () => {
  const c = classify({ deadline_text: 'ask the program officer' });
  assert.equal(c.deadline_iso, null);
  assert.equal(c.recurring, false);
  assert.equal(c.provenance.deadline_iso.basis, 'none');
  assert.ok(c.provenance.deadline_iso.owed);
});

test('every derived field names the rule that produced it', () => {
  const c = classify({ kind: 'Residency', amount_range: [1000, 1000], deadline_text: '2026-11-01' });
  assert.equal(c.provenance.returns.basis, 'derived');
  assert.match(c.provenance.returns.note, /classify\.js/);
  assert.equal(c.provenance.effort.basis, 'derived');
  assert.ok(c.rules_fired.length >= 3, 'a residency with an amount and a date fires a return, an effort and a date rule');
  for (const r of c.rules_fired) assert.ok(r.because, `${r.rule} must say why it fired`);
});

test('a row nothing fires on is left empty rather than filled in', () => {
  const c = classify({ kind: 'Unclassifiable thing' });
  assert.deepEqual(c.returns, []);
  assert.equal(c.effort, null);
  assert.equal(c.provenance.returns.basis, 'none');
  assert.equal(c.provenance.effort.basis, 'none');
  assert.ok(c.provenance.returns.owed);
});

test('a field already on the record beats the rule that would derive it', () => {
  const c = classify({ kind: 'Residency', returns: ['money'], effort: 'trivial' });
  assert.deepEqual(c.returns, ['money']);
  assert.equal(c.effort, 'trivial');
});

test('every rule declares the fields it reads, so it can be checked without reading the code', () => {
  for (const r of [...RETURN_RULES, ...EFFORT_RULES]) {
    assert.ok(Array.isArray(r.on) && r.on.length, `${r.id} must declare what it reads`);
    assert.ok(r.because, `${r.id} must say why`);
  }
});

// -- scoring -----------------------------------------------------------------

test('a fit score is reported with basis none whatever its value', () => {
  for (const value of [10, 1, 0]) {
    const r = score({ id: 'x', kind: 'Grant', fit_score: value }, { today: TODAY });
    assert.equal(r.fit.value, value);
    assert.equal(r.fit.basis, 'none');
    assert.match(r.fit.caution, /no formulas/);
  }
});

test('an unknown effort makes feasibility unknown, never a pass', () => {
  const r = score({ id: 'x', kind: 'Unclassifiable thing', deadline_text: '2026-09-05' }, { today: TODAY });
  assert.equal(r.effort, null);
  assert.equal(r.deadline_feasible, null, 'unknown must not read as feasible');
  assert.equal(r.return_per_hour, null);
  assert.ok(r.flags.some((f) => f.level === 'warn' && /effort estimate/.test(f.text)));
});

test('a recurring call is not scored as feasible on a date it does not have', () => {
  const r = score({ id: 'x', kind: 'Grant', amount_range: [1000, 1000], deadline_text: 'Rolling' }, { today: TODAY });
  assert.equal(r.recurring, true);
  assert.equal(r.deadline_iso, null);
  assert.equal(r.deadline_feasible, null);
  assert.ok(r.flags.some((f) => /Recurring/.test(f.text)));
});

test('a deadline that cannot fit the effort is called infeasible rather than carried as live', () => {
  const r = score(
    { id: 'x', kind: 'Grant', amount_range: [90000, 90000], deadline_text: '2026-09-03' },
    { today: TODAY, hoursAvailable: 7 },
  );
  assert.equal(r.effort.key, 'heavy');
  assert.equal(r.deadline_feasible, false);
  assert.ok(r.flags.some((f) => f.level === 'warn' && /Not feasible/.test(f.text)));
});

test('never applied to is reported as an absence, not as a failure', () => {
  const r = score({ id: 'x', kind: 'Grant', attempts: [] }, { today: TODAY });
  assert.equal(r.attempt_status, 'untried');
  const flag = r.flags.find((f) => /Never applied/.test(f.text));
  assert.ok(flag, 'an untried opportunity must say so in plain words');
  assert.equal(flag.level, 'info', 'untried is not a warning — it is an absence of information');
});

test('applied-and-nothing-back is a different status from never applied', () => {
  const submitted = score({ id: 'x', kind: 'Grant', attempts: [{ reached: 'submitted' }] }, { today: TODAY });
  const landed = score({ id: 'y', kind: 'Grant', attempts: [{ reached: 'submitted', outcome: 'accepted' }] }, { today: TODAY });
  assert.equal(submitted.attempt_status, 'submitted_no_result');
  assert.equal(landed.attempt_status, 'landed');
});

// -- the board ---------------------------------------------------------------

test('the board groups by return rather than ranking cash and shelter on one axis', () => {
  const b = board(
    [
      { id: 'res', kind: 'Residency', amount_range: [750, 750], deadline_text: 'Rolling' },
      { id: 'cash', kind: 'Grant', amount_range: [5000, 5000], deadline_text: 'Rolling' },
    ],
    { today: TODAY },
  );
  assert.ok(b.by_return.shelter.some((r) => r.id === 'res'));
  assert.ok(b.by_return.money.some((r) => r.id === 'cash'));
  assert.ok(b.by_return.money.some((r) => r.id === 'res'), 'a residency that also pays belongs in both groups');
  assert.match(b.finding, /not on one axis/);
  assert.ok(!('rank' in b), 'there is deliberately no single ranking');
});

test('hours to clear counts only what is untried, feasible and has an effort', () => {
  const b = board(
    [
      { id: 'a', kind: 'Grant', amount_range: [1000, 1000], deadline_text: 'Rolling' },
      { id: 'b', kind: 'Grant', amount_range: [1000, 1000], deadline_text: 'Rolling', attempts: [{ reached: 'submitted' }] },
      { id: 'c', kind: 'Unclassifiable thing' },
    ],
    { today: TODAY },
  );
  assert.equal(b.hours_to_clear_untried, EFFORT.light.hours, 'only the untried, estimable row counts');
  assert.equal(b.counts.no_effort, 1);
  assert.equal(b.counts.uncategorised, 1);
});

test('the board is deterministic — the same record and the same day give the same bytes', () => {
  const once = JSON.stringify(board(openCalls, { today: TODAY }));
  const twice = JSON.stringify(board(openCalls, { today: TODAY }));
  assert.equal(once, twice);
});

test('the board reports its own basis rather than presenting a ranking as a result', () => {
  const b = board(openCalls, { today: TODAY });
  assert.match(b.caution, /basis `none`/);
  assert.match(b.caution, /basis `derived`/);
});

// -- the corpus --------------------------------------------------------------

test('every extracted record carries a source and a per-field provenance', () => {
  for (const rows of [openCalls, locations, roles]) {
    for (const r of rows) {
      assert.ok(r.id, 'every record needs an id');
      assert.ok(r.source?.file && r.source?.sheet, `${r.id} must say which sheet it came off`);
      assert.ok(r.provenance && Object.keys(r.provenance).length, `${r.id} must carry provenance`);
      for (const [field, p] of Object.entries(r.provenance)) {
        assert.ok(['confirmed', 'sourced', 'derived', 'none'].includes(p.basis), `${r.id}.${field} has basis ${p.basis}`);
        if (p.basis === 'none') assert.ok(p.owed ?? p.note, `${r.id}.${field} is basis none and must say what is owed`);
      }
    }
  }
});

test('ids are unique — the same workbook was uploaded twice and the duplicates were collapsed', () => {
  for (const rows of [openCalls, locations, roles]) {
    const ids = rows.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((v, i) => ids.indexOf(v) !== i)}`);
  }
});

test('no typed score anywhere in the corpus is recorded as computed', () => {
  const scored = [
    ...openCalls.filter((o) => o.fit_score != null).map((o) => [o, 'fit_score']),
    ...locations.filter((l) => l.financial_score != null).map((l) => [l, 'financial_score']),
  ];
  assert.ok(scored.length, 'the workbooks do contain typed scores; if this is empty the extractor broke');
  for (const [rec, field] of scored) {
    assert.equal(rec.provenance[field].basis, 'none', `${rec.id}.${field} must not claim to be derived`);
    assert.match(rec.provenance[field].note, /not one formula/);
  }
});

test('every return category the engine can emit is documented', () => {
  const emitted = new Set(RETURN_RULES.flatMap((r) => r.gives));
  for (const key of emitted) assert.ok(RETURNS[key], `rule emits ${key} with no entry in RETURNS`);
  for (const [key, v] of Object.entries(RETURNS)) assert.ok(v.label && v.gloss, `${key} needs a label and a gloss`);
});

test('the bundled corpus is the real extraction, not a sample', () => {
  assert.ok(openCalls.length >= 10, 'open calls');
  assert.ok(locations.length >= 12, 'locations');
  assert.ok(roles.length >= 6, 'roles');
  const b = board(openCalls, { today: TODAY });
  assert.equal(b.counts.untried, openCalls.length, 'nothing in the workbook records an outcome, so everything reads untried');
});

test('the effort rules are ordered so size beats kind at both ends and a residency sits between', () => {
  const eff = (op) => score({ id: 'x', ...op }, { today: TODAY }).effort?.key;
  assert.equal(eff({ kind: 'Research Grant', amount_range: [90000, 90000] }), 'heavy', 'a $90k anything is heavy');
  assert.equal(eff({ kind: 'Residency', amount_range: [750, 750] }), 'moderate', 'a residency is a full packet at any stipend');
  assert.equal(eff({ kind: 'Award', amount_range: [1000, 1000] }), 'light', 'a $1k award is not a twelve-hour packet');
  assert.equal(eff({ kind: 'Micro-Grant' }), 'trivial');
  assert.equal(eff({ kind: 'Grant' }), 'moderate', 'a grant with no amount falls to the middle');
  assert.deepEqual(
    EFFORT_RULES.map((r) => r.id),
    ['E1', 'E2', 'E3', 'E4', 'E5'],
    'the order is the argument; changing it must show up in the diff',
  );
});
