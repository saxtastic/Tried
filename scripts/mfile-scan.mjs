#!/usr/bin/env node
// Build a manifest from a directory that is already on this machine.
//
// This is the half that runs where the files are — a Mac with iCloud Drive
// mounted, an external disk, a synced Box folder. It reads. It writes one JSON
// file. It never renames, moves or deletes, and it makes no network request, so
// it is safe to point at anything.
//
//   node scripts/mfile-scan.mjs <dir> --store icloud > manifest.json
//   node scripts/mfile-scan.mjs <dir> --store icloud --no-hash   # faster, degrades duplicate to candidate
//
// Then: node scripts/mfile.mjs manifest.json

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const store = args[args.indexOf("--store") + 1] ?? "unknown";
const account = args.includes("--account") ? args[args.indexOf("--account") + 1] : undefined;
const hash = !args.includes("--no-hash");
const MAX_HASH = 512 * 1024 * 1024;

if (!dir) {
  process.stderr.write("usage: node scripts/mfile-scan.mjs <dir> --store <key> [--account <key>] [--no-hash]\n");
  process.exit(2);
}

const SKIP = new Set([".git", "node_modules", ".DS_Store", ".Trash", ".Spotlight-V100", ".fseventsd"]);
const records = [];
let skipped = 0;

function walk(abs, rel) {
  let entries;
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    skipped++;
    return;
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP.has(e.name)) continue;
    const a = path.join(abs, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) walk(a, r);
    else if (e.isFile()) {
      let st;
      try {
        st = fs.statSync(a);
      } catch {
        skipped++;
        continue;
      }
      // An iCloud placeholder is a name with no bytes behind it yet. Hashing it
      // would trigger a download, so it is recorded as present-but-unhashed
      // rather than silently pulled from the network.
      const placeholder = e.name.startsWith(".") && e.name.endsWith(".icloud");
      const rec = {
        path: r,
        name: placeholder ? e.name.replace(/^\./, "").replace(/\.icloud$/, "") : e.name,
        ext: path.extname(placeholder ? e.name.replace(/\.icloud$/, "") : e.name).slice(1).toLowerCase(),
        bytes: st.size,
        mtime: st.mtime.toISOString(),
        store,
      };
      if (account) rec.account = account;
      if (placeholder) rec.not_downloaded = true;
      else if (hash && st.size <= MAX_HASH) {
        try {
          rec.content_hash = crypto.createHash("sha256").update(fs.readFileSync(a)).digest("hex");
        } catch {
          skipped++;
        }
      }
      records.push(rec);
    }
  }
}

walk(path.resolve(dir), "");

process.stdout.write(
  JSON.stringify(
    {
      scanned_at: new Date().toISOString(),
      root: path.resolve(dir),
      store,
      hashed: hash,
      unreadable: skipped,
      records,
    },
    null,
    2,
  ) + "\n",
);
process.stderr.write(`${records.length} records, ${skipped} unreadable, hashing ${hash ? "on" : "off"}\n`);
