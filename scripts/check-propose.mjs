#!/usr/bin/env node
/* Assertions over the officer corpora and the proposal evaluator.
 *
 *   node scripts/check-propose.mjs
 *
 * The reproducibility assertion is the one that matters: a simulation whose
 * output is not byte-identical across runs cannot be checked by anyone, and a
 * number nobody can reproduce is a number nobody should act on.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS = path.join(ROOT, "corpus");
const BASES = new Set(["confirmed", "sourced", "derived", "none"]);
const LEVELS = new Set(["instance", "local", "broad"]);

let failed = 0;
const ok = (m) => console.log(`PASS  ${m}`);
const bad = (m) => { failed++; console.log(`FAIL  ${m}`); };

const officers = fs.readdirSync(CORPUS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const read = (o, kind) => {
  const d = path.join(CORPUS, o, kind);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: `${o}/${kind}/${f}`, data: JSON.parse(fs.readFileSync(path.join(d, f), "utf8")) })) : [];
};

const allPremises = officers.flatMap((o) => read(o, "premises"));
const allProposals = officers.flatMap((o) => read(o, "proposals"));

// 1. Every officer declares what it will not assert, and what it declines.
for (const o of officers) {
  const i = JSON.parse(fs.readFileSync(path.join(CORPUS, o, "integrity.json"), "utf8"));
  if (!i.will_not_assert?.length || !i.declines) bad(`${o} integrity names no refusal — an officer that refuses nothing is not a vantage`);
}
if (!failed) ok("every officer declares what it will not assert");

// 2. One officer per file. A premise filed under one officer may not claim another.
let strayed = 0;
for (const { file, data } of [...allPremises, ...allProposals]) {
  if (data.officer !== file.split("/")[0]) { bad(`${file} claims officer ${data.officer}`); strayed++; }
}
if (!strayed) ok("no corpus entry claims an officer other than its own");

// 3. Bases and specificity are from the closed vocabularies.
let vocab = 0;
for (const { file, data } of allPremises) {
  if (!BASES.has(data.basis)) { bad(`${file} basis ${data.basis}`); vocab++; }
  if (!LEVELS.has(data.specificity)) { bad(`${file} specificity ${data.specificity}`); vocab++; }
}
if (!vocab) ok(`${allPremises.length} premises use only the declared bases and levels`);

// 4. Anything not basis none names how it was established; basis none names what is owed.
let unbacked = 0;
for (const { file, data } of allPremises) {
  if (data.basis === "none") {
    if (!data.owed) { bad(`${file} is basis none and names nothing owed — a blank without a question is just a blank`); unbacked++; }
  } else if (data.basis === "derived") {
    if (!data.derived_from?.length || !data.derivation) { bad(`${file} is derived and names no source premises or no rule`); unbacked++; }
  } else if (!data.measured_by) { bad(`${file} asserts basis ${data.basis} with no measurer`); unbacked++; }
}
if (!unbacked) ok("every premise names its measurer, its derivation, or what is owed");

// 5. Premises are not aggregates. A stored value derived from others must
//    declare it, so the derivation can be recomputed instead of trusted.
let agg = 0;
for (const { file, data } of allPremises) {
  if (data.derived_from?.length && data.basis !== "derived") { bad(`${file} names derived_from but claims basis ${data.basis}`); agg++; }
}
if (!agg) ok("no premise stores an aggregate while claiming to be a measurement");

// 5b. A confirmed premise must not carry a bare environment-dependent figure in
//     its statement. Three measurements of one page returned 14, 18 and 17 while
//     the property being asserted held in all three; a statement carrying the
//     count goes stale on every re-measure, one asserting the invariant does not.
let numeric = 0;
for (const { file, data } of allPremises) {
  if (data.basis !== "confirmed") continue;
  if (/\b\d{2,}\b/.test(data.statement) && !data.measurements) {
    bad(`${file} asserts a figure in its statement with no measurements series behind it`);
    numeric++;
  }
}
if (!numeric) ok("no confirmed premise states a bare figure without its measurement conditions");

// 6. Every assumption points at premises that exist.
let dangling = 0;
const ids = new Set(allPremises.map((p) => p.data.id));
for (const { file, data } of allProposals) {
  for (const a of data.assumptions) for (const id of a.premises) {
    if (!ids.has(id)) { bad(`${file} assumption ${a.id} names ${id}, which no corpus contains`); dangling++; }
  }
}
if (!dangling) ok(`${allProposals.length} proposals reference only premises that exist`);

// 7. Seed, runs and thresholds live in the proposal, not the code.
let undeclared = 0;
for (const { file, data } of allProposals) {
  const s = data.simulation;
  if (!s || typeof s.seed !== "number" || typeof s.runs !== "number" || !s.thresholds) {
    bad(`${file} does not declare seed, runs and thresholds`); undeclared++;
  }
}
if (!undeclared) ok("every proposal declares its own seed, run count and thresholds");

// 8. THE ONE THAT MATTERS: two runs, byte for byte.
const run = () => execFileSync(process.execPath, [path.join(ROOT, "scripts", "propose.mjs")], { encoding: "utf8" });
const a = run(), b = run();
if (a !== b) bad("propose.mjs is not reproducible — two runs differ");
else ok(`propose.mjs is byte-identical across runs (${a.length} bytes)`);

// 9. No number survives an assumption that cannot carry one.
const withheld = a.split("\n").filter((l) => l.includes("probability: withheld")).length;
const printed = a.split("\n").filter((l) => l.includes("under the stated assumptions")).length;
ok(`${withheld} proposal(s) withheld a number, ${printed} reported one under stated assumptions`);
if (printed && !a.includes("most load-bearing")) bad("a probability was printed with no sensitivity beside it");
else if (printed) ok("every printed probability ships its sensitivity");

console.log(`\n${failed ? `${failed} failure(s)` : "all assertions passed"} — ${officers.length} officers, ${allPremises.length} premises, ${allProposals.length} proposals`);
process.exit(failed ? 1 : 0);
