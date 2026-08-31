// Orchestration.
//
// One call runs the whole apparatus: both agents on every condition, the bench
// on every pairing, the interpretive sweep across regimes, the institutional
// translation across policy densities, the paradox resolution, and the
// statutory vectors that fall out of the failures.

import { indexLexicon, REGIMES as INTERP_REGIMES, driftReport } from './lexicon.js';
import { proponent, opponent } from './agents.js';
import { adjudicate, disposition } from './judge.js';
import { profile, necessitySilence, translate, REGIMES as POLICY_REGIMES } from './institution.js';
import { reframe } from './paradox.js';
import { itinerary, sensitivity } from './transitions.js';
import { reconciliationRoutes, classify } from './forums.js';
import { register } from './attempts.js';
import { counterclaims } from './agents.js';

/** Build the evaluation context from a raw corpus + case. */
export function buildContext(corpus, options = {}) {
  const lexicon = indexLexicon(corpus.lexicon ?? []);
  const provisions = new Map((corpus.provisions ?? []).map((p) => [p.id, p]));
  const claim = corpus.claim ?? {};
  const institution = corpus.institution ?? {};
  return {
    lexicon,
    provisions,
    precedents: corpus.precedents ?? [],
    conditions: corpus.conditions ?? [],
    facts: claim.facts ?? {},
    claim,
    institution,
    caseYear: options.caseYear ?? claim.year ?? new Date().getFullYear(),
    regime: options.regime ?? 'contemporary',
    policyRegime: options.policyRegime ?? null,
    necessitySilence: necessitySilence(institution),
    itinerary: itinerary(corpus.passages ?? []),
  };
}

/** Run one full pass at a fixed interpretive regime. */
export function run(corpus, options = {}) {
  const ctx = buildContext(corpus, options);
  if (ctx.policyRegime) {
    ctx.institution = { ...ctx.institution, regime: ctx.policyRegime, conflicts: ctx.institution.conflicts ?? [] };
    ctx.necessitySilence = necessitySilence(ctx.institution);
  }

  const tracks = options.tracks ?? null;
  const conditions = ctx.conditions.filter((c) => !tracks || tracks.includes(c.track));

  const debates = conditions.map((condition) => {
    const pro = proponent(condition, ctx);
    const con = opponent(condition, ctx, pro);
    const judgment = adjudicate(condition, pro, con, ctx);
    return { condition, pro, con, judgment };
  });

  return {
    regime: ctx.regime,
    policy_regime: profile(ctx.institution).regime,
    case_year: ctx.caseYear,
    debates,
    disposition: disposition(debates.map((d) => d.judgment), ctx),
  };
}

/**
 * Interpretive sweep: the same case under every regime.
 * Where the outcome moves between regimes, the case is about the words, not the
 * facts — and that is a drafting defect with a legislative answer.
 */
export function sweepInterpretations(corpus, options = {}) {
  const rows = INTERP_REGIMES.map((regime) => {
    const r = run(corpus, { ...options, regime });
    return {
      regime,
      established: r.disposition.summary.established,
      barred: r.disposition.summary.barred,
      outcomes: Object.fromEntries(r.debates.map((d) => [d.condition.id, d.judgment.outcome])),
    };
  });
  const distinct = new Set(rows.map((r) => JSON.stringify(r.outcomes)));
  return {
    rows,
    outcome_depends_on_regime: distinct.size > 1,
    best_for_claimant: rows.reduce((a, b) => (b.established > a.established ? b : a), rows[0]).regime,
    worst_for_claimant: rows.reduce((a, b) => (b.established < a.established ? b : a), rows[0]).regime,
    finding:
      distinct.size > 1
        ? 'The outcome changes with the interpretive regime. The dispute is over the meaning of the words, not over what happened, ' +
          'so the durable fix is a definition rather than a better record.'
        : 'The outcome holds across every interpretive regime. Nothing is gained by arguing about which reading governs; ' +
          'the case turns on the elements themselves.',
  };
}

/**
 * Institutional sweep: the same case against a loose, rigid, absent, and
 * over-dense institution. Answers "what happens when it faces rigidity".
 */
export function sweepInstitutions(corpus, options = {}) {
  const rows = Object.keys(POLICY_REGIMES).map((policyRegime) => {
    const r = run(corpus, { ...options, policyRegime });
    return {
      regime: policyRegime,
      label: POLICY_REGIMES[policyRegime].label,
      gloss: POLICY_REGIMES[policyRegime].gloss,
      established: r.disposition.summary.established,
      outcomes: Object.fromEntries(r.debates.map((d) => [d.condition.id, d.judgment.outcome])),
      claimant_theory: POLICY_REGIMES[policyRegime].claimant_theory,
      vectors: r.disposition.statutory_challenge.map((v) => v.vector),
    };
  });
  const actual = profile(corpus.institution ?? {}).regime;
  return {
    actual_regime: actual,
    rows,
    translation: translate(POLICY_REGIMES[actual].claimant_theory, corpus.institution ?? {}),
    finding: institutionFinding(rows, actual),
  };
}

function institutionFinding(rows, actual) {
  const here = rows.find((r) => r.regime === actual);
  const better = rows.filter((r) => r.established > (here?.established ?? 0));
  const worse = rows.filter((r) => r.established < (here?.established ?? 0));
  const parts = [];
  if (better.length) {
    parts.push(
      `The same facts fare better against a ${better.map((b) => b.label.toLowerCase()).join(' or ')} institution, ` +
        'which means part of the current difficulty is the venue rather than the merits.',
    );
  }
  if (worse.length) {
    parts.push(
      `Against a ${worse.map((w) => w.label.toLowerCase()).join(' or ')} institution the claim weakens, ` +
        'so the theory should not be pitched at a generality it cannot sustain elsewhere.',
    );
  }
  if (!better.length && !worse.length) {
    parts.push('The claim survives every policy regime unchanged, which is the strongest position: it does not depend on this institution\'s particular looseness.');
  }
  const od = rows.find((r) => r.regime === 'over_dense');
  if (od?.vectors.includes('supply_an_intelligible_principle')) {
    parts.push(
      'Under an over-dense rulebook the necessity–silence conflict fires: the institution has to exercise a discretion it was never granted, ' +
        'so its decisions are unreviewable by construction and the defect moves from the decision to the enabling act.',
    );
  }
  return parts.join(' ');
}

/** Everything, in one object. */
export function fullReport(corpus, options = {}) {
  const base = run(corpus, options);
  return {
    ...base,
    // The passages between findings. Everything else here scores a state; this
    // scores the intervals, which is where claims are actually lost.
    itinerary: itinerary(corpus.passages ?? []),
    passage_sensitivity: sensitivity(corpus.passages ?? []),
    // Which body of law each condition is pleaded in, and what that costs
    // before any fact is argued.
    forums: {
      ...reconciliationRoutes(corpus.claim?.forum_facts ?? {}),
      per_condition: (corpus.conditions ?? []).map(classify),
    },
    // Which doors have been tried, how far they got, and what stopped them.
    doors: register(corpus.doors ?? []),
    // What the respondent can bring back — scored on exposure, not likelihood.
    counterclaims: counterclaims({ facts: corpus.claim?.facts ?? {} }),
    interpretive_sweep: sweepInterpretations(corpus, options),
    institutional_sweep: sweepInstitutions(corpus, options),
    paradox: reframe(corpus.claim ?? {}),
    drift: (corpus.lexicon ?? []).map((t) =>
      driftReport(indexLexicon(corpus.lexicon), t.id, { caseYear: base.case_year, regime: base.regime }),
    ),
  };
}
