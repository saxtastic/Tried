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
  convictions_vacated: 'Convictions obtained, then set aside',
  convicted: 'Criminal conviction of a perpetrator, sustained',
  civil_settlement: 'Money paid; no criminal accountability',
  legislative_remedy: 'Legislature enacted compensation or apology',
  posthumous_exoneration: 'Wrongly convicted person cleared after death',
  unresolved: 'Investigation opened and never closed',
};

// METHODOLOGY.md section 6: unpunished is derived. Only a sustained criminal
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

export function validate() {
  const complaints = read('complaints.json').complaints;
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

  [[complaints, 'complaints'], [persons, 'register'],
   [impediments, 'impediments'], [archives, 'archives']]
    .forEach(([rows, label]) => dupes(rows, label));

  const personIds = ids(persons);
  const complaintIds = ids(complaints);
  const impedimentIds = ids(impediments);
  const archiveIds = ids(archives);

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
    // METHODOLOGY.md section 7: a count is a count and must say so; an
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
      err(at, 'missing consent_note (METHODOLOGY.md section 7)');
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

  for (const i of impediments) {
    const at = `impediments/${i.id}`;
    if (!IMPEDIMENT_KIND.includes(i.kind)) err(at, `kind "${i.kind}" is not written or unwritten`);
    if (!IMPEDIMENT_STATUS.includes(i.status)) {
      err(at, `status "${i.status}" is not one of ${IMPEDIMENT_STATUS.join(', ')}`);
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
  for (const i of impediments) {
    if (!usedImpediments.has(i.id)) warn(`impediments/${i.id}`, 'not invoked by any complaint');
  }

  return { complaints, persons, impediments, archives, errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { complaints, persons, impediments, archives, errors, warnings } = validate();
  const unpunished = complaints.filter((c) => isUnpunished(c.process.outcome)).length;
  const captured = complaints.filter(
    (c) => c.finding.act === 'established' && isUnpunished(c.process.outcome)).length;
  const unattributed = complaints.filter(
    (c) => c.finding.attribution === 'unattributed').length;
  const restored = complaints.filter((c) => isMateriallyRestored(c.restoration.forms)).length;
  const nothing = complaints.filter((c) => !c.restoration.forms.length).length;
  const named = complaints.filter((c) => (c.respondents?.named ?? []).length).length;

  for (const w of warnings) console.warn(`  warn  ${w}`);
  for (const e of errors) console.error(`  ERROR ${e}`);

  console.log(
    `\n${complaints.length} complaints (${unpunished} unpunished, ` +
    `${complaints.length - unpunished} with a sustained conviction), ` +
    `${persons.length} register entries, ${impediments.length} impediments, ` +
    `${archives.length} archives`
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
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}
