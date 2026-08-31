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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CRITERIA = JSON.parse(fs.readFileSync(path.join(ROOT, "mfile", "criteria.json"), "utf8"));
const STEM_RULES = path.join(ROOT, "mfile", "stem-rules.json");

/** The owner's naming cadence, if it has been read off their files. */
export function stemRules() {
  if (!fs.existsSync(STEM_RULES)) {
    return { confirmed: false, rules: [], source: null };
  }
  const r = JSON.parse(fs.readFileSync(STEM_RULES, "utf8"));
  return { confirmed: r.confirmed === true, rules: r.rules ?? [], source: r.source ?? null, scope: r.scope ?? "directory" };
}

/** Reduce a filename to the work it is a version of — only under confirmed rules. */
export function normaliseStem(name, rules) {
  let s = name.replace(/\.[^.]*$/, "").toLowerCase().trim();
  for (const rule of rules) {
    s = s.replace(new RegExp(rule.pattern, rule.flags ?? "g"), rule.replace ?? "");
  }
  return s.replace(/[\s._-]+/g, " ").trim();
}

function tally(records, key) {
  const m = new Map();
  for (const r of records) {
    const v = r[key];
    if (v === undefined || v === null || v === "") continue;
    if (!m.has(v)) m.set(v, []);
    m.get(v).push(r);
  }
  return m;
}

/**
 * Answer the four questions for every record.
 * Every verdict carries a basis. A verdict that cannot reach `confirmed` or
 * `derived` is returned at the degraded wording the criteria file specifies —
 * never at the confident one.
 */
export function administer(manifest, override) {
  const records = manifest.records ?? [];
  const rules = override ?? stemRules();
  const hashed = records.filter((r) => r.content_hash);
  const haveHashes = hashed.length === records.length && records.length > 0;

  const byHash = tally(records, "content_hash");
  // Two files with one stem in two folders are versions of each other only if
  // the folders mean nothing. In a media dump they usually mean nothing; in a
  // built tree they mean everything. So the scope is declared, never assumed.
  const scope = rules.scope ?? "directory";
  const stems = new Map();
  for (const r of records) {
    const base = normaliseStem(r.name, rules.rules);
    const dir = r.path.includes("/") ? r.path.slice(0, r.path.lastIndexOf("/")) : "";
    const s = scope === "flat" ? `${base}.${r.ext}` : `${dir}\u0000${base}.${r.ext}`;
    if (!stems.has(s)) stems.set(s, []);
    stems.get(s).push(r);
  }

  const criterion = (k) => CRITERIA.questions.find((q) => q.key === k);
  const hasReferenceIndex = Boolean(manifest.reference_index);
  const referenced = new Set(
    (manifest.reference_index?.refers_to ?? []).map((p) => String(p)),
  );

  const verdicts = records.map((r) => {
    const base = normaliseStem(r.name, rules.rules);
    const dir = r.path.includes("/") ? r.path.slice(0, r.path.lastIndexOf("/")) : "";
    const stem = scope === "flat" ? `${base}.${r.ext}` : `${dir}\u0000${base}.${r.ext}`;
    const sameHash = r.content_hash ? (byHash.get(r.content_hash) ?? []) : [];
    const sameStem = stems.get(stem) ?? [];

    // duplicate
    let duplicate;
    if (r.content_hash) {
      duplicate = sameHash.length > 1
        ? { says: "duplicate", basis: "confirmed", with: sameHash.filter((x) => x !== r).map((x) => x.path) }
        : { says: "not-duplicate", basis: "confirmed", with: [] };
    } else {
      const near = records.filter((x) => x !== r && x.bytes === r.bytes && x.ext === r.ext);
      duplicate = {
        says: near.length ? "candidate" : "not-duplicate",
        basis: near.length ? "derived" : "derived",
        with: near.map((x) => x.path),
        withheld: criterion("duplicate").degraded.must_not_say,
        because: "no content hash in the manifest",
      };
    }

    // iterative
    const others = sameStem.filter((x) => x !== r && x.content_hash !== r.content_hash);
    let iterative;
    if (!rules.confirmed) {
      iterative = {
        says: others.length ? "candidate" : "unknown",
        basis: "none",
        with: others.map((x) => x.path),
        withheld: criterion("iterative").degraded.must_not_say,
        because: criterion("iterative").degraded.reason,
      };
    } else {
      const series = [...sameStem].sort((a, b) => String(a.mtime).localeCompare(String(b.mtime)));
      iterative = others.length
        ? {
            says: "iterative",
            basis: "derived",
            with: others.map((x) => x.path),
            head: series[series.length - 1].path === r.path,
            position: series.findIndex((x) => x.path === r.path) + 1,
            of: series.length,
          }
        : { says: "not-iterative", basis: "derived", with: [] };
    }

    // novel
    const uniqueContent = r.content_hash ? sameHash.length === 1 : null;
    let novel;
    if (!rules.confirmed) {
      novel = uniqueContent === null
        ? { says: "unknown", basis: "none", because: "no content hash and no confirmed stem rules" }
        : {
            says: uniqueContent ? "unique-content" : "not-unique",
            basis: "confirmed",
            withheld: criterion("novel").degraded.must_not_say,
            because: criterion("novel").degraded.reason,
          };
    } else {
      novel = {
        says: uniqueContent && sameStem.length === 1 ? "novel" : "not-novel",
        basis: "derived",
      };
    }

    // functional
    const functional = hasReferenceIndex
      ? {
          says: referenced.has(r.path) ? "functional" : "unreferenced",
          basis: "confirmed",
          note: referenced.has(r.path) ? null : "unreferenced in the supplied index, which is not the same as unused",
        }
      : {
          says: "unknown",
          basis: "none",
          withheld: [criterion("functional").degraded.must_not_say, criterion("functional").degraded.must_not_say_either],
          because: criterion("functional").degraded.reason,
        };

    return { path: r.path, name: r.name, bytes: r.bytes, store: r.store, stem: stem.replace("\u0000", "/"), duplicate, iterative, novel, functional };
  });

  const count = (k, v) => verdicts.filter((x) => x[k].says === v).length;

  return {
    scanned_at: manifest.scanned_at ?? null,
    root: manifest.root ?? null,
    records: records.length,
    inputs: {
      content_hash: haveHashes ? "present on every record" : `present on ${hashed.length} of ${records.length}`,
      stem_rules: rules.confirmed ? `confirmed, ${scope} scope — ${rules.source}` : "not confirmed — see mfile/questions/intake.json Q2",
      reference_index: hasReferenceIndex ? `present — ${referenced.size} paths` : "absent — see mfile/questions/intake.json Q3",
    },
    answered: {
      duplicate: { duplicate: count("duplicate", "duplicate"), candidate: count("duplicate", "candidate"), clear: count("duplicate", "not-duplicate") },
      iterative: { iterative: count("iterative", "iterative"), candidate: count("iterative", "candidate"), unknown: count("iterative", "unknown") },
      novel: { novel: count("novel", "novel"), unique_content: count("novel", "unique-content"), unknown: count("novel", "unknown") },
      functional: { functional: count("functional", "functional"), unreferenced: count("functional", "unreferenced"), unknown: count("functional", "unknown") },
    },
    withheld: CRITERIA.questions
      .filter((q) => {
        if (q.key === "duplicate") return !haveHashes;
        if (q.key === "iterative" || q.key === "novel") return !rules.confirmed;
        if (q.key === "functional") return !hasReferenceIndex;
        return false;
      })
      .map((q) => ({ question: q.key, needs: q.requires, ask: `mfile/questions/intake.json` })),
    verdicts,
  };
}

function render(report) {
  const L = [];
  L.push("");
  L.push(`M FILE ADMINISTRATOR — ${report.records} records${report.root ? ` under ${report.root}` : ""}`);
  L.push("");
  L.push("  inputs");
  for (const [k, v] of Object.entries(report.inputs)) L.push(`    ${k.padEnd(16)} ${v}`);
  L.push("");
  L.push("  answered");
  for (const [q, counts] of Object.entries(report.answered)) {
    const parts = Object.entries(counts).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`);
    L.push(`    ${q.padEnd(16)} ${parts.join(", ")}`);
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
  const text = [];
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (skip.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
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
  const report = administer(manifest, args.includes("--self") ? SELF_RULES : undefined);
  process.stdout.write(args.includes("--json") ? JSON.stringify(report, null, 2) + "\n" : render(report));
}
