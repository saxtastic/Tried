#!/usr/bin/env node
/* Outstanding requests and clarifications.
 *
 *   npm run outstanding            print the list
 *   npm run outstanding -- --strict  exit non-zero if anything awaits the owner
 *   npm run outstanding -- --json
 *
 * Derived, not maintained. A hand-kept list of open items goes stale exactly as
 * fast as everything else in this repository has gone stale — the record is the
 * only thing that stays true, so this reads the record.
 *
 * Four sources, in descending order of who is blocked:
 *   1. Awaiting the owner   — declared in fleet/projects/simulator.json
 *   2. Awaiting a vantage   — core questions with no answer, arbitrations null
 *   3. Owed a source        — every `owed` field and `basis: none` in any corpus
 *   4. Owed a search        — doors with no recorded attempt
 *
 * Only the first is hand-declared, because a question put to a person cannot be
 * derived from a file. Everything else is read.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);

const C = process.stdout.isTTY && !flag("no-color")
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, c: (s) => `\x1b[36m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, r: (s) => s, y: (s) => s, c: (s) => s };

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null);

function walkJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p);

// -- 1. awaiting the owner ---------------------------------------------------

const project = readJson(path.join(ROOT, "fleet/projects/simulator.json")) ?? {};
const awaitingOwner = (project.awaiting_owner ?? []).map((x) => ({
  kind: "awaiting_owner",
  ...x,
}));

// -- 2. awaiting a vantage ---------------------------------------------------

const questions = readJson(path.join(ROOT, "fleet/questions.json"));
const awaitingVantage = [];
if (questions?.questions) {
  for (const q of questions.questions) {
    const answered = new Set((q.answers ?? []).map((a) => a.vantage));
    const owed = (q.vantages ?? []).filter((v) => !answered.has(v));
    if (owed.length) {
      awaitingVantage.push({
        kind: "awaiting_vantage",
        id: q.id,
        question: q.question,
        owed_from: owed,
        detail: `${owed.length} of ${(q.vantages ?? []).length} vantage(s) have not answered`,
      });
    }
    if (q.arbitration === null && (q.answers ?? []).length > 0) {
      awaitingVantage.push({
        kind: "awaiting_arbitration",
        id: q.id,
        question: q.question,
        detail: `${(q.answers ?? []).length} answer(s) recorded, no arbitration written`,
      });
    }
  }
}

// -- 3. owed a source --------------------------------------------------------

const owed = [];
const corpora = [path.join(ROOT, "corpus"), path.join(ROOT, "public/simulator/corpus")];
for (const dir of corpora) {
  for (const file of walkJson(dir)) {
    const data = readJson(file);
    const visit = (node, trail) => {
      if (node === null || typeof node !== "object") {
        if (typeof node === "string" && /⟦(OWED|FILL)/.test(node)) {
          owed.push({ kind: "owed_marker", file: rel(file), at: trail, detail: node.slice(0, 160) });
        }
        return;
      }
      if (Array.isArray(node)) return node.forEach((v, i) => visit(v, `${trail}[${i}]`));
      for (const [k, v] of Object.entries(node)) {
        if (k === "owed" && typeof v === "string" && node.basis !== "none") {
          // A node with basis `none` is reported once, below, with its owed text.
          owed.push({ kind: "owed_source", file: rel(file), at: trail || node.id || "", id: node.id ?? null, detail: v });
        }
        if (k === "basis" && v === "none") {
          owed.push({
            kind: "basis_none",
            file: rel(file),
            at: trail || node.id || "",
            id: node.id ?? null,
            detail: node.owed ?? node.note ?? "held, not asserted — nothing behind it yet",
          });
        }
        visit(v, trail ? `${trail}.${k}` : k);
      }
    };
    visit(data, "");
  }
}

// -- 4. owed a search --------------------------------------------------------

const doors = readJson(path.join(ROOT, "public/simulator/corpus/doors.json")) ?? [];
const owedSearch = doors
  .filter((d) => (d.attempts ?? []).length === 0)
  .map((d) => ({ kind: "owed_search", id: d.id, detail: d.owed ?? "no search recorded", theory: d.theory }));

// -- report ------------------------------------------------------------------

const all = { awaitingOwner, awaitingVantage, owed, owedSearch };
const total = awaitingOwner.length + awaitingVantage.length + owed.length + owedSearch.length;

if (flag("json")) {
  console.log(JSON.stringify({ total, ...all }, null, 2));
  process.exit(flag("strict") && awaitingOwner.length ? 1 : 0);
}

const wrap = (t, w = 78, ind = "      ") => {
  const words = String(t).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > w) { lines.push(line.trim()); line = word; }
    else line += ` ${word}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((l) => ind + l).join("\n");
};

console.log(`\n${C.b("OUTSTANDING")}  ${C.dim(`${total} item(s), derived from the record`)}`);
console.log(C.dim("─".repeat(60)));

console.log(`\n${C.r(`AWAITING THE OWNER — ${awaitingOwner.length}`)}  ${C.dim("nothing moves on these without an answer")}`);
if (!awaitingOwner.length) console.log(C.dim("  none declared"));
for (const x of awaitingOwner) {
  console.log(`  ${C.b("?")} ${x.question ?? x.id}`);
  if (x.detail) console.log(wrap(x.detail));
  if (x.asked_at) console.log(C.dim(`      asked ${x.asked_at}${x.blocking ? " · BLOCKING" : " · not blocking"}`));
}

console.log(`\n${C.y(`AWAITING A VANTAGE — ${awaitingVantage.length}`)}`);
if (!awaitingVantage.length) console.log(C.dim("  none"));
for (const x of awaitingVantage) {
  console.log(`  ${C.b(x.id)} ${C.dim(x.kind === "awaiting_arbitration" ? "no arbitration" : `owed from: ${x.owed_from.join(", ")}`)}`);
  console.log(wrap(x.detail));
}

// Grouped by file. A flat list of every field marked `none` is a wall, and a
// wall gets skipped — which would defeat the point of generating it at all.
const byFile = {};
for (const x of owed) (byFile[x.file] ??= []).push(x);
const fileCount = Object.keys(byFile).length;
console.log(`\n${C.c(`OWED A SOURCE — ${owed.length} across ${fileCount} file(s)`)}  ${C.dim("held, not asserted")}`);
for (const [file, items] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  const ids = [...new Set(items.map((i) => i.id).filter(Boolean))];
  console.log(`  ${C.b(file)} ${C.dim(`· ${items.length} item(s)`)}`);
  if (ids.length && ids.length <= 6) console.log(C.dim(`      ${ids.join(", ")}`));
  else if (ids.length) console.log(C.dim(`      ${ids.slice(0, 6).join(", ")} … and ${ids.length - 6} more`));
  // One representative detail per file; the rest are the same shape.
  const rep = items.find((i) => i.detail && i.detail.length > 40) ?? items[0];
  if (rep?.detail) console.log(wrap(rep.detail.slice(0, 200), 74));
}

console.log(`\n${C.c(`OWED A SEARCH — ${owedSearch.length}`)}  ${C.dim("unsearched, not unattempted")}`);
for (const x of owedSearch) {
  console.log(`  ${C.b(x.id)}`);
  console.log(wrap(x.theory));
  console.log(C.dim(wrap(x.detail)));
}

console.log(`\n${C.dim("  Derived from fleet/projects/simulator.json, fleet/questions.json, corpus/**, and doors.json.")}`);
console.log(`${C.dim("  Only 'awaiting the owner' is hand-declared — a question put to a person cannot be read off a file.")}\n`);

process.exit(flag("strict") && awaitingOwner.length ? 1 : 0);
