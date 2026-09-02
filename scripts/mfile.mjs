#!/usr/bin/env node
// The M file administrator.
//
// It does not run between the officers. It runs across all of them at once, on
// one input: a manifest of files. It answers four questions per file —
// duplicate, iterative, novel, functional — and it declares a basis for every
// verdict it gives.
//
// It never renames, moves, archives or deletes. It reports.
//
//   node scripts/mfile.mjs <manifest.json> [--json]
//   node scripts/mfile.mjs --self          # run against this repository
//
// No network. No dependencies.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { administer, normaliseStem } from "../src/administer.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STEM_RULES = path.join(ROOT, "mfile", "stem-rules.json");


/** The owner's naming cadence, if it has been read off their files. */
export function stemRules() {
  if (!fs.existsSync(STEM_RULES)) {
    return { confirmed: false, rules: [], source: null };
  }
  const r = JSON.parse(fs.readFileSync(STEM_RULES, "utf8"));
  return { confirmed: r.confirmed === true, rules: r.rules ?? [], source: r.source ?? null, scope: r.scope ?? "directory" };
}

function render(report) {
  const L = [];
  L.push("");
  L.push(`M FILE ADMINISTRATOR — ${report.records} files from ${report.listed ?? report.records} listing(s)${report.root ? ` under ${report.root}` : ""}`);
  L.push("");
  if (report.doors) L.push(`  doors            ${report.doors.join(" + ")}`);
  if (report.collapsed && report.collapsed.count) {
    L.push(`  collapsed        ${report.collapsed.count} album listing(s) — one file, listed more than once, NOT duplicates`);
  }
  if (report.dated_by && report.dated_by.captured_at) {
    L.push(`  ordered by       ${report.dated_by.captured_at} on capture date, ${report.dated_by.mtime} on mtime`);
  }
  L.push("");
  L.push("  inputs");
  for (const [k, v] of Object.entries(report.inputs)) L.push(`    ${k.padEnd(16)} ${v}`);
  L.push("");
  L.push("  answered");
  for (const [q, counts] of Object.entries(report.answered)) {
    const parts = Object.entries(counts).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`);
    L.push(`    ${q.padEnd(16)} ${parts.join(", ")}`);
  }
  if (report.kinds.length) {
    L.push("");
    L.push("  by kind — from the extension the name claims, not from the bytes");
    for (const k of report.kinds) {
      const mb = (k.bytes / 1048576).toFixed(1);
      L.push(`    ${k.kind.padEnd(16)} ${String(k.files).padStart(6)} files  ${mb.padStart(9)} MB`);
    }
  }
  if (report.withheld.length) {
    L.push("");
    L.push("  withheld — these questions have no answer yet, and were not estimated");
    for (const w of report.withheld) L.push(`    ${w.question.padEnd(16)} needs ${w.needs.join(", ")}`);
    L.push("");
    L.push(`  three questions unblock them: mfile/questions/intake.json`);
  }
  L.push("");
  return L.join("\n");
}

/**
 * A manifest of this repository, with all three inputs present.
 *
 * This is not a demo fixture. It is the administrator run against the one file
 * store whose naming cadence IS standardised and whose references ARE
 * enumerable, so that the four questions can be seen answered rather than
 * withheld. The contrast with a real drive is the point: the repository can be
 * administered because it was built to be, and a drive of twenty years of media
 * cannot, until the three intake questions are answered.
 */
function selfManifest() {
  const out = [];
  const skip = new Set(["node_modules", ".git", ".wrangler"]);
  // A build output is not a file in the store; it is a projection of one.
  // Counting them would also make this manifest a function of its own bytes —
  // public/mfile/data.js is generated FROM this scan, so including it means the
  // scan never converges and `--check` can never pass.
  const generated = new Set([
    "public/mfile/data.js",
    "public/workstation/data.js",
    "public/fellowships/registry.json",
    "public/simulator/corpus.bundle.js",
  ]);
  const text = [];
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (skip.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (generated.has(r)) continue;
      if (e.isDirectory()) walk(abs, r);
      else if (e.isFile()) {
        const buf = fs.readFileSync(abs);
        const st = fs.statSync(abs);
        out.push({
          path: r,
          name: e.name,
          ext: path.extname(e.name).slice(1).toLowerCase(),
          bytes: st.size,
          mtime: st.mtime.toISOString(),
          store: "repository",
          content_hash: crypto.createHash("sha256").update(buf).digest("hex"),
        });
        if (/\.(md|json|mjs|js|css|html|toml|py|txt)$/.test(e.name)) {
          text.push({ path: r, body: buf.toString("utf8") });
        }
      }
    }
  })(ROOT, "");

  // A file is referred to when some OTHER file names its path or its basename.
  const refers_to = out
    .filter((r) => text.some((t) => t.path !== r.path && (t.body.includes(r.path) || t.body.includes(r.name))))
    .map((r) => r.path);

  return {
    scanned_at: new Date().toISOString(),
    root: ".",
    store: "repository",
    records: out,
    reference_index: {
      built_by: "textual mention of a path or basename by any other tracked file",
      basis: "confirmed",
      limits: "It sees a name, not a use. A path named only inside a comment counts as a reference here, and a file loaded by a glob rather than by name does not.",
      refers_to,
    },
  };
}

/** The repository's cadence, which is standardised — unlike a personal drive's. */
const SELF_RULES = {
  confirmed: true,
  source: "this repository's own naming conventions, enforced by npm run check",
  scope: "directory",
  rules: [
    // Only markers that are genuinely version noise here. The verb prefix
    // check-/build-/make- was in this list on the first run and the report
    // called scripts/check-registry.mjs a version of scripts/build-registry.mjs,
    // which is false — the prefix names what the script does, not which draft it
    // is. It was removed. This is the mistake the iterative criterion is written
    // to prevent, and it happened here on the first attempt, on a store whose
    // cadence I already knew.
    { pattern: "\\.(bundle|min)$", flags: "", replace: "" },
  ],
};

const args = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = args.includes("--self")
    ? selfManifest()
    : JSON.parse(fs.readFileSync(args.find((a) => !a.startsWith("--")) ?? "mfile/manifest.json", "utf8"));
  const report = administer(manifest, args.includes("--self") ? SELF_RULES : stemRules());
  process.stdout.write(args.includes("--json") ? JSON.stringify(report, null, 2) + "\n" : render(report));
}
