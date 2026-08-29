// The authority of the premise.
//
// The knot: you are asking a governing authority for relief, and part of your
// case is that the authority governed wrongly. If the claim is framed as "this
// body has no rightful authority", then a grant of relief is the body conceding
// its own standing to grant relief — which it cannot do, and which would
// dissolve the remedy in the act of awarding it. Push hard enough on the
// premise and you argue yourself out of the forum.
//
// The resolution this module implements is a layer separation. "Authority" is
// not one thing; it is three, and only two of them are contestable:
//
//   1. CONSTITUTIVE  — the power to be the authority at all (charter, enabling
//                      act, delegated sovereignty). Attacking this layer is
//                      self-defeating for anyone seeking relief from it.
//   2. WARRANT       — the justification the authority claims for holding that
//                      power: its stated purpose, its promises, its published
//                      commitments. Fully contestable, and contesting it does
//                      not unseat the authority — it holds the authority to its
//                      own terms.
//   3. COMPETENCE    — particular exercises: this decision, this proceeding,
//                      this policy. Contestable and correctable as a matter of
//                      routine.
//
// So the non-self-defeating frame is: relief is not a concession of governance,
// it is an EXERCISE of it. The authority is asked to do what its own
// constitutive commitments already oblige. Granting confirms the authority
// rather than surrendering it — which is precisely why it can be granted.
//
// Practically: any prayer for relief that requires the respondent to disavow
// its own authority is flagged and rewritten to target the warrant and the
// competence instead.

export const LAYERS = {
  constitutive: {
    rank: 0,
    label: 'Constitutive authority',
    contestable: false,
    gloss: 'The power to be the authority. Attacking it forfeits the forum.',
  },
  warrant: {
    rank: 1,
    label: 'Legitimating warrant',
    contestable: true,
    gloss: 'The justification claimed for holding the power. Holding the body to its own stated terms.',
  },
  competence: {
    rank: 2,
    label: 'Exercised competence',
    contestable: true,
    gloss: 'The particular act. Reviewable and correctable without touching the charter.',
  },
};

/**
 * Score how far a claim, as framed, attacks the constitutive layer.
 * 0 = fully survivable framing; 1 = self-defeating as pleaded.
 */
export function selfDefeatRisk(claim) {
  const targets = claim.attacks ?? [];
  let risk = 0;
  for (const t of targets) {
    if (t.layer === 'constitutive') risk += 0.6 * (t.weight ?? 1);
    if (t.layer === 'warrant') risk += 0.05 * (t.weight ?? 1);
  }
  if (claim.relief_requires_disavowal) risk += 0.5;
  return Math.max(0, Math.min(1, risk));
}

/**
 * Rewrite a claim into a frame the forum can actually grant.
 *
 * Every constitutive attack is converted into the warrant-level claim it was
 * really making: not "you have no authority", but "the authority you do have
 * was conferred on terms you have not kept."
 */
export function reframe(claim) {
  const before = selfDefeatRisk(claim);
  const moved = [];
  const attacks = (claim.attacks ?? []).map((t) => {
    if (t.layer !== 'constitutive') return t;
    const converted = {
      ...t,
      layer: 'warrant',
      original_layer: 'constitutive',
      statement: constitutiveToWarrant(t.statement),
    };
    moved.push(converted);
    return converted;
  });

  const reframed = {
    ...claim,
    attacks,
    relief_requires_disavowal: false,
    relief_theory: 'exercise_not_concession',
  };

  return {
    before,
    after: selfDefeatRisk(reframed),
    moved,
    claim: reframed,
    frame: {
      holding_shape:
        'The respondent retains full constitutive authority. The relief sought is an exercise of that authority in conformity with the terms on which it was conferred, not a diminution of it.',
      why_grantable:
        'A body may always correct its own exercise of power without surrendering the power. Correction is evidence of governing capacity, not of its absence.',
      what_is_conceded: 'Nothing at the constitutive layer. Only that a particular exercise departed from the stated warrant.',
      standing_preserved: true,
    },
    counter_move: {
      by: 'respondent',
      principle: 'sovereign_continuity',
      argument:
        'The claimant\'s theory, taken to its end, denies the premise on which any award would rest; the tribunal cannot grant relief that unmakes the tribunal.',
      answer:
        'The theory reaches the warrant and the exercise, never the charter. The respondent is asked to honour its own instrument, which presupposes rather than denies its authority.',
      answered: true,
    },
  };
}

function constitutiveToWarrant(statement = '') {
  const s = statement.trim().replace(/\.$/, '');
  return `${s} — pleaded not as a denial of the respondent's authority, but as a departure from the terms on which that authority was conferred and is held.`;
}

/**
 * The reparations form of the paradox, stated generally.
 *
 * A remedy that is large enough to matter looks like it concedes the legitimacy
 * of the thing it remedies. This returns the standard escape: the remedy is
 * owed under the institution's own commitments, so paying it vindicates the
 * commitments rather than indicting the institution's right to exist.
 */
export function remedialFrame({ remedy = 'the relief sought', instrument = 'its own charter and published commitments' } = {}) {
  return {
    thesis: `${remedy} is owed because the respondent's conduct departed from ${instrument}.`,
    antithesis: `Granting ${remedy} would admit a defect so deep that the respondent's authority to grant anything is in question.`,
    synthesis:
      `The obligation arises from ${instrument}, so performance is an act of authority under that instrument. ` +
      'The respondent does not concede that it should not govern; it demonstrates that it does — by holding itself to the terms it wrote. ' +
      'The deeper the departure, the more the correction is required to preserve the authority, not to dissolve it.',
    non_circular: true,
  };
}
