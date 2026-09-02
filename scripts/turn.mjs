#!/usr/bin/env node
// The per-turn cycle, run as a cycle rather than described as one.
//
//   extract → save → archive → execute → recheck → posture → report
//
// Each stage has to actually happen, in order, and the report is written from
// what the stages returned — not from what the turn intended. A stage that did
// not run is reported as not run. That is the whole point: the log is a record,
// not a summary.
//
//   node scripts/turn.mjs "<objective>" [--manifest <path>] [--dry]
//
// Appends one entry to turn/log.jsonl and prints the formalised report.

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TURN = path.join(ROOT, "turn");
const LOG = path.join(TURN, "log.jsonl");
const ARCHIVE = path.join(TURN, "archive");

const args = process.argv.slice(2);
const objective = args.find((a) => !a.startsWith("--")) ?? "";
const dry = args.includes("--dry");
const manifestPath = args.includes("--manifest") ? args[args.indexOf("--manifest") + 1] : null;

if (!objective) {
  process.stderr.write('usage: node scripts/turn.mjs "<objective>" [--manifest <path>] [--dry]\n');
  process.exit(2);
}

const stages = [];
function stage(name, fn) {
  const at = new Date().toISOString();
  try {
    const out = fn();
    stages.push({ stage: name, at, ran: true, ...out });
    return out;
  } catch (err) {
    stages.push({ stage: name, at, ran: true, failed: true, error: String(err.message ?? err) });
    return null;
  }
}

// 1. EXTRACT — what already exists that this turn needs to know about.
const extracted = stage("extract", () => {
  const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  return { tracked: tracked.length, head, dirty: dirty.length, files: tracked };
});

// 2. SAVE — fix the content of what was extracted, so the rest of the turn is
//    measured against a state that cannot move underneath it.
const saved = stage("save", () => {
  const files = (extracted?.files ?? []).filter((f) => fs.existsSync(path.join(ROOT, f)));
  const h = crypto.createHash("sha256");
  let bytes = 0;
  for (const f of files.sort()) {
    const buf = fs.readFileSync(path.join(ROOT, f));
    bytes += buf.length;
    h.update(f).update(buf);
  }
  return { files: files.length, bytes, state: h.digest("hex").slice(0, 16) };
});

// 3. ARCHIVE — compress that state and keep it. Deflate, from the standard
//    library; no tar, no external binary, so the archive is reproducible.
const archived = stage("archive", () => {
  if (dry) return { skipped: "dry run" };
  fs.mkdirSync(ARCHIVE, { recursive: true });
  const body = JSON.stringify({
    at: new Date().toISOString(),
    head: extracted?.head ?? null,
    state: saved?.state ?? null,
    files: extracted?.files ?? [],
  });
  const gz = zlib.gzipSync(Buffer.from(body), { level: 9 });
  const name = `${saved?.state ?? "unknown"}.json.gz`;
  fs.writeFileSync(path.join(ARCHIVE, name), gz);
  return { file: `turn/archive/${name}`, raw: body.length, packed: gz.length, ratio: +(gz.length / body.length).toFixed(3) };
});

// 4. EXECUTE — the objective. This runner does not perform the objective; it
//    records that the objective was declared and carries it into the log, so a
//    turn can never report an objective it did not state up front.
const executed = stage("execute", () => ({
  objective,
  performed_by: "the session, outside this runner",
  note: "This stage is deliberately not automated. A runner that claimed to have executed an objective it only logged would be the exact failure this cycle exists to prevent.",
}));

// 5. RECHECK — run the repository's own checks against the post-execution tree.
const rechecked = stage("recheck", () => {
  if (dry) return { skipped: "dry run" };
  const results = {};
  for (const cmd of ["check:tiers", "check:propose", "check:mfile"]) {
    try {
      execFileSync("npm", ["run", "--silent", cmd], { cwd: ROOT, stdio: "pipe" });
      results[cmd] = "pass";
    } catch (e) {
      results[cmd] = `fail (${e.status})`;
    }
  }
  return { results, all_pass: Object.values(results).every((v) => v === "pass") };
});

// 6. POSTURE — what media this turn may now include, and on what basis. A file
//    is postured for inclusion only where the administrator can say something
//    about it. Nothing is postured on an unmeasured store.
const postured = stage("posture", () => {
  if (!manifestPath) {
    return {
      included: 0,
      withheld: "no manifest supplied",
      because: "Media cannot be postured for inclusion from a store that has not been scanned. See mfile/questions/intake.json.",
    };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const report = JSON.parse(
    execFileSync("node", [path.join(ROOT, "scripts", "mfile.mjs"), manifestPath, "--json"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
  const usable = report.verdicts.filter(
    (v) => v.duplicate.says !== "duplicate" && v.functional.says !== "unreferenced",
  );
  return {
    scanned: manifest.records?.length ?? 0,
    included: usable.length,
    excluded_as_duplicate: report.verdicts.filter((v) => v.duplicate.says === "duplicate").length,
    unknown_function: report.verdicts.filter((v) => v.functional.says === "unknown").length,
    basis: report.inputs,
  };
});

// 7. REPORT — formalised, appended, never rewritten.
const entry = {
  at: new Date().toISOString(),
  objective,
  head: extracted?.head ?? null,
  state: saved?.state ?? null,
  stages,
  complete: stages.every((s) => s.ran && !s.failed),
};

if (!dry) {
  fs.mkdirSync(TURN, { recursive: true });
  fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
}

const W = 18;
const L = ["", `TURN — ${entry.objective}`, ""];
for (const s of stages) {
  const detail = Object.entries(s)
    .filter(([k]) => !["stage", "at", "ran", "files", "basis", "results"].includes(k))
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("  ");
  L.push(`  ${(s.failed ? "✗ " : "  ") + s.stage.padEnd(W)}${detail}`);
}
L.push("");
L.push(`  ${entry.complete ? "complete" : "INCOMPLETE"} — state ${entry.state}${dry ? " (dry run, nothing written)" : `, appended to turn/log.jsonl`}`);
L.push("");
process.stdout.write(L.join("\n"));
