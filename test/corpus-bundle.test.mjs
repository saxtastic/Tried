import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { renderBundle, BUNDLE_PATH } from '../scripts/build-corpus.mjs';
import { loadCorpus } from '../sim/load.mjs';

test('the generated corpus bundle is in step with the JSON it is built from', async () => {
  const onDisk = await readFile(BUNDLE_PATH, 'utf8');
  const fresh = await renderBundle();
  assert.equal(
    onDisk,
    fresh,
    'public/simulator/corpus.bundle.js is stale — run `npm run build:corpus` after editing corpus/*.json',
  );
});

test('the bundle carries exactly what the Node loader reads', async () => {
  const fromJson = await loadCorpus();
  const fromBundle = await import(BUNDLE_PATH);
  for (const key of ['lexicon', 'provisions', 'precedents', 'conditions', 'claim', 'institution']) {
    assert.deepEqual(fromBundle[key], fromJson[key === 'claim' ? 'claim' : key], `${key} differs between bundle and JSON`);
  }
  assert.deepEqual(fromBundle.corpus.conditions, fromJson.conditions);
});

test('the browser app does not reach for the network', async () => {
  const app = await readFile(new URL('../public/simulator/app.js', import.meta.url), 'utf8');
  assert.ok(!/\bfetch\s*\(/.test(app), 'app.js must not fetch — the venue CSP is default-src none with no connect-src');
  assert.ok(!/XMLHttpRequest/.test(app), 'app.js must not use XHR for the same reason');
});

test('the browser app sets no inline style attributes', async () => {
  const app = await readFile(new URL('../public/simulator/app.js', import.meta.url), 'utf8');
  assert.ok(
    !/setAttribute\(\s*['"]style['"]/.test(app),
    'inline style attributes are refused under style-src self; assign through CSSOM instead',
  );
});
