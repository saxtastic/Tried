// The attempt register.
//
// The forum module says which doors exist and what each costs in concession.
// This one says which have been tried, by whom, how far they got, and what
// stopped them. The difference is the difference between a posture and a
// measurement.
//
// The epistemics matter more than the tally, and one distinction carries the
// whole module: a door with many failed attempts and a door with no attempts are
// not the same finding, and collapsing them is the most common error in this
// space. Many failures is evidence the door is shut. NO ATTEMPTS IS NOT EVIDENCE
// OF ANYTHING. It is an absence, and absence of evidence gets reported here as
// absence rather than quietly scored as failure.
//
// That is not optimism. Donald v. United Klans is the case: nobody had run an
// agency theory against a klavern before. The door was not closed. It was
// unopened, and the register would have shown `untried` rather than `hopeless`.
//
// This module supplies the instrument. It does not supply the docket data, and
// it will not invent it — every cell that requires a real search is marked
// `owed` and stays that way until a paralegal with database access fills it.

/** How far an attempt got. Ordered; index is the measurement. */
export const STAGES = [
  'not_filed',
  'filed',
  'survived_dismissal',
  'discovery',
  'survived_summary_judgment',
  'trial',
  'verdict_for_claimant',
  'remedy_executed',
];

export const STAGE_GLOSS = {
  not_filed: 'No recorded attempt.',
  filed: 'Brought, and stopped before any court tested the merits.',
  survived_dismissal: 'The theory was held legally sufficient — the door opens at least this far.',
  discovery: 'Reached the record. Where a claim depends on documents the institution holds, this is the threshold that matters most.',
  survived_summary_judgment: 'A court held a reasonable factfinder could find for the claimant.',
  trial: 'Tried on the facts.',
  verdict_for_claimant: 'Won.',
  remedy_executed: 'Won and collected. The only stage at which anything actually moved.',
};

export function stageIndex(s) {
  const i = STAGES.indexOf(s);
  return i < 0 ? 0 : i;
}

/**
 * Stratify one door.
 *
 * @param {object} door { forum, theory, attempts: [{who, year, reached, stopped_by, source}] }
 */
export function stratify(door) {
  const attempts = door.attempts ?? [];
  const n = attempts.length;

  if (n === 0) {
    return {
      ...door,
      attempts: [],
      count: 0,
      status: 'untried',
      furthest: 'not_filed',
      furthest_index: 0,
      measurement: 'No recorded attempt.',
      reading:
        'Untried is not closed. Nothing here says this door fails; it says nobody in the searched record has pushed it. ' +
        'That is the one cell where the absence of a result is not a result, and it is the cell most often misread as hopeless.',
      confidence: 'none — depends entirely on how the search was scoped',
      owed: door.owed ?? 'A docket search wide enough to say whether the absence is real or an artifact of the query.',
    };
  }

  const idx = attempts.map((a) => stageIndex(a.reached));
  const furthestIndex = Math.max(...idx);
  const furthest = STAGES[furthestIndex];
  const executed = attempts.filter((a) => a.reached === 'remedy_executed').length;
  const pastDismissal = attempts.filter((a) => stageIndex(a.reached) >= stageIndex('survived_dismissal')).length;

  const stoppers = {};
  for (const a of attempts) {
    if (!a.stopped_by) continue;
    stoppers[a.stopped_by] = (stoppers[a.stopped_by] ?? 0) + 1;
  }
  const dominant = Object.entries(stoppers).sort((x, y) => y[1] - x[1])[0] ?? null;

  let status;
  if (executed > 0) status = 'open';
  else if (pastDismissal > 0) status = 'partially_open';
  else status = 'closed_early';

  return {
    ...door,
    count: n,
    status,
    furthest,
    furthest_index: furthestIndex,
    reached_discovery: attempts.filter((a) => stageIndex(a.reached) >= stageIndex('discovery')).length,
    executed,
    past_dismissal: pastDismissal,
    stopped_by: stoppers,
    dominant_bar: dominant ? { bar: dominant[0], times: dominant[1] } : null,
    measurement:
      `${n} recorded attempt${n === 1 ? '' : 's'}; ${pastDismissal} past dismissal; ${executed} reached a remedy actually executed. ` +
      `Furthest: ${furthest}.`,
    reading: readingFor(status, dominant, furthest),
    confidence: door.confidence ?? 'sourced where each attempt names a source; otherwise owed',
  };
}

function readingFor(status, dominant, furthest) {
  const bar = dominant ? ` The same thing stops it each time: ${dominant[0]} (${dominant[1]}×).` : '';
  switch (status) {
    case 'open':
      return `This door has been opened and something moved through it. It is not theoretical.${bar}`;
    case 'partially_open':
      return (
        `The theory survives a legal-sufficiency test, so the door is not shut as a matter of law — it stops on facts, proof, or attrition.${bar} ` +
        `Reaching ${furthest} tells you what a well-resourced attempt can expect, not what it will get.`
      );
    default:
      return (
        `No recorded attempt has survived a threshold motion. That is a measurement of the door, not of any claimant.${bar} ` +
        'A door that closes this early usually closes on a rule rather than on a record, which is what makes it a legislative target rather than a litigation one.'
      );
  }
}

/**
 * The register: every door, stratified, sorted so the most informative cells
 * come first — what has actually worked, then what is untried, then what is shut.
 */
export function register(doors = []) {
  const rows = doors.map(stratify);

  const open = rows.filter((r) => r.status === 'open');
  const partial = rows.filter((r) => r.status === 'partially_open');
  const untried = rows.filter((r) => r.status === 'untried');
  const closed = rows.filter((r) => r.status === 'closed_early');

  const sourced = rows.filter((r) => (r.attempts ?? []).some((a) => a.source));
  const coverage = rows.length ? sourced.length / rows.length : 0;

  return {
    rows: [...open, ...partial, ...untried, ...closed],
    counts: { open: open.length, partially_open: partial.length, untried: untried.length, closed_early: closed.length },
    coverage: {
      doors_with_any_sourced_attempt: sourced.length,
      of: rows.length,
      ratio: Math.round(coverage * 100) / 100,
      basis: coverage === 1 ? 'sourced' : 'none',
      owed:
        'A docket search per door — Justia, CourtListener, Lexis or Nexis — recording for each attempt the court, the year, the stage reached, and what stopped it. ' +
        'Until that exists this register measures what has been entered, not what has been attempted, and those are different things.',
    },
    finding: registerFinding({ open, partial, untried, closed, coverage }),
  };
}

function registerFinding({ open, partial, untried, closed, coverage }) {
  const parts = [];
  if (open.length) {
    parts.push(`${open.length} door${open.length === 1 ? ' has' : 's have'} been opened and executed: ${open.map((r) => r.theory).join(', ')}. Those are not arguments, they are precedents with a remedy behind them.`);
  }
  if (untried.length) {
    parts.push(
      `${untried.length} untried: ${untried.map((r) => r.theory).join(', ')}. ` +
        'Untried is the highest-information cell in this table and the easiest to misread. It says nobody has pushed, not that pushing fails.',
    );
  }
  if (closed.length) {
    parts.push(`${closed.length} closed before any court tested the merits, which makes ${closed.length === 1 ? 'it' : 'them'} a drafting problem rather than a proof problem.`);
  }
  if (partial.length) {
    parts.push(`${partial.length} survive${partial.length === 1 ? 's' : ''} a threshold motion but stop short of a remedy — where attrition rather than doctrine does the work.`);
  }
  parts.push(
    coverage === 1
      ? 'Every door carries at least one sourced attempt.'
      : 'This register is incomplete and says so: doors without a sourced attempt are recorded as unsearched, never as unattempted. The instrument is here; the docket work is owed.',
  );
  return parts.join(' ');
}
