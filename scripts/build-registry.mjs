/* Compiles data/ into public/registry.json.
 *
 *   npm run build          write public/registry.json
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
const OUT = path.join(ROOT, "public", "registry.json");

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

  for (const [field, allowed] of Object.entries(contract.enums)) {
    if (!(field in rec)) continue;
    const values = Array.isArray(rec[field]) ? rec[field] : [rec[field]];
    for (const v of values) {
      if (v !== "any" && !allowed.includes(v)) {
        note(file, `${field} "${v}" is not one of ${allowed.join(", ")}`);
      }
    }
  }

  if (!stageIds.has(rec.stage)) {
    note(file, `stage "${rec.stage}" is not declared in data/workflow.json`);
  }

  for (const key of ["opens", "closes", "verified"]) {
    const v = rec[key];
    if (v === null || v === undefined) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v + "T00:00:00Z"))) {
      note(file, `${key} "${v}" is not an ISO yyyy-mm-dd date`);
    }
  }
  if (rec.opens && rec.closes && rec.opens > rec.closes) {
    note(file, `opens (${rec.opens}) is after closes (${rec.closes})`);
  }

  /* The honesty rule the reference is built around: a record nobody has
     checked against its source cannot claim a register above V. */
  if (!rec.verified && rec.register !== "V") {
    note(file, `register "${rec.register}" claims verification but verified is null`);
  }
  if (rec.verified && rec.date_basis === "estimated" && rec.register !== "V") {
    note(file, `dates are estimated, so register must stay V until date_basis is confirmed`);
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
    console.error("build-registry: public/registry.json is out of date. Run `npm run build`.");
    process.exit(1);
  }
  console.log(`PASS  registry in sync — ${calls.length} calls, ${workflow.stages.length} stages`);
  process.exit(0);
}

fs.writeFileSync(OUT, serialised);

const unverified = calls.filter((c) => !c.verified).length;
const estimated = calls.filter((c) => c.date_basis === "estimated").length;
console.log(`wrote public/registry.json — ${calls.length} calls, ${workflow.stages.length} stages, ${vantage.fields.length} fields`);
console.log(`provenance: ${unverified}/${calls.length} unverified, ${estimated}/${calls.length} carry estimated dates`);
if (unverified) console.log("every unverified record is marked in the interface and must be confirmed against its source before it is acted on.");
