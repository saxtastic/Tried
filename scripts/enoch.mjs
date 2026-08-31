#!/usr/bin/env node
/* Enoch — the account, and whether the protocol was followed.
 *
 *   npm run enoch              ledger and points of order
 *   npm run enoch -- --strict  exit non-zero if anything is out of order
 *   npm run enoch -- --json
 *
 * This officer is not a vantage. It does not answer core questions, does not
 * hold a position, and does not rule on whether a claim is correct. It keeps two
 * things:
 *
 *   THE LEDGER        every claim that was corrected, what superseded what, and
 *                     who caught it — read off the record, never inferred.
 *   POINTS OF ORDER   whether a protocol step was taken. A ruling of out_of_order
 *                     says a step was skipped. It says nothing about whether the
 *                     outcome would have differed, and this officer will not be
 *                     drawn on that.
 *
 * The separation is the point. An officer that ruled on the merits could not
 * also certify that the merits were reached properly, because it would be
 * certifying its own participation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);

const C = process.stdout.isTTY && !flag("no-color")
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, g: (s) => s, r: (s) => s, y: (s) => s };

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null);
const rel = (p) => path.relative(ROOT, p);

function walkJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

const CORPORA = [path.join(ROOT, "corpus"), path.join(ROOT, "public/simulator/corpus")];
const files = CORPORA.flatMap((d) => walkJson(d));

// ---------------------------------------------------------------- the ledger

const ledger = [];
const note = (entry) => ledger.push(entry);

for (const f of files) {
  const data = readJson(f);
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);

    if (typeof node.corrects === "string") {
      note({ kind: "correction", where: rel(f), id: node.id ?? null, entry: node.corrects });
    }
    if (Array.isArray(node.corrections)) {
      for (const c of node.corrections) {
        note({
          kind: "correction",
          where: rel(f),
          id: node.id ?? null,
          entry: c.what_was_wrong ?? JSON.stringify(c).slice(0, 200),
          raised_by: c.raised_by ?? null,
          verified_by: c.verified_by ?? null,
          standing: c.standing ?? null,
        });
      }
    }
    if (Array.isArray(node.history)) {
      for (const h of node.history) {
        if (typeof h === "string") note({ kind: "history", where: rel(f), id: node.id ?? null, entry: h });
      }
    }
    if (node.discrepancy) {
      note({ kind: "discrepancy_held_open", where: rel(f), id: node.id ?? null, entry: node.discrepancy });
    }
    for (const v of Object.values(node)) visit(v);
  };
  visit(data);
}

// -------------------------------------------------------- points of order

const rulings = [];
const rule = (verdict, on, finding, basis) => rulings.push({ verdict, on, finding, basis });

// 1. Every officer declares what it will not assert.
for (const dir of fs.readdirSync(path.join(ROOT, "corpus"), { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const i = readJson(path.join(ROOT, "corpus", dir.name, "integrity.json"));
  if (!i) { rule("out_of_order", `corpus/${dir.name}`, "No integrity declaration.", "an officer without one has declared no refusal"); continue; }
  if (!i.will_not_assert?.length || !i.declines) {
    rule("out_of_order", `corpus/${dir.name}`, "Declares no refusal.", "the protocol requires each officer to name what it will not assert");
  }
}

// 2. An answer names one vantage. An answer claiming several is one pretending.
const questions = readJson(path.join(ROOT, "fleet/questions.json"));
if (questions?.questions) {
  for (const q of questions.questions) {
    for (const a of q.answers ?? []) {
      if (!a.vantage) rule("out_of_order", q.id, "An answer does not name its vantage.", "rule: an answer names its vantage");
      else if (Array.isArray(a.vantage)) rule("out_of_order", q.id, "An answer claims more than one vantage.", "rule: an answer claiming all four vantages is one vantage pretending");
    }
    // 3. Answers standing without an arbitration.
    if ((q.answers ?? []).length > 0 && q.arbitration === null) {
      rule("out_of_order", q.id, `${(q.answers ?? []).length} answer(s) recorded, no arbitration written.`, "rule: arbitration holds the opposition; answers left unarbitrated resolve by whatever happens first");
    }
    // 4. An arbitration that overrode must say what it cost.
    if (q.arbitration?.overrode && q.arbitration.overrode !== "neither" && !q.arbitration.cost) {
      rule("out_of_order", q.id, "An arbitration overrode a vantage without naming the cost.", "rule: the decision names which it overrode and what that costs");
    }
    // 5. No question is closed by the asker answering it.
    const asker = q.arbitration?.by;
    if (asker && (q.answers ?? []).some((a) => a.session === asker)) {
      rule("out_of_order", q.id, "The session that arbitrated also answered.", "rule: no question is closed by the asker answering it");
    }
  }
}

// 6. A confirmed premise must not carry a bare figure with no measurement series.
for (const f of walkJson(path.join(ROOT, "corpus"))) {
  const d = readJson(f);
  if (d?.basis === "confirmed" && /\b\d{2,}\b/.test(d.statement ?? "") && !d.measurements) {
    rule("out_of_order", d.id ?? rel(f), "A confirmed premise states a figure with no measurement conditions.", "rule: assert the invariant, not the count");
  }
  if (d?.basis === "none" && !d.owed && !/⟦/.test(JSON.stringify(d))) {
    rule("out_of_order", d.id ?? rel(f), "A premise held at basis none does not say what is owed.", "rule: a premise with basis none is a question kept where it will be seen, not a blank");
  }
}

// 7. A door marked untried must name the search that would settle it.
for (const d of readJson(path.join(ROOT, "public/simulator/corpus/doors.json")) ?? []) {
  if ((d.attempts ?? []).length === 0 && !d.owed) {
    rule("out_of_order", d.id, "A door with no recorded attempt does not name the search that would settle it.", "rule: untried is unsearched, and an unsearched cell must say what search is owed");
  }
}

// 8. A correction must name who raised it.
for (const e of ledger.filter((x) => x.kind === "correction")) {
  if (e.raised_by === null && e.verified_by === null && !/session_|officer|owner/i.test(e.entry ?? "")) {
    rule("noted", e.id ?? e.where, "A correction is recorded without naming who raised it.", "not a defect — the protocol asks for attribution but does not require it");
  }
}

const outOfOrder = rulings.filter((r) => r.verdict === "out_of_order");
const noted = rulings.filter((r) => r.verdict === "noted");

// ----------------------------------------------------------------- output

const payload = {
  officer: "enoch",
  not_a_vantage: true,
  ledger,
  rulings,
  counts: { ledger: ledger.length, out_of_order: outOfOrder.length, noted: noted.length },
  refusal: "Enoch rules on order, never on merit. Nothing above says any claim is correct, and nothing above should be read as saying so.",
};

if (flag("json")) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(flag("strict") && outOfOrder.length ? 1 : 0);
}

const wrap = (t, w = 76, ind = "      ") => {
  const words = String(t).split(/\s+/);
  const lines = []; let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > w) { lines.push(line.trim()); line = word; }
    else line += ` ${word}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((l) => ind + l).join("\n");
};

console.log(`\n${C.b("ENOCH")} ${C.dim("· the account, and whether the protocol was followed")}`);
console.log(C.dim("  Not a vantage. Rules on order, never on merit."));
console.log(C.dim("─".repeat(62)));

console.log(`\n${C.b(`THE LEDGER — ${ledger.length}`)} ${C.dim("what was corrected, and what superseded what")}`);
for (const e of ledger) {
  const tag = e.kind === "discrepancy_held_open" ? C.y("held open") : e.kind === "correction" ? C.g("corrected") : C.dim("history");
  console.log(`  ${tag} ${C.dim(e.id ?? e.where)}`);
  console.log(wrap(e.entry, 74));
  if (e.raised_by) console.log(C.dim(`      raised by ${e.raised_by}`));
  if (e.verified_by) console.log(C.dim(`      verified by ${e.verified_by}`));
  if (e.standing) console.log(C.dim(wrap(e.standing, 70)));
}

console.log(`\n${C.b(`POINTS OF ORDER — ${outOfOrder.length} out of order, ${noted.length} noted`)}`);
if (!rulings.length) console.log(C.g("  every protocol step this officer can check was taken"));
for (const r of rulings) {
  const tag = r.verdict === "out_of_order" ? C.r("OUT OF ORDER") : C.dim("noted");
  console.log(`  ${tag} ${C.b(r.on)}`);
  console.log(wrap(r.finding, 74));
  console.log(C.dim(wrap(r.basis, 70)));
}

console.log(`\n${C.dim(wrap(payload.refusal, 76, "  "))}\n`);
process.exit(flag("strict") && outOfOrder.length ? 1 : 0);
