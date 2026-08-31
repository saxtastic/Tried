#!/usr/bin/env node
/* Evaluate a proposal against its officer's corpus.
 *
 *   node scripts/propose.mjs                 every proposal
 *   node scripts/propose.mjs PROP-CATALOGUE  one
 *   node scripts/propose.mjs --specificity local
 *
 * Reproducible by construction. The seed, the run count and the thresholds are
 * declared in the proposal, never here. Re-running produces byte-identical
 * output; scripts/check-propose.mjs asserts that rather than trusting it.
 *
 * The rule that shapes the whole file: an assumption whose premises are all
 * basis `none` gets no number. Its proposal cannot resolve in_favor or
 * nullified no matter what the other assumptions do, and the output names the
 * unsourced assumption instead of averaging over it. A number that cannot be
 * traced to a stated assumption is not printed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS = path.join(ROOT, "corpus");

const ORDER = { instance: 0, local: 1, broad: 2 };

/* Deterministic PRNG. Seeded per proposal from its own declared seed, so two
   proposals never share a stream and reordering them changes nothing. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readAll(dir, kind) {
  const out = [];
  for (const officer of fs.readdirSync(CORPUS, { withFileTypes: true })) {
    if (!officer.isDirectory()) continue;
    const d = path.join(CORPUS, officer.name, kind);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).sort()) {
      if (f.endsWith(".json")) out.push(JSON.parse(fs.readFileSync(path.join(d, f), "utf8")));
    }
  }
  return out;
}

const premises = new Map(readAll(CORPUS, "premises").map((p) => [p.id, p]));
const proposals = readAll(CORPUS, "proposals");
const integrity = new Map(
  fs.readdirSync(CORPUS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => [e.name, JSON.parse(fs.readFileSync(path.join(CORPUS, e.name, "integrity.json"), "utf8"))])
);

/* An assumption is groundless when every premise behind it has basis none, or
   names a premise that does not exist. Both are unsourced; the second is worse. */
function ground(a) {
  const found = a.premises.map((id) => premises.get(id));
  const missing = a.premises.filter((id) => !premises.has(id));
  const sourced = found.filter((p) => p && p.basis !== "none");
  return { missing, sourced: sourced.length, groundless: sourced.length === 0 };
}

function evaluate(proposal) {
  const grounds = proposal.assumptions.map((a) => ({ a, g: ground(a) }));
  const groundless = grounds.filter((x) => x.g.groundless);
  const missing = grounds.flatMap((x) => x.g.missing);

  // Specificity toggle. The error runs one way only: a claim may rest on a
  // premise at least as broad as itself, never on a narrower one. A broad claim
  // standing on a single instance measurement is the case this catches — one
  // measurement is not an industry. A local claim resting on a broad premise is
  // fine and common, and flagging it was this check's first bug.
  const level = ORDER[proposal.specificity];
  const overreach = [];
  for (const { a } of grounds) {
    for (const id of a.premises) {
      const p = premises.get(id);
      if (p && ORDER[p.specificity] < level) {
        overreach.push(`${a.id} claims ${proposal.specificity} but rests on ${id}, which holds only at ${p.specificity}`);
      }
    }
  }

  const { seed, runs, thresholds } = proposal.simulation;
  const rand = mulberry32(seed);

  // Sample each assumption inside its declared range, independently, per trial.
  // The hypothesis holds in a trial when every assumption does.
  let held = 0;
  const draws = proposal.assumptions.map(() => []);
  for (let i = 0; i < runs; i++) {
    let all = true;
    proposal.assumptions.forEach((a, k) => {
      const [lo, hi] = a.range;
      const p = lo + rand() * (hi - lo);
      draws[k].push(p);
      if (rand() > p) all = false;
    });
    if (all) held++;
  }
  const probability = held / runs;

  // Sensitivity: hold one assumption at certainty and re-run; the assumption
  // whose removal moves the answer most is the one the proposal turns on.
  const sensitivity = proposal.assumptions.map((a, k) => {
    const r2 = mulberry32(seed + 1 + k);
    let h = 0;
    for (let i = 0; i < runs; i++) {
      let all = true;
      proposal.assumptions.forEach((b, j) => {
        const [lo, hi] = b.range;
        const p = j === k ? 1 : lo + r2() * (hi - lo);
        if (j !== k && r2() > p) all = false;
      });
      if (all) h++;
    }
    return { id: a.id, statement: a.statement, lift: h / runs - probability };
  }).sort((x, y) => y.lift - x.lift);

  let verdict, why;
  if (missing.length) {
    verdict = "test_retest";
    why = `assumption names ${missing.join(", ")}, which no corpus contains`;
  } else if (groundless.length) {
    verdict = "test_retest";
    why = `${groundless.map((x) => x.a.id).join(", ")} rests only on basis none — ${groundless
      .flatMap((x) => x.a.premises.map((id) => premises.get(id)?.owed).filter(Boolean))
      .join("; ") || "nothing is owed against it yet"}`;
  } else if (overreach.length) {
    verdict = "test_retest";
    why = `specificity overreach — ${overreach.join("; ")}`;
  } else if (probability >= thresholds.in_favor) {
    verdict = "in_favor";
    why = `clears ${thresholds.in_favor} under the stated assumptions`;
  } else if (probability <= thresholds.nullified) {
    verdict = "nullified";
    why = `falls below ${thresholds.nullified} under the stated assumptions`;
  } else {
    verdict = "test_retest";
    why = `lands between ${thresholds.nullified} and ${thresholds.in_favor}; the premises do not separate the outcomes`;
  }

  // The hard rule: no number for a proposal that cannot carry one.
  const reportable = !missing.length && !groundless.length && !overreach.length;
  return { proposal, verdict, why, probability: reportable ? probability : null, sensitivity: reportable ? sensitivity : null, groundless, missing, overreach };
}

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith("--"));
const sIdx = args.indexOf("--specificity");
const atLevel = sIdx >= 0 ? args[sIdx + 1] : null;

let selected = proposals;
if (only) selected = selected.filter((p) => p.id === only);
if (atLevel) selected = selected.filter((p) => ORDER[p.specificity] <= ORDER[atLevel]);

console.log(`proposals — ${selected.length} of ${proposals.length}${atLevel ? ` at specificity ${atLevel} or narrower` : ""}\n`);

let failures = 0;
for (const p of selected) {
  const r = evaluate(p);
  const officer = integrity.get(p.officer);
  console.log(`  ${p.id}  [${r.verdict}]  ${p.title}`);
  console.log(`  ${"".padEnd(p.id.length)}  officer: ${p.officer} · specificity: ${p.specificity} · seed ${p.simulation.seed} × ${p.simulation.runs}`);
  console.log(`  ${"".padEnd(p.id.length)}  hypothesis: ${p.hypothesis}`);
  if (r.probability === null) {
    console.log(`  ${"".padEnd(p.id.length)}  probability: withheld — ${r.why}`);
    failures++;
  } else {
    console.log(`  ${"".padEnd(p.id.length)}  probability: ${r.probability.toFixed(4)} under the stated assumptions — ${r.why}`);
    console.log(`  ${"".padEnd(p.id.length)}  most load-bearing: ${r.sensitivity[0].id} (+${r.sensitivity[0].lift.toFixed(4)} if certain) — ${r.sensitivity[0].statement}`);
    for (const s of r.sensitivity.slice(1)) {
      console.log(`  ${"".padEnd(p.id.length)}    ${s.id}: +${s.lift.toFixed(4)}`);
    }
  }
  if (officer?.declines) console.log(`  ${"".padEnd(p.id.length)}  officer declines: ${officer.declines.split(".")[0]}.`);
  console.log();
}
process.exit(failures && args.includes("--strict") ? 1 : 0);
