// Opportunity radar.
//
// The workbooks this reads from contain real structure — fit scores, amounts,
// eligibility, deadlines, cost-of-living ratios — and not one formula across
// 4,300 populated cells. Every score in them was typed. That makes them a good
// data model and not an analysis, and the difference is the whole reason this
// module exists.
//
// It deliberately reuses what the simulator already proved out rather than
// inventing a second system:
//
//   attempts.js   an opportunity is a DOOR. Applied-and-rejected and never-applied
//                 are different findings, and never-applied is not evidence of
//                 anything. The most valuable cell in a pipeline is the one
//                 nobody has pushed.
//   transitions   a deadline is a PASSAGE. What decays across it is real and
//                 nothing in a spreadsheet models it.
//   sensitivity   a stipulated fit score is basis `none`. Ranking by it and
//                 calling the ranking a result is the failure this whole
//                 repository is built to catch.
//
// The categories are the ones that actually matter to the person using it:
// money, shelter, food, distribution, venue, and work. A pipeline that only
// tracks jobs misses most of how an artist actually survives a year.

import { classify } from './classify.js';

export const RETURNS = {
  money: { label: 'Money', gloss: 'Cash, stipend, fee, or award that lands in an account.' },
  shelter: { label: 'Shelter', gloss: 'Housing, residency with lodging, or a reduction in rent burden.' },
  food: { label: 'Food', gloss: 'Per diem, board, meals provided.' },
  distribution: { label: 'Distribution', gloss: 'The work reaches an audience it could not otherwise reach.' },
  venue: { label: 'Venue', gloss: 'A room, a stage, a wall, a slot.' },
  work: { label: 'Work', gloss: 'Ongoing employment or contracted engagement.' },
  standing: { label: 'Standing', gloss: 'A credential or affiliation that changes what else becomes reachable.' },
};

/** What it costs to find out. Not what it costs to win. */
export const EFFORT = {
  trivial: { label: 'Trivial', hours: 0.5, gloss: 'A form and a link.' },
  light: { label: 'Light', hours: 3, gloss: 'Existing materials, lightly tailored.' },
  moderate: { label: 'Moderate', hours: 12, gloss: 'A written statement and a tailored packet.' },
  heavy: { label: 'Heavy', hours: 40, gloss: 'A full proposal, budget, and letters.' },
};


const round = (n) => Math.round(n * 100) / 100;

/**
 * Score one opportunity.
 *
 * `fit` is carried through untouched and always reported with its basis, because
 * it was typed by a person and no arithmetic here makes it a measurement.
 * Returns, effort and the deadline date are NOT on the record — they are derived
 * by the named rules in classify.js, and every row carries which ones fired.
 */
export function score(op, { today = new Date(), hoursAvailable = 20 } = {}) {
  const derived = classify(op, { year: today.getUTCFullYear() });
  const effortKey = derived.effort;
  const effort = EFFORT[effortKey] ?? null;
  const returns = derived.returns.filter((r) => RETURNS[r]);

  // Money, where a range is known. Midpoint, and the range is reported too.
  const money = Array.isArray(op.amount_range) ? (op.amount_range[0] + op.amount_range[1]) / 2 : null;

  // Deadline pressure. A deadline is a passage; what matters is whether the
  // effort fits in the time left, not how far away the date is. A recurring
  // call has no date, so feasibility is unknown rather than true — an unknown
  // that reads as a pass is the failure this repository exists to catch.
  let days = null;
  let feasible = null;
  if (derived.deadline_iso && effort) {
    days = Math.ceil((new Date(`${derived.deadline_iso}T00:00:00Z`) - today) / 86400000);
    const hoursLeft = Math.max(0, days) * (hoursAvailable / 7);
    feasible = hoursLeft >= effort.hours;
  }

  // Attempt status, on the register's terms.
  const attempts = op.attempts ?? [];
  const attemptStatus = attempts.length === 0
    ? 'untried'
    : attempts.some((a) => a.outcome === 'accepted') ? 'landed'
      : attempts.some((a) => a.reached === 'submitted') ? 'submitted_no_result' : 'started';

  // Return per hour, where money AND an effort estimate are both known. Never a
  // ranking on its own — a residency that pays nothing and supplies shelter for
  // two months can beat a cash award, and the categories exist so that stays
  // visible.
  const perHour = money !== null && effort ? round(money / effort.hours) : null;

  return {
    id: op.id,
    org: op.org ?? op.role_type ?? op.metro,
    kind: op.kind ?? null,
    category: op.category ?? 'unknown',
    source_of_record: op.source_of_record ?? 'workbook',
    stage: op.stage ?? null,
    stage_label: op.stage_label ?? null,
    url: op.url ?? null,
    returns,
    return_labels: returns.map((r) => RETURNS[r].label),
    effort: effort ? { ...effort, key: effortKey } : null,
    money_midpoint: money,
    money_range: op.amount_range ?? null,
    return_per_hour: perHour,
    deadline_iso: derived.deadline_iso,
    deadline_text: op.deadline_text ?? null,
    recurring: derived.recurring,
    days_to_deadline: days,
    deadline_feasible: feasible,
    attempt_status: attemptStatus,
    fit: {
      value: op.fit_score ?? op.financial_score ?? null,
      basis: 'none',
      caution: 'Typed by hand into a workbook with no formulas. Rank by it if you like, but the ranking inherits its basis.',
    },
    derivation: { rules_fired: derived.rules_fired, provenance: derived.provenance },
    flags: flagsFor({ op, days, feasible, attemptStatus, returns, effort, derived }),
  };
}

function flagsFor({ op, days, feasible, attemptStatus, returns, effort, derived }) {
  const f = [];
  if (attemptStatus === 'untried') {
    f.push({ level: 'info', text: 'Never applied to. That is an absence, not a verdict — the cheapest information in the pipeline is one submission.' });
  }
  if (feasible === false) {
    f.push({ level: 'warn', text: `Not feasible at the derived effort in ${days} day(s) at the hours available. Either cut the effort or drop it, but do not carry it as live.` });
  }
  if (days !== null && days < 0) {
    f.push({ level: 'warn', text: `Deadline passed ${Math.abs(days)} day(s) ago. If it recurs, record the next cycle; if it does not, close it.` });
  }
  if (derived.recurring) {
    f.push({ level: 'info', text: `Recurring — the cell says ${JSON.stringify(String(op.deadline_text ?? '').slice(0, 32))} and names no date. Nothing schedules itself; the next cycle has to be looked up.` });
  }
  if (!returns.length) {
    f.push({ level: 'warn', text: 'No return category, and no rule fired to derive one. An opportunity whose return is unnamed cannot be compared to anything.' });
  }
  if (!effort) {
    f.push({ level: 'warn', text: 'No effort estimate, and no rule fired to derive one. Without it there is no feasibility and no return per hour.' });
  }
  if (returns.length && !returns.includes('money')) {
    f.push({ level: 'info', text: `Returns ${returns.join(', ')} rather than cash. Worth carrying — a pipeline that only counts money misses shelter, food and distribution, which are most of a year.` });
  }
  if ((op.fit_score ?? op.financial_score) != null && !op.amount_range) {
    f.push({ level: 'info', text: 'Scored for fit but no amount parsed. The score is doing all the work and it is a typed opinion.' });
  }
  return f;
}

/**
 * The board. Grouped by what it returns rather than ranked into one list,
 * because a single ranking forces cash and shelter onto one axis and they are
 * not on one axis.
 */
export function board(ops, opts = {}) {
  const rows = ops.map((o) => score(o, opts));

  const byReturn = {};
  for (const key of Object.keys(RETURNS)) {
    const hits = rows.filter((r) => r.returns.includes(key));
    if (hits.length) byReturn[key] = hits.slice().sort((a, b) => (b.return_per_hour ?? -1) - (a.return_per_hour ?? -1));
  }

  const untried = rows.filter((r) => r.attempt_status === 'untried');
  const infeasible = rows.filter((r) => r.deadline_feasible === false);
  const uncategorised = rows.filter((r) => !r.returns.length);
  const unscheduled = rows.filter((r) => r.deadline_iso === null);
  const noEffort = rows.filter((r) => r.effort === null);
  const totalHours = rows
    .filter((r) => r.attempt_status === 'untried' && r.deadline_feasible !== false && r.effort)
    .reduce((a, b) => a + b.effort.hours, 0);

  return {
    rows,
    by_return: byReturn,
    counts: {
      total: rows.length,
      untried: untried.length,
      infeasible: infeasible.length,
      uncategorised: uncategorised.length,
      unscheduled: unscheduled.length,
      no_effort: noEffort.length,
    },
    hours_to_clear_untried: round(totalHours),
    finding:
      `${rows.length} opportunities. ${untried.length} never attempted, which would take ${round(totalHours)} hours to clear at the derived efforts. ` +
      (infeasible.length ? `${infeasible.length} cannot be done in the time left and should be cut or descoped rather than carried as live. ` : '') +
      (unscheduled.length ? `${unscheduled.length} carry no date at all — recurring or unreadable — so nothing about them is on a calendar. ` : '') +
      (uncategorised.length ? `${uncategorised.length} have no return category and cannot be compared to anything. ` : '') +
      'Grouped by what each returns rather than ranked into one list, because cash and shelter are not on one axis and forcing them onto one hides the trade.',
    caution:
      'Every fit score here carries basis `none` — typed into a workbook containing no formulas. Returns, effort and dates carry basis `derived` and name the rule that produced them. Nothing in this module converts a typed score into a measurement, and any ordering that leans on fit inherits its basis.',
  };
}
