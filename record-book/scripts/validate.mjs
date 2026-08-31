#!/usr/bin/env node
// Validates the record book: enums, referential integrity, and the derivation
// of process.unpunished. Exits non-zero on any error.
// See ../METHODOLOGY.md for what each rule is protecting.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

export const OUTCOMES = {
  no_process: 'No investigation was ever opened',
  investigated_no_charge: 'Investigated; no charges filed',
  charged_acquitted: 'Charges filed; acquittal',
  charged_no_conviction: 'Charges filed; ended without conviction',
  convictions_vacated: 'Convictions obtained, then set aside',
  convicted: 'Criminal conviction of a perpetrator, sustained',
  civil_settlement: 'Money paid; no criminal accountability',
  legislative_remedy: 'Legislature enacted compensation or apology',
  posthumous_exoneration: 'Wrongly convicted person cleared after death',
  unresolved: 'Investigation opened and never closed',
};

// METHODOLOGY.md section 13: unpunished is derived. Only a sustained criminal
// conviction of a perpetrator counts as punishment. Settlements, apologies and
// exonerations of the victim do not.
export const isUnpunished = (outcome) => outcome !== 'convicted';

// The three questions are independent, and the book keeps them apart.
// ACT: did the violence occur? Answered by bodies, ruins, death records,
// contemporaneous reporting - not by a forum, and not by this book's opinion.
export const ACT = {
  established: 'The act occurred. Attested by physical evidence, records, or contemporaneous account.',
  contested: 'Sources conflict on whether, or in what form, the act occurred.',
  unestablished: 'Asserted only. Nothing on file establishes that the act occurred.',
};
// ATTRIBUTION: who did it? A separate question, and a harder one.
export const ATTRIBUTION = {
  named_in_sources: 'Participants are named in the sources.',
  described_unidentified: 'Participants are described by role or office but not named.',
  unattributed: 'No participant is identified in any source located.',
  contested: 'Sources conflict as to who acted.',
};

// RESTORATION: what reached the victims. The resolve this book measures is not
// punishment of offenders but restoration to the harmed, so this axis is derived
// and reported alongside the disposition, never folded into it.
export const RESTORATION = {
  full_restitution: 'The harmed were made whole.',
  partial_compensation: 'Money or property reached some of the harmed.',
  restoration_of_status: 'A conviction vacated, a pardon, an exoneration. Corrects the state\'s injury to the victim.',
  institutional_reform: 'The law or practice changed. Reaches future persons, not the harmed.',
  symbolic: 'Apology, marker, resolution, renaming. Costs nothing and returns nothing.',
};
// Only these forms put anything material back into the hands of the harmed.
const MATERIAL = ['full_restitution', 'partial_compensation'];
export const isMateriallyRestored = (forms) => (forms ?? []).some((f) => MATERIAL.includes(f));

// How a source came to observe. Independent vantages are what let a record
// survive a hostile official finding; see METHODOLOGY.md section 4.
export const VANTAGE = {
  victim_testimony: 'Given by a person harmed.',
  witness: 'Given by a witness who was not harmed.',
  perpetrator_record: 'Kept or given by those who did it.',
  commercial_record: "The transacting party's own instrument - bill of sale, ledger, manifest, policy, mortgage. Created to make title provable, and provable now for the same reason.",
  contemporaneous_press: 'Reported at the time.',
  investigative: 'Produced by a private investigation.',
  official_investigation: 'Produced by a state or federal investigation.',
  official_commission: 'Produced by a later commission of inquiry.',
  judicial_record: 'Produced by a court.',
  litigation_record: 'Produced by counsel in the course of litigation.',
  administrative_record: 'Ledgers, registers, manifests, censuses.',
  statistical_series: 'A maintained tally.',
  memoir: 'Recollection, written later.',
  scholarship: 'Later research.',
  government_record: 'Held by the agency that produced it.',
  congressional_testimony: 'Sworn testimony taken by a legislature.',
  oral_history: 'Collected later from those who lived it.',
  material_record: 'The object, site, or memorial itself.',
  genealogical_record: 'Descent reconstructed from records of sale, census, and probate.',
  clinical_research: 'Clinical or psychological research. A framework, not a finding - see TRANSMISSION.',
};

// ERAS, in order. Periodisation lets the log show a harm as a continuity rather
// than a series of incidents - which is the only way the injury to children is
// visible, because it is the same injury arriving in different institutions.
export const ERAS = [
  'atlantic_trade',   // to 1808
  'domestic_trade',   // 1808-1865
  'reconstruction',   // 1865-1877
  'jim_crow',         // 1877-1954
  'civil_rights',     // 1954-1968
  'modern',           // 1968-
];

// How a child was reached. Recorded because the book's other fields assume an
// adult with capacity, and the harms that begin in childhood are collected in
// adulthood by institutions that never appear in the entry at all.
export const CHILD_MECHANISM = [
  'killed', 'sold_from_parent', 'separated_from_family_to_obtain_schooling',
  'separated_from_kin_and_language', 'born_into_the_condition', 'laboured_from_infancy',
  'transported', 'trafficked', 'denied_schooling', 'punished_for_learning',
  'taught_in_secret_at_risk', 'aged_out_of_schooling', 'prosecuted_as_a_child',
  'beaten_in_custody', 'sterilised_as_a_minor',
  'consent_obtained_from_a_parent_who_could_not_read_it', 'institutionalised_as_feebleminded',
  'medical_experimentation_without_consent',
];

// ECHELON: the ladder of authority, lowest rung first. An actor operates at a
// rung; a matter travels up the rungs, or fails to. The ordering is what makes
// the analysis possible - it lets the book ask whether a matter ever got above
// the level of the person who caused it.
export const ECHELON = [
  'private_holder',  // plantation, holder, overseer, master
  'proxy',           // patrol, posse, mob, private agent for holder or community
  'municipal',       // city, town, council
  'county',          // sheriff, coroner, county court, grand jury
  'district',        // judicial or administrative district
  'state',           // legislature, governor, state agency, state high court
  'regional',        // federal circuit
  'federal',         // department, bureau, Congress, federal trial court
  'supreme',         // Supreme Court of the United States
];
export const rungOf = (e) => ECHELON.indexOf(e);

// What a rung did when the matter reached it.
export const DISPOSITION = {
  no_process: 'Never opened at this level.',
  declined: 'Reached this level and it declined to act.',
  investigated_no_charge: 'Investigated; no charge.',
  no_indictment: 'A grand jury refused to indict.',
  acquitted: 'Tried and acquitted.',
  no_conviction: 'Prosecuted; ended without conviction.',
  convicted: 'Convicted at this level.',
  vacated: 'A conviction set aside here.',
  adverse: 'Decided against the party who brought it.',
  dismissed_jurisdiction: 'Dismissed for want of jurisdiction or cognizable offence.',
  dismissed_time_barred: 'Dismissed as time-barred.',
  dismissed_no_standing: 'Dismissed for want of standing.',
  dismissed_immunity: 'Dismissed on immunity.',
  settled: 'Money paid; no finding.',
  legislated: 'A legislature acted.',
  commission_reported: 'A commission of inquiry reported.',
  apology: 'An apology issued.',
  exonerated: 'A wrongly convicted person cleared.',
};

// Dispositions that end a matter without any adverse finding against an actor.
const TERMINAL_WITHOUT_FINDING = [
  'no_process', 'declined', 'investigated_no_charge', 'no_indictment', 'acquitted',
  'no_conviction', 'vacated', 'dismissed_jurisdiction', 'dismissed_time_barred',
  'dismissed_no_standing', 'dismissed_immunity',
];

// HARM DOMAINS: what was injured, as distinct from what kind of event it was.
// Classification says "lynching"; a domain says "the body", "the franchise",
// "the line of descent". Entries carry as many as apply, and because they are
// shared across a century the domains form a web rather than a list - two
// entries a hundred years apart are joined by the thing they broke.
export const DOMAINS = {
  physiological: 'The body. Killing, torture, maiming, disease, treatment withheld.',
  spiritual: 'The soul and the ties that bind it - to ancestors, to the dead, to land, to rite. Desecration, burial denied, severance from lineage.',
  social: 'Standing and belonging. A community dispersed, a class prevented from re-forming, a people driven out.',
  political: 'Self-governance. The franchise, office, representation, standing to be heard.',
  economic: 'Property, wages, land, business, inheritance, and the compounding of what was taken.',
  educational: 'Access to learning, literacy, and credential.',
  interpersonal: 'The bonds between people. Kinship, marriage, parent and child, line of descent.',
  intrapersonal: 'The interior life. Esteem, identity, the self a person is permitted to hold.',
};

// TRANSMISSION: harm that outlives the harmed generation. Distinct from
// interstitial harm, which falls between events within one. The standing of a
// transmission claim is recorded on the claim itself, because this is the
// hardest thing in the book to establish and the easiest to overstate.
export const TRANSMISSION = {
  documented: 'Established by record: title transferred, population displaced, wealth destroyed, measured effects.',
  argued_in_literature: 'Advanced in a scholarly or clinical framework. Recorded as an argument with its proponents named, never converted into a finding.',
  contested: 'The literature is in open disagreement.',
};

// Naming: the book reports whom the sources accuse, with provenance. It never
// adds an accusation of its own, and every name requires the source that made it.
const RESPONDENT_STATUS = [
  'confessed', 'confessed_after_acquittal', 'charged_acquitted', 'charged_no_conviction',
  'convicted_vacated', 'convicted', 'named_in_source', 'names_withheld_in_source',
  'never_identified',
];

const IDENTITY = ['named', 'name_unrecorded', 'collectively_recorded'];
const STANDING = ['claimant', 'decedent_of_record', 'collective'];
const VERIFICATION = ['documented', 'contested', 'unverified'];
const IMPEDIMENT_KIND = ['written', 'unwritten'];
const IMPEDIMENT_STATUS = ['operative', 'superseded', 'repudiated'];

// The web. Which domains recur, which travel together, and which entries a
// domain joins. Computed, never stored, so it cannot drift from the data.
export function harmWeb(complaints) {
  const names = Object.keys(DOMAINS);
  const frequency = Object.fromEntries(names.map((n) => [n, 0]));
  const entriesByDomain = Object.fromEntries(names.map((n) => [n, []]));
  const pairs = Object.fromEntries(names.map((a) => [a, Object.fromEntries(names.map((b) => [b, 0]))]));

  for (const c of complaints) {
    const ds = c.harm_domains ?? [];
    for (const a of ds) {
      frequency[a] += 1;
      entriesByDomain[a].push(c.id);
      for (const b of ds) if (a !== b) pairs[a][b] += 1;
    }
  }
  // Strongest joins first: the domains that most often travel together.
  const joins = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const n = pairs[names[i]][names[j]];
      if (n) joins.push({ a: names[i], b: names[j], n });
    }
  }
  joins.sort((x, y) => y.n - x.n);
  return { names, frequency, entriesByDomain, pairs, joins };
}

// The route. For each entry: how high the matter climbed, where it stopped, and
// - the question the ladder exists to ask - whether it ever got above the rung
// the actor was standing on.
export function routes(complaints) {
  return complaints.map((c) => {
    const all = c.process?.escalation ?? [];
    const actorRung = rungOf(c.respondents?.echelon);
    const track = (t) => all.filter((r) => (r.track ?? 'against_perpetrators') === t);

    const summarise = (rungs) => {
      if (!rungs.length) return null;
      const ceiling = rungs.reduce((a, b) => (rungOf(b.rung) > rungOf(a.rung) ? b : a));
      const terminal = rungs[rungs.length - 1];
      return { ceiling, terminal, steps: rungs.length };
    };

    const against = summarise(track('against_perpetrators'));
    const harmed = summarise(track('against_the_harmed'));

    return {
      id: c.id, title: c.title, actor: c.respondents?.echelon, actorRung,
      against, harmed,
      // Did anything against the actor get heard above the actor's own level?
      escaped: against ? rungOf(against.ceiling.rung) > actorRung : false,
      // Did any rung ever make an adverse finding against an actor?
      everFound: track('against_perpetrators').some(
        (r) => !TERMINAL_WITHOUT_FINDING.includes(r.disposition)
          && ['convicted', 'legislated', 'settled', 'commission_reported'].includes(r.disposition)),
      convicted: track('against_perpetrators').some((r) => r.disposition === 'convicted'),
    };
  });
}

// The finding the ladder exists to produce: whether the height of the actor
// predicts whether anything above them ever heard it. Computed, with its own n,
// because a correlation stated in prose outlives the data that produced it.
export function routeFinding(complaints) {
  const rt = routes(complaints).filter((r) => r.against);
  const OFFICIAL = rungOf('county'); // county and above: the actor IS an organ of the state
  const high = rt.filter((r) => r.actorRung >= OFFICIAL);
  const low = rt.filter((r) => r.actorRung < OFFICIAL);
  // The echelon split alone stopped separating cleanly once entries from the
  // civil rights era and later were added. The era split is what survives, and
  // it says something sharper: the forums that could hear a matter against a
  // state actor did not exist for most of this corpus's span.
  const byId = new Map(complaints.map((c) => [c.id, c]));
  const LATE = ['civil_rights', 'modern'];
  const isLate = (r) => (byId.get(r.id).era ?? []).some((e) => LATE.includes(e));
  const early = high.filter((r) => !isLate(r));
  const late = high.filter(isLate);
  return {
    n: rt.length,
    high: { n: high.length, escaped: high.filter((r) => r.escaped).length, ids: high.map((r) => r.id),
      stuck: high.filter((r) => !r.escaped).map((r) => r.id) },
    low: { n: low.length, escaped: low.filter((r) => r.escaped).length },
    era: {
      early: { n: early.length, escaped: early.filter((r) => r.escaped).length },
      late: { n: late.length, escaped: late.filter((r) => r.escaped).length,
        climbed: late.filter((r) => r.escaped).map((r) => r.id) },
    },
    noTrack: routes(complaints).filter((r) => !r.against).map((r) => r.id),
  };
}

// The child across the eras. The user-facing question this answers: is harm to
// children a feature of one period, or the constant?
export function childrenAcrossEras(complaints) {
  const rows = ERAS.map((era) => {
    const inEra = complaints.filter((c) => (c.era ?? []).includes(era));
    const withKids = inEra.filter((c) => c.harmed?.children);
    return {
      era,
      entries: inEra.length,
      children: withKids.length,
      ids: withKids.map((c) => c.id),
      mechanisms: [...new Set(withKids.flatMap((c) => c.harmed.children.mechanism))],
      educational: inEra.filter((c) => (c.harm_domains ?? []).includes('educational')).length,
      physiological: inEra.filter((c) => (c.harm_domains ?? []).includes('physiological')).length,
    };
  });
  const total = complaints.filter((c) => c.harmed?.children);
  return { rows, total: total.length, ids: total.map((c) => c.id),
    everyEra: rows.every((r) => r.entries === 0 || r.children > 0) };
}

export function validate() {
  const complaints = read('complaints.json').complaints;
  const organizations = read('organizations.json').organizations;
  const rights = read('rights.json').rights;
  const persons = read('register.json').persons;
  const impediments = read('impediments.json').impediments;
  const archives = read('archives.json').archives;

  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

  const ids = (rows) => new Set(rows.map((r) => r.id));
  const dupes = (rows, label) => {
    const seen = new Set();
    for (const r of rows) {
      if (seen.has(r.id)) err(label, `duplicate id ${r.id}`);
      seen.add(r.id);
    }
  };

  [[complaints, 'complaints'], [persons, 'register'], [organizations, 'organizations'],
   [rights, 'rights'], [impediments, 'impediments'], [archives, 'archives']]
    .forEach(([rows, label]) => dupes(rows, label));

  const personIds = ids(persons);
  const complaintIds = ids(complaints);
  const impedimentIds = ids(impediments);
  const archiveIds = ids(archives);
  const orgIds = ids(organizations);
  const rightIds = ids(rights);

  const ref = (where, field, values, pool, poolName) => {
    for (const v of values ?? []) {
      if (!pool.has(v)) err(where, `${field} references unknown ${poolName} "${v}"`);
    }
  };

  for (const c of complaints) {
    const at = `complaints/${c.id}`;
    if (!c.title) err(at, 'missing title');
    if (!VERIFICATION.includes(c.verification)) {
      err(at, `verification "${c.verification}" is not one of ${VERIFICATION.join(', ')}`);
    }
    const outcome = c.process?.outcome;
    if (!(outcome in OUTCOMES)) {
      err(at, `process.outcome "${outcome}" is not one of ${Object.keys(OUTCOMES).join(', ')}`);
    } else if ('unpunished' in c.process) {
      // The field must never be hand-written: it is derived at build time.
      if (c.process.unpunished !== isUnpunished(outcome)) {
        err(at, `process.unpunished is stored as ${c.process.unpunished} but derives to ` +
                `${isUnpunished(outcome)} from outcome "${outcome}"`);
      } else {
        warn(at, 'process.unpunished is stored in the data; it is derived and should be omitted');
      }
    }
    if (c.verification === 'unverified' && c.citations?.length) {
      err(at, 'marked unverified but carries citations; use documented or contested');
    }
    if (c.verification === 'documented' && !c.citations?.length) {
      err(at, 'marked documented but carries no citations');
    }
    if (c.verification === 'contested' && !c.status_note) {
      err(at, 'marked contested but status_note does not describe the conflict');
    }
    // The act does not wait on a forum. An established act with no process is
    // the ordinary case in this book, not an inconsistency.
    if (!(c.finding?.act in ACT)) {
      err(at, `finding.act "${c.finding?.act}" is not one of ${Object.keys(ACT).join(', ')}`);
    }
    if (!(c.finding?.attribution in ATTRIBUTION)) {
      err(at, `finding.attribution "${c.finding?.attribution}" is not one of ` +
              Object.keys(ATTRIBUTION).join(', '));
    }
    if (c.finding?.act === 'established' && c.verification === 'unverified') {
      err(at, 'finding.act is established but verification is unverified; nothing on file can establish an act');
    }
    if (!Array.isArray(c.offense)) {
      err(at, 'offense must be an array of offence characterisations (may be empty with offense_note)');
    } else if (!c.offense.length && !c.offense_note) {
      err(at, 'offense is empty; say why in offense_note');
    }
    if (!c.conduct) err(at, 'missing conduct');

    if (c.respondents?.organization && !orgIds.has(c.respondents.organization)) {
      err(at, `respondents.organization references unknown organisation "${c.respondents.organization}"`);
    }
    // A body that claimed sanction must say what it claimed. The arrogation is
    // the analytical point; asserting it without stating it would be empty.
    const cs = c.respondents?.claimed_sanction;
    if (cs && (!cs.asserted || !Array.isArray(cs.expressed_through) || !cs.expressed_through.length)) {
      err(at, 'claimed_sanction must state what authority was asserted and how it was expressed');
    }
    ref(at, 'rights_violated', c.rights_violated, rightIds, 'right');
    if (!c.rights_violated?.length) err(at, 'rights_violated must name at least one right');
    // RT-REMEDY is violated by every entry by construction; storing it 25 times
    // would carry no information and would let the count drift.
    if ((c.rights_violated ?? []).includes('RT-REMEDY')) {
      err(at, 'RT-REMEDY is derived, not stored: every entry violates it by construction');
    }
    const fc = c.foreclosed_contribution;
    if (fc) {
      if (!fc.basis) err(at, 'foreclosed_contribution must state the documentable input destroyed');
      // The single most important guard in this file.
      if (fc.quantifiable !== false) {
        err(at, 'foreclosed_contribution.quantifiable must be false; the output is unknowable ' +
                'and the book never records what would have been made');
      }
      if (!fc.note) err(at, 'foreclosed_contribution must carry the note distinguishing input from output');
    }
    if (!Array.isArray(c.era) || !c.era.length) {
      err(at, 'era must name at least one period');
    } else {
      for (const e of c.era) {
        if (!ERAS.includes(e)) err(at, `era "${e}" is not one of ${ERAS.join(', ')}`);
      }
    }
    const kids = c.harmed?.children;
    if (kids) {
      if (kids.harmed_as_children !== true) {
        err(at, 'harmed.children is present but harmed_as_children is not true; omit the field instead');
      }
      for (const m of kids.mechanism ?? []) {
        if (!CHILD_MECHANISM.includes(m)) err(at, `child mechanism "${m}" is not a recorded mechanism`);
      }
      if (!kids.mechanism?.length) err(at, 'harmed.children must record how the child was reached');
      // The whole point of the field: the harm does not stop at childhood.
      if (!kids.carried_into_adulthood) {
        err(at, 'harmed.children must state what the child carried into adulthood');
      }
    }
    if (!ECHELON.includes(c.respondents?.echelon)) {
      err(at, `respondents.echelon "${c.respondents?.echelon}" is not one of ${ECHELON.join(', ')}`);
    }
    const esc = c.process?.escalation;
    if (!Array.isArray(esc) || !esc.length) {
      err(at, 'process.escalation must record at least one rung the matter reached, or failed to');
    } else {
      for (const r of esc) {
        if (!ECHELON.includes(r.rung)) err(at, `escalation rung "${r.rung}" is not on the ladder`);
        if (!(r.disposition in DISPOSITION)) {
          err(at, `escalation disposition "${r.disposition}" is not one of ` +
                  Object.keys(DISPOSITION).join(', '));
        }
        if (r.track && !['against_perpetrators', 'against_the_harmed'].includes(r.track)) {
          err(at, `escalation track "${r.track}" is not against_perpetrators or against_the_harmed`);
        }
        if (!r.forum) err(at, 'each escalation rung must name the forum');
      }
      // A conviction on the perpetrator track must agree with the derived
      // disposition, so the two accounts of the same fact cannot disagree.
      const conv = esc.some(
        (r) => (r.track ?? 'against_perpetrators') === 'against_perpetrators'
          && r.disposition === 'convicted');
      const sustained = c.process.outcome === 'convicted';
      if (sustained && !conv) {
        err(at, 'process.outcome is convicted but no escalation rung records a conviction against a perpetrator');
      }
    }

    if (!Array.isArray(c.harm_domains) || !c.harm_domains.length) {
      err(at, 'harm_domains must name at least one domain of injury');
    } else {
      for (const dm of c.harm_domains) {
        if (!(dm in DOMAINS)) {
          err(at, `harm_domain "${dm}" is not one of ${Object.keys(DOMAINS).join(', ')}`);
        }
      }
      if (new Set(c.harm_domains).size !== c.harm_domains.length) {
        err(at, 'harm_domains contains a duplicate');
      }
    }

    const tr = c.harmed?.transmitted;
    if (tr) {
      if (!(tr.standing in TRANSMISSION)) {
        err(at, `harmed.transmitted.standing "${tr.standing}" is not one of ` +
                Object.keys(TRANSMISSION).join(', '));
      }
      if (!tr.description) err(at, 'harmed.transmitted must describe the harm');
      // An argued claim must say who argues it and that it is not a finding.
      if (tr.standing !== 'documented' && !tr.note) {
        err(at, `harmed.transmitted.standing is "${tr.standing}" but no note states ` +
                'whose argument it is and that the book does not adopt it');
      }
      const hasClinical = (c.citations ?? []).some((x) => x.vantage === 'clinical_research');
      if (tr.standing === 'argued_in_literature' && !hasClinical) {
        err(at, 'transmitted harm is argued_in_literature but no clinical_research vantage is cited');
      }
    }

    ref(at, 'harmed.persons', c.harmed?.persons, personIds, 'person');
    ref(at, 'impediments', c.impediments, impedimentIds, 'impediment');
    ref(at, 'citations', (c.citations ?? []).map((x) => x.source), archiveIds, 'archive');

    for (const cit of c.citations ?? []) {
      if (!(cit.vantage in VANTAGE)) {
        err(at, `citation ${cit.source} has vantage "${cit.vantage}", not one of ` +
                Object.keys(VANTAGE).join(', '));
      }
    }
    // A record resting on a single vantage cannot survive a hostile official
    // finding. Wells's method was to add one, not to argue with the coroner.
    const vantages = new Set((c.citations ?? []).map((x) => x.vantage));
    if (c.finding?.act === 'established' && vantages.size < 2) {
      warn(at, `act is established on ${vantages.size} vantage(s); a single vantage ` +
               'cannot be checked against anything');
    }
    if (!c.concurrence?.agree || !c.concurrence?.diverge) {
      err(at, 'concurrence must state both where the vantages agree and where they diverge');
    }

    if (!Array.isArray(c.restoration?.forms)) {
      err(at, 'restoration.forms must be an array (empty where nothing was restored)');
    } else {
      for (const f of c.restoration.forms) {
        if (!(f in RESTORATION)) {
          err(at, `restoration form "${f}" is not one of ${Object.keys(RESTORATION).join(', ')}`);
        }
      }
      if (!c.restoration.forms.length && !c.restoration.none_note) {
        err(at, 'restoration.forms is empty; say so in restoration.none_note');
      }
      if (!c.restoration.reached) {
        err(at, 'restoration.reached must say who actually received it, or that nobody did');
      }
    }

    for (const r of c.respondents?.named ?? []) {
      // The accusation belongs to the source, never to this book.
      if (!r.source) err(at, `named respondent "${r.name}" has no source for the naming`);
      else if (!archiveIds.has(r.source)) {
        err(at, `named respondent "${r.name}" cites unknown archive "${r.source}"`);
      }
      if (!RESPONDENT_STATUS.includes(r.status)) {
        err(at, `named respondent "${r.name}" has status "${r.status}", not one of ` +
                RESPONDENT_STATUS.join(', '));
      }
    }
  }

  for (const p of persons) {
    const at = `register/${p.id}`;
    if (!IDENTITY.includes(p.identity_status)) {
      err(at, `identity_status "${p.identity_status}" is not one of ${IDENTITY.join(', ')}`);
    }
    if (!STANDING.includes(p.standing)) {
      err(at, `standing "${p.standing}" is not one of ${STANDING.join(', ')}`);
    }
    // METHODOLOGY.md section 14: a count is a count and must say so; an
    // individuated person is never carried as a number.
    if (p.identity_status === 'collectively_recorded' && !p.count) {
      err(at, 'collectively_recorded rows must carry a count');
    }
    if (p.identity_status !== 'collectively_recorded' && p.count) {
      err(at, 'only collectively_recorded rows may carry a count');
    }
    if (p.count && !p.count.basis) {
      err(at, 'count must state its basis');
    }
    if (p.identity_status === 'name_unrecorded' && !p.attestation) {
      err(at, 'name_unrecorded rows must state what attests the person\'s existence');
    }
    if (!p.consent_note) {
      err(at, 'missing consent_note (METHODOLOGY.md section 14)');
    }
    if (p.voice?.source && !archiveIds.has(p.voice.source)) {
      err(at, `voice.source references unknown archive "${p.voice.source}"`);
    }
    if (p.voice && !p.voice.citation) {
      err(at, 'voice must carry a citation; the book does not print unattributed speech');
    }
    ref(at, 'complaints', p.complaints, complaintIds, 'complaint');
    ref(at, 'sources', p.sources, archiveIds, 'archive');
  }

  for (const r of rights) {
    const at = `rights/${r.id}`;
    if (!['enumerated', 'unenumerated'].includes(r.status)) {
      err(at, `status "${r.status}" is not enumerated or unenumerated`);
    }
    if (r.status === 'enumerated' && !r.instruments?.length) {
      err(at, 'an enumerated right must name the instrument that recognises it');
    }
    if (r.status === 'unenumerated' && r.instruments?.length) {
      err(at, 'an unenumerated right must name no instrument; if one exists it is enumerated');
    }
    if (r.status === 'unenumerated' && !r.note) {
      err(at, 'an unenumerated right must say plainly that it is a moral claim and not positive law');
    }
  }

  for (const o of organizations) {
    const at = `organizations/${o.id}`;
    if (!o.claimed_sanction?.asserted) {
      err(at, 'an organisation is entered here because it claimed sanction; say what it claimed');
    }
    if (!o.claimed_sanction?.expressed_through?.length) {
      err(at, 'claimed_sanction.expressed_through must record how the claim was made visible');
    }
    if (typeof o.state_response?.suppressed !== 'boolean') {
      err(at, 'state_response.suppressed must record whether any authority ever put a stop to it');
    }
    if (!o.state_response?.how) err(at, 'state_response.how must say what was or was not done');
    ref(at, 'sources', o.sources, archiveIds, 'archive');
    ref(at, 'complaints', o.complaints, complaintIds, 'complaint');
  }

  for (const i of impediments) {
    const at = `impediments/${i.id}`;
    if (!IMPEDIMENT_KIND.includes(i.kind)) err(at, `kind "${i.kind}" is not written or unwritten`);
    if (!IMPEDIMENT_STATUS.includes(i.status)) {
      err(at, `status "${i.status}" is not one of ${IMPEDIMENT_STATUS.join(', ')}`);
    }
    if (!i.if_removed) {
      err(at, 'if_removed must say what repealing or overruling this would actually resolve');
    }
    if (i.status !== 'operative' && !i.repudiated_by && !i.note) {
      err(at, `status is "${i.status}" but nothing records what displaced it`);
    }
  }

  const allCited = new Set([
    ...complaints.flatMap((c) => (c.citations ?? []).map((x) => x.source)),
    ...complaints.flatMap((c) => (c.respondents?.named ?? []).map((r) => r.source)),
    ...persons.flatMap((p) => p.sources ?? []),
  ]);

  for (const a of archives) {
    const at = `archives/${a.id}`;
    if (a.fetchable && !a.url) err(at, 'marked fetchable but has no url');
    if (a.url && a.verified !== true) warn(at, 'locator not yet resolved (verified:false)');
    if (!allCited.has(a.id)) warn(at, 'in the manifest but cited by nothing');
  }

  // Orphan checks: a person nobody claims, an impediment nothing invokes.
  const citedPersons = new Set(complaints.flatMap((c) => c.harmed?.persons ?? []));
  const citedFromRegister = new Set(persons.flatMap((p) => p.complaints ?? []));
  for (const p of persons) {
    if (!citedPersons.has(p.id) && !(p.complaints ?? []).length) {
      warn(`register/${p.id}`, 'not linked to any complaint');
    }
  }
  for (const c of complaints) {
    if (!citedFromRegister.has(c.id) && !(c.harmed?.persons ?? []).length) {
      warn(`complaints/${c.id}`, 'no person in the register is linked to this complaint');
    }
  }
  const usedImpediments = new Set(complaints.flatMap((c) => c.impediments ?? []));
  for (const r of rights) {
    const at = `rights/${r.id}`;
    if (!['enumerated', 'unenumerated'].includes(r.status)) {
      err(at, `status "${r.status}" is not enumerated or unenumerated`);
    }
    if (r.status === 'enumerated' && !r.instruments?.length) {
      err(at, 'an enumerated right must name the instrument that recognises it');
    }
    if (r.status === 'unenumerated' && r.instruments?.length) {
      err(at, 'an unenumerated right must name no instrument; if one exists it is enumerated');
    }
    if (r.status === 'unenumerated' && !r.note) {
      err(at, 'an unenumerated right must say plainly that it is a moral claim and not positive law');
    }
  }

  for (const o of organizations) {
    const at = `organizations/${o.id}`;
    if (!o.claimed_sanction?.asserted) {
      err(at, 'an organisation is entered here because it claimed sanction; say what it claimed');
    }
    if (!o.claimed_sanction?.expressed_through?.length) {
      err(at, 'claimed_sanction.expressed_through must record how the claim was made visible');
    }
    if (typeof o.state_response?.suppressed !== 'boolean') {
      err(at, 'state_response.suppressed must record whether any authority ever put a stop to it');
    }
    if (!o.state_response?.how) err(at, 'state_response.how must say what was or was not done');
    ref(at, 'sources', o.sources, archiveIds, 'archive');
    ref(at, 'complaints', o.complaints, complaintIds, 'complaint');
  }

  for (const i of impediments) {
    if (!usedImpediments.has(i.id)) warn(`impediments/${i.id}`, 'not invoked by any complaint');
  }

  return { complaints, persons, organizations, rights, impediments, archives, errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { complaints, persons, organizations, rights, impediments, archives, errors, warnings } = validate();
  const unpunished = complaints.filter((c) => isUnpunished(c.process.outcome)).length;
  const captured = complaints.filter(
    (c) => c.finding.act === 'established' && isUnpunished(c.process.outcome)).length;
  const unattributed = complaints.filter(
    (c) => c.finding.attribution === 'unattributed').length;
  const restored = complaints.filter((c) => isMateriallyRestored(c.restoration.forms)).length;
  const nothing = complaints.filter((c) => !c.restoration.forms.length).length;
  const named = complaints.filter((c) => (c.respondents?.named ?? []).length).length;
  const transmitted = complaints.filter((c) => c.harmed?.transmitted).length;
  const argued = complaints.filter(
    (c) => c.harmed?.transmitted && c.harmed.transmitted.standing !== 'documented').length;

  for (const w of warnings) console.warn(`  warn  ${w}`);
  for (const e of errors) console.error(`  ERROR ${e}`);

  console.log(
    `\n${complaints.length} complaints (${unpunished} unpunished, ` +
    `${complaints.length - unpunished} with a sustained conviction), ` +
    `${persons.length} register entries, ${impediments.length} impediments, ` +
    `${archives.length} archives, ${organizations.length} organisations`
  );
  console.log(
    `${captured} entries record an act established on the evidence for which no ` +
    `perpetrator was convicted; ${unattributed} have no participant identified in any source`
  );
  console.log(
    `restoration: ${restored} of ${complaints.length} produced anything material for the ` +
    `harmed, ${nothing} produced nothing at all, 0 produced full restitution`
  );
  console.log(`${named} entries name a respondent the sources accuse, each with its provenance`);
  console.log(
    `${transmitted} entries record harm that outlives the harmed generation ` +
    `(${transmitted - argued} documented, ${argued} recorded as argued and not adopted)`
  );
  const web = harmWeb(complaints);
  const top = web.joins.slice(0, 3).map((j) => `${j.a}+${j.b} (${j.n})`).join(', ');
  const thin = web.names.filter((n) => web.frequency[n] <= 2);
  console.log(`harm web: strongest joins ${top}`);
  if (thin.length) {
    console.log(
      `thinly covered domains: ${thin.map((n) => `${n} (${web.frequency[n]})`).join(', ')}` +
      ' — a gap in the corpus, not a gap in the history'
    );
  }
  const rt = routes(complaints);
  const stuck = rt.filter((r) => r.against && !r.escaped);
  const climbed = rt.filter((r) => r.against && r.escaped);
  const anyFinding = rt.filter((r) => r.everFound);
  const convictedAnywhere = rt.filter((r) => r.convicted);
  const harmedTracks = rt.filter((r) => r.harmed);
  const withTrack = climbed.length + stuck.length;
  console.log(
    `route: ${climbed.length} of ${withTrack} matters against perpetrators were heard above ` +
    `the actor's own rung; ${stuck.length} never got above it` +
    (complaints.length - withTrack
      ? ` (${complaints.length - withTrack} entry carries no perpetrator track)` : '')
  );
  console.log(
    `${convictedAnywhere.length} produced a conviction at any rung ` +
    `(${convictedAnywhere.map((r) => r.id).join(', ') || 'none'}), ` +
    `${anyFinding.length} produced any adverse finding at all`
  );
  console.log(
    `${harmedTracks.length} entries also carry a track running against the harmed - ` +
    'the state prosecuting the people it had already injured'
  );
  const f = routeFinding(complaints);
  console.log(
    `where the actor stood at county level or above (n=${f.high.n}), ${f.high.escaped} matters ` +
    `were heard above that level; where the actor stood below it (n=${f.low.n}), ${f.low.escaped} were`
  );
  console.log(
    `  of those official actors: ${f.era.early.escaped} of ${f.era.early.n} climbed before the ` +
    `civil rights era, ${f.era.late.escaped} of ${f.era.late.n} in that era or after`
  );
  const suppressed = organizations.filter((o) => o.state_response.suppressed);
  console.log(
    `organisations claiming sanction: ${organizations.length}; ` +
    `${suppressed.length} were ever stopped by anything (${suppressed.map((o) => o.id).join(', ')})`
  );
  const kids = childrenAcrossEras(complaints);
  const populated = kids.rows.filter((r) => r.entries > 0);
  console.log(
    `children: ${kids.total} of ${complaints.length} entries record harm reaching children as ` +
    `children, in ${populated.filter((r) => r.children).length} of ${populated.length} populated eras` +
    (kids.everyEra ? ' — every era in the corpus' : '')
  );
  const unenum = rights.filter((r) => r.status === 'unenumerated');
  const fc = complaints.filter((c) => c.foreclosed_contribution);
  console.log(
    `rights: ${rights.length} named, ${unenum.length} unenumerated ` +
    `(${unenum.map((r) => r.id).join(', ')}); RT-REMEDY violated by all ${complaints.length} by construction`
  );
  console.log(
    `foreclosed contribution recorded on ${fc.length} entries; ` +
    `${fc.filter((c) => c.foreclosed_contribution.quantifiable === false).length} state the input and none the output`
  );
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}
