#!/usr/bin/env node
/* Definition of completion.
 *
 *   npm run complete                 run every gate, retest and benchmark
 *   npm run complete -- --fast       skip the gates marked slow (the browser one)
 *   npm run complete -- --strict     exit non-zero unless the verdict is `complete`
 *   npm run complete -- --json
 *
 * The protocol lives in corpus/enoch/protocol/completion.json and this file only
 * executes it. That split is the point: what counts as finished is a record that
 * can be read and argued with, not a condition buried in a script.
 *
 * Three verdicts and no others, the same three a proposal resolves to:
 *
 *   complete      every gate passed and every benchmark read met
 *   incomplete    something named came back failing, and it is printed
 *   test_retest   the gates hold but a benchmark could not be read at all
 *
 * `test_retest` is not a softer failure. It is the honest verdict when the
 * record does not separate the outcomes, and it names the measurement that
 * would. A run that never returns it is a run whose benchmarks are all trivially
 * readable, which is usually a sign they are not measuring much.
 *
 * Enoch administers this. Enoch rules on order, never on merit: this file will
 * say a gate was not run and will never say the work was not worth doing.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);

const C = process.stdout.isTTY && !flag("no-color")
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, r: (s) => s, g: (s) => s, y: (s) => s };

const PROTOCOL_PATH = path.join(ROOT, "corpus/enoch/protocol/completion.json");
if (!fs.existsSync(PROTOCOL_PATH)) {
  console.error(`completion: no protocol at ${path.relative(ROOT, PROTOCOL_PATH)}. Nothing to administer.`);
  process.exit(2);
}
const protocol = JSON.parse(fs.readFileSync(PROTOCOL_PATH, "utf8"));

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const rel = (p) => path.relative(ROOT, p);

function walkJson(dir, out = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

// A failing gate's own words, not its last four lines. Most of these tools end
// with a standing caveat, so a naive tail reports the caveat and hides the
// ruling — which is how a failure gets read as noise and skipped.
const SIGNAL = /\b(FAIL|OUT OF ORDER|not ok|unmet|Error|error:)\b/;
function saySo(r) {
  if (r.error) return String(r.error.message);
  const lines = `${r.stdout}\n${r.stderr}`.split("\n").map((l) => l.trim()).filter(Boolean);
  const signal = lines.filter((l) => SIGNAL.test(l));
  const pick = signal.length ? signal : lines.slice(-4);
  return pick.slice(0, 4).join(" | ");
}

// A passing gate's summary line, where it has one. The tools here end with a
// standing caveat rather than a result, so the last line is usually the caveat.
const SUMMARY = /^(#\s*pass\b|all assertions\b|PASS\b|\d+\s+(passed|assertions)\b)/i;
function sayOk(r) {
  const lines = r.stdout.split("\n").map((l) => l.trim()).filter(Boolean);
  const hit = [...lines].reverse().find((l) => SUMMARY.test(l));
  // No summary line is not a fault. Several of these tools end in prose, and
  // reporting the last sentence of an essay as a result is worse than saying
  // nothing: it reads like a finding.
  return hit ?? "exit 0, no summary line";
}

function run(cmd) {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", error: r.error };
}

// -- gates -------------------------------------------------------------------

const gates = [];
for (const g of protocol.gates ?? []) {
  if (g.slow && flag("fast")) {
    gates.push({ ...g, state: "skipped", detail: "marked slow and --fast was passed. A skipped gate is not a passed gate." });
    continue;
  }
  const r = run(g.run);
  gates.push({
    ...g,
    state: r.ok ? "pass" : "fail",
    detail: r.ok
      ? sayOk(r)
      : saySo(r),
  });
}

// -- retests -----------------------------------------------------------------
//
// Run the same producer twice and compare. Where the producer writes files, the
// files are compared too, and against what was already on disk before the first
// run — a bundle that regenerates identically but differs from the committed
// copy is stale, which is a different fault and is reported as one.

const retests = [];
for (const t of protocol.retests ?? []) {
  const before = (t.compare ?? []).map((f) => (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f)) : null));
  const a = run(t.run);
  const afterA = (t.compare ?? []).map((f) => (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f)) : null));
  const b = run(t.run);
  const afterB = (t.compare ?? []).map((f) => (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f)) : null));

  if (!a.ok || !b.ok) {
    retests.push({ ...t, state: "fail", detail: `producer exited ${a.ok ? b.status : a.status}` });
    continue;
  }
  if (a.stdout !== b.stdout) {
    retests.push({ ...t, state: "fail", detail: "two runs produced different stdout from the same inputs" });
    continue;
  }
  const unstable = (t.compare ?? []).filter((_, i) => !bufEq(afterA[i], afterB[i]));
  if (unstable.length) {
    retests.push({ ...t, state: "fail", detail: `regenerated differently on the second run: ${unstable.join(", ")}` });
    continue;
  }
  const stale = (t.compare ?? []).filter((_, i) => !bufEq(before[i], afterA[i]));
  if (stale.length) {
    retests.push({ ...t, state: "fail", detail: `committed copy is stale: ${stale.join(", ")} — run \`npm run build:corpus\`` });
    continue;
  }
  retests.push({ ...t, state: "pass", detail: `identical across two runs${t.compare?.length ? ` and in step with the ${t.compare.length} committed file(s)` : ""}` });
}

function bufEq(a, b) {
  if (a === null || b === null) return a === b;
  return Buffer.compare(a, b) === 0;
}

// -- benchmarks --------------------------------------------------------------
//
// The check vocabulary is implemented here and named in the protocol. The
// protocol never carries code: a corpus file that could be executed would let a
// record decide what counts as passing it.

const BASES = new Set(["confirmed", "sourced", "derived", "none"]);

const CHECKS = {
  basis_declared(bm) {
    const bad = [];
    let seen = 0;
    for (const dir of bm.over) {
      for (const file of walkJson(dir)) {
        let data;
        try { data = readJson(path.join(ROOT, file)); } catch (e) { bad.push(`${file}: unreadable — ${e.message}`); continue; }
        visit(data, "", (node, trail) => {
          if (typeof node.basis !== "string") return;
          seen++;
          if (!BASES.has(node.basis)) bad.push(`${file}:${trail} basis ${JSON.stringify(node.basis)}`);
          else if (node.basis === "none" && !node.owed && !node.note) bad.push(`${file}:${trail} basis none and says nothing about what is owed`);
        });
      }
    }
    if (!seen) return { state: "test_retest", detail: "no record in these paths declares a basis at all, so nothing was measured" };
    return bad.length
      ? { state: "unmet", detail: `${bad.length} of ${seen}: ${bad.slice(0, 3).join("; ")}${bad.length > 3 ? " …" : ""}` }
      : { state: "met", detail: `${seen} declared bases, all within the four, and every one reading none says what is owed` };
  },

  owner_items_are_owed(bm) {
    const items = bm.over.flatMap((f) => (readJson(path.join(ROOT, f)).awaiting_owner ?? []));
    if (!items.length) return { state: "test_retest", detail: "no awaiting_owner items declared — either nothing is owed or nothing is being recorded, and this cannot tell which" };
    const answered = items.filter((i) => i.answered || i.resolved);
    return answered.length
      ? { state: "unmet", detail: `${answered.length} item(s) marked answered in the file rather than by the owner: ${answered.map((i) => i.id).join(", ")}` }
      : { state: "met", detail: `${items.length} question(s) held open, none derived away; ${items.filter((i) => i.blocking).length} blocking` };
  },

  csp_clean(bm) {
    const bad = [];
    for (const f of bm.over) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      if (/\bfetch\s*\(/.test(src)) bad.push(`${f} calls fetch`);
      if (/XMLHttpRequest/.test(src)) bad.push(`${f} uses XHR`);
      if (/setAttribute\(\s*['"]style['"]/.test(src)) bad.push(`${f} sets a style attribute`);
    }
    return bad.length
      ? { state: "unmet", detail: bad.join("; ") }
      : { state: "met", detail: `${bm.over.length} surface script(s), none reaching the network or setting inline style` };
  },

  no_typed_score_claims_derivation(bm) {
    const bad = [];
    let seen = 0;
    for (const dir of bm.over) {
      for (const file of walkJson(dir)) {
        const rows = readJson(path.join(ROOT, file));
        if (!Array.isArray(rows)) continue;
        for (const r of rows) {
          for (const field of ["fit_score", "financial_score"]) {
            if (r[field] === null || r[field] === undefined) continue;
            seen++;
            const p = r.provenance?.[field];
            if (!p) bad.push(`${r.id}.${field} has no provenance at all`);
            else if (p.basis !== "none") bad.push(`${r.id}.${field} claims basis ${p.basis}`);
          }
        }
      }
    }
    if (!seen) return { state: "test_retest", detail: "no typed score found in these paths; if the extraction ran, this should not be empty" };
    return bad.length ? { state: "unmet", detail: bad.join("; ") } : { state: "met", detail: `${seen} typed score(s), every one carrying basis none` };
  },

  derivation_named(bm) {
    const bad = [];
    for (const f of bm.over) {
      const src = fs.readFileSync(path.join(ROOT, f), "utf8");
      const ids = [...src.matchAll(/id:\s*'([A-Z]\d+)'/g)].map((m) => m[1]);
      const becauses = [...src.matchAll(/because:\s*'/g)].length;
      const ons = [...src.matchAll(/on:\s*\[/g)].length;
      if (!ids.length) bad.push(`${f} declares no named rules`);
      if (becauses < ids.length) bad.push(`${f}: ${ids.length} rule(s) but ${becauses} reason(s)`);
      if (ons < ids.length) bad.push(`${f}: ${ids.length} rule(s) but ${ons} declaration(s) of what they read`);
    }
    return bad.length ? { state: "unmet", detail: bad.join("; ") } : { state: "met", detail: "every rule names the fields it reads and why it fires" };
  },

  test_named(bm) {
    const missing = [];
    const haystack = bm.over
      .filter((f) => fs.existsSync(path.join(ROOT, f)))
      .map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"))
      .join("\n");
    if (!haystack) return { state: "test_retest", detail: `none of ${bm.over.join(", ")} exists, so the assertion cannot be located` };
    for (const name of bm.expects ?? []) if (!haystack.includes(name)) missing.push(name);
    return missing.length
      ? { state: "unmet", detail: `assertion(s) not found: ${missing.map((m) => JSON.stringify(m)).join(", ")}` }
      : { state: "met", detail: `${(bm.expects ?? []).length} named assertion(s) present; G1 is what proves they pass` };
  },

  command_produces(bm) {
    const r = run(bm.run);
    if (!r.ok) return { state: "unmet", detail: `exited ${r.status}` };
    try {
      const out = JSON.parse(r.stdout);
      const kinds = Object.keys(out).filter((k) => Array.isArray(out[k]) && out[k].length);
      return kinds.length
        ? { state: "met", detail: `reports ${kinds.length} non-empty categor(y/ies): ${kinds.join(", ")}` }
        : { state: "test_retest", detail: "ran and reported nothing outstanding, which is either true or a broken reader" };
    } catch {
      return { state: "test_retest", detail: "ran but did not produce readable JSON, so nothing can be concluded" };
    }
  },
};

function visit(node, trail, fn) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((v, i) => visit(v, `${trail}[${i}]`, fn));
  fn(node, trail || node.id || "");
  for (const [k, v] of Object.entries(node)) visit(v, trail ? `${trail}.${k}` : k, fn);
}

const benchmarks = [];
for (const bm of protocol.benchmarks ?? []) {
  const check = CHECKS[bm.check];
  if (!check) {
    benchmarks.push({ ...bm, state: "test_retest", detail: `no check named ${bm.check} is implemented, so this benchmark cannot be read` });
    continue;
  }
  try {
    benchmarks.push({ ...bm, ...check(bm) });
  } catch (e) {
    benchmarks.push({ ...bm, state: "test_retest", detail: `check threw: ${e.message}` });
  }
}

// -- verdict -----------------------------------------------------------------

const failed = [
  ...gates.filter((g) => g.state === "fail"),
  ...retests.filter((t) => t.state === "fail"),
  ...benchmarks.filter((b) => b.state === "unmet"),
];
const unread = benchmarks.filter((b) => b.state === "test_retest");
const skipped = gates.filter((g) => g.state === "skipped");

const verdict = failed.length ? "incomplete" : unread.length || skipped.length ? "test_retest" : "complete";

const declaredProjects = [...new Set(benchmarks.map((b) => b.project))];
const projects = fs.existsSync(path.join(ROOT, "fleet/projects"))
  ? fs.readdirSync(path.join(ROOT, "fleet/projects")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  : [];
const undeclared = projects.filter((p) => !declaredProjects.includes(p));

if (flag("json")) {
  console.log(JSON.stringify({ verdict, gates, retests, benchmarks, undeclared_projects: undeclared }, null, 2));
  process.exit(flag("strict") && verdict !== "complete" ? 1 : 0);
}

const mark = { pass: C.g("PASS"), fail: C.r("FAIL"), skipped: C.y("SKIP"), met: C.g(" MET"), unmet: C.r("UNMET"), test_retest: C.y("RETST") };

const wrap = (t, w = 76, ind = "        ") =>
  String(t).split(/\s+/).reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if ((last + " " + word).trim().length > w) lines.push(word);
    else lines[lines.length - 1] = (last + " " + word).trim();
    return lines;
  }, [""]).map((l) => ind + l).join("\n");

console.log(`\n${C.b("DEFINITION OF COMPLETION")}  ${C.dim(`protocol v${protocol.version} · administered by ${protocol.owner}`)}`);
console.log(C.dim("─".repeat(64)));
console.log(wrap(protocol.definition.statement, 76, "  "));

console.log(`\n${C.b("GATES")}`);
for (const g of gates) {
  console.log(`  ${mark[g.state] ?? g.state}  ${C.b(g.id)} ${g.name}  ${C.dim(g.run.join(" "))}`);
  console.log(C.dim(wrap(g.detail)));
}

console.log(`\n${C.b("RETESTS")}  ${C.dim("same inputs, twice, byte for byte")}`);
for (const t of retests) {
  console.log(`  ${mark[t.state] ?? t.state}  ${C.b(t.id)} ${t.name}`);
  console.log(C.dim(wrap(t.detail)));
}

console.log(`\n${C.b("BENCHMARKS")}`);
for (const b of benchmarks) {
  console.log(`  ${mark[b.state] ?? b.state}  ${C.b(b.id)} ${C.dim(`[${b.project}]`)} ${b.statement}`);
  console.log(C.dim(wrap(b.detail)));
}

if (undeclared.length) {
  console.log(`\n${C.y(`UNDECLARED — ${undeclared.length}`)}  ${C.dim("a project with no benchmark is not complete, it is unmeasured")}`);
  console.log(C.dim(`      ${undeclared.join(", ")}`));
}

const line = { complete: C.g("COMPLETE"), incomplete: C.r("INCOMPLETE"), test_retest: C.y("TEST-RETEST") }[verdict];
console.log(`\n${C.b("VERDICT")}  ${line}`);
console.log(wrap(protocol.definition.verdicts[verdict], 76, "  "));
if (failed.length) {
  console.log(`\n  ${C.r("what is failing:")}`);
  for (const f of failed) console.log(`    ${f.id} ${f.name ?? f.statement}`);
}
if (unread.length) {
  console.log(`\n  ${C.y("what could not be read:")}`);
  for (const u of unread) console.log(`    ${u.id} — ${u.detail}`);
}
if (skipped.length) console.log(`\n  ${C.y("skipped:")} ${skipped.map((s) => s.id).join(", ")} (--fast). A skipped gate is not a passed gate.`);
console.log(`\n${C.dim("  Enoch rules on order, not on merit. Nothing above says whether the work is good.")}`);
console.log(`${C.dim(`  Protocol: ${rel(PROTOCOL_PATH)} — edit the record, not this script.`)}\n`);

process.exit(flag("strict") && verdict !== "complete" ? 1 : 0);
