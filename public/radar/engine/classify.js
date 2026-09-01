// Deriving the fields the workbook never held.
//
// The workbooks record what an opportunity IS ("Residency", "Research Grant")
// and what it pays. They do not record what it RETURNS, what it COSTS to apply,
// or when the deadline actually falls as a date. Those three are the only
// fields the board needs and the only three that were missing, which is not a
// coincidence: they are the fields that would have had to be computed, and
// there is not one formula in the four workbooks.
//
// So they are derived here, by rules that are written down, named, and reported
// on every row they touch. That is the difference between this and the sheet:
// not that the numbers are better, but that each one says which rule produced
// it and can therefore be argued with. A rule that does not fire yields `null`
// and basis `none`. Nothing is guessed into place to make a row look complete.

/**
 * Return-category rules, in order. First match on each category wins.
 * `on` names the fields the rule reads, so a reader can check it against the
 * corpus without reading this file.
 */
export const RETURN_RULES = [
  {
    id: 'R1',
    gives: ['shelter', 'food', 'venue', 'distribution'],
    on: ['kind'],
    when: (op) => /residenc|fellowship school|colony/i.test(txt(op.kind)),
    because: 'A residency supplies a room and, at these institutions, board. That is shelter and food whether or not it also pays.',
  },
  {
    id: 'R2',
    gives: ['money'],
    on: ['kind', 'amount_range'],
    when: (op) => /grant|award|fund|prize|micro/i.test(txt(op.kind)) || Array.isArray(op.amount_range),
    because: 'A grant, award or parsed dollar range lands as cash.',
  },
  {
    id: 'R3',
    gives: ['money', 'standing'],
    on: ['kind'],
    when: (op) => /fellowship/i.test(txt(op.kind)),
    because: 'A fellowship pays and is also an affiliation, which changes what else becomes reachable.',
  },
  {
    id: 'R4',
    gives: ['distribution', 'venue'],
    on: ['kind', 'summary'],
    when: (op) => /exhibit|performance|showcase|festival|commission|tour/i.test(txt(op.kind, op.summary)),
    because: 'The named return is an audience and a room rather than a payment.',
  },
  {
    id: 'R5',
    gives: ['money'],
    on: ['kind', 'summary'],
    when: (op) => /emergency|relief|assistance/i.test(txt(op.kind, op.summary)),
    because: 'Relief funds pay, and they pay against a hardship rather than a project.',
  },
  {
    id: 'R6',
    gives: ['work', 'money'],
    on: ['category'],
    when: (op) => op.category === 'role',
    because: 'A role is ongoing work, and ongoing work is a different return from a one-time award.',
  },
];

/**
 * Effort rules. What it costs to FIND OUT, not what it costs to win.
 * These are the estimate the owner has to live with, so they are conservative:
 * where nothing fires, the answer is `null` and the row says so.
 */
export const EFFORT_RULES = [
  { id: 'E1', gives: 'trivial', on: ['kind', 'summary'], when: (op) => /micro|open mic|drop-in/i.test(txt(op.kind, op.summary)), because: 'A micro-grant or a drop-in slot is a form and a link.' },
  { id: 'E2', gives: 'heavy', on: ['amount_range'], when: (op) => (op.amount_range?.[1] ?? 0) >= 50000, because: 'Anything at or above $50k wants a budget, a narrative and letters, whatever it is called.' },
  { id: 'E3', gives: 'moderate', on: ['kind'], when: (op) => /residenc|fellowship|colony/i.test(txt(op.kind)), because: 'A residency or fellowship wants a statement, work samples and a tailored packet — the stipend does not change that.' },
  { id: 'E4', gives: 'light', on: ['amount_range'], when: (op) => (op.amount_range?.[1] ?? Infinity) <= 5000, because: 'A small award takes existing materials, lightly tailored.' },
  { id: 'E5', gives: 'moderate', on: ['kind'], when: (op) => /grant|award|fund|prize/i.test(txt(op.kind)), because: 'Anything else called a grant or award sits in the middle by default.' },
];

// Order matters and is the argument, not an implementation detail: size beats
// kind at the top and the bottom (a $90k anything is heavy, a $1k award is
// light), but a residency is a full packet at any stipend, so it sits between
// them. Disagree with that and the fix is to move a rule, which is visible in
// the diff and reported on every row it changes.

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

/**
 * Read a deadline out of the cell text.
 *
 * Returns `{ iso, recurring, rule }`. A rolling or quarterly deadline is NOT a
 * date and is not turned into one — it is recorded as recurring with `iso:
 * null`, because a fabricated date would be indistinguishable from a real one
 * three screens later.
 */
export function deadlineOf(text, { year = new Date().getUTCFullYear() } = {}) {
  const t = String(text ?? '').trim();
  if (!t) return { iso: null, recurring: false, rule: null };
  if (/rolling|ongoing|continuous|anytime|quarterly|monthly|year-round/i.test(t)) {
    return { iso: null, recurring: true, rule: 'D1', because: 'Recorded as recurring. A rolling deadline is not a date and is not invented into one.' };
  }
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return { iso: iso[0], recurring: false, rule: 'D2', because: 'An ISO date was present in the cell.' };
  const named = new RegExp(`(${MONTHS})[a-z]*\\.?\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?`, 'i').exec(t);
  if (named) {
    const m = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ').indexOf(named[1].toLowerCase()) + 1;
    const y = named[3] ? Number(named[3]) : year;
    return {
      iso: `${y}-${String(m).padStart(2, '0')}-${String(Number(named[2])).padStart(2, '0')}`,
      recurring: false,
      rule: named[3] ? 'D3' : 'D4',
      because: named[3]
        ? 'A month, day and year were named in the cell.'
        : 'A month and day were named with no year. The current year was assumed, which is a guess and is marked as one.',
      assumed_year: !named[3],
    };
  }
  return { iso: null, recurring: false, rule: null, because: `No date could be read from ${JSON.stringify(t.slice(0, 40))}. It stays unscheduled rather than becoming a date.` };
}

const txt = (...parts) => parts.filter(Boolean).join(' ');

/**
 * Derive returns, effort and deadline for one opportunity, reporting which
 * rules fired. Fields already present on the record are never overwritten —
 * a hand-corrected row beats a rule.
 */
export function classify(op, opts = {}) {
  const fired = [];

  let returns = op.returns;
  if (!Array.isArray(returns) || !returns.length) {
    const set = new Set();
    for (const r of RETURN_RULES) {
      if (!r.when(op)) continue;
      r.gives.forEach((g) => set.add(g));
      fired.push({ rule: r.id, gives: r.gives, on: r.on, because: r.because });
    }
    returns = [...set];
  }

  let effort = op.effort;
  if (!effort) {
    const hit = EFFORT_RULES.find((r) => r.when(op));
    if (hit) {
      effort = hit.gives;
      fired.push({ rule: hit.id, gives: hit.gives, on: hit.on, because: hit.because });
    }
  }

  const dl = op.deadline_iso
    ? { iso: op.deadline_iso, recurring: false, rule: 'given', because: 'Recorded on the row.' }
    : deadlineOf(op.deadline_text, opts);
  if (dl.rule) fired.push({ rule: dl.rule, gives: dl.iso ?? (dl.recurring ? 'recurring' : 'unscheduled'), on: ['deadline_text'], because: dl.because });

  return {
    returns,
    effort: effort ?? null,
    deadline_iso: dl.iso,
    recurring: dl.recurring,
    rules_fired: fired,
    provenance: {
      returns: returns.length
        ? { basis: 'derived', note: `Derived by rule ${fired.filter((f) => /^R/.test(f.rule)).map((f) => f.rule).join(', ') || 'none'} in public/radar/engine/classify.js. The workbook does not record a return category for any row.` }
        : { basis: 'none', owed: 'What this actually returns. No rule fired and the workbook does not say, so it cannot be compared to anything until someone writes it down.' },
      effort: effort
        ? { basis: 'derived', note: `Derived by rule ${fired.find((f) => /^E/.test(f.rule))?.rule} in public/radar/engine/classify.js.` }
        : { basis: 'none', owed: 'What it costs to apply. Not in the workbook and no rule fired.' },
      deadline_iso: dl.iso
        ? { basis: 'derived', note: `Parsed by rule ${dl.rule}.${dl.assumed_year ? ' YEAR ASSUMED — the cell named a month and a day only.' : ''}` }
        : { basis: 'none', owed: dl.recurring ? 'The next actual cycle date. The cell says it recurs and gives no date.' : 'A deadline. None could be read from the cell.' },
    },
  };
}
