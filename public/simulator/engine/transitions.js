// Passages.
//
// Every other module in this engine scores a state: an element met, a condition
// established, a precedent entrenched. States are what the doctrine talks about,
// so states are what got modelled first. But nobody experiences a state. What a
// person actually experiences is the passage between two of them — the interval
// after the record is requested and before the record exists as a document.
//
// That interval is where claims are lost, and it is not lost for doctrinal
// reasons. It is lost because evidence ages, memory goes, the person's standing
// lapses when they graduate or leave or are removed, and their capacity to keep
// going runs out. None of that appears anywhere in a holding.
//
// Two things follow, and this module models both.
//
// FIRST, the glitch. The record that is requested and the document that arrives
// are not the same object, and the gap between them is not an absence of
// evidence — it IS evidence. A body required to maintain a record that returns
// nothing has told you something about itself. Read the delta, not just the
// document.
//
// SECOND, what carries a claim across. Not doctrine; doctrine does not move.
// People do. And the support that works is structurally lopsided — many know
// the case, the person knows few of them back. That asymmetry reads like a
// defect and is the opposite: reciprocal support is capped by how many
// relationships one exhausted person can carry, and asymmetric support is not.
// It is a real relation doing real work on unequal terms, and modelling it as
// anything softer would be both untrue and useless.

export const PASSAGE_KINDS = {
  request_to_record: {
    label: 'Request → record',
    from: 'the record as provisionally requested',
    to: 'the record as actually documented',
    gloss: 'The ask is made. Something arrives, or does not. This is the passage the whole claim rests on and the one with no procedure governing it.',
  },
  complaint_to_docket: {
    label: 'Complaint → proceeding',
    from: 'a grievance filed',
    to: 'a matter that formally exists',
    gloss: 'Filing is not docketing. In the gap the institution decides whether the thing is a thing.',
  },
  record_to_finding: {
    label: 'Record → finding',
    from: 'documents produced',
    to: 'a determination made on them',
    gloss: 'Documents do not speak. Someone has to be reading, and someone has to still be asking.',
  },
  finding_to_remedy: {
    label: 'Finding → remedy',
    from: 'a determination in the claimant\'s favour',
    to: 'relief actually ordered',
    gloss: 'Being right is not being restored. Most claims that die after winning die here.',
  },
  remedy_to_repair: {
    label: 'Remedy → repair',
    from: 'relief ordered',
    to: 'the interval actually closed',
    gloss: 'An order is a document too. Whether it becomes a life again is a further passage, and nobody supervises it.',
  },
};

// What the delta between request and production tells you.
export const GLITCHES = {
  clean: {
    label: 'Produced as requested',
    evidentiary_value: 0,
    reading: 'The document matches the request. Read the document.',
  },
  partial: {
    label: 'Partially produced',
    evidentiary_value: 0.5,
    reading:
      'Some of what was asked for arrived. What is missing was selected by the party with an interest in the selection, and the shape of the omission is the first thing to describe on the record.',
  },
  null_return: {
    label: 'No responsive records',
    evidentiary_value: 0.85,
    reading:
      'Nothing arrived from a body required to hold it. This is not an absence of evidence. Either the record was never made, which is a failure to maintain, or it was made and is gone, which is worse, and the institution must say which.',
  },
  reconstructed: {
    label: 'Produced, but made afterwards',
    evidentiary_value: 0.8,
    reading:
      'A document exists and postdates the decision it explains. It is a rationalisation, not a record, and it gets none of the deference a contemporaneous document would.',
  },
  substituted: {
    label: 'A different document offered',
    evidentiary_value: 0.6,
    reading:
      'What arrived answers a question nobody asked. Substitution is a choice, and the choice implies someone read the actual request and declined it.',
  },
  timed_out: {
    label: 'Never produced',
    evidentiary_value: 0.7,
    reading:
      'The interval simply ran. Where an institution controls both the clock and the remedy, an unbounded process is a limitations defence that never had to be pleaded.',
  },
};

// What the interval costs, per unit of time.
// Every rate below is STIPULATED — chosen to express a judgment, not measured
// from anything. `basis` says so on each one, and `measurable_by` says what
// would have to exist for it to become a number with a record behind it. This
// matters because the ordering of these rates determines the model's headline
// output, and an ordering that comes from the author is an assumption made
// legible, never a finding.
export const DECAYS = {
  evidence: {
    label: 'Evidence', rate: 0.9, basis: 'stipulated',
    gloss: 'Files are purged on schedule; devices are reissued; the contemporaneous record thins.',
    measurable_by: 'published retention schedules, which state the actual half-life of a given record class',
  },
  memory: {
    label: 'Memory', rate: 0.7, basis: 'stipulated',
    gloss: 'Witnesses recall the account they last gave rather than the events.',
    measurable_by: 'the eyewitness-memory literature, which has real decay curves this could be fitted to',
  },
  standing: {
    label: 'Standing', rate: 1.0, basis: 'stipulated',
    gloss: 'The status that made the claimant a person the institution owes something to lapses — they graduate, leave, or are removed.',
    measurable_by: 'the institution\'s own enrolment and separation rules, which fix the date exactly',
  },
  capacity: {
    label: 'Capacity', rate: 1.1, basis: 'stipulated',
    gloss: 'The claimant\'s ability to keep doing this. The term no doctrine mentions.',
    measurable_by: 'nothing available here. Attrition rates in long institutional proceedings would do it, and this session has no such data.',
  },
  salience: {
    label: 'Salience', rate: 0.6, basis: 'stipulated',
    gloss: 'Everyone else stops finding it urgent, including people who agreed with it.',
    measurable_by: 'nothing available here.',
  },
};

// What carries a claim across an interval.
// As above: `strength` is stipulated, and `sustains` — which decay each term
// reaches — is a definition written by the author. Any statement of the form
// "only X reaches Y" is therefore true by construction and must never be
// reported as though the model discovered it.
export const SUSTAINS = {
  community: {
    label: 'Spontaneous community engagement',
    reciprocity: 'asymmetric',
    strength: 1.2,
    basis: 'stipulated',
    measurable_by: 'nothing available here. Case studies of long-running individual claims against institutions would be the record.',
    gloss:
      'People who show up without being organised into showing up. Structurally lopsided: many follow the case, the claimant knows few of them back. ' +
      'That is not a lesser form of support. Reciprocal support is capped by how many relationships one exhausted person can maintain, and this is not capped, ' +
      'which is precisely why it is the term that scales across a long interval.',
    sustains: ['capacity', 'salience'],
  },
  counsel: {
    label: 'Representation',
    reciprocity: 'contractual',
    strength: 1.0,
    basis: 'stipulated',
    measurable_by: 'legal-services outcome studies',
    gloss: 'Carries the procedural load and the clock. Does not carry capacity, and is usually the first thing that runs out of money.',
    sustains: ['evidence', 'standing'],
  },
  documentation_practice: {
    label: 'The claimant\'s own contemporaneous record',
    reciprocity: 'none',
    strength: 0.9,
    basis: 'stipulated',
    measurable_by: 'nothing available here.',
    gloss: 'The one term entirely within the claimant\'s control, and the only defence against a null return: a record the institution does not hold cannot be purged by it.',
    sustains: ['evidence', 'memory'],
  },
  institutional_ally: {
    label: 'Someone inside who stayed',
    reciprocity: 'mutual_but_costly',
    strength: 0.8,
    basis: 'stipulated',
    measurable_by: 'nothing available here.',
    gloss: 'Preserves standing and often produces the document. Bears real risk, which is why this term is unreliable by nature rather than by character.',
    sustains: ['standing', 'evidence'],
  },
  public_record: {
    label: 'The account made public',
    reciprocity: 'asymmetric',
    strength: 0.7,
    basis: 'stipulated',
    measurable_by: 'nothing available here.',
    gloss: 'Fixes the version of events before memory drifts, and makes salience someone else\'s problem to maintain. Costs privacy permanently and cannot be undone.',
    sustains: ['memory', 'salience'],
  },
};

/**
 * Score one passage.
 *
 * @param {object} spec
 *   kind, requested, produced, glitch, interval_days,
 *   decays: string[], sustains: string[]
 */
export function passage(spec) {
  const kind = PASSAGE_KINDS[spec.kind] ?? PASSAGE_KINDS.request_to_record;
  const glitch = GLITCHES[spec.glitch] ?? GLITCHES.clean;
  const months = (spec.interval_days ?? 0) / 30;

  const decaying = (spec.decays ?? []).map((id) => {
    const d = DECAYS[id];
    return { id, ...d, cost: round(Math.min(1, (d?.rate ?? 0.5) * months * 0.08)) };
  });
  const carrying = (spec.sustains ?? []).map((id) => {
    const s = SUSTAINS[id];
    return { id, ...s, holds: (s?.sustains ?? []) };
  });

  // A sustain only offsets the decays it actually reaches. Community does not
  // preserve a purged file; a lawyer does not restore capacity.
  let offset = 0;
  for (const d of decaying) {
    const helpers = carrying.filter((s) => s.holds.includes(d.id));
    if (!helpers.length) continue;
    const best = Math.max(...helpers.map((s) => s.strength ?? 0.5));
    offset += Math.min(d.cost, d.cost * best * 0.8);
  }

  const totalDecay = round(decaying.reduce((a, b) => a + b.cost, 0));
  const totalOffset = round(offset);
  const net = round(totalDecay - totalOffset);
  const unmet = decaying.filter((d) => !carrying.some((s) => s.holds.includes(d.id)));

  return {
    kind: spec.kind,
    label: kind.label,
    from: kind.from,
    to: kind.to,
    gloss: kind.gloss,
    interval_days: spec.interval_days ?? 0,
    requested: spec.requested,
    produced: spec.produced,
    glitch: { id: spec.glitch ?? 'clean', ...glitch },
    decay: { items: decaying, total: totalDecay },
    sustain: { items: carrying, offset: totalOffset },
    net_cost: net,
    carried: net < 0.35,
    uncovered: unmet.map((d) => ({ id: d.id, label: d.label, gloss: d.gloss, cost: d.cost })),
    connective: connective({ kind, glitch, spec, net, carrying, unmet }),
  };
}

/**
 * The transition sentence.
 *
 * The findings this engine emits are discrete blocks, and blocks with nothing
 * between them read as a list rather than an argument. This is the connective
 * tissue: what happened between one finding and the next, written as prose,
 * because the passage is the part a reader — and a tribunal — otherwise skips.
 */
function connective({ kind, glitch, spec, net, carrying, unmet }) {
  const days = spec.interval_days ?? 0;
  const span = days >= 365 ? `${(days / 365).toFixed(1)} years` : days >= 60 ? `${Math.round(days / 30)} months` : `${days} days`;
  const held = carrying.map((s) => s.label.toLowerCase()).join(', ');

  const opening = `Between ${kind.from} and ${kind.to} lies ${span}.`;
  const middle =
    glitch.evidentiary_value > 0
      ? ` ${glitch.reading}`
      : ' The document matches what was asked for, which is rare enough to be worth saying plainly.';
  // An uncovered decay is only worth naming as a loss if it actually cost
  // something over this interval. On a short passage the same gap is a note,
  // not a wound, and saying otherwise contradicts the verdict two clauses later.
  const material = unmet.filter((d) => d.cost >= 0.15);
  const cost = material.length
    ? ` Nothing in the record covered ${material.map((d) => d.label.toLowerCase()).join(' or ')} across that span, and no argument recovers what that interval took.`
    : unmet.length
      ? ` ${unmet.map((d) => d.label.toLowerCase()).join(' and ')} went uncovered, though over this span not yet expensively.`
      : '';
  const carried =
    held
      ? ` What crossed the interval was not the doctrine, which does not move. It was ${held}.`
      : ' Nothing is recorded as having carried the claim across, which is usually how a claim ends without ever being decided.';
  const verdict = net < 0.35 ? ' The claim arrives on the other side intact.' : ' The claim arrives diminished, and the diminishment is not on anyone\'s record as a ruling.';

  return opening + middle + cost + carried + verdict;
}

/** Score a whole sequence of passages and report where a claim is actually lost. */
export function itinerary(specs = []) {
  const legs = specs.map(passage);
  const totalDays = legs.reduce((a, b) => a + b.interval_days, 0);
  const lost = legs.filter((l) => !l.carried);
  const evidentiary = legs.filter((l) => l.glitch.evidentiary_value >= 0.6);

  return {
    provenance: {
      weights: 'stipulated',
      basis: 'Every decay rate and sustain strength in this module was chosen by the author to express a judgment. None is measured.',
      reportable: 'Run sensitivity() before stating any conclusion here as a finding. Only the robust class survives the weights being wrong.',
    },
    legs,
    total_days: totalDays,
    total_span: totalDays >= 365 ? `${(totalDays / 365).toFixed(1)} years` : `${Math.round(totalDays / 30)} months`,
    survived: lost.length === 0,
    lost_at: lost.map((l) => l.label),
    glitches_worth_pleading: evidentiary.map((l) => ({
      passage: l.label,
      glitch: l.glitch.label,
      value: l.glitch.evidentiary_value,
      reading: l.glitch.reading,
    })),
    finding:
      lost.length === 0
        ? 'The claim survives every passage. Where that happens it is worth naming what carried it, because it was not the merits — the merits were the same in the cases that did not survive.'
        : `The claim is diminished at: ${lost.map((l) => l.label).join('; ')}. None of those losses appear as a ruling anywhere. ` +
          'A claim that fails here has not been decided against; it has been outlasted, and the two are recorded identically.',
  };
}

/**
 * Sensitivity.
 *
 * The headline outputs of this module follow from weights the author chose. So
 * the honest report is not the ordering but which conclusions SURVIVE the
 * ordering being wrong. Three classes come out of this, and they are not
 * equally worth anything:
 *
 *   by_construction — true because of how the model is defined, so perturbing
 *                     the numbers cannot touch it. Never a finding.
 *   fragile         — flips when the weights move within a plausible range.
 *                     Report only alongside the weights that produced it.
 *   robust          — survives every perturbation tried. The only class that
 *                     may be stated without immediately restating its basis.
 */
export function sensitivity(specs = [], { spread = 0.4, steps = 5 } = {}) {
  const base = itinerary(specs);
  const runs = [];

  for (let i = 0; i < steps; i += 1) {
    const f = 1 - spread + (2 * spread * i) / Math.max(1, steps - 1);
    const decays = Object.fromEntries(
      Object.entries(DECAYS).map(([k, v]) => [k, { ...v, rate: v.rate * f }]),
    );
    const sustains = Object.fromEntries(
      Object.entries(SUSTAINS).map(([k, v]) => [k, { ...v, strength: v.strength * (2 - f) }]),
    );
    runs.push({ factor: round(f), result: itineraryWith(specs, decays, sustains) });
  }

  const lostSets = runs.map((r) => r.result.lost_at.join('|'));
  const survivedFlags = runs.map((r) => r.result.survived);

  return {
    base_lost_at: base.lost_at,
    perturbations: runs.map((r) => ({ factor: r.factor, survived: r.result.survived, lost_at: r.result.lost_at })),
    claims: [
      {
        claim: 'Only community engagement reaches the capacity decay.',
        class: 'by_construction',
        why: 'The reach list on each sustain is written by the author. Perturbing weights cannot change it, so this is a modelling decision stated in the model, not a result produced by it.',
      },
      {
        claim: 'Capacity is the heaviest decay.',
        class: 'by_construction',
        why: 'It is heaviest because its rate was set highest. Reporting it as a finding would be circular.',
      },
      {
        claim: 'The claim does not survive every passage intact.',
        class: new Set(survivedFlags).size === 1 ? 'robust' : 'fragile',
        why:
          new Set(survivedFlags).size === 1
            ? `Held across every perturbation tried (±${spread * 100}% on all weights simultaneously). This one does not depend on the particular numbers.`
            : 'Flips within the perturbation range, so it is a statement about the chosen weights rather than about the case.',
      },
      {
        claim: 'The claim is lost at specific passages rather than others.',
        class: new Set(lostSets).size === 1 ? 'robust' : 'fragile',
        why:
          new Set(lostSets).size === 1
            ? 'The same passages fail across the whole range, so the location of the loss is driven by the intervals and glitches in the record rather than by the weights.'
            : `Which passages fail moves with the weights (${new Set(lostSets).size} distinct outcomes across the range), so name the weights whenever naming the passage.`,
      },
    ],
    note:
      'Every weight in this module is stipulated. That is not a defect to be apologised for — it is the point, because a stipulated weight is inspectable and a fitted one is not. ' +
      'But it means a statement is only reportable as a finding if it is in the robust class. Anything by_construction is an assumption made legible, and saying otherwise would be laundering an authored judgment through an engine.',
  };
}

/** itinerary(), run against substituted weight tables. */
function itineraryWith(specs, decays, sustains) {
  const legs = specs.map((spec) => passageWith(spec, decays, sustains));
  const lost = legs.filter((l) => !l.carried);
  return { survived: lost.length === 0, lost_at: lost.map((l) => l.label) };
}

function passageWith(spec, decays, sustains) {
  const months = (spec.interval_days ?? 0) / 30;
  const kind = PASSAGE_KINDS[spec.kind] ?? PASSAGE_KINDS.request_to_record;
  const decaying = (spec.decays ?? []).map((id) => ({
    id,
    cost: Math.min(1, (decays[id]?.rate ?? 0.5) * months * 0.08),
  }));
  const carrying = (spec.sustains ?? []).map((id) => sustains[id]).filter(Boolean);
  let offset = 0;
  for (const d of decaying) {
    const helpers = carrying.filter((s) => (s.sustains ?? []).includes(d.id));
    if (!helpers.length) continue;
    const best = Math.max(...helpers.map((s) => s.strength ?? 0.5));
    offset += Math.min(d.cost, d.cost * best * 0.8);
  }
  const net = decaying.reduce((a, b) => a + b.cost, 0) - offset;
  return { label: kind.label, carried: net < 0.35 };
}

function round(n) {
  return Math.round(n * 100) / 100;
}
