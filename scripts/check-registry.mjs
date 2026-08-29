/* Assertions over the reference and the workflow engine. No browser.
 *
 *   npm run check:data
 *
 * What this proves: the engine is deterministic and idempotent, the auto
 * transitions in data/workflow.json fire when their guards hold and not
 * otherwise, every record can reach a terminal stage, the Vantage
 * configuration is internally consistent, and the honesty rule on provenance
 * holds across every record.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "fellowships", "registry.json"), "utf8"));

/* Load the engine exactly as the browser does — same file, no shim. */
const sandbox = {};
vm.createContext(sandbox);
new vm.Script(fs.readFileSync(path.join(ROOT, "public", "fellowships", "workflow.js"), "utf8")).runInContext(sandbox);
const Workflow = sandbox.Workflow;

const { workflow, vantage, calls } = registry;
const engine = Workflow.compile(workflow);

/* Comments describe the rules; they are not violations of them. Scan code. */
const strip = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/* Configuration files carry "$comment" keys. They are documentation, not
   floors, fields or stages. */
const keys = (obj) => Object.keys(obj).filter((k) => k[0] !== "$");

let failures = 0;
const ok = (name, cond, detail) => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond || !detail ? "" : `  — ${detail}`}`);
};

/* ------------------------------------------------------------- engine -- */

ok("engine has no eval", !/\beval\s*\(|new Function/.test(
  strip(fs.readFileSync(path.join(ROOT, "public", "fellowships", "workflow.js"), "utf8"))));

ok("engine names no stage id of its own", (() => {
  const src = strip(fs.readFileSync(path.join(ROOT, "public", "fellowships", "workflow.js"), "utf8"));
  return !workflow.stages.some((s) => src.includes(`"${s.id}"`));
})(), "a stage id is hard-coded in the engine");

ok("module names no field or band id of its own", (() => {
  const src = strip(fs.readFileSync(path.join(ROOT, "public", "fellowships", "vantage.js"), "utf8"));
  const ids = [...vantage.fields.map((f) => f.id), ...vantage.bands.map((b) => b.id)];
  return !ids.some((id) => src.includes(`"${id}"`));
})(), "a field or band id is hard-coded in vantage.js");

ok("module compares no width", (() => {
  const src = strip(fs.readFileSync(path.join(ROOT, "public", "fellowships", "vantage.js"), "utf8"));
  return !/innerWidth|max-width|min-width/.test(src);
})(), "vantage.js measures a width instead of reading --tier");

/* settle() is idempotent: settling a settled record moves nothing further. */
{
  let bad = null;
  for (const call of calls) {
    for (const days of [-400, -30, -1, 0, 1, 30, 400]) {
      const first = engine.settle({ call, derived: { days } });
      const second = engine.settle({ call: { ...call, stage: first.stage }, derived: { days } });
      if (second.stage !== first.stage) { bad = `${call.id} @${days}d: ${first.stage} → ${second.stage}`; break; }
      if (first.stalled || second.stalled) { bad = `${call.id} @${days}d stalled`; break; }
    }
    if (bad) break;
  }
  ok("settle() is idempotent and never stalls", !bad, bad);
}

/* Every auto transition is reachable, and each one fires only under its guard. */
for (const t of workflow.transitions.filter((x) => x.mode === "auto")) {
  const from = t.from[0];
  const fires = engine.settle({ call: { stage: from }, derived: { days: -1 } });
  const holds = engine.settle({ call: { stage: from }, derived: { days: 999 } });
  ok(`auto "${t.id}" fires past the close date`, fires.fired.includes(t.id), `settled to ${fires.stage}`);
  ok(`auto "${t.id}" stays put before it`, !holds.fired.includes(t.id), `settled to ${holds.stage}`);
}

/* No manual transition is offered out of a terminal stage. */
{
  const leaking = workflow.stages
    .filter((s) => s.terminal)
    .filter((s) => engine.actions({ call: { stage: s.id }, derived: { days: 10 } }).length);
  ok("terminal stages offer no manual transition", leaking.length === 0,
    leaking.map((s) => s.id).join(", "));
}

/* Every non-terminal stage can reach some terminal stage. */
{
  const edges = new Map(workflow.stages.map((s) => [s.id, []]));
  for (const t of workflow.transitions) for (const f of t.from) edges.get(f)?.push(t.to);
  const terminal = new Set(workflow.stages.filter((s) => s.terminal).map((s) => s.id));
  const stranded = workflow.stages.filter((s) => {
    if (s.terminal) return false;
    const seen = new Set([s.id]);
    const queue = [s.id];
    while (queue.length) {
      const cur = queue.shift();
      if (terminal.has(cur)) return false;
      for (const next of edges.get(cur) || []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    return true;
  });
  ok("every stage can reach a terminal stage", stranded.length === 0,
    stranded.map((s) => s.id).join(", "));
}

/* --------------------------------------------------------- provenance -- */

{
  const lying = calls.filter((c) => !c.verified && c.register !== "V");
  ok("no record claims a register it has not earned", lying.length === 0,
    lying.map((c) => c.id).join(", "));

  const LEGAL = ["sourced", "confirmed", "none"];
  const unmarked = calls.filter((c) => !LEGAL.includes(c.date_basis));
  ok("every record declares a date basis", unmarked.length === 0, unmarked.map((c) => c.id).join(", "));

  /* The rule the whole reference rests on, asserted against the shipped data
     rather than trusted from the build. */
  const fabricated = calls.filter((c) => c.closes && c.date_basis === "none");
  ok("no record carries a date without a source", fabricated.length === 0,
    fabricated.map((c) => c.id).join(", "));

  const undocumented = calls.filter((c) => c.closes && !c.sourced_from);
  ok("every dated record records what was read", undocumented.length === 0,
    undocumented.map((c) => c.id).join(", "));

  const silent = calls.filter((c) => !c.closes && !/⟦FILL/.test(c.cycle_note || ""));
  ok("every undated record names what is owed", silent.length === 0,
    silent.map((c) => c.id).join(", "));

  const fakeAward = calls.filter((c) => c.award.basis === "none" && (c.award.min !== null || c.award.max !== null));
  ok("no record carries an award figure without a source", fakeAward.length === 0,
    fakeAward.map((c) => c.id).join(", "));

  const provField = vantage.fields.find((f) => f.role === "provenance");
  ok("provenance renders on every floor", provField &&
    keys(vantage.density).every((t) => provField.tiers.includes(t)),
    "a floor exists where an unverified date shows without its marker");
}

/* ------------------------------------------------------------- config -- */

{
  const titles = vantage.fields.filter((f) => f.role === "title");
  ok("exactly one title field", titles.length === 1, `${titles.length} found`);

  const everyFloor = keys(vantage.density);
  const bare = everyFloor.filter((t) => !vantage.fields.some((f) => f.role === "title" && f.tiers.includes(t)));
  ok("every floor renders a title", bare.length === 0, bare.join(", "));

  const roles = new Set(vantage.fields.map((f) => f.role));
  const src = strip(fs.readFileSync(path.join(ROOT, "public", "fellowships", "vantage.js"), "utf8"));
  const missing = [...roles].filter((r) => !new RegExp(`\\b${r}:\\s*function`).test(src));
  ok("every configured role has a renderer", missing.length === 0, missing.join(", "));

  const past = vantage.bands.filter((b) => b.when_past);
  ok("exactly one band claims the past", past.length === 1, `${past.length} found`);

  const undatedBands = vantage.bands.filter((b) => b.when_undated);
  ok("exactly one band claims the undated", undatedBands.length === 1, `${undatedBands.length} found`);

  const ordered = vantage.bands.filter((b) => !b.when_past && !b.when_undated && b.max_days !== null);
  const ascending = ordered.every((b, i) => i === 0 || b.max_days > ordered[i - 1].max_days);
  ok("band ceilings ascend", ascending, "a band is unreachable behind a wider one");

  const probe = { days: 1, fit: 1, ret: 1, band_order: 0 };
  const unresolved = vantage.order.filter((o) =>
    Workflow.read({ call: calls[0], derived: probe }, o.key) === undefined);
  ok("order keys resolve", unresolved.length === 0,
    unresolved.map((o) => o.key).join(", "));

  const rank = vantage.rank || {};
  ok("return-on-effort inputs are declared", !!(rank.effort_cost && rank.award_value && rank.weights),
    "data/vantage.config.json is missing rank inputs");
  ok("every effort level has a cost", ["low", "medium", "high"].every((e) => rank.effort_cost[e] > 0),
    "an effort level has no cost, so it would divide by the default");
  ok("return is ranked before the deadline within a band",
    vantage.order[0].key === "derived.band_order" &&
    vantage.order[1].key === "derived.ret" && vantage.order[1].dir === "desc",
    "the horizon band must group first and return must rank inside it");

  const weights = (vantage.fit.criteria || []).reduce((n, c) => n + c.weight, 0);
  ok("fit weights sum above zero", weights > 0, `${weights}`);

  const badCriteria = (vantage.fit.criteria || []).filter((c) =>
    !(c.profile in vantage.profile) || !calls.some((call) => c.call in call));
  ok("every fit criterion names a real profile and record key", badCriteria.length === 0,
    badCriteria.map((c) => c.id).join(", "));
}

console.log(`\n${failures ? `${failures} failed` : "all assertions passed"} — ${calls.length} calls, ${workflow.stages.length} stages, ${vantage.fields.length} fields`);
process.exit(failures ? 1 : 0);
