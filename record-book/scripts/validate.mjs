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

// METHODOLOGY.md section 3: unpunished is derived. Only a sustained criminal
// conviction of a perpetrator counts as punishment. Settlements, apologies and
// exonerations of the victim do not.
export const isUnpunished = (outcome) => outcome !== 'convicted';

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
    if (c.verification === 'unverified' && c.sources?.length) {
      err(at, 'marked unverified but carries sources; use documented or contested');
    }
    if (c.verification === 'documented' && !c.sources?.length) {
      err(at, 'marked documented but carries no sources');
    }
    if (c.verification === 'contested' && !c.status_note) {
      err(at, 'marked contested but status_note does not describe the conflict');
    }
    ref(at, 'harmed.persons', c.harmed?.persons, personIds, 'person');
    ref(at, 'impediments', c.impediments, impedimentIds, 'impediment');
    ref(at, 'sources', c.sources, archiveIds, 'archive');
  }

  for (const p of persons) {
    const at = `register/${p.id}`;
    if (!IDENTITY.includes(p.identity_status)) {
      err(at, `identity_status "${p.identity_status}" is not one of ${IDENTITY.join(', ')}`);
    }
    if (!STANDING.includes(p.standing)) {
      err(at, `standing "${p.standing}" is not one of ${STANDING.join(', ')}`);
    }
    // METHODOLOGY.md section 4: a count is a count and must say so; an
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
      err(at, 'missing consent_note (METHODOLOGY.md section 4)');
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

  for (const a of archives) {
    const at = `archives/${a.id}`;
    if (a.fetchable && !a.url) err(at, 'marked fetchable but has no url');
    if (a.url && a.verified !== true) warn(at, 'locator not yet resolved (verified:false)');
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

  for (const w of warnings) console.warn(`  warn  ${w}`);
  for (const e of errors) console.error(`  ERROR ${e}`);

  console.log(
    `\n${complaints.length} complaints (${unpunished} unpunished, ` +
    `${complaints.length - unpunished} with a sustained conviction), ` +
    `${persons.length} register entries, ${impediments.length} impediments, ` +
    `${archives.length} archives`
  );
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}
