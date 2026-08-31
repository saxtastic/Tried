// The two agents.
//
// PROPONENT takes each condition and argues it is satisfied.
// OPPONENT takes the same condition and argues it is not.
//
// They are deliberately not symmetric. The proponent builds forward from
// elements to a rule; the opponent works through a fixed catalogue of
// defeaters, because that is how the answering side actually operates — it does
// not need a theory of the case, only one dispositive objection. Modelling that
// asymmetry is what stops the simulator from producing a flattering result.

import { evaluate } from './predicates.js';
import { driftReport } from './lexicon.js';
import { onPoint, entrenchment, movesAgainst } from './stare.js';
import { profile, necessitySilence, THEORIES } from './institution.js';
import { tally } from './principles.js';

export const DEFEATERS = {
  element_unmet: {
    label: 'Element not established',
    principles: ['textual_fidelity'],
    gloss: 'The record does not carry an element the claim requires.',
  },
  no_private_right: {
    label: 'No private right of action',
    principles: ['separation_of_powers', 'textual_fidelity'],
    gloss: 'Even a violation gives this claimant no forum, because the legislature created none.',
  },
  interpretive_reach: {
    label: 'Term does not reach the theory',
    principles: ['textual_fidelity'],
    gloss: 'The operative word, in the sense that governs, does not extend to what is alleged.',
  },
  deference: {
    label: 'Deference to institutional judgment',
    principles: ['institutional_competence'],
    gloss: 'The decision is academic or professional judgment, reviewed only for a substantial departure from accepted norms.',
  },
  discretion: {
    label: 'Committed to discretion',
    principles: ['institutional_competence', 'separation_of_powers'],
    gloss: 'There is no law to apply, so there is nothing for a reviewing body to measure.',
  },
  exhaustion: {
    label: 'Internal remedies not exhausted',
    principles: ['exhaustion', 'finality'],
    gloss: 'The institution has not been given the chance to correct itself.',
  },
  timeliness: {
    label: 'Out of time',
    principles: ['finality', 'reliance'],
    gloss: 'The limitation period has run.',
  },
  precedent_forecloses: {
    label: 'Controlling precedent forecloses the claim',
    principles: ['textual_fidelity', 'finality'],
    gloss: 'A decision on point resolves this against the claimant.',
  },
  self_defeating_premise: {
    label: 'The premise unmakes the forum',
    principles: ['sovereign_continuity'],
    gloss: 'The claim, taken to its end, denies the authority that would have to grant the relief.',
  },
  harmless_deviation: {
    label: 'Deviation was harmless',
    principles: ['finality', 'institutional_competence'],
    gloss: 'The process departed, but the outcome would have been the same.',
  },
  structured_compliance: {
    label: 'Formal compliance with every written rule',
    principles: ['textual_fidelity', 'institutional_competence'],
    gloss: 'Conduct that satisfies each written rule while defeating their purpose is formally unimpeachable.',
  },
};

/** Build the proponent's case for a condition. */
export function proponent(condition, ctx) {
  const elements = [];
  const principles = new Set();
  const provision = ctx.provisions.get(condition.provision);

  for (const el of condition.elements) {
    const r = evaluate(el.test, { ...ctx, provision });
    const support = r.value === 'true' ? r.strength : r.value === 'unknown' ? r.strength * 0.4 : Math.max(0, 0.25 - r.strength * 0.2);
    for (const p of el.principles ?? []) principles.add(p);
    const drift = el.term ? driftReport(ctx.lexicon, el.term, { enactedYear: provision?.enacted, caseYear: ctx.caseYear, regime: ctx.regime }) : null;
    elements.push({
      id: el.id,
      statement: el.statement,
      support: round(support),
      finding: r.value,
      because: r.because,
      principles: el.principles ?? [],
      drift,
      alternative_reading: drift?.drifted
        ? `If the tribunal is not with us on the ${ctx.regime} reading, the purposive reading of "${drift.label}" supplies the reach the claim needs, and the provision's stated purpose supports it.`
        : null,
    });
  }

  const inst = profile(ctx.institution);
  const theory = THEORIES[inst.claimant_theory];
  // The necessity-silence conflict is an administrative and governance argument.
  // It says nothing about whether race was a ground or who owns a copyright, so
  // it is not attached to conditions it cannot actually help.
  const nsTracks = ['admin', 'governance', 'fiduciary'];
  const ns = nsTracks.includes(condition.track) ? necessitySilence(ctx.institution) : { triggered: false, principles: [] };
  if (ns.triggered) for (const p of ns.principles) principles.add(p);
  for (const p of theory?.principles ?? []) principles.add(p);

  const helpful = onPoint(ctx.precedents, condition.covers ?? []).filter((p) => p.favours === 'claimant');

  return {
    side: 'proponent',
    condition: condition.id,
    track: condition.track,
    thesis: condition.statement,
    elements,
    weakest: elements.reduce((a, b) => (b.support < a.support ? b : a), elements[0] ?? { support: 0 }),
    institutional_theory: theory ? { id: inst.claimant_theory, ...theory } : null,
    necessity_silence: ns.triggered ? ns : null,
    supporting_precedent: helpful.map((p) => ({ id: p.id, cite: p.cite, holding: p.holding, entrenchment: entrenchment(p) })),
    principles: [...principles],
    principled_weight: round(tally([...principles])),
  };
}

/** Build the opponent's case against the same condition. */
export function opponent(condition, ctx, proCase) {
  const raised = [];
  const principles = new Set();
  const provision = ctx.provisions.get(condition.provision);
  const inst = profile(ctx.institution);

  // 1. Weak elements.
  for (const el of proCase.elements) {
    if (el.support < 0.5) {
      raised.push(mkDefeater('element_unmet', 0.85 - el.support, {
        target: el.id,
        argument: `"${el.statement}" is not carried on this record: ${el.because.join('; ')}.`,
      }));
    }
  }

  // 2. Private right of action.
  if (provision && provision.confers_private_right === false) {
    raised.push(mkDefeater('no_private_right', 0.9, {
      target: condition.id,
      argument: `${provision.cite ?? provision.id} creates a duty but no private right to enforce it. Whatever the merits, this claimant is in the wrong forum.`,
    }));
  }

  // 3. Interpretive reach — the opponent always argues the narrowest sense.
  //
  // How hard that argument lands depends on whether the governing regime is
  // already against it. Where the sense that actually governs supplies the reach
  // the claim needs, pressing the narrowest possible reading is a real move but a
  // weak one: it asks the tribunal to prefer a sense nothing else selects. Where
  // the governing sense also fails, the same move is close to dispositive.
  for (const el of proCase.elements) {
    if (el.drift?.drifted) {
      const narrow = el.drift.readings.strict_textual;
      const need = condition.elements.find((e) => e.id === el.id)?.test?.reach;
      if (need && narrow && !narrow.reach.includes(need)) {
        const governingHolds = el.finding === 'true';
        const alsoFails = ['originalist', 'enactment_era']
          .filter((r) => el.drift.readings[r] && !el.drift.readings[r].reach.includes(need)).length;
        const strength = governingHolds ? 0.3 + alsoFails * 0.1 : 0.75 + alsoFails * 0.05;
        raised.push(mkDefeater('interpretive_reach', strength, {
          target: el.id,
          argument: `On the narrowest reading the enacted words will bear — "${narrow.gloss}" — the term does not reach ${need}. ` +
            'Later expansion of the word in ordinary usage is not an amendment of the statute.' +
            (el.drift.narrowedBy ? ` The narrowing in ${el.drift.narrowedBy.year} (${el.drift.narrowedBy.by}) is authority, not drift.` : ''),
          concession: governingHolds
            ? `The reading that governs here (${el.drift.readings.contemporary ? 'contemporary' : 'as applied'}) does supply the reach, so this argument asks the tribunal to depart from the sense the term ordinarily carries.`
            : null,
        }));
      }
    }
  }

  // 4. Deference / discretion, keyed to the institution's actual regime.
  const respondentTheory = THEORIES[inst.respondent_theory];
  if (respondentTheory) {
    const kind = inst.regime === 'absent' ? 'discretion' : inst.regime === 'rigid' ? 'harmless_deviation' : 'deference';
    raised.push(mkDefeater(kind, 0.45 + inst.discretion * 0.3, {
      target: condition.id,
      argument: `${respondentTheory.argument} (${respondentTheory.label}, in a ${inst.regime} policy regime.)`,
      vulnerability: respondentTheory.vulnerability,
      // Every other profession that grants deference to expert judgment makes it
      // conditional on producing the professional standard and showing conformity
      // to it. Educational deference asks for no equivalent showing, and that
      // asymmetry is itself an argument.
      answer_available: kind === 'deference'
        ? {
            move: 'demand_the_peer_standard',
            argument:
              'Deference to professional judgment is granted elsewhere only against a demonstrated professional ' +
              'standard: the respondent produces what a responsible body of practitioners would have done, shows ' +
              'conformity, and the tribunal may still reject a standard that will not bear logical scrutiny. ' +
              'Deference claimed here rests on the respondent\'s own characterisation of its decision as academic, ' +
              'with no such showing. The party seeking the benefit should carry the burden every comparable ' +
              'profession carries.',
            source: 'medical standard-of-care practice (Bolam as qualified by Bolitho)',
          }
        : null,
    }));
  }

  // 4b. The dense-rulebook shield.
  //
  // The simulator originally scored a rigid regime as favourable to the claimant,
  // on the theory that more written rules means more to breach. Financial
  // reporting spent decades learning the opposite is at least as often true:
  // density invites conduct engineered to satisfy every rule while defeating what
  // the rules were for, and that conduct is formally unimpeachable. So the shield
  // is modelled, and so is the answer to it.
  if (inst.regime === 'rigid' || inst.policy_density >= 0.7) {
    const theory = THEORIES.structured_compliance;
    raised.push(mkDefeater('structured_compliance', 0.4 + inst.policy_density * 0.3, {
      target: condition.id,
      argument: theory.argument,
      vulnerability: theory.vulnerability,
      answer_available: {
        move: 'purpose_and_recorded_judgment',
        argument:
          'A written requirement has an objective. Conduct meeting the text while defeating the objective is not ' +
          'compliance, and a party invoking the rulebook as a shield must show it made the judgment at the time ' +
          'rather than reconstructing it afterwards.',
        source: 'the settled answer in financial reporting to the same argument',
      },
    }));
  }

  // 5. Procedural bars.
  if (ctx.facts?.exhausted?.value === false) {
    raised.push(mkDefeater('exhaustion', 0.6, { target: condition.id, argument: 'The internal process was not carried to its end before this claim was brought.' }));
  }
  if (ctx.facts?.within_limitations?.value === false) {
    raised.push(mkDefeater('timeliness', 0.8, { target: condition.id, argument: 'The claim was filed outside the applicable period.' }));
  }

  // 6. Adverse precedent.
  const adverse = onPoint(ctx.precedents, condition.covers ?? []).filter((p) => p.favours === 'respondent');
  for (const p of adverse) {
    const ent = entrenchment(p);
    raised.push(mkDefeater('precedent_forecloses', 0.5 + ent.score * 0.45, {
      target: condition.id,
      argument: `${p.cite}: ${p.holding}`,
      rationale: p.rationale,
      entrenchment: ent,
      answer: movesAgainst(p, ctx.facts ?? {}),
    }));
  }

  // 7. The governance riposte, where the claim reaches the premise.
  if (condition.track === 'governance' || (ctx.claim?.attacks ?? []).some((a) => a.layer === 'constitutive')) {
    raised.push(mkDefeater('self_defeating_premise', 0.75, {
      target: condition.id,
      argument: 'The claimant asks this body to act on a theory that denies this body\'s authority to act. Relief on that premise would be void in the granting.',
    }));
  }

  for (const d of raised) for (const p of d.principles) principles.add(p);

  return {
    side: 'opponent',
    condition: condition.id,
    track: condition.track,
    antithesis: `It is not established that ${lowerFirst(condition.statement)}`,
    defeaters: raised.sort((a, b) => b.strength - a.strength),
    strongest: raised.length ? raised.reduce((a, b) => (b.strength > a.strength ? b : a)) : null,
    principles: [...principles],
    principled_weight: round(tally([...principles])),
  };
}

function mkDefeater(kind, strength, extra) {
  const d = DEFEATERS[kind];
  return {
    kind,
    label: d.label,
    gloss: d.gloss,
    principles: d.principles,
    strength: round(Math.max(0, Math.min(1, strength))),
    ...extra,
  };
}

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

// Counterclaims.
//
// A defeater says the claim fails. A counterclaim says the respondent has one of
// its own, and the two are different objects with different consequences: a
// defeater costs the claimant the case, a counterclaim can cost them more than
// they came in with. Nothing in this engine modelled that, which made every
// projection here optimistic by omission.
//
// The interaction worth noticing is with the passage model. `public_record` is
// scored there as a sustain — it holds memory and salience across a long
// interval, and for many claimants it is the only sustain available. It is also
// the single act that opens the most exposure. That is a real cost of the term,
// and a model that scores the benefit without the cost is not measuring, it is
// encouraging.
export const COUNTERCLAIMS = {
  defamation: {
    label: 'Defamation',
    trigger: 'the account was published',
    gloss:
      'Reaches the published account rather than the claim. Truth is a defence and the burden of proving falsity generally sits with the institution as to matters of public concern, ' +
      'but the defence is established at trial, and the cost of getting there is the point.',
    severity: 0.7,
    interacts_with: 'passage.sustain.public_record',
    note: 'The sustain that carries a claim across a long interval is the same act that opens this. Both belong in the same sentence when advising anyone.',
  },
  breach_of_contract: {
    label: 'Breach of contract or code of conduct',
    trigger: 'an enrolment agreement or conduct code exists',
    gloss: 'The instrument the claimant wants to enforce against the institution binds them too, and the institution drafted it.',
    severity: 0.5,
  },
  fee_shifting: {
    label: 'Fee-shifting on a claim held frivolous',
    trigger: 'a fee-shifting statute is invoked',
    gloss:
      'Several civil-rights statutes allow a prevailing defendant fees where the action was frivolous, unreasonable or without foundation. ' +
      'The standard is deliberately asymmetric and rarely met, but the exposure is what a risk-averse claimant actually weighs.',
    severity: 0.6,
  },
  abuse_of_process: {
    label: 'Abuse of process',
    trigger: 'proceedings are characterised as brought for a collateral purpose',
    gloss: 'Reaches the bringing of the claim rather than its merits. Usually weak; usually pleaded anyway.',
    severity: 0.4,
  },
  interference: {
    label: 'Tortious interference',
    trigger: 'the claimant contacted the institution\'s counterparties',
    gloss: 'Reaches the organising and the telling — which is to say, it reaches the community sustain directly.',
    severity: 0.5,
    interacts_with: 'passage.sustain.community',
  },
};

/**
 * What the respondent can bring back, given what the claimant has done.
 * Scored on exposure, not on likelihood of success — the exposure is what
 * changes a person's decision, and it exists whether or not the counterclaim wins.
 */
export function counterclaims(ctx = {}) {
  const f = ctx.facts ?? {};
  const raised = [];
  const add = (id, why) => {
    const c = COUNTERCLAIMS[id];
    raised.push({ id, ...c, why });
  };

  if (f.account_published?.value === true) add('defamation', 'the account is public, so there is something to sue over');
  if (f.enrolment_agreement?.value === true || f.conduct_code_applies?.value === true) {
    add('breach_of_contract', 'the institution drafted an instrument that binds the claimant too');
  }
  if (f.fee_shifting_statute_invoked?.value === true) add('fee_shifting', 'the statute pleaded carries a prevailing-defendant provision');
  if (f.contacted_counterparties?.value === true) add('interference', 'third parties were contacted');
  if (f.claim_characterised_as_collateral?.value === true) add('abuse_of_process', 'a collateral purpose has been alleged');

  const exposure = raised.reduce((a, b) => Math.max(a, b.severity), 0);
  return {
    raised,
    exposure: Math.round(exposure * 100) / 100,
    finding: raised.length
      ? 'The respondent is not only defending. What it can bring back is scored on exposure rather than on likelihood, because exposure is what changes a decision and it exists whether or not the counterclaim would win.'
      : 'Nothing on this record supports a counterclaim. That is a finding about the record as pleaded, and it changes the moment the account is published.',
    unmodelled_before: true,
  };
}
