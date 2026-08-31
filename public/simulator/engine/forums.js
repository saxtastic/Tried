// Forums.
//
// Every other module here asks whether a claim is good. This one asks a prior
// question the doctrine rarely states: WHICH BODY OF LAW is being used, and what
// that choice costs before any fact is argued.
//
// The choice is not neutral and it is not a matter of pleading style. The same
// record, run as a tort, as an administrative appeal, or as an education-funding
// complaint, reaches different defendants, yields different remedies, and — the
// part that matters most and is almost never modelled — differs in whether it
// requires the respondent to CONCEDE anything.
//
// That last column is the governance paradox, operationalised. An administrative
// remedy asks a body to correct itself. A legislative remedy asks for a grant.
// Both require the authority to act against its own prior position, which is
// exactly where the circularity bites. A tort judgment asks for nothing: it
// executes. The organisation's own account of itself — its structure, its
// hierarchy, its stated principles — becomes the instrument of its liability.
//
// Donald v. United Klans of America is the worked example and the reason this
// module exists. A criminal prosecution reached two men and left the
// organisation standing. The tort action, on an agency theory, reached the
// organisation and ended it. The remedy was not granted. It was a deed.

export const FORUMS = {
  tort: {
    label: 'Tort',
    reaches: 'the organisation, through its own structure',
    remedy: 'damages, executed against assets; where damages exceed assets, property transfers',
    concession_required: 'none — a judgment does not ask, it executes',
    concession_rank: 0,
    controlled_by: 'the injured party',
    standard: 'preponderance',
    bar: 'Requires an agency or duty theory connecting the organisation to the act, and a defendant with assets.',
    reconciliation: 'Material and non-consensual. The only route here that needs the respondent to agree with no part of it.',
    worked_example: 'donald_uka',
  },
  criminal: {
    label: 'Criminal',
    reaches: 'individuals',
    remedy: 'punishment of a person; nothing moves to the injured party',
    concession_required: 'none — but the state must choose to act',
    concession_rank: 1,
    controlled_by: 'a prosecutor, not the injured party',
    standard: 'beyond a reasonable doubt',
    bar: 'The injured party does not control whether it is brought, and a conviction leaves the institution untouched.',
    reconciliation: 'Symbolic and public. It names a wrong without moving anything to the person harmed.',
  },
  contract: {
    label: 'Contract',
    reaches: 'promises the institution actually made',
    remedy: 'expectation — the position promised, or its value',
    concession_required: 'low — the instrument is the institution\'s own words',
    concession_rank: 2,
    controlled_by: 'the injured party',
    standard: 'preponderance',
    bar: 'Courts often hold a handbook or catalogue not to be an offer, and disclaimers are common and usually effective.',
    reconciliation: 'Holds the institution to what it wrote — the self-binding theory in a different register.',
  },
  fiduciary: {
    label: 'Fiduciary duty',
    reaches: 'the party holding discretionary control over another\'s interest',
    remedy: 'accounting, restitution, sometimes removal',
    concession_required: 'low — the duty arises from the relationship, not from consent',
    concession_rank: 2,
    controlled_by: 'the injured party',
    standard: 'preponderance, with the burden often shifting to the fiduciary',
    bar: 'Establishing the relationship where no statute names it.',
    reconciliation: 'Restorative in form: it asks what was held, and what became of it.',
  },
  education_funding: {
    label: 'Education / funding condition',
    reaches: 'the institution\'s eligibility for federal money',
    remedy: 'agency enforcement; a private action only where the provision is rights-creating',
    concession_required: 'medium — runs through a third party with its own priorities',
    concession_rank: 3,
    controlled_by: 'the funding agency',
    standard: 'varies; intentional conduct on the private route',
    bar: 'Sandoval for effects claims; Gonzaga where the condition speaks to the agency rather than to persons.',
    reconciliation: 'Systemic and slow. It rarely reaches the individual who complained.',
  },
  administrative: {
    label: 'Administrative review',
    reaches: 'a particular decision',
    remedy: 'set aside and remand — the same body decides again',
    concession_required: 'high — the body must find against its own prior act',
    concession_rank: 4,
    controlled_by: 'the institution, procedurally',
    standard: 'arbitrary and capricious, deferential',
    bar: 'Deference, exhaustion, and the fact that remand returns the question to the decider.',
    reconciliation: 'Procedural. Often returns the claimant to the start of the process that injured them.',
  },
  legislative: {
    label: 'Legislative remedy',
    reaches: 'the rule itself, prospectively',
    remedy: 'a changed text; rarely anything for the person who raised it',
    concession_required: 'highest — requires the governing authority to grant',
    concession_rank: 5,
    controlled_by: 'the legislature',
    standard: 'political, not evidentiary',
    bar: 'Everything. But it is the only route that fixes the defect rather than one instance of it.',
    reconciliation: 'General and future-facing. The claimant is the occasion, not the beneficiary.',
  },
};

/**
 * Rank the forums by how much the respondent must concede before anything moves.
 *
 * This is the answer to "what are the non-traditional avenues of
 * reconciliation". They are at the top of this list, and they look
 * non-traditional only because the route that feels standard — complain
 * internally, appeal, then ask for the rule to change — is the one that requires
 * the most agreement from the party least willing to give it.
 */
export function reconciliationRoutes(facts = {}) {
  const {
    respondent_has_assets = true,
    written_promise_exists = true,
    discretionary_control_exists = true,
    provision_is_rights_creating = false,
    agency_theory_available = true,
  } = facts;

  const rows = Object.entries(FORUMS).map(([id, f]) => {
    let available = true;
    let unavailable_because = null;
    if (id === 'tort' && !respondent_has_assets) {
      available = false;
      unavailable_because = 'a judgment that cannot be executed against anything is a piece of paper';
    }
    if (id === 'tort' && !agency_theory_available) {
      available = false;
      unavailable_because = 'nothing connects the organisation to the act, so only individuals are reachable';
    }
    if (id === 'contract' && !written_promise_exists) {
      available = false;
      unavailable_because = 'nothing was promised in a form a court will enforce';
    }
    if (id === 'fiduciary' && !discretionary_control_exists) {
      available = false;
      unavailable_because = 'no relationship of control to found the duty on';
    }
    if (id === 'education_funding' && !provision_is_rights_creating) {
      available = false;
      unavailable_because = 'the provision speaks to the agency rather than to persons, so this claimant has no private route';
    }
    return { id, ...f, available, unavailable_because };
  });

  rows.sort((a, b) => a.concession_rank - b.concession_rank || Number(b.available) - Number(a.available));
  const open = rows.filter((r) => r.available);
  const cheapest = open[0] ?? null;

  return {
    routes: rows,
    open: open.map((r) => r.id),
    blocked: rows.filter((r) => !r.available).map((r) => ({ id: r.id, because: r.unavailable_because })),
    least_concession: cheapest ? { id: cheapest.id, label: cheapest.label, why: cheapest.reconciliation } : null,
    finding:
      'These are ordered by how much the respondent must concede before anything moves, not by likelihood of success. ' +
      'The two get confused, and the confusion favours the institution: the avenues that feel standard — complain internally, then appeal, then seek a rule change — ' +
      'are precisely the ones requiring the governing authority to act against its own prior position. ' +
      'A claim can be strong and still be routed into the forum least able to grant it.',
    paradox_note:
      'Where a claim has stalled on the authority of the premise, the fix is usually not a better argument. It is a different body of law. ' +
      'A tort judgment never asks the respondent to agree with any part of it, and the respondent\'s own account of what it is becomes the thing that binds it.',
  };
}

/** Which forum is a condition currently pleaded in, and what does that cost it? */
export function classify(condition) {
  const byTrack = {
    civil: 'education_funding',
    admin: 'administrative',
    ip: 'tort',
    fiduciary: 'fiduciary',
    governance: 'administrative',
  };
  const id = byTrack[condition.track] ?? 'administrative';
  const f = FORUMS[id];
  return {
    condition: condition.id,
    forum: id,
    label: f.label,
    concession_required: f.concession_required,
    concession_rank: f.concession_rank,
    bar: f.bar,
    note:
      f.concession_rank === 0
        ? 'Already in the forum requiring the least concession.'
        : `Pleaded where the respondent must concede ${f.concession_required.split('—')[0].trim()}. Ask whether the same facts support a tort, contract or fiduciary theory, which do not.`,
  };
}
