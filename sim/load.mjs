// Node-side corpus loader. The browser has its own (fetch-based) loader in
// public/simulator/app.js; the engine itself is environment-agnostic and takes
// an already-assembled corpus object.

import { readFile } from 'node:fs/promises';
import { dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const CORPUS_DIR = resolve(here, '..', 'public', 'simulator', 'corpus');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function at(dir, file) {
  return isAbsolute(file) ? file : resolve(dir, file);
}

/**
 * Assemble a corpus.
 * @param {object} opts
 * @param {string} [opts.dir]         corpus directory
 * @param {string} [opts.caseFile]    case file (claim + facts)
 * @param {string} [opts.institution] institution profile file
 */
export async function loadCorpus({ dir = CORPUS_DIR, caseFile = 'case.template.json', institution = 'institution.template.json' } = {}) {
  const [lexicon, provisions, precedents, conditions, passages, claim, inst] = await Promise.all([
    readJson(resolve(dir, 'lexicon.json')),
    readJson(resolve(dir, 'provisions.json')),
    readJson(resolve(dir, 'precedents.json')),
    readJson(resolve(dir, 'conditions.json')),
    readJson(resolve(dir, 'passages.json')),
    readJson(at(dir, caseFile)),
    readJson(at(dir, institution)),
  ]);
  return { lexicon, provisions, precedents, conditions, passages, claim, institution: inst };
}
