// Principle registry.
//
// The premise of this simulator is that in the cases it models, evidence is
// rarely dispositive: both sides can usually reach the same record and read it
// differently. What actually moves a judgment is which principle the tribunal
// treats as load-bearing. So principles are first-class objects with weights,
// and the judge decides contested elements by principled margin rather than by
// counting facts.

export const PRINCIPLES = {
  equal_protection: {
    weight: 1.0,
    gloss: 'Like cases are treated alike; race-conscious burdens require justification.',
    polarity: 'claimant',
  },
  non_arbitrariness: {
    weight: 0.9,
    gloss: 'An exercise of public or quasi-public power must rest on a stated, reviewable reason.',
    polarity: 'claimant',
  },
  procedural_regularity: {
    weight: 0.85,
    gloss: 'The process actually followed must be the process that was promised.',
    polarity: 'claimant',
  },
  self_binding: {
    weight: 0.8,
    gloss: 'An institution that publishes a rule is bound by it before it binds anyone else.',
    polarity: 'claimant',
  },
  institutional_candor: {
    weight: 0.75,
    gloss: 'A body owing a duty must disclose the basis on which it acted.',
    polarity: 'claimant',
  },
  authorial_ownership: {
    weight: 0.8,
    gloss: 'Authorship vests in the author absent a writing that says otherwise.',
    polarity: 'claimant',
  },
  remedial_completeness: {
    weight: 0.7,
    gloss: 'A right without a remedy is not a right; relief should reach the whole injury.',
    polarity: 'claimant',
  },
  reliance: {
    weight: 0.65,
    gloss: 'Settled expectations induced by an institution are protected.',
    polarity: 'neutral',
  },
  // Respondent-leaning principles.
  separation_of_powers: {
    weight: 0.9,
    gloss: 'Rights of action and standards of conduct are created by the legislature, not inferred.',
    polarity: 'respondent',
  },
  textual_fidelity: {
    weight: 0.85,
    gloss: 'The enacted words govern; a reading the text will not bear is not available.',
    polarity: 'respondent',
  },
  institutional_competence: {
    weight: 0.8,
    gloss: 'Academic and professional judgment is reviewed deferentially, not de novo.',
    polarity: 'respondent',
  },
  finality: {
    weight: 0.7,
    gloss: 'Concluded proceedings are not endlessly reopened.',
    polarity: 'respondent',
  },
  exhaustion: {
    weight: 0.6,
    gloss: 'Internal remedies are used before external ones are invoked.',
    polarity: 'respondent',
  },
  sovereign_continuity: {
    weight: 0.95,
    gloss: 'A governing authority cannot be required to disavow the authority under which it acts.',
    polarity: 'respondent',
  },
};

export function weightOf(id) {
  const p = PRINCIPLES[id];
  return p ? p.weight : 0.5;
}

export function glossOf(id) {
  const p = PRINCIPLES[id];
  return p ? p.gloss : id;
}

/** Sum the weights of a principle list, de-duplicated. */
export function tally(ids = []) {
  const seen = new Set();
  let total = 0;
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    total += weightOf(id);
  }
  return total;
}
