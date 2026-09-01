#!/usr/bin/env node
// Bundle the corpus JSON into an ES module.
//
// The browser page cannot fetch its corpus: the venue ships a closed
// Content-Security-Policy (default-src 'none' with no connect-src), so XHR and
// fetch are refused outright. Rather than widen the policy for one subtree, the
// corpus is compiled into a module the page imports — script-src 'self' already
// allows that, and it costs six fewer round trips.
//
// The JSON files stay the source of truth and the editable surface. This script
// regenerates the bundle; `npm test` asserts the two have not drifted.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const CORPUS_DIR = resolve(here, '..', 'public', 'simulator', 'corpus');
export const BUNDLE_PATH = resolve(here, '..', 'public', 'simulator', 'corpus.bundle.js');

const PARTS = [
  ['lexicon', 'lexicon.json'],
  ['provisions', 'provisions.json'],
  ['precedents', 'precedents.json'],
  ['conditions', 'conditions.json'],
  ['passages', 'passages.json'],
  ['doors', 'doors.json'],
  ['claim', 'case.template.json'],
  ['institution', 'institution.template.json'],
];

export const RADAR_DIR = resolve(here, '..', 'public', 'radar', 'corpus');
export const RADAR_BUNDLE_PATH = resolve(here, '..', 'public', 'radar', 'corpus.bundle.js');

export const FELLOWSHIPS_REGISTRY = resolve(here, '..', 'public', 'fellowships', 'registry.json');

// The radar reconciles the workbook rows against the fellowships project's
// reference, so the reference is bundled with it. That file belongs to
// fellowships and is READ here, never written — and because it is a copy, the
// `complete` protocol's T1 retest compares the committed bundle against a fresh
// build, so a registry change upstream shows up as a stale bundle rather than
// as a page quietly serving last week's deadlines.
const RADAR_PARTS = [
  ['openCalls', 'open-calls.json'],
  ['locations', 'locations.json'],
  ['roles', 'roles.json'],
  ['registry', FELLOWSHIPS_REGISTRY, (r) => ({ workflow: r.workflow, calls: r.calls })],
];

async function render({ dir, parts, source, named }) {
  const entries = await Promise.all(
    parts.map(async ([key, file, pick]) => {
      const data = JSON.parse(await readFile(resolve(dir, file), 'utf8'));
      return [key, pick ? pick(data) : data];
    }),
  );
  const body = entries
    .map(([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)};`)
    .join('\n\n');
  return `// GENERATED FILE — do not edit.
// Source: ${source}
// Regenerate with: npm run build:corpus
//
// The page imports this instead of fetching, because the venue's
// Content-Security-Policy blocks fetch (default-src 'none', no connect-src).

${body}

export const ${named} = { ${entries.map(([k]) => k).join(', ')} };
export default ${named};
`;
}

export async function renderBundle() {
  return render({
    dir: CORPUS_DIR,
    parts: PARTS,
    source: 'public/simulator/corpus/*.json',
    named: 'corpus',
  });
}

export async function renderRadarBundle() {
  return render({
    dir: RADAR_DIR,
    parts: RADAR_PARTS,
    source: 'public/radar/corpus/*.json and public/fellowships/registry.json (read, never written)',
    named: 'radar',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [path, make] of [[BUNDLE_PATH, renderBundle], [RADAR_BUNDLE_PATH, renderRadarBundle]]) {
    const out = await make();
    await writeFile(path, out, 'utf8');
    console.log(`wrote ${path} (${out.length} bytes)`);
  }
}
