// Precedent, its rationale, and how much pull it actually has.
//
// A precedent is not a wall; it is a weight, and the weight is a function of
// things you can name and argue about. This module scores that weight, decides
// whether the honest move is to follow, distinguish, limit, or press for
// overruling, and — where the precedent is entrenched but wrong — routes the
// problem to the legislature instead. That routing is the point of the whole
// exercise: a precedent that cannot be moved by a court is the strongest
// possible argument for a statutory fix.

export const TREATMENTS = ['followed', 'distinguished', 'limited', 'questioned', 'overruled'];

/** Precedents whose `covers` tags intersect the element's coverage tags. */
export function onPoint(precedents, tags = []) {
  if (!tags.length) return [];
  return precedents.filter((p) => (p.covers ?? []).some((c) => tags.some((t) => matchTag(c, t))));
}

function matchTag(coverage, tag) {
  if (coverage === tag) return true;
  // "civil.private_right" covers "civil.private_right.disparate_impact"
  return tag.startsWith(`${coverage}.`) || coverage.startsWith(`${tag}.`);
}

/**
 * Casey-style factors. High score = entrenched; low = ripe to be displaced.
 * `erosion` and `factual_change` cut against the precedent; `reliance` and
 * `workability` cut for it.
 */
export function entrenchment(p) {
  const reliance = p.reliance ?? 0.5;
  const workability = p.workability ?? 0.5;
  const erosion = p.erosion ?? 0.2;
  const factual = p.factual_change ?? 0.2;
  const age = p.year ? Math.min(1, (new Date().getFullYear() - p.year) / 60) : 0.3;
  const raw = 0.3 * reliance + 0.3 * workability + 0.2 * age - 0.35 * erosion - 0.25 * factual;
  const score = Math.max(0, Math.min(1, raw + 0.35));
  let posture;
  if (score >= 0.7) posture = 'entrenched';
  else if (score >= 0.45) posture = 'stable_but_pressable';
  else if (score >= 0.28) posture = 'vulnerable';
  else posture = 'ripe_for_displacement';
  return {
    score: round(score),
    posture,
    factors: { reliance, workability, erosion, factual_change: factual, age: round(age) },
    reasoning: entrenchmentReasoning(posture, p),
  };
}

function entrenchmentReasoning(posture, p) {
  switch (posture) {
    case 'entrenched':
      return `${p.short ?? p.id} is settled, workable, and heavily relied upon. A court will not revisit it; the realistic route around it is legislative.`;
    case 'stable_but_pressable':
      return `${p.short ?? p.id} holds, but its rationale can be confined to its facts. Argue for a narrow reading rather than for overruling.`;
    case 'vulnerable':
      return `${p.short ?? p.id} has been eroded by later authority or by changed facts. Preserve the overruling argument, but win on distinction if you can.`;
    default:
      return `${p.short ?? p.id} rests on assumptions that no longer hold. Press the displacement argument directly, and plead the statutory fix in the alternative.`;
  }
}

/**
 * Given a precedent that runs against the claimant, produce the available moves
 * in the order a careful advocate would actually take them.
 */
export function movesAgainst(p, caseFacts = {}) {
  const ent = entrenchment(p);
  const moves = [];
  const distinctions = (p.distinguishable_on ?? []).filter((d) => caseFacts[d.fact] !== undefined && caseFacts[d.fact]?.value === d.value);
  if (distinctions.length) {
    moves.push({
      move: 'distinguish',
      strength: 0.7,
      basis: distinctions.map((d) => d.note ?? `${d.fact} = ${d.value}`),
      why: 'The holding is bounded by facts this record does not share, so the rule does not reach this case on its own terms.',
    });
  }
  if ((p.rationale_scope ?? 'broad') === 'narrow' || ent.posture === 'stable_but_pressable') {
    moves.push({
      move: 'limit_to_rationale',
      strength: 0.55,
      basis: [p.rationale ?? 'stated rationale'],
      why: 'A holding reaches no further than the reasoning that produced it. Where the reasoning does not apply, neither does the holding.',
    });
  }
  if (ent.posture === 'vulnerable' || ent.posture === 'ripe_for_displacement') {
    moves.push({
      move: 'press_for_displacement',
      strength: 0.45,
      basis: [`entrenchment ${ent.score}`, ent.reasoning],
      why: 'Later authority and changed conditions have undercut the premises; the rule can be argued as no longer good law.',
    });
  }
  if (ent.posture === 'entrenched') {
    moves.push({
      move: 'route_to_legislature',
      strength: 0.8,
      basis: [ent.reasoning],
      why: 'Where the precedent is judicially immovable, the defect is a legislative one. This is the strongest statutory-challenge posture, not a fallback.',
      produces_statutory_vector: true,
    });
  }
  moves.push({
    move: 'follow',
    strength: 0.3,
    basis: [p.holding ?? ''],
    why: 'Concede the point and win elsewhere; conceding a controlled point buys credibility on the contested ones.',
  });
  return { precedent: p, entrenchment: ent, moves };
}

/**
 * Gap register. A gap is where neither the enacted text nor any precedent
 * actually decides the question — the place where a case is either lost for
 * want of authority or won by making new law.
 */
export function findGaps({ element, precedents, provision, lexDrift, status = 'contested' }) {
  const tags = element.covers ?? [];
  const covering = onPoint(precedents, tags);
  const gaps = [];

  // An element that is simply established on the record is not a question of
  // first impression just because no case has bothered to say so. A gap is only
  // worth registering where the element is actually in play: contested or
  // unmet, or resting on an interpretive judgment rather than a fact.
  const inPlay = status !== 'met' || Boolean(element.term);

  if (!covering.length && inPlay) {
    gaps.push({
      element: element.id,
      class: 'first_impression',
      statement: `No authority in the corpus decides "${element.statement ?? element.id}".`,
      consequence: 'The question is open. It will be decided by principle and analogy, which is where the judge model below does its work.',
      statutory_vector: 'codify_the_rule',
    });
  }

  if (provision && element.term && !(provision.terms ?? []).includes(element.term)) {
    gaps.push({
      element: element.id,
      class: 'textual_silence',
      statement: `The provision (${provision.cite ?? provision.id}) never uses the operative term "${element.term}".`,
      consequence: 'The claim depends on reading the term in, which invites the fidelity objection and gives a reviewing court an easy exit.',
      statutory_vector: 'amend_to_name_the_term',
    });
  }

  if (lexDrift?.drifted) {
    gaps.push({
      element: element.id,
      class: 'definitional_drift',
      statement: `"${lexDrift.label}" carries different reach depending on the interpretive regime applied.` +
        (lexDrift.narrowedBy ? ` Reach was narrowed in ${lexDrift.narrowedBy.year} by ${lexDrift.narrowedBy.by}, losing: ${lexDrift.narrowedBy.lost.join(', ')}.` : ''),
      consequence: 'The outcome turns on which sense the tribunal adopts rather than on the record. That is a drafting problem, and drafting problems are fixed by drafting.',
      statutory_vector: 'define_the_term_in_statute',
    });
  }

  const conflicting = splitAuthority(covering);
  if (conflicting) {
    gaps.push({
      element: element.id,
      class: 'conflicting_authority',
      statement: `Authority divides: ${conflicting.pro.map((p) => p.short ?? p.id).join(', ')} against ${conflicting.con.map((p) => p.short ?? p.id).join(', ')}.`,
      consequence: 'Either side can cite controlling-looking authority, so the tribunal must choose on principle. A split is also the classic ground for review.',
      statutory_vector: 'resolve_the_split_by_statute',
    });
  }

  return gaps;
}

function splitAuthority(precedents) {
  const pro = precedents.filter((p) => p.favours === 'claimant');
  const con = precedents.filter((p) => p.favours === 'respondent');
  return pro.length && con.length ? { pro, con } : null;
}

function round(n) {
  return Math.round(n * 100) / 100;
}
