// Interpretive drift.
//
// Statutory words do not hold still. "Discrimination", "author", "record",
// "merit", "discretion" each carry a stack of dated senses, and which sense a
// tribunal picks up is usually the whole case. This module makes that choice
// explicit and re-runnable: the same condition is scored under four regimes,
// and the spread between them is itself a finding.

export const REGIMES = ['originalist', 'enactment_era', 'contemporary', 'purposive', 'strict_textual'];

export const REGIME_GLOSS = {
  originalist: 'The sense the word carried when the provision was first enacted.',
  enactment_era: 'The sense in general legal usage during the enacting decade.',
  contemporary: 'The sense the word carries at the time of the dispute.',
  purposive: 'The widest sense the provision\'s stated purpose will support.',
  strict_textual: 'The narrowest sense the enacted words will bear.',
};

/** Index a raw lexicon array by term id. */
export function indexLexicon(terms = []) {
  const byId = new Map();
  for (const t of terms) byId.set(t.id, t);
  return byId;
}

function senseAt(term, year) {
  if (!term) return null;
  let best = null;
  for (const s of term.senses) {
    const from = s.from ?? -Infinity;
    const to = s.to ?? Infinity;
    if (year >= from && year <= to) return s;
    if (year > to && (!best || to > (best.to ?? -Infinity))) best = s;
  }
  return best ?? term.senses[term.senses.length - 1] ?? null;
}

function widest(term) {
  if (!term) return null;
  let best = term.senses[0] ?? null;
  for (const s of term.senses) {
    if ((s.reach?.length ?? 0) > (best.reach?.length ?? 0)) best = s;
  }
  return best;
}

function narrowest(term) {
  if (!term) return null;
  let best = term.senses[0] ?? null;
  for (const s of term.senses) {
    if ((s.reach?.length ?? 0) < (best.reach?.length ?? 0)) best = s;
  }
  return best;
}

/**
 * Resolve which sense of `termId` governs.
 *
 * @param {Map} lex        indexed lexicon
 * @param {string} termId
 * @param {object} ctx     { regime, enactedYear, caseYear }
 */
export function resolveSense(lex, termId, ctx) {
  const term = lex.get(termId);
  if (!term) return null;
  const { regime = 'contemporary', enactedYear, caseYear } = ctx;
  switch (regime) {
    case 'originalist':
      return senseAt(term, term.origin_year ?? enactedYear ?? caseYear);
    case 'enactment_era':
      return senseAt(term, enactedYear ?? caseYear);
    case 'purposive':
      return widest(term);
    case 'strict_textual':
      return narrowest(term);
    case 'contemporary':
    default:
      return senseAt(term, caseYear);
  }
}

/** Does the governing sense of `termId` reach the theory `mode`? */
export function reaches(lex, termId, mode, ctx) {
  const sense = resolveSense(lex, termId, ctx);
  if (!sense) return { hit: false, reason: `term "${termId}" is not in the lexicon`, sense: null };
  const hit = (sense.reach ?? []).includes(mode);
  return {
    hit,
    sense,
    reason: hit
      ? `under the ${ctx.regime} reading ("${sense.gloss}") the term reaches ${mode}`
      : `under the ${ctx.regime} reading ("${sense.gloss}") the term does not reach ${mode}`,
  };
}

/**
 * Report how far a term has moved. A term whose reach differs across regimes is
 * a drift point: the place where a statutory challenge has the most purchase,
 * because the legislature can pick the sense the courts declined to.
 */
export function driftReport(lex, termId, ctx) {
  const term = lex.get(termId);
  if (!term) return null;
  const readings = {};
  for (const regime of REGIMES) {
    const s = resolveSense(lex, termId, { ...ctx, regime });
    readings[regime] = s ? { gloss: s.gloss, reach: s.reach ?? [], from: s.from, to: s.to } : null;
  }
  const reachSets = Object.values(readings).filter(Boolean).map((r) => r.reach.join('|'));
  const drifted = new Set(reachSets).size > 1;
  return {
    term: termId,
    label: term.label ?? termId,
    drifted,
    narrowedBy: narrowingEvent(term),
    readings,
  };
}

function narrowingEvent(term) {
  const ordered = [...term.senses].sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1];
    const cur = ordered[i];
    if ((cur.reach?.length ?? 0) < (prev.reach?.length ?? 0)) {
      return { year: cur.from, by: cur.narrowed_by ?? 'unattributed', lost: (prev.reach ?? []).filter((r) => !(cur.reach ?? []).includes(r)) };
    }
  }
  return null;
}
