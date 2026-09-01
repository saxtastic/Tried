// Browser driver for the radar. Same engine the CLI runs — one implementation.
//
// The corpus arrives as a module rather than over fetch: the venue's
// Content-Security-Policy is `default-src 'none'` with no connect-src, so fetch
// and XHR are refused outright. corpus.bundle.js is generated from
// public/radar/corpus/*.json by `npm run build:corpus`, and `npm test` asserts
// the two stay in step.

import { board, RETURNS } from './engine/radar.js';
import { reconcile } from './engine/reconcile.js';
import { openCalls, locations, roles, registry } from './corpus.bundle.js';

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    // Styles go through CSSOM. A `style` attribute is inline style, which the
    // venue's Content-Security-Policy refuses; assigning through the CSSOM is
    // not covered by style-src and applies normally.
    else if (k === 'style') { if (v) n.style.cssText = v; }
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return n;
};

// A role is an opportunity too — ongoing work is a return, and leaving it out
// of the board is how a pipeline ends up counting only awards.
const ROLES = roles.map((r) => ({
  id: r.id,
  category: 'role',
  kind: r.role_type,
  org: r.role_type,
  amount_range: r.salary_range,
  amount_text: r.salary_range_text,
  summary: r.why_competitive,
  eligibility: r.without_references,
  attempts: [],
  provenance: r.provenance,
  source: r.source,
}));

// The workbook rows and the fellowships reference overlap. Reconcile before
// scoring: where both carry a call, the record that was read off the
// organisation's own page wins, and the workbook's fit score rides along
// carrying its basis. Near-matches are reported, never merged.
const RECONCILED = reconcile({ workbook: openCalls, registry: registry.calls, workflow: registry.workflow });

const OPS = [...RECONCILED.rows, ...ROLES];

const state = {
  hours: 20,
  today: new Date(),
  show: new Set(['untried', 'live', 'recurring']),
};

const money = (n) => (n === null || n === undefined ? '—' : '$' + Math.round(n).toLocaleString('en-US'));

// ---- controls -------------------------------------------------------------

const hoursInput = document.getElementById('hours');
const todayInput = document.getElementById('today');
const filtersBox = document.getElementById('filters');

const iso = (d) => d.toISOString().slice(0, 10);
todayInput.value = iso(state.today);

const FILTERS = [
  ['untried', 'Never tried'],
  ['live', 'On a date'],
  ['recurring', 'Recurring'],
  ['infeasible', "Won't fit"],
];
for (const [key, label] of FILTERS) {
  const id = `f-${key}`;
  filtersBox.append(el('label', { class: 'toggle', for: id },
    el('input', { type: 'checkbox', id, checked: state.show.has(key) ? '' : null, 'data-filter': key }),
    label));
}

const onChange = () => {
  state.hours = Math.max(1, Number(hoursInput.value) || 20);
  const d = new Date(`${todayInput.value}T00:00:00Z`);
  if (!Number.isNaN(d.getTime())) state.today = d;
  state.show = new Set(
    [...filtersBox.querySelectorAll('input[data-filter]')]
      .filter((i) => i.checked)
      .map((i) => i.getAttribute('data-filter')),
  );
  render();
};

hoursInput.addEventListener('change', onChange);
todayInput.addEventListener('change', onChange);
filtersBox.addEventListener('change', onChange);
document.getElementById('rerun').addEventListener('click', render);

document.getElementById('download').addEventListener('click', () => {
  const payload = JSON.stringify(current, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = el('a', { href: url, download: 'radar.json' });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---- render ---------------------------------------------------------------

let current = null;

function keep(row) {
  if (state.show.has('untried') && row.attempt_status === 'untried') return true;
  if (state.show.has('live') && row.deadline_iso && row.deadline_feasible !== false) return true;
  if (state.show.has('recurring') && row.recurring) return true;
  if (state.show.has('infeasible') && row.deadline_feasible === false) return true;
  return false;
}

function rowNode(row) {
  const meta = [
    row.kind,
    row.effort ? `${row.effort.label.toLowerCase()} · ${row.effort.hours}h` : 'effort unknown',
    row.money_range ? money(row.money_midpoint) : 'amount unparsed',
    row.recurring ? 'recurring' : row.deadline_iso ? `${row.days_to_deadline}d left` : 'no date',
  ].filter(Boolean);

  return el('article', { class: 'op', 'data-status': row.attempt_status, 'data-feasible': String(row.deadline_feasible) },
    el('h4', {}, row.org ?? row.id),
    el('p', { class: 'op-meta' }, meta.join(' · ')),
    el('ul', { class: 'tags' }, [
      ...row.return_labels.map((l) => el('li', {}, l)),
      row.stage_label ? el('li', { class: 'tag-stage' }, row.stage_label) : null,
      el('li', { class: 'tag-src' }, row.source_of_record === 'fellowships-registry' ? 'sourced' : 'workbook'),
    ]),
    row.return_per_hour !== null
      ? el('p', { class: 'op-rate' }, `${money(row.return_per_hour)} per hour of application, at the derived effort.`)
      : null,
    el('ul', { class: 'flags' }, row.flags.map((f) => el('li', { 'data-level': f.level }, f.text))),
    el('details', { class: 'why' },
      el('summary', {}, `Why these fields (${row.derivation.rules_fired.length} rule(s))`),
      el('ul', { class: 'rules' }, row.derivation.rules_fired.map((r) =>
        el('li', {}, el('b', {}, r.rule), ' — ', r.because))),
      el('p', { class: 'basis' }, row.fit.value === null
        ? 'No fit score on this row.'
        : `Fit ${row.fit.value} · basis none. ${row.fit.caution}`)),
  );
}

function render() {
  const out = document.getElementById('board');
  out.replaceChildren();

  const b = board(OPS, { today: state.today, hoursAvailable: state.hours });
  current = b;

  const counts = document.getElementById('counts');
  counts.replaceChildren(
    ...Object.entries({
      total: b.counts.total,
      untried: b.counts.untried,
      'no date': b.counts.unscheduled,
      "won't fit": b.counts.infeasible,
      'hours to clear': b.hours_to_clear_untried,
    }).flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, String(v))]),
  );

  out.append(el('p', { class: 'finding' }, b.finding));
  out.append(el('p', { class: 'finding' }, RECONCILED.finding));

  if (RECONCILED.possible_duplicates.length) {
    out.append(el('section', { class: 'group' },
      el('div', { class: 'section-head' },
        el('h3', {}, 'Owed a decision'),
        el('p', {}, 'Two rows that look like the same call and did not match on a key. Both are carried until someone says which they are.')),
      el('ul', { class: 'flags' }, RECONCILED.possible_duplicates.map((d) =>
        el('li', { 'data-level': 'warn' }, `${d.workbook} ↔ ${d.registry} (${d.score}) — ${d.owed}`)))));
  }

  let shown = 0;
  for (const [key, rows] of Object.entries(b.by_return)) {
    const kept = rows.filter(keep);
    if (!kept.length) continue;
    shown += kept.length;
    out.append(el('section', { class: 'group' },
      el('div', { class: 'section-head' },
        el('h3', {}, RETURNS[key].label),
        el('p', {}, RETURNS[key].gloss)),
      el('div', { class: 'ops' }, kept.map(rowNode))));
  }

  if (!shown) {
    out.append(el('p', { class: 'finding' },
      'Nothing matches the current filters. That is a filter result, not a finding about the pipeline.'));
  }

  out.append(el('section', { class: 'group' },
    el('div', { class: 'section-head' },
      el('h3', {}, 'Where'),
      el('p', {}, 'Metros, on rent as a share of take-home. A comparison, not an opportunity — nothing here is applied to.')),
    el('div', { class: 'table-wrap' },
      el('table', { class: 'metros' },
        el('thead', {}, el('tr', {}, ['Metro', 'Rent', 'Take-home', 'Rent share'].map((h) => el('th', {}, h)))),
        el('tbody', {}, locations.map((l) => el('tr', {},
          el('td', {}, l.metro),
          el('td', {}, l.median_1br_rent ?? '—'),
          el('td', {}, l.take_home_mo ?? '—'),
          el('td', {}, l.rent_pct_take_home ?? '—'))))))));

  out.append(el('p', { class: 'caution' }, b.caution));
}

render();
