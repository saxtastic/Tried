// The bench.
//
// The judge does not decide by counting facts. In the cases this models the
// record is usually common ground and the fight is over what follows from it,
// so the model resolves close elements by principled margin: which side's
// position, if adopted as a rule, does less violence to the principles the
// tribunal has already committed to.
//
// It also has to say what it is doing. Every holding carries the principle that
// carried it, so a losing claim tells you exactly which principle you failed to
// make load-bearing — which is the actual output you want from a simulator.

import { tally, glossOf } from './principles.js';
import { findGaps, entrenchment } from './stare.js';
import { reframe, remedialFrame, selfDefeatRisk } from './paradox.js';
import { driftReport } from './lexicon.js';

export const STANDARDS = {
  preponderance: { threshold: 0.5, label: 'preponderance of the evidence' },
  clear_and_convincing: { threshold: 0.7, label: 'clear and convincing evidence' },
  substantial_evidence: { threshold: 0.4, label: 'substantial evidence' },
  arbitrary_capricious: { threshold: 0.65, label: 'arbitrary and capricious review' },
  de_novo: { threshold: 0.5, label: 'de novo review' },
};

const CONTEST_MARGIN = 0.15;

export function adjudicate(condition, pro, con, ctx) {
  const standard = STANDARDS[condition.standard] ?? STANDARDS.preponderance;
  const provision = ctx.provisions.get(condition.provision);

  // Net each element against the defeaters aimed at it.
  const elementRulings = pro.elements.map((el) => {
    const aimed = con.defeaters.filter((d) => d.target === el.id);
    const defeat = aimed.length ? Math.max(...aimed.map((d) => d.strength)) : 0;
    const net = round(el.support * (1 - defeat * 0.85));
    let status;
    if (net >= standard.threshold + CONTEST_MARGIN) status = 'met';
    else if (net >= standard.threshold - CONTEST_MARGIN) status = 'contested';
    else status = 'unmet';
    return { id: el.id, statement: el.statement, support: el.support, defeat: round(defeat), net, status, defeaters: aimed };
  });

  // Condition-level defeaters answer the claim whatever the elements show.
  const globalDefeaters = con.defeaters.filter((d) => d.target === condition.id);
  const bar = globalDefeaters.filter((d) => ['no_private_right', 'timeliness', 'exhaustion'].includes(d.kind) && d.strength >= 0.6);

  const contested = elementRulings.filter((e) => e.status === 'contested');
  const unmet = elementRulings.filter((e) => e.status === 'unmet');

  // Principled margin: the fuel.
  const proWeight = tally(pro.principles);
  const conWeight = tally(con.principles.filter((p) => globalDefeaters.concat(contested.flatMap((c) => c.defeaters)).some((d) => d.principles.includes(p))));
  const margin = round(proWeight - conWeight);
  const decisive = decisivePrinciple(pro, con, margin);

  let outcome;
  let reasoning;

  if (bar.length) {
    outcome = 'barred';
    reasoning =
      `The claim is not reached on its merits. ${bar.map((b) => b.argument).join(' ')} ` +
      'A bar of this kind is not a finding that the conduct was lawful; it is a finding that this forum is not the one that says so. ' +
      'That distinction is the whole basis of the statutory vector below.';
  } else if (unmet.length) {
    outcome = 'not_established';
    reasoning =
      `The following element${unmet.length > 1 ? 's fail' : ' fails'} under ${standard.label}: ` +
      `${unmet.map((u) => `"${u.statement}" (net ${u.net})`).join('; ')}. ` +
      `The proponent's principled weight (${round(proWeight)}) does not rescue an element the record does not carry.`;
  } else if (contested.length) {
    if (margin > 0) {
      outcome = 'established_on_principle';
      reasoning =
        `Every element clears or approaches ${standard.label}, and ${contested.length} turn${contested.length > 1 ? '' : 's'} on which rule the tribunal adopts rather than on what happened. ` +
        `Resolving those on principle, the proponent carries ${round(proWeight)} against ${round(conWeight)}. ` +
        `The decisive principle is ${decisive.id} — ${glossOf(decisive.id)} ` +
        'Adopting the respondent\'s reading would require the tribunal to hold that a body may depart from its own stated terms without answering for it, which no articulated principle in this corpus supports.';
    } else {
      outcome = 'not_established_on_principle';
      reasoning =
        `The contested elements are decided against the proponent on principle: the respondent carries ${round(conWeight)} against ${round(proWeight)}, ` +
        `chiefly on ${decisive.id} — ${glossOf(decisive.id)} ` +
        'The evidentiary record would support the claim; the governing principle will not. This is the signature of a claim that needs a statute rather than a better record.';
    }
  } else {
    outcome = 'established';
    reasoning = `All elements are met under ${standard.label} and no condition-level bar answers the claim.`;
  }

  const gaps = elementRulings.flatMap((el) => {
    const src = condition.elements.find((e) => e.id === el.id);
    return findGaps({
      element: { ...src, id: el.id, statement: el.statement },
      status: el.status,
      precedents: ctx.precedents,
      provision,
      lexDrift: src?.term ? driftReport(ctx.lexicon, src.term, { enactedYear: provision?.enacted, caseYear: ctx.caseYear, regime: ctx.regime }) : null,
    });
  });

  return {
    condition: condition.id,
    track: condition.track,
    standard: standard.label,
    outcome,
    reasoning,
    elements: elementRulings,
    bars: bar,
    principled: { pro: round(proWeight), con: round(conWeight), margin, decisive },
    gaps,
    stare_decisis: stareView(condition, ctx),
    synthesis: synthesise(condition, pro, con, { outcome, contested, gaps, margin, decisive, ctx, elementRulings }),
  };
}

function decisivePrinciple(pro, con, margin) {
  const pool = margin > 0 ? pro.principles : con.principles;
  const ranked = [...pool].sort((a, b) => tally([b]) - tally([a]));
  const id = ranked[0] ?? 'non_arbitrariness';
  return { id, gloss: glossOf(id), side: margin > 0 ? 'proponent' : 'opponent' };
}

function stareView(condition, ctx) {
  const tags = condition.covers ?? [];
  const rel = ctx.precedents.filter((p) => (p.covers ?? []).some((c) => tags.some((t) => t.startsWith(c) || c.startsWith(t))));
  return rel.map((p) => {
    const ent = entrenchment(p);
    return {
      id: p.id,
      cite: p.cite,
      favours: p.favours,
      holding: p.holding,
      rationale: p.rationale,
      entrenchment: ent,
      recommended_treatment:
        p.favours === 'claimant'
          ? 'followed'
          : ent.posture === 'entrenched'
            ? 'followed_under_protest'
            : ent.posture === 'ripe_for_displacement'
              ? 'questioned'
              : 'distinguished',
      note:
        p.favours === 'respondent' && ent.posture === 'entrenched'
          ? 'This is the wall. It will not move judicially, and every hour spent arguing it away is an hour not spent on the legislative fix.'
          : null,
    };
  });
}

/**
 * Thesis, antithesis, synthesis. The synthesis is not a compromise — it is the
 * narrower rule that both sides' best arguments actually leave standing, plus
 * the named place where the law has to be made rather than found.
 */
function synthesise(condition, pro, con, { outcome, contested, gaps, margin, decisive, ctx, elementRulings }) {
  // What survives is what survives the answer, not what the proponent asserted.
  const survivingElements = elementRulings.filter((e) => e.status !== 'unmet').map((e) => e.statement);
  const lost = elementRulings.filter((e) => e.status === 'unmet').map((e) => e.statement);
  // The self-defeating-premise objection is answered structurally by the paradox
  // module rather than conceded, so it does not belong in the concession list.
  const conceded = con.defeaters
    .filter((d) => d.strength >= 0.6 && d.kind !== 'self_defeating_premise')
    .map((d) => d.label);
  const driftPoints = pro.elements.filter((e) => e.drift?.drifted).map((e) => e.drift.label);

  const rule =
    survivingElements.length
      ? `Where ${survivingElements.map(lowerFirst).join(', and where ')}, the institution owes an answer on the record` +
        (conceded.length
          ? ` — notwithstanding ${conceded.map((c) => c.toLowerCase()).join(' and ')}, which go to forum and remedy rather than to whether the duty existed.`
          : ', and the duty is enforceable on its own terms.') +
        (lost.length
          ? ` The rule is narrower than pleaded: it does not extend to ${lost.map(lowerFirst).join('; nor to ')}.`
          : '')
      : 'No rule survives both sides\' best arguments on this condition; the claim as framed has nothing left standing.';

  return {
    thesis: pro.thesis,
    antithesis: con.antithesis,
    synthesis: rule,
    emergent_reading: driftPoints.length
      ? `The contest is really over "${driftPoints.join('", "')}". The synthesis available is a reading that keeps the term's settled core ` +
        'and declines to treat later judicial narrowing as if it had been legislative — the word is given the reach its purpose requires, ' +
        'and the narrowing is confined to the private-enforcement question it actually decided.'
      : null,
    where_law_must_be_made: gaps.map((g) => ({ class: g.class, statement: g.statement, vector: g.statutory_vector })),
    decisive_principle: decisive,
    posture: outcome,
  };
}

/**
 * Roll condition-level judgments into a disposition, and derive the statutory
 * challenge — which is the actual goal, not the appeal.
 */
export function disposition(rulings, ctx) {
  const byTrack = {};
  for (const r of rulings) {
    byTrack[r.track] ??= [];
    byTrack[r.track].push(r);
  }

  const won = rulings.filter((r) => r.outcome.startsWith('established'));
  const barred = rulings.filter((r) => r.outcome === 'barred');
  const lostOnPrinciple = rulings.filter((r) => r.outcome === 'not_established_on_principle');

  const paradox = reframe(ctx.claim ?? {});
  const remedial = remedialFrame({
    remedy: ctx.claim?.remedy ?? 'the relief sought',
    instrument: ctx.claim?.instrument ?? 'the respondent\'s own charter and published commitments',
  });

  return {
    summary: {
      conditions: rulings.length,
      established: won.length,
      barred: barred.length,
      lost_on_principle: lostOnPrinciple.length,
    },
    by_track: Object.fromEntries(
      Object.entries(byTrack).map(([t, rs]) => [
        t,
        {
          established: rs.filter((r) => r.outcome.startsWith('established')).map((r) => r.condition),
          failed: rs.filter((r) => !r.outcome.startsWith('established')).map((r) => ({ condition: r.condition, outcome: r.outcome })),
        },
      ]),
    ),
    governance: {
      self_defeat_risk_before: paradox.before,
      self_defeat_risk_after: paradox.after,
      reframed: paradox.moved.length,
      frame: paradox.frame,
      counter_move: paradox.counter_move,
      remedial_dialectic: remedial,
      note:
        paradox.before > 0.4
          ? 'As originally pleaded the claim attacked the constitutive layer, which is why it kept coming back circular. Reframed to the warrant, the same facts support the same relief without asking anyone to unmake themselves.'
          : 'The claim as pleaded already targets the warrant and the exercise, so the circularity objection does not bite.',
    },
    statutory_challenge: statutoryVectors(rulings, ctx),
  };
}

/**
 * The point of the exercise. Every place the claim fails for a reason a court
 * cannot fix is a place a legislature can, and those are ranked by how much of
 * the case they unlock.
 */
function statutoryVectors(rulings, ctx) {
  const vectors = new Map();

  const add = (key, v) => {
    const cur = vectors.get(key);
    if (cur) {
      cur.unlocks.push(...v.unlocks);
      cur.weight += v.weight;
    } else {
      vectors.set(key, { ...v, unlocks: [...v.unlocks] });
    }
  };

  for (const r of rulings) {
    for (const b of r.bars) {
      if (b.kind === 'no_private_right') {
        add('restore_private_right', {
          vector: 'restore_private_right',
          title: 'Create an express private right of action',
          why: 'The duty exists and was found enforceable in substance; only the forum is missing. A one-sentence amendment supplying the right of action converts a barred claim into a heard one without changing the underlying standard at all.',
          weight: 1.0,
          unlocks: [r.condition],
        });
      }
      if (b.kind === 'exhaustion' || b.kind === 'timeliness') {
        add('tolling_and_exhaustion', {
          vector: 'tolling_and_exhaustion',
          title: 'Toll the period during internal process, and cap internal process',
          why: 'Where an institution controls both the internal clock and the internal remedy, an unbounded internal process is a de facto limitations defence. Tolling plus a hard cap removes the incentive to run the clock.',
          weight: 0.7,
          unlocks: [r.condition],
        });
      }
    }
    for (const g of r.gaps) {
      const map = {
        define_the_term_in_statute: {
          title: 'Define the operative term by statute',
          why: 'The outcome turns on which dated sense of a word the tribunal picks. A definition section removes the choice, and removes it prospectively for everyone rather than case by case.',
          weight: 0.9,
        },
        amend_to_name_the_term: {
          title: 'Amend the provision to name the conduct',
          why: 'The claim currently depends on reading a term into text that never used it. Naming it converts an inference into an application.',
          weight: 0.75,
        },
        codify_the_rule: {
          title: 'Codify the rule the case would have to make',
          why: 'A question of first impression is decided on principle, which means it can be decided either way and binds nobody until it is. Codifying it is cheaper than litigating it twice.',
          weight: 0.6,
        },
        resolve_the_split_by_statute: {
          title: 'Resolve the split',
          why: 'Divided authority means identically situated people get opposite answers by geography. That is the clearest case for legislative intervention and the easiest to explain to a legislator.',
          weight: 0.8,
        },
      };
      const m = map[g.statutory_vector];
      if (m) add(g.statutory_vector, { vector: g.statutory_vector, ...m, unlocks: [r.condition] });
    }
    for (const s of r.stare_decisis) {
      if (s.favours === 'respondent' && s.entrenchment.posture === 'entrenched') {
        add('supersede_precedent', {
          vector: 'supersede_precedent',
          title: `Supersede ${s.cite} by statute`,
          why: `${s.entrenchment.reasoning} A statute displacing the holding does not ask any court to admit error; it changes the text the holding construed, which is the one move that is always available.`,
          weight: 0.95,
          unlocks: [r.condition],
        });
      }
    }
  }

  // Passage-derived vectors. A claim lost in an interval was not decided
  // against; it was outlasted, and the fix for being outlasted is legislative.
  for (const leg of ctx.itinerary?.legs ?? []) {
    if (leg.glitch.id === 'null_return') {
      add('mandatory_retention', {
        vector: 'mandatory_retention',
        title: 'Require the record to exist, and say what happens when it does not',
        why:
          'A body that must hold a record and returns nothing currently loses nothing by it. A retention duty with a stated consequence — an adverse inference where the record should exist and does not — converts the gap from the claimant\'s evidentiary problem into the institution\'s, which is where it belongs.',
        weight: 0.95,
        unlocks: [leg.label],
      });
    }
    if (leg.glitch.id === 'timed_out' || leg.glitch.id === 'reconstructed') {
      add('bound_the_interval', {
        vector: 'bound_the_interval',
        title: 'Put a clock on the passage, and date the reasons',
        why:
          'Where an institution controls both the clock and the remedy, an unbounded interval is a limitations defence nobody had to plead. A deadline for each step, plus a requirement that reasons be recorded at the time rather than reconstructed, makes the passage reviewable instead of merely survivable.',
        weight: 0.85,
        unlocks: [leg.label],
      });
    }
    if (!leg.carried && leg.uncovered.some((u) => u.id === 'standing')) {
      add('preserve_standing', {
        vector: 'preserve_standing',
        title: 'Preserve standing through the process',
        why:
          'A claimant who graduates, leaves or is removed while the matter is pending can lose the status that made them someone the institution owed anything to. Standing that lapses on the institution\'s own timetable rewards delay directly. Freezing it for the duration of a pending matter costs nothing and removes the incentive.',
        weight: 0.9,
        unlocks: [leg.label],
      });
    }
  }

  const ns = ctx.necessitySilence;
  if (ns?.triggered) {
    add('supply_an_intelligible_principle', {
      vector: 'supply_an_intelligible_principle',
      title: 'Supply a standard to the enabling act',
      why:
        'The institution must exercise discretion to function and has no authority for the discretion it exercises, so nothing it does can be cited or reviewed. ' +
        'This is not fixable by winning one case, because the next decision is equally unmoored. The amendment supplies the standard the act omitted, ' +
        'which makes every future exercise reviewable at once.',
      weight: 1.0,
      unlocks: ['institution-wide'],
    });
  }

  return [...vectors.values()]
    .sort((a, b) => b.weight - a.weight)
    .map((v) => ({ ...v, unlocks: [...new Set(v.unlocks)] }));
}

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function round(n) {
  return Math.round(n * 100) / 100;
}
