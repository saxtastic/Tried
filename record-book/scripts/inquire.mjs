#!/usr/bin/env node
// Runs the inquiry functions that sit alongside the log rather than inside it:
// aggregation, categorisation, pattern matching, trend identification, and the
// feasibility computation that tests the corpus's principal claim.
//
// What this cannot do, and does not pretend to do: this environment has no
// outbound network. An inquiry function here produces a RESEARCH AGENDA - the
// questions a corpus of this shape raises about itself - never a finding. Every
// figure it prints is derived from data/ on the spot, with its n, so a claim
// that moves is visible as having moved.
//
//   node record-book/scripts/inquire.mjs            all sections
//   node record-book/scripts/inquire.mjs --audit    contested words, undeclared
//   node record-book/scripts/inquire.mjs --feasibility
//   node record-book/scripts/inquire.mjs --registers
//   node record-book/scripts/inquire.mjs --trend
//   node record-book/scripts/inquire.mjs --json

import { fileURLToPath } from 'node:url';
import { validate, feasibility, lexicalAudit, ERAS, CONFIRMATION, REGISTERS } from './validate.mjs';

const { complaints, lexicon, precedents, legislation } = validate();
const argv = process.argv.slice(2);
const want = (f) => argv.includes(f) || (!argv.length || (argv.length === 1 && argv[0] === '--json'));
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : 'n/a');

// AGGREGATION + CATEGORISATION -------------------------------------------------
function registerProfile() {
  const counts = Object.fromEntries(REGISTERS.map((r) => [r, 0]));
  for (const t of lexicon) for (const r of t.registers ?? []) counts[r]++;
  const methods = Object.fromEntries(Object.keys(CONFIRMATION).map((m) => [m, 0]));
  for (const t of lexicon) for (const m of t.confirmation?.method ?? []) methods[m]++;
  const containers = lexicon.filter((t) => t.container);
  const senses = lexicon.reduce((n, t) => n + t.senses.length, 0);
  return { counts, methods, containers, senses };
}

// TREND -------------------------------------------------------------------------
// Era is the only axis on which this corpus can carry a trend, because it is the
// only one every entry declares. A blank row is a gap in the corpus, not history.
function trend() {
  const rows = ERAS.map((era) => {
    const inEra = complaints.filter((c) => (c.era ?? []).includes(era));
    const restored = inEra.filter((c) =>
      (c.restoration?.forms ?? []).some((f) => f === 'full_restitution' || f === 'partial_compensation'));
    const convicted = inEra.filter((c) => c.process?.outcome === 'convicted');
    const senses = lexicon.reduce(
      (n, t) => n + t.senses.filter((s) => (s.era ?? []).includes(era)).length, 0);
    return { era, entries: inEra.length, restored: restored.length,
      convicted: convicted.length, senses };
  });
  return rows;
}

// PATTERN MATCHING ---------------------------------------------------------------
function audit() {
  const hits = lexicalAudit(complaints, lexicon);
  const byTerm = {};
  for (const h of hits) (byTerm[h.word] ??= []).push(h.complaint);
  return { hits, byTerm };
}

// THE CLAIM UNDER TEST -----------------------------------------------------------
const feas = feasibility(precedents);

if (argv.includes('--json')) {
  console.log(JSON.stringify(
    { feasibility: feas, registers: registerProfile(), trend: trend(), audit: audit() },
    null, 2));
  process.exit(0);
}

const rule = (s) => console.log(`\n${s}\n${'-'.repeat(s.length)}`);

if (want('--feasibility')) {
  rule('FEASIBILITY: is the obstacle capacity, or is it a decision?');
  console.log(
    `${feas.enacted} of ${feas.n} reparative programmes on file were actually enacted and executed ` +
    `(${feas.governmental} of them governmental); ${feas.declined.length} was recommended and refused ` +
    `(${feas.declined.join(', ') || 'none'}).`);
  console.log(
    `Of the ${feas.enacted} enacted, ${feas.novel} required machinery that did not already exist` +
    (feas.novel ? `: ${feas.novelIds.join(', ')}.` : '.'));
  console.log(
    feas.capacityIsNotTheConstraint
      ? '  => On this evidence operational capacity is not the binding constraint. Every enacted\n' +
        '     programme reused ordinary appropriation, claims, settlement or conveyance machinery.\n' +
        `     What remains is a decision, which is a matter of principle. This is a finding about\n` +
        `     ${feas.enacted} enacted programmes, not a prediction about the next one.`
      : '  => FALSIFIED on the present data: at least one enacted programme needed a novel\n' +
        '     instrument, so capacity cannot be dismissed as a constraint.');
  console.log(
    `\nWho was paid: ${feas.toHarmed} of ${feas.enacted} programmes ran to the harmed; ` +
    `${feas.toHolders} ran to the holders of title (${feas.toHoldersIds.join(', ') || 'none'}).`);
  const early = precedents.filter((p) => p.beneficiary === 'holders_of_title');
  if (early.length) {
    console.log(
      '  The earliest enacted programmes in this file are the ones that paid owners. Compensation\n' +
      '  for slavery has been legislated, funded and delivered - to the party holding title.');
  }
}

if (want('--registers')) {
  const rp = registerProfile();
  rule('LANGUAGE: what the lexicon holds');
  console.log(`${lexicon.length} contested terms carrying ${rp.senses} distinct senses ` +
    `(${(rp.senses / lexicon.length).toFixed(1)} per term); ${rp.containers.length} container term(s): ` +
    `${rp.containers.map((t) => t.term).join(', ')}.`);
  console.log('\nregister      terms');
  for (const [r, n] of Object.entries(rp.counts).sort((a, b) => b[1] - a[1])) {
    if (n) console.log(`  ${r.padEnd(14)}${'#'.repeat(n)} ${n}`);
  }
  console.log('\nhow each reading is confirmed (a term may use several):');
  for (const [m, n] of Object.entries(rp.methods).sort((a, b) => b[1] - a[1])) {
    if (n) console.log(`  ${m.padEnd(30)}${n}  ${CONFIRMATION[m]}`);
  }
  const noOp = lexicon.filter((t) => !(t.confirmation?.method ?? []).includes('operational_consequence'));
  console.log(
    `\n${lexicon.length - noOp.length} of ${lexicon.length} terms are confirmed by what the word ` +
    'licensed rather than by how it reads.');
  if (noOp.length) {
    console.log(`  weakest on this test, and the place to press: ${noOp.map((t) => t.id).join(', ')}`);
  }
}

if (want('--trend')) {
  rule('TREND: the corpus by era');
  console.log('era              entries  restored  convicted  word-senses');
  for (const r of trend()) {
    console.log(
      `  ${r.era.padEnd(15)}${String(r.entries).padStart(5)}` +
      `${String(r.restored).padStart(10)}${String(r.convicted).padStart(11)}` +
      `${String(r.senses).padStart(13)}`);
  }
  const withEntries = trend().filter((r) => r.entries);
  const noRestore = withEntries.filter((r) => !r.restored);
  console.log(
    `\n${noRestore.length} of ${withEntries.length} populated eras contain no material restoration ` +
    `at all (${noRestore.map((r) => r.era).join(', ') || 'none'}). The era on a row is the era of the ` +
    'conduct, never of the remedy, so this table shows which conduct was answered - not when.');
}

if (want('--audit')) {
  const { hits, byTerm } = audit();
  rule('AUDIT: contested words used in entries the lexicon does not link');
  console.log(
    'Each line is a question, not a defect: the entry uses a word whose sense is contested,\n' +
    'and the lexicon has not declared that the entry turns on it. Either the link is missing\n' +
    'or the word is being used in its uncontested sense - and which one is a research task.\n');
  if (!hits.length) console.log('  none');
  for (const [word, ids] of Object.entries(byTerm).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  "${word}" (${ids.length}): ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ', ...' : ''}`);
  }
  const declared = lexicon.reduce((n, t) => n + t.bears_on.length, 0);
  console.log(
    `\n${declared} declared bearings, ${hits.length} undeclared appearances across ` +
    `${complaints.length} entries and ${legislation.length} statutes. ` +
    `Coverage ${pct(declared, declared + hits.length)}.`);
}

console.log('\nNo network egress in this environment: every line above is derived from data/,');
console.log('and every one of them is a question to take to a source, not an answer from one.');
