// Institutional translation.
//
// The same argument does not survive a change of venue. A test built against a
// loose institution — one that runs on unwritten practice and pervasive
// discretion — reads as a complaint about nothing when it is aimed at a rigid
// one, and vice versa. So every condition is re-run against four policy
// regimes, and the simulator reports which of the claimant's moves survive each.
//
// The fourth regime is the one that is usually missed and is the most
// productive: an institution with too MUCH policy, whose rules conflict, so
// that discretion becomes functionally mandatory while remaining formally
// unauthorised. Nobody can cite the ground they are actually standing on,
// because the principal act never granted it. That silence is not a gap in the
// claimant's case. It is the defect.

export const REGIMES = {
  loose: {
    label: 'Loose',
    gloss: 'Few written rules; outcomes run on custom and individual judgment.',
    policy_density: 0.2,
    discretion: 0.85,
    claimant_theory: 'custom_and_estoppel',
    respondent_theory: 'no_rule_no_violation',
  },
  rigid: {
    label: 'Rigid',
    gloss: 'Dense, enforced rules; little room to depart from the written process.',
    policy_density: 0.85,
    discretion: 0.2,
    claimant_theory: 'self_binding_breach',
    respondent_theory: 'process_followed',
  },
  absent: {
    label: 'Absent',
    gloss: 'No governing policy on the question at all.',
    policy_density: 0.05,
    discretion: 0.95,
    claimant_theory: 'standardless_therefore_arbitrary',
    respondent_theory: 'no_reviewable_standard',
  },
  over_dense: {
    label: 'Over-dense',
    gloss: 'So much policy that provisions conflict; compliance with all of it is impossible.',
    policy_density: 1.0,
    discretion: 0.7,
    claimant_theory: 'necessity_silence_conflict',
    respondent_theory: 'reasonable_reconciliation',
  },
};

export const THEORIES = {
  custom_and_estoppel: {
    label: 'Custom and estoppel',
    principles: ['reliance', 'procedural_regularity'],
    argument:
      'Where an institution has no written rule but a settled practice, the practice is the rule. ' +
      'Having induced reliance on it, the institution may not depart from it in a single case without reasons.',
    vulnerability: 'Practice must be shown to be settled and known; a one-off departure may be characterised as ordinary judgment.',
    base_strength: 0.55,
  },
  no_rule_no_violation: {
    label: 'No rule, no violation',
    principles: ['institutional_competence', 'textual_fidelity'],
    argument: 'Nothing written was breached, so nothing enforceable was breached.',
    vulnerability: 'Concedes that the outcome rested on unreviewable judgment, which invites the arbitrariness theory.',
    base_strength: 0.5,
  },
  self_binding_breach: {
    label: 'Self-binding breach',
    principles: ['self_binding', 'procedural_regularity', 'non_arbitrariness'],
    argument:
      'The institution published the process. A published process binds its author first. ' +
      'Departure from it is the violation, and no showing of bad outcome is needed beyond the departure itself.',
    vulnerability: 'Respondent will argue substantial compliance or harmless deviation.',
    base_strength: 0.72,
  },
  process_followed: {
    label: 'Process followed',
    principles: ['procedural_regularity', 'finality', 'exhaustion'],
    argument: 'Each written step was taken; disagreement with the outcome is not a procedural defect.',
    vulnerability: 'Formal compliance with a process whose substance was predetermined is itself reviewable.',
    base_strength: 0.6,
  },
  structured_compliance: {
    label: 'Formal compliance with every written rule',
    principles: ['textual_fidelity', 'institutional_competence'],
    argument:
      'Every applicable written requirement was satisfied. Where conduct meets each rule as drafted, ' +
      'a complaint that it defeated the rules\' purpose is a complaint about the drafting, not about the conduct.',
    vulnerability:
      'The answer is the one financial reporting settled on after decades of the same argument: a rule has an ' +
      'objective, conduct engineered to satisfy the text while defeating the objective does not comply, and the ' +
      'party claiming the shield must show it made and recorded the judgment at the time.',
    base_strength: 0.62,
  },
  standardless_therefore_arbitrary: {
    label: 'Standardless, therefore arbitrary',
    principles: ['non_arbitrariness', 'equal_protection'],
    argument:
      'Where no standard exists, no two decisions can be shown to be alike, and the decision cannot be defended as reasoned. ' +
      'Unconstrained power over an individual interest is arbitrary in the constitutional sense, not merely the colloquial one.',
    vulnerability: 'Respondent argues the absence of policy means the matter was committed to discretion and is unreviewable.',
    base_strength: 0.6,
  },
  no_reviewable_standard: {
    label: 'No reviewable standard',
    principles: ['institutional_competence', 'separation_of_powers'],
    argument: 'With no law to apply, the decision is committed to institutional judgment and a reviewing body has nothing to measure against.',
    vulnerability: 'This is an admission that converts cleanly into the vagueness and standardless-discretion challenge.',
    base_strength: 0.55,
  },
  necessity_silence_conflict: {
    label: 'Necessity–silence conflict',
    principles: ['non_arbitrariness', 'self_binding', 'institutional_candor'],
    argument:
      'The policy set is internally inconsistent, so some provision must be disapplied in every case. ' +
      'Discretion is therefore functionally required in order for the institution to operate at all. ' +
      'But the principal act supplies no standard for choosing which provision yields, so the discretion actually exercised can never be cited to any source. ' +
      'The result is power that must be used and cannot be justified — unreviewable by construction. ' +
      'The defect is not the individual decision but the silence that makes every such decision unaccountable.',
    vulnerability: 'Requires showing an actual conflict, not merely a dense rulebook; respondent will offer a harmonising reading.',
    base_strength: 0.68,
  },
  reasonable_reconciliation: {
    label: 'Reasonable reconciliation',
    principles: ['institutional_competence', 'textual_fidelity'],
    argument: 'The provisions can be read together, and the institution\'s reconciliation of them is entitled to deference.',
    vulnerability: 'If the reconciliation was never stated at the time, it is post-hoc rationalisation and gets no deference.',
    base_strength: 0.5,
  },
};

/** Build an institution profile, defaulting anything the corpus omits. */
export function profile(inst = {}) {
  const asked = inst.regime ?? inferRegime(inst);
  // An unrecognised regime falls back rather than producing a profile that
  // claims a regime it has none of the properties of.
  const regime = REGIMES[asked] ? asked : inferRegime(inst);
  const base = REGIMES[regime] ?? REGIMES.loose;
  return {
    id: inst.id ?? 'respondent',
    name: inst.name ?? 'the institution',
    regime,
    ...base,
    policy_density: inst.policy_density ?? base.policy_density,
    discretion: inst.discretion ?? base.discretion,
    conflicts: inst.conflicts ?? [],
    published_policies: inst.published_policies ?? [],
    settled_practices: inst.settled_practices ?? [],
    enabling_act: inst.enabling_act ?? null,
    enabling_act_supplies_standard: inst.enabling_act_supplies_standard ?? false,
  };
}

function inferRegime(inst) {
  const d = inst.policy_density ?? 0.5;
  if ((inst.conflicts?.length ?? 0) > 0 && d > 0.7) return 'over_dense';
  if (d < 0.15) return 'absent';
  if (d > 0.7) return 'rigid';
  return 'loose';
}

/**
 * Detect the necessity–silence conflict: mandatory discretion with no source.
 * This is the finding that converts an institutional mess into a statutory
 * challenge, because the fix is legislative rather than adjudicative.
 */
export function necessitySilence(inst) {
  const p = profile(inst);
  const hasConflict = p.conflicts.length > 0;
  const mustChoose = hasConflict || p.regime === 'over_dense';
  const noStandard = !p.enabling_act_supplies_standard;
  const triggered = mustChoose && noStandard;
  return {
    triggered,
    regime: p.regime,
    conflicts: p.conflicts,
    enabling_act: p.enabling_act,
    // Aviation's substitution test, borrowed because the construct asserted that
    // discretion was "functionally required" without supplying a way to prove it.
    // This is a thing a record can actually establish.
    substitution_test: triggered
      ? {
          question:
            'Would another similarly trained and experienced person, in the same circumstances and with the same ' +
            'information, plausibly have made the same choice between the conflicting provisions?',
          if_yes:
            'The finding is systemic. The defect belongs to the instrument that forced the choice, not to the person ' +
            'who made it, and no amount of scrutiny of the individual decision will reach it.',
          if_no:
            'The departure was not compelled by the conflict, and the ordinary review of that particular exercise ' +
            'applies without needing this argument at all.',
          proves: 'that the discretion was required rather than merely convenient',
          source: 'ICAO Annex 19 / Just Culture practice',
        }
      : null,
    finding: triggered
      ? 'Discretion is required for the institution to function and is unauthorised by the instrument that created it. ' +
        'Every exercise is therefore both unavoidable and uncitable, and no reviewing body can test it against anything.'
      : mustChoose
        ? 'Conflicting provisions require a choice, but the enabling act supplies a standard for making it, so the choice is reviewable.'
        : 'No conflict established; discretion, where exercised, is not shown to be structurally unauthorised.',
    remedy_vector: triggered ? 'supply_an_intelligible_principle' : null,
    principles: triggered ? ['non_arbitrariness', 'institutional_candor', 'self_binding'] : [],
  };
}

/**
 * Translate a claimant theory across every regime, so you can see which moves
 * survive a change of institution and which were artifacts of this one.
 */
export function translate(baseTheoryId, inst) {
  const here = profile(inst);
  const rows = [];
  for (const [id, regime] of Object.entries(REGIMES)) {
    const claimant = THEORIES[regime.claimant_theory];
    const respondent = THEORIES[regime.respondent_theory];
    const survives = regime.claimant_theory === baseTheoryId
      ? 'native'
      : portability(baseTheoryId, id);
    rows.push({
      regime: id,
      label: regime.label,
      gloss: regime.gloss,
      is_actual: id === here.regime,
      claimant_theory: { id: regime.claimant_theory, ...claimant },
      respondent_theory: { id: regime.respondent_theory, ...respondent },
      base_theory_status: survives,
      note: PORT_NOTES[`${baseTheoryId}->${id}`] ?? null,
    });
  }
  return { actual_regime: here.regime, rows };
}

function portability(theoryId, regimeId) {
  const t = THEORIES[theoryId];
  if (!t) return 'unknown';
  const target = REGIMES[regimeId];
  const shared = t.principles.filter((p) => THEORIES[target.claimant_theory].principles.includes(p));
  if (shared.length >= 2) return 'transfers';
  if (shared.length === 1) return 'transfers_weakened';
  return 'does_not_transfer';
}

const PORT_NOTES = {
  'self_binding_breach->loose':
    'Without a written rule there is nothing to be bound by; the argument must be re-pleaded as custom and estoppel or it collapses.',
  'self_binding_breach->absent':
    'Re-plead as standardless discretion. The absence you would have complained about becomes the whole claim.',
  'custom_and_estoppel->rigid':
    'Practice arguments lose to the written rule; the rule is now both the sword and the answer, so plead breach of it directly.',
  'custom_and_estoppel->over_dense':
    'Practice is evidence of which conflicting provision the institution actually disapplies — useful, but as proof of the conflict rather than as the rule itself.',
  'standardless_therefore_arbitrary->rigid':
    'A dense rulebook defeats the premise. Shift to whether the rules were followed.',
  'necessity_silence_conflict->rigid':
    'Only survives if the density itself produces conflicts; a rigid but coherent rulebook answers it.',
  'necessity_silence_conflict->absent':
    'Merges into the standardless-discretion theory: same defect, reached without needing to prove a conflict.',
};
