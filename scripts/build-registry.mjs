/* Compiles data/ into public/fellowships/registry.json.
 *
 *   npm run build          write public/fellowships/registry.json
 *   npm run build -- --check   fail if the committed file is out of date
 *
 * The output is deterministic: records are sorted by id, keys are emitted in a
 * fixed order, and no build timestamp is embedded. That is what lets --check
 * be a real assertion rather than a diff against the clock.
 *
 * This is the only validator in the repository. data/record.schema.json is the
 * contract in prose; the enforcement is here, so that adding a record cannot
 * add a dependency.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CALLS = path.join(ROOT, "data", "open-calls");
const OUT = path.join(ROOT, "public", "fellowships", "registry.json");

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const workflow = read(path.join(ROOT, "data", "workflow.json"));
const vantage = read(path.join(ROOT, "data", "vantage.config.json"));
const contract = read(path.join(ROOT, "data", "record.schema.json"));

const stageIds = new Set(workflow.stages.map((s) => s.id));
const problems = [];
const note = (file, msg) => problems.push(`${file}: ${msg}`);

/* ------------------------------------------------------------- records -- */

const files = fs.readdirSync(CALLS).filter((f) => f.endsWith(".json")).sort();
const calls = [];
const seen = new Set();

for (const file of files) {
  let rec;
  try {
    rec = read(path.join(CALLS, file));
  } catch (e) {
    note(file, `unparseable — ${e.message}`);
    continue;
  }

  for (const key of contract.required) {
    if (!(key in rec)) note(file, `missing required field "${key}"`);
  }

  if (rec.id !== path.basename(file, ".json")) {
    note(file, `id "${rec.id}" does not match the filename`);
  }
  if (seen.has(rec.id)) note(file, `duplicate id "${rec.id}"`);
  seen.add(rec.id);

  for (const field of ["kind", "cycle"]) {
    const v = rec[field];
    if (v !== null && v !== undefined && !contract.enums[field].includes(v)) {
      note(file, `${field} "${v}" is not one of ${contract.enums[field].join(", ")}`);
    }
  }
  for (const v of (rec.eligibility && rec.eligibility.career_stage) || []) {
    if (!contract.enums.career_stage.includes(v)) {
      note(file, `eligibility.career_stage "${v}" is not legal`);
    }
  }

  if (!stageIds.has(rec.stage)) {
    note(file, `stage "${rec.stage}" is not declared in data/workflow.json`);
  }

  for (const key of ["opens", "closes"]) {
    const v = rec[key];
    if (v === null || v === undefined) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v + "T00:00:00Z"))) {
      note(file, `${key} "${v}" is not an ISO yyyy-mm-dd date`);
    }
  }
  if (rec.opens && rec.closes && rec.opens > rec.closes) {
    note(file, `opens (${rec.opens}) is after closes (${rec.closes})`);
  }

  /* ------------------------------------------------------- provenance ---- */
  /* Enforced per field rather than only on dates and money. That narrowness was
     the gap this project's own Q4-PROVENANCE audit found: summary, eligibility,
     effort, kind and cycle rendered as fact with nothing behind them, and four
     of them passed an enum check, which made them read as validated.

     A field is populated only if its provenance entry names where it came from.
     A field whose basis is "none" must be blank and must say what is owed. */

  const prov = rec.provenance || {};

  /* "Blank" means something different for a string, a date and a sub-object, so
     each group states its own predicate rather than sharing a loose one. */
  const populated = {
    closes: () => Boolean(rec.closes),
    summary: () => Boolean(rec.summary),
    eligibility: () => {
      const e = rec.eligibility || {};
      return Boolean(e.stated || e.disciplines || e.geography || e.career_stage);
    },
    requirements: () => Boolean(rec.requirements),
    award: () => (rec.award || {}).min !== null || (rec.award || {}).max !== null,
    kind: () => Boolean(rec.kind),
    cycle: () => Boolean(rec.cycle),
  };

  for (const field of contract.provenance_required_for) {
    const e = prov[field];
    if (!e) {
      note(file, `provenance.${field} is missing — every product field declares where it came from`);
      continue;
    }
    if (!contract.enums.basis.includes(e.basis)) {
      note(file, `provenance.${field}.basis "${e.basis}" is not legal`);
      continue;
    }

    const isSet = populated[field]();

    if (e.basis === "none") {
      if (isSet) {
        note(file, `${field} is populated but its basis is "none" — a value with no record behind it is a fabrication`);
      }
      if (!/⟦FILL/.test(e.why || "")) {
        note(file, `provenance.${field} has basis "none", so why must carry a FILL marker naming what is owed`);
      }
    } else {
      if (!isSet) {
        note(file, `provenance.${field}.basis is "${e.basis}" but ${field} is blank`);
      }
      if (!/^https:\/\//.test(e.from || "")) {
        note(file, `provenance.${field}.basis is "${e.basis}" but from names no https source`);
      }
      if (e.basis === "derived" && !e.rule) {
        note(file, `provenance.${field} is "derived" but states no transformation rule`);
      }
      if (e.basis !== "derived" && !e.read) {
        note(file, `provenance.${field} is "${e.basis}" but records no read date`);
      }
    }
  }

  /* The eligibility enum arrays are this repository's vocabulary, not the
     source's, so they may never claim to be quoted from it. */
  if (prov.eligibility && prov.eligibility.basis === "sourced") {
    note(file, `provenance.eligibility may not be "sourced" — the enum arrays map into this schema's vocabulary, so the honest basis is "derived"`);
  }

  /* effort is derived from requirements at read time and must not be stored. A
     stored grading is an opinion, and it is the denominator of the ranking. */
  if ("effort" in rec) {
    note(file, `effort must not be stored on a record — it is derived from requirements`);
  }

  const aw = rec.award || {};
  if (!contract.enums.basis.includes(aw.basis)) {
    note(file, `award.basis "${aw.basis}" is not legal`);
  }

  if (!Array.isArray(rec.drafts)) note(file, `drafts must be an array`);
  for (const d of rec.drafts || []) {
    if (!d || typeof d.label !== "string" || !d.label) note(file, `every draft needs a label`);
  }
  if (!/^https:\/\//.test(rec.url || "")) note(file, `url must be https`);
  if (!/^https:\/\//.test(rec.source || "")) note(file, `source must be https`);

  calls.push(rec);
}

/* ------------------------------------------------ config cross-checks --- */

const fieldTiers = new Set(Object.keys(vantage.density).filter((k) => k[0] !== "$"));
for (const f of vantage.fields) {
  for (const t of f.tiers) {
    if (!fieldTiers.has(t)) note("vantage.config.json", `field "${f.id}" targets unknown tier "${t}"`);
  }
}
const ops = new Set(workflow.guards.ops);
const combinators = new Set(workflow.guards.combinators);
const walkGuard = (g, id) => {
  if (!g || typeof g !== "object") return;
  for (const c of combinators) {
    if (c in g) {
      const kids = Array.isArray(g[c]) ? g[c] : [g[c]];
      kids.forEach((k) => walkGuard(k, id));
      return;
    }
  }
  if (!ops.has(g.op)) note("workflow.json", `transition "${id}" uses undeclared op "${g.op}"`);
};
for (const t of workflow.transitions) {
  walkGuard(t.guard, t.id);
  if (!stageIds.has(t.to)) note("workflow.json", `transition "${t.id}" targets unknown stage "${t.to}"`);
  for (const f of t.from || []) {
    if (!stageIds.has(f)) note("workflow.json", `transition "${t.id}" leaves unknown stage "${f}"`);
  }
}
if (!stageIds.has(workflow.initial)) note("workflow.json", `initial stage "${workflow.initial}" is not declared`);

/* --------------------------------------------------------------- emit --- */

if (problems.length) {
  console.error("build-registry: the data does not satisfy the contract.\n");
  for (const p of problems) console.error("  " + p);
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}

calls.sort((a, b) => a.id.localeCompare(b.id));

const registry = {
  $comment:
    "GENERATED by scripts/build-registry.mjs from data/. Do not edit by hand — edit the files under data/ and run `npm run build`. `npm run check` fails if this file drifts from them.",
  workflow,
  vantage,
  calls,
};

const serialised = JSON.stringify(registry, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== serialised) {
    console.error("build-registry: public/fellowships/registry.json is out of date. Run `npm run build`.");
    process.exit(1);
  }
  console.log(`PASS  registry in sync — ${calls.length} calls, ${workflow.stages.length} stages`);
  process.exit(0);
}

fs.writeFileSync(OUT, serialised);

const basis = (c, f) => ((c.provenance || {})[f] || {}).basis;
const groups = ["closes", "summary", "eligibility", "requirements", "award", "cycle"];

const tally = {};
for (const g of groups) {
  tally[g] = calls.filter((c) => basis(c, g) !== "none").length;
}
const owed = calls.filter((c) => basis(c, "closes") === "none").map((c) => c.id);

console.log(`wrote public/fellowships/registry.json — ${calls.length} calls, ${workflow.stages.length} stages, ${vantage.fields.length} fields`);
console.log("\nprovenance, per product field-group (populated / total):");
for (const g of groups) {
  const bar = "#".repeat(tally[g]).padEnd(calls.length, ".");
  console.log(`  ${g.padEnd(13)} ${String(tally[g]).padStart(2)}/${calls.length}  ${bar}`);
}
console.log(`\n${owed.length} record(s) owe a deadline: ${owed.join(", ")}`);
