#!/usr/bin/env node
// Pulls the public-domain and open-access texts listed in data/archives.json
// into record-book/corpus/, which is gitignored. Nothing large belongs in the
// repository; the manifest is the artefact, the corpus is a working copy.
//
//   node record-book/scripts/fetch-archives.mjs            # all fetchable
//   node record-book/scripts/fetch-archives.mjs SRC-WELLS-RED-RECORD
//   node record-book/scripts/fetch-archives.mjs --list
//   node record-book/scripts/fetch-archives.mjs --check    # resolve locators only

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS = join(HERE, '..', 'corpus');
const archives = JSON.parse(
  readFileSync(join(HERE, '..', 'data', 'archives.json'), 'utf8')).archives;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const wanted = args.filter((a) => !a.startsWith('--'));

const fetchable = archives.filter((a) => a.fetchable);
const targets = wanted.length
  ? archives.filter((a) => wanted.includes(a.id))
  : fetchable;

if (flags.has('--list')) {
  for (const a of archives) {
    const mark = a.fetchable ? '+' : ' ';
    console.log(`${mark} ${a.id.padEnd(30)} ${a.rights.padEnd(14)} ${a.title}`);
  }
  console.log(`\n${fetchable.length} of ${archives.length} are fetchable (+).`);
  process.exit(0);
}

if (!targets.length) {
  console.error('Nothing to fetch. Try --list.');
  process.exit(1);
}

const check = flags.has('--check');
mkdirSync(CORPUS, { recursive: true });

let ok = 0, failed = 0, skipped = 0;

for (const a of targets) {
  if (!a.url) {
    console.log(`  skip   ${a.id} — no locator (held at ${a.holder})`);
    skipped++;
    continue;
  }
  if (!a.fetchable) {
    // Refusing to pull in-copyright material is deliberate, not an oversight.
    console.log(`  skip   ${a.id} — rights are "${a.rights}"; consult ${a.holder} directly`);
    skipped++;
    continue;
  }

  const dest = join(CORPUS, `${a.id}.html`);
  if (!check && existsSync(dest)) {
    console.log(`  have   ${a.id}`);
    ok++;
    continue;
  }

  try {
    const res = await fetch(a.url, {
      method: check ? 'HEAD' : 'GET',
      redirect: 'follow',
      headers: { 'user-agent': 'record-book/0.1 (archival research; contact via repository)' },
    });
    if (!res.ok) {
      console.log(`  FAIL   ${a.id} — HTTP ${res.status} ${a.url}`);
      failed++;
      continue;
    }
    if (check) {
      console.log(`  ok     ${a.id} — ${res.status} ${a.url}`);
      ok++;
      continue;
    }
    const body = await res.text();
    writeFileSync(dest, body);
    console.log(`  got    ${a.id} — ${(body.length / 1024).toFixed(0)} KiB`);
    ok++;
  } catch (e) {
    console.log(`  FAIL   ${a.id} — ${e.message}`);
    failed++;
  }
}

console.log(`\n${ok} ok, ${failed} failed, ${skipped} skipped.`);
if (check && failed === 0 && ok > 0) {
  console.log('All checked locators resolved. Set "verified": true for those ids in data/archives.json.');
}
process.exit(failed ? 1 : 0);
