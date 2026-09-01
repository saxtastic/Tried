// Two lists of the same world.
//
// `data/open-calls/` is the fellowships project's reference: sixteen calls read
// off each organisation's own page, every field carrying an https source and a
// read date, driven by a declared stage machine. `public/radar/corpus/` is what
// came out of the owner's workbooks: fit judgments, metros, role types, and a
// list of calls typed by hand.
//
// They overlap. MacDowell is in both. Left alone, the board would count it
// twice and show two different deadlines for it, which is worse than either
// list on its own.
//
// The rule here is one line long: WHERE BOTH CARRY A CALL, THE SOURCED RECORD
// WINS. The registry read it off the organisation's page and dated the read;
// the workbook row is a typed recollection. What the workbook keeps is the
// thing the registry does not have — the owner's own fit score — and it is
// carried across as basis `none`, which is what it always was.
//
// Near-matches are never merged silently. Two rows that look like the same call
// without matching on a key are reported as a possible duplicate, both kept,
// and the decision is owed to a person. A reconciler that guesses is how one
// list quietly becomes two.

/** Stages the fellowships workflow marks terminal, committed and won.
 *
 *  This is the ONE place the radar names a stage belonging to another project's
 *  workflow, and it is named rather than inferred because `awarded` and
 *  `declined` are both terminal and both committed — the flags cannot separate
 *  them. A test asserts every id here exists in that workflow, so a rename
 *  upstream fails loudly instead of silently reclassifying a win as a loss. */
export const WON_STAGES = new Set(['awarded']);

const STOP = new Set(['the', 'of', 'for', 'a', 'an', 'and', 'program', 'programme', 'us', 'u.s.']);

/** Acronyms the token match cannot see through.
 *
 *  Each entry is a fact, not a judgment: NEA is what the National Endowment for
 *  the Arts is called. Expanding them lets a pair be COMPARED; it never decides
 *  that the pair is the same call. "NEA — Art Works" and the NEA's "Grants for
 *  Arts Projects" reach the near band and are reported as owed a decision,
 *  which is correct — one is the other's former name and a reconciler has no
 *  business asserting that on its own.
 *
 *  This list is the reconciler's recall limit and is stated as one: an acronym
 *  it does not know is a match it cannot make and cannot detect that it missed. */
export const ALIASES = {
  nea: ['national', 'endowment', 'arts'],
  nsf: ['national', 'science', 'foundation'],
  usa: ['united', 'states', 'artists'],
  ted: ['ted'],
};

/** Tokens that carry identity. Punctuation, case and filler are not identity. */
export function tokens(s) {
  const raw = String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !STOP.has(t));
  const out = new Set(raw);
  for (const t of raw) for (const x of ALIASES[t] ?? []) out.add(x);
  return [...out];
}

/** Jaccard overlap on those tokens. Cheap, symmetric, and easy to argue with. */
export function overlap(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / (A.size + B.size - hit);
}

export const MATCH = 0.75;
export const NEAR = 0.4;

/**
 * Turn a fellowships registry call into an opportunity the board can read.
 * Nothing is invented: a field the registry holds at basis `none` arrives here
 * as null and stays null.
 */
export function fromRegistry(call, workflow) {
  const stage = (workflow?.stages ?? []).find((s) => s.id === call.stage) ?? null;
  const award = call.award ?? {};
  const priced = award.basis && award.basis !== 'none' && (award.min != null || award.max != null);

  return {
    id: `fc.${call.id}`,
    category: 'open_call',
    source_of_record: 'fellowships-registry',
    kind: call.kind,
    org: call.org ?? call.name,
    name: call.name,
    url: call.url ?? call.source ?? null,
    summary: call.summary ?? null,
    eligibility: call.eligibility?.stated ?? null,
    amount_range: priced ? [award.min ?? award.max, award.max ?? award.min] : null,
    deadline_iso: call.closes ?? null,
    deadline_text: call.closes ?? call.cycle_note ?? call.cycle ?? null,
    fit_score: null,
    stage: call.stage,
    stage_label: stage?.label ?? call.stage,
    attempts: attemptsFrom(call, stage),
    provenance: call.provenance ?? {},
    source: { file: `data/open-calls/${call.id}.json`, sheet: null, url: call.source ?? null },
  };
}

/**
 * The registry does not record attempts; it records a stage. The stage says
 * more than a count does, so it is translated rather than discarded — and the
 * translation reads the workflow's own `committed` and `terminal` flags instead
 * of a second copy of the stage list.
 */
function attemptsFrom(call, stage) {
  if (!stage) return [];
  if (!stage.committed) {
    // discovered, screening, eligible, ineligible, passed, lapsed. None of these
    // is an attempt. `lapsed` in particular is a deadline that went by without a
    // submission, which is the opposite of having tried and is recorded as such.
    return [];
  }
  const reached = stage.order >= 5 ? 'submitted' : 'started';
  const outcome = stage.terminal ? (WON_STAGES.has(stage.id) ? 'accepted' : 'declined') : undefined;
  return [{ who: 'owner', reached, outcome, stage: stage.id, note: stage.note }];
}

/**
 * Reconcile the workbook rows against the registry.
 *
 * Returns the set the board should read, plus the collisions, plus what is
 * owed. Nothing is dropped without appearing in one of the three.
 */
export function reconcile({ workbook = [], registry = [], workflow = null } = {}) {
  const fromReg = registry.map((c) => fromRegistry(c, workflow));
  const merged = [];
  const superseded = [];
  const possible = [];

  for (const row of workbook) {
    const label = row.org ?? row.name ?? row.id;
    let best = null;
    let bestScore = 0;
    for (const reg of fromReg) {
      const s = Math.max(overlap(label, reg.org), overlap(label, reg.name));
      if (s > bestScore) { bestScore = s; best = reg; }
    }

    if (best && bestScore >= MATCH) {
      // The sourced record wins. The workbook's fit score is the one thing it
      // holds that the registry does not, so it rides along carrying its basis.
      best.fit_score = row.fit_score ?? null;
      best.fit_from = row.id;
      best.provenance = {
        ...best.provenance,
        fit_score: row.provenance?.fit_score ?? { basis: 'none', owed: 'A stated rule behind the score.' },
      };
      superseded.push({
        workbook: row.id,
        registry: best.id,
        score: round(bestScore),
        reading: `The registry read this off ${best.url ?? 'the organisation'} and dated the read. The workbook row is a typed recollection of the same call, so it is superseded — except the fit score, which only the workbook has.`,
      });
      continue;
    }

    if (best && bestScore >= NEAR) {
      possible.push({
        workbook: row.id,
        registry: best.id,
        score: round(bestScore),
        owed: `Whether ${JSON.stringify(label)} and ${JSON.stringify(best.name)} are the same call. Both are carried until someone says; merging on a guess turns one list into two that disagree.`,
      });
    }
    merged.push({ ...row, source_of_record: 'workbook' });
  }

  const rows = [...fromReg, ...merged];

  return {
    rows,
    superseded,
    possible_duplicates: possible,
    counts: {
      total: rows.length,
      from_registry: fromReg.length,
      from_workbook: merged.length,
      superseded: superseded.length,
      possible_duplicates: possible.length,
    },
    finding:
      `${rows.length} calls after reconciliation: ${fromReg.length} read off the organisations' own pages, ` +
      `${merged.length} held only in the workbooks. ` +
      (superseded.length
        ? `${superseded.length} workbook row(s) superseded by a sourced record; the fit score was carried across and nothing else was. `
        : '') +
      (possible.length
        ? `${possible.length} near-match(es) left unmerged and reported — a reconciler that guesses is how one list quietly becomes two. `
        : 'No near-matches were left undecided. ') +
      'Matching is token overlap plus a named acronym list. An acronym the list does not know is a match it cannot make, and it cannot detect that it missed one.',
  };
}

const round = (n) => Math.round(n * 100) / 100;
