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

export async function renderBundle() {
  const entries = await Promise.all(
    PARTS.map(async ([key, file]) => [key, JSON.parse(await readFile(resolve(CORPUS_DIR, file), 'utf8'))]),
  );
  const body = entries
    .map(([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)};`)
    .join('\n\n');
  return `// GENERATED FILE — do not edit.
// Source: public/simulator/corpus/*.json
// Regenerate with: npm run build:corpus
//
// The page imports this instead of fetching, because the venue's
// Content-Security-Policy blocks fetch (default-src 'none', no connect-src).

${body}

export const corpus = { lexicon, provisions, precedents, conditions, passages, doors, claim, institution };
export default corpus;
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await renderBundle();
  await writeFile(BUNDLE_PATH, out, 'utf8');
  console.log(`wrote ${BUNDLE_PATH} (${out.length} bytes)`);
}
