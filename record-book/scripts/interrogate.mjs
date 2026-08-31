#!/usr/bin/env node
// Interrogates the log's own citations and produces a research brief: what each
// entry currently establishes, what it cannot, which questions the data itself
// raises, and which sources would answer them.
//
// It generates the PLAN, not the findings. Nothing here fetches anything or
// invents a fact; every line is derived from what is already recorded, so a
// brief cannot claim more than the corpus does.
//
//   node record-book/scripts/interrogate.mjs CL-1918-TURNER
//   node record-book/scripts/interrogate.mjs --source SRC-NAACP-PAPERS
//   node record-book/scripts/interrogate.mjs --gaps      # corpus-wide, ranked
//   node record-book/scripts/interrogate.mjs --json CL-1918-TURNER

import { validate, VANTAGE, DOMAINS, rungOf } from './validate.mjs';

const data = validate();
if (data.errors.length) {
  console.error('The record does not validate; fix it before interrogating it.');
  for (const e of data.errors) console.error(`  ERROR ${e}`);
  process.exit(1);
}
const { complaints, persons, organizations, impediments, archives } = data;
const arch = new Map(archives.map((a) => [a.id, a]));
const imp = new Map(impediments.map((i) => [i.id, i]));
const org = new Map(organizations.map((o) => [o.id, o]));

// What a vantage is good for, and what it cannot be asked to establish. This is
// the heart of the interrogation: a source is not "reliable" or not, it answers
// some questions and is silent or self-serving on others.
const INTERROGATION = {
  victim_testimony: {
    establishes: 'What was done, to whom, and what it cost. Names, kin, sequence.',
    silent_on: 'Numbers beyond the witness\'s own sight; the perpetrators\' identities where they were disguised or strangers.',
    press: 'Ask who else was present and named. Ask what the witness was asked and by whom - the interview conditions shape the transcript.',
  },
  perpetrator_record: {
    establishes: 'The conduct, in the actor\'s own hand, kept for the actor\'s own purposes. Usually the strongest proof of the act.',
    silent_on: 'Harm. It records the transaction or the procedure, not what it did to anyone.',
    press: 'Ask what the record was FOR, and what its purpose made it necessary to write down. Ask what the same file series holds for adjacent dates and parties.',
  },
  commercial_record: {
    establishes: 'The transaction, the parties, the price, the date, and often the names of the people transacted. Made to be provable.',
    silent_on: 'Everything the transaction did. Consent, family, destination beyond the port of entry.',
    press: 'Follow the instrument: a bill of sale implies a deed book entry, an estate inventory, a manifest if shipped, a policy if insured, and a mortgage if pledged. Each names more people.',
  },
  contemporaneous_press: {
    establishes: 'That the event occurred, when, and how it was publicly described at the time.',
    silent_on: 'Nothing - and that is the problem. It supplies a stated cause that is often the pretext.',
    press: 'Read the hostile paper against the official finding. This is the Wells method: the press that excused it often also reported the details that convict it.',
  },
  investigative: {
    establishes: 'Findings from deliberate inquiry, often including names the official record omits.',
    silent_on: 'What the investigator could not reach, and what the organisation chose not to publish.',
    press: 'Ask whether names were obtained but withheld, and to whom they were transmitted. Field notes usually survive where the published report does not carry them.',
  },
  official_investigation: {
    establishes: 'What a state or federal body found, and what it decided to do.',
    silent_on: 'Why it declined. The reasoning is usually in the departmental file, not the public report.',
    press: 'The declination memo is the document to find. For federal matters look to Justice (RG 60) rather than the court file.',
  },
  official_commission: {
    establishes: 'A later, resourced reconstruction, usually the best single secondary account.',
    silent_on: 'Anything its terms of reference excluded, and any figure it declined to fix.',
    press: 'Read the appendices and the dissents. Commissions collect far more than they conclude.',
  },
  judicial_record: {
    establishes: 'What was charged, tried, and decided.',
    silent_on: 'Everything never charged - which in this corpus is most of it.',
    press: 'Ask for the docket, not the opinion: motions, venire lists, and the grand jury record where it can be unsealed.',
  },
  litigation_record: { establishes: 'Counsel\'s theory, the evidence assembled, and the procedural history.',
    silent_on: 'Matters counsel judged unwinnable.', press: 'Case files hold investigator reports and witness statements that never reached a courtroom.' },
  government_record: { establishes: 'What the agency did and recorded in the course of doing it.',
    silent_on: 'What it chose not to record.', press: 'Identify the record group and series, then ask what adjacent series the same office generated.' },
  congressional_testimony: { establishes: 'Sworn first-person accounts, often the earliest.',
    silent_on: 'What the committee did not ask about.', press: 'The index of witnesses is a list of survivors. Cross-reference it against the census.' },
  administrative_record: { establishes: 'Existence, place, household, and sometimes name.',
    silent_on: 'Events.', press: 'Use it to individuate a count and to trace a person across a rupture.' },
  statistical_series: { establishes: 'Pattern and scale.',
    silent_on: 'Individuals. A tally is not a person.', press: 'Ask the definition the series used, then compare against a series with a different one. The spread measures the counting.' },
  oral_history: { establishes: 'Lived experience of a period, from people never asked at the time.',
    silent_on: 'Dates and figures, reliably.', press: 'Search the finding aid by county, not by event; these interviews rarely index under the event name.' },
  material_record: { establishes: 'That a place, an object, or a grave exists.',
    silent_on: 'Who and why.', press: 'For contested counts this is often the only vantage that can still resolve them - excavation, remains, DNA.' },
  memoir: { establishes: 'The author\'s account and its later shaping.', silent_on: 'What the author did not witness.',
    press: 'Compare against contemporaneous letters where they survive.' },
  scholarship: { establishes: 'Synthesis and apparatus.', silent_on: 'Nothing new; it is derivative by construction.',
    press: 'Mine the footnotes. The value of a secondary source to this book is the primary sources it cites.' },
  clinical_research: { establishes: 'A framework and its evidence.', silent_on: 'Any particular entry here.',
    press: 'Never let it establish an act. It is recorded as argument, and its citations are its own.' },
  genealogical_record: { establishes: 'Descent, where the chain survives.', silent_on: 'Where the chain was cut.',
    press: 'The break in the line is usually the sale. Look for the deed on the date the record stops.' },
  witness: { establishes: 'What was seen.', silent_on: 'Context beyond it.', press: 'Ask what the witness was doing there.' },
};

const esc = (s) => String(s ?? '');
const H = (t) => `\n${t}\n${'-'.repeat(t.length)}`;

function brief(c) {
  const held = new Set((c.citations ?? []).map((x) => x.vantage));
  const missing = Object.keys(VANTAGE).filter((v) => !held.has(v));
  const q = [];

  // Questions the data itself raises.
  if (c.finding.attribution === 'unattributed') {
    q.push({
      q: 'No participant is named in any source on file. Who would have written a name down?',
      why: 'The act is established; the actor is not. That gap is a record problem, not a doubt about the killing.',
      look: ['Departmental declination files (DOJ, RG 60) rather than the court file',
             'FBI investigative case file (RG 65) if any federal inquiry opened',
             'Coroner\'s inquest return and the venire list for any grand jury convened',
             'Private investigative field notes (NAACP branch files) where the published report withheld names'],
    });
  }
  if (c.finding.attribution === 'described_unidentified') {
    q.push({ q: 'Participants are described by role or office but not named. Which office held the roster?',
      why: 'A described role implies an appointment, a payroll, or a duty log.',
      look: ['County commission minutes and deputy appointment records',
             'Militia and posse muster rolls', 'Jail custody and turnkey logs for the date'] });
  }
  const ct = c.harmed?.count;
  if (ct && ct.documented == null && (ct.estimated_low || ct.estimated_high)) {
    q.push({ q: `The count is estimated (${ct.estimated_low ?? '?'}-${ct.estimated_high ?? '?'}) and never fixed. What would individuate it?`,
      why: 'An estimate is a statement about the counting, not the dying. Individuation is the standing task of this book.',
      look: ['Coroner returns and burial permits for the period', 'Church and undertaker registers',
             'Census comparison across the event year', 'Mass grave survey and remains identification where a site is known'] });
  }
  const collectives = persons.filter(
    (p) => (c.harmed?.persons ?? []).includes(p.id) && p.identity_status === 'collectively_recorded');
  for (const p of collectives) {
    q.push({ q: `Register row ${p.id} carries ${p.count?.documented ?? 'an estimate'} people as a count. Can it be individuated?`,
      why: p.attestation ?? 'A count is not a person.',
      look: (p.sources ?? []).map((s) => `${s} — ${arch.get(s)?.title ?? ''}`) });
  }
  if (!c.restoration.forms.length || c.restoration.forms.every((f) => f === 'symbolic')) {
    const ops = (c.impediments ?? []).map((i) => imp.get(i)).filter((i) => i?.status === 'operative');
    q.push({ q: 'Nothing material reached the harmed. Is any forum still open?',
      why: ops.length
        ? `Operative impediments on this entry: ${ops.map((i) => i.name).join('; ')}. These are current law and would have to be met, not argued past.`
        : 'No operative impediment is recorded on this entry, which is itself worth checking.',
      look: ['Legislative claim bill precedent — Rosewood 1994, Groveland 2023 are the models in this corpus',
             'State commission of inquiry as an evidence-gathering route where litigation is time-barred',
             'Descendant organisation and institutional negotiation — the GU272 route, which required no forum at all'] });
  }
  if (c.concurrence?.diverge) {
    q.push({ q: 'The vantages diverge. What would resolve it?',
      why: c.concurrence.diverge,
      look: ['A vantage independent of both sides of the divergence',
             ...(missing.includes('material_record') ? ['Physical evidence: site survey, remains, structural record'] : []),
             ...(missing.includes('government_record') ? ['The agency\'s own file series, which is usually not the public report'] : [])] });
  }
  const unresolved = (c.citations ?? []).map((x) => arch.get(x.source)).filter((a) => a && a.url && !a.verified);
  if (unresolved.length) {
    q.push({ q: `${unresolved.length} cited locator${unresolved.length === 1 ? '' : 's'} unresolved.`,
      why: 'An unverified locator is a lead, not a citation.',
      look: unresolved.map((a) => `${a.id} — ${a.url}`) });
  }
  const withheld = (c.respondents.named ?? []).filter((r) => r.status === 'names_withheld_in_source');
  if (withheld.length) {
    q.push({
      q: 'A source obtained participants\' names and did not publish them. Where did they go?',
      why: withheld.map((r) => r.note).filter(Boolean).join(' ')
        || 'The names existed in a source that chose not to print them.',
      look: ['The investigating organisation\'s unpublished field notes and branch files',
             'The correspondence file of the official the names were transmitted to — a governor\'s incoming correspondence is usually archived by year at the state archives',
             'Any subsequent internal report explaining why no prosecution followed'],
      priority: 'high — the identification already happened once; this is a retrieval problem, not an investigative one',
    });
  }
  const acquitted = (c.respondents.named ?? []).filter(
    (r) => r.status === 'confessed_after_acquittal' || r.status === 'charged_no_conviction');
  if (acquitted.length) {
    q.push({
      q: 'A named respondent was charged and not convicted. What does the case file hold?',
      why: acquitted.map((r) => `${r.name}: ${r.note ?? r.status}`).join('; '),
      look: ['The docket and full case file rather than the reported outcome',
             'Venire lists and juror questionnaires where they survive',
             'Any later federal review file explaining the decision not to revisit it'],
    });
  }
  if (c.respondents.organization) {
    const o = org.get(c.respondents.organization);
    q.push({ q: `The actor operated under ${o.name}, which claimed sanction to punish. What else did it do?`,
      why: `Claimed: ${o.claimed_sanction.asserted}`,
      look: ['Other entries linked to this organisation, for transferable evidence',
             'Membership and charter records where the body organised openly',
             'Congressional inquiry testimony naming the same locality'] });
  }

  // Sources not yet cited here that other entries facing the same impediment used.
  const sibling = complaints.filter(
    (x) => x.id !== c.id && (x.impediments ?? []).some((i) => (c.impediments ?? []).includes(i)));
  const theirs = new Set(sibling.flatMap((x) => (x.citations ?? []).map((y) => y.source)));
  const mine = new Set((c.citations ?? []).map((y) => y.source));
  const suggest = [...theirs].filter((s) => !mine.has(s));

  return { entry: c, held: [...held], missing, questions: q, suggest, sibling: sibling.map((s) => s.id) };
}

function render(b) {
  const c = b.entry;
  console.log(`\n${'='.repeat(72)}\n${c.id}  ${c.title}\n${'='.repeat(72)}`);
  console.log(`act ${c.finding.act} · actor ${c.finding.attribution} · forum ${c.process.outcome} · ` +
              `restoration ${c.restoration.forms.join(', ') || 'none'}`);

  console.log(H('Vantages held'));
  for (const v of b.held) {
    const i = INTERROGATION[v];
    console.log(`  ${v}`);
    if (i) {
      console.log(`      establishes  ${i.establishes}`);
      console.log(`      silent on    ${i.silent_on}`);
      console.log(`      press        ${i.press}`);
    }
  }
  console.log(H('Vantages absent'));
  console.log('  ' + (b.missing.join(', ') || 'none'));

  console.log(H(`Questions the record raises (${b.questions.length})`));
  b.questions.forEach((x, n) => {
    console.log(`\n  ${n + 1}. ${x.q}`);
    console.log(`     why: ${x.why}`);
    if (x.priority) console.log(`     priority: ${x.priority}`);
    for (const l of x.look) console.log(`     → ${l}`);
  });

  if (b.suggest.length) {
    console.log(H('Sources used by entries facing the same impediments, not cited here'));
    for (const s of b.suggest) console.log(`  ${s} — ${arch.get(s)?.title ?? ''}`);
  }
  if (b.sibling.length) {
    console.log(H('Entries sharing an impediment (transferable evidence and argument)'));
    console.log('  ' + b.sibling.join(', '));
  }
}

// ---------------------------------------------------------------------- main
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const rest = args.filter((a) => !a.startsWith('--'));

if (args.includes('--live')) {
  // What, if anything, is still actionable. The honest answer is almost nothing
  // criminally, and the reason is mortality rather than law.
  const HOMICIDE = ['homicide', 'mass_homicide', 'homicide_of_a_child',
    'homicide_under_colour_of_law', 'homicide_after_surrender', 'killing_of_an_unborn_child'];
  const unconvicted = complaints.filter((c) => c.process.outcome !== 'convicted');
  const killing = unconvicted.filter((c) => (c.offense ?? []).some((o) => HOMICIDE.includes(o)));
  const named = killing.filter((c) => (c.respondents.named ?? []).length);
  console.log('\nWhat remains actionable\n' + '='.repeat(23));
  console.log(`\n${unconvicted.length} of ${complaints.length} entries produced no conviction.`);
  console.log(`\nCriminal route, in theory: ${killing.length} entries name a homicide offence, and`);
  console.log('murder is generally not subject to a limitation period. Of those,');
  console.log(`${named.length} name a respondent at all. In substantially every one, every`);
  console.log('identified subject is deceased — which is why DOJ closes these matters, and');
  console.log('why the criminal route is open in law and shut in fact.');
  for (const c of killing) {
    const n = (c.respondents.named ?? []).length;
    console.log(`  ${c.id.padEnd(32)} ${n ? `${n} named` : 'no respondent named'}`);
  }
  const ops = impediments.filter((i) => i.status === 'operative');
  console.log(`\nCivil and legislative route: blocked by ${ops.length} operative impediments.`);
  console.log('What removing each would actually resolve:\n');
  for (const i of ops) console.log(`  ${i.name}\n    ${i.if_removed}\n`);
  const worked = complaints.filter((c) =>
    (c.restoration.forms ?? []).some((f) => ['partial_compensation', 'full_restitution'].includes(f)));
  console.log(`Routes that have actually delivered something material (${worked.length}):`);
  for (const c of worked) {
    const how = c.process.escalation.filter((r) => ['legislated', 'settled'].includes(r.disposition));
    console.log(`  ${c.id}`);
    for (const r of how) console.log(`    ${r.rung}: ${r.forum} — ${r.disposition}`);
  }
  console.log('\nEvery one came through a legislature, a claim bill, or an institution acting on');
  console.log('its own record. None came from a court applying existing law to a historical claim.');
} else if (args.includes('--gaps')) {
  const ranked = complaints.map((c) => brief(c))
    .sort((a, b) => b.questions.length - a.questions.length);
  console.log('Entries ranked by open research questions:\n');
  for (const b of ranked) {
    console.log(`  ${String(b.questions.length).padStart(2)}  ${b.entry.id.padEnd(30)} ` +
                `${b.missing.length} vantages absent`);
  }
  const total = ranked.reduce((n, b) => n + b.questions.length, 0);
  console.log(`\n${total} open questions across ${ranked.length} entries.`);
  console.log('Run without --gaps and with an entry id for the full brief.');
} else if (args.includes('--source')) {
  const id = rest[0];
  const a = arch.get(id);
  if (!a) { console.error(`No such archive: ${id}`); process.exit(1); }
  const citing = complaints.filter((c) => (c.citations ?? []).some((x) => x.source === id));
  console.log(`\n${a.id}  ${a.title}\n  holder: ${a.holder}\n  rights: ${a.rights}` +
              `${a.url ? `\n  url: ${a.url}${a.verified ? '' : '  (UNRESOLVED — a lead, not a citation)'}` : ''}`);
  if (a.note) console.log(`\n  ${a.note}`);
  console.log(H(`Cited by ${citing.length} entr${citing.length === 1 ? 'y' : 'ies'}`));
  for (const c of citing) {
    const v = c.citations.find((x) => x.source === id).vantage;
    console.log(`  ${c.id.padEnd(30)} as ${v}`);
  }
  const vs = [...new Set(citing.map((c) => c.citations.find((x) => x.source === id).vantage))];
  console.log(H('How to interrogate it'));
  for (const v of vs) {
    const i = INTERROGATION[v];
    if (!i) continue;
    console.log(`  as ${v}:`);
    console.log(`      establishes  ${i.establishes}`);
    console.log(`      silent on    ${i.silent_on}`);
    console.log(`      press        ${i.press}`);
  }
} else if (rest.length) {
  const c = complaints.find((x) => x.id === rest[0]);
  if (!c) { console.error(`No such entry: ${rest[0]}`); process.exit(1); }
  const b = brief(c);
  if (asJson) console.log(JSON.stringify(b, null, 2));
  else render(b);
} else {
  console.log('Usage:');
  console.log('  interrogate.mjs <CL-ID>            full research brief for one entry');
  console.log('  interrogate.mjs --source <SRC-ID>  what a source can and cannot establish');
  console.log('  interrogate.mjs --gaps            corpus-wide, ranked by open questions');
  console.log('  interrogate.mjs --live            what remains actionable, and by which route');
  console.log('  interrogate.mjs --json <CL-ID>    machine-readable brief\n');
  console.log(`${complaints.length} entries, ${archives.length} archives.`);
}
