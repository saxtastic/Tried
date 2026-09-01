import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { inspect, judge, symbolsIn, mappingEvidence, captureHonesty, CONTRACT_PATH } from '../scripts/bsa-reconcile.mjs';

const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));

/* Fixtures, not the app. The five symbol names beyond Adinkrahene, Akoma Ntoso
 * and Boa Me are arbitrary picks from the vocabulary, chosen only to exercise
 * the counter. They are NOT a claim about which eight symbols the real builds
 * carry -- this session has not read those files. See "not_established_here"
 * in bsa/reconciliation.json. */
const FILLER = ['Sankofa', 'Dwennimmen', 'Nkyinkyim', 'Gye Nyame', 'Duafe'];

const translatorLike = `
  <h1>BSA Translator</h1>
  <h2>Live Audio Capture — Real-Time Transcription</h2>
  <p>Press start and the app listens.</p>
  <script>
    const PITCH_MAP = { 'C': 'Adinkrahene', 'C#': 'Sankofa', 'D': 'Dwennimmen',
                        'D#': 'Nkyinkyim', 'E': 'Gye Nyame', 'F': 'Duafe' };
    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    function sample(t) { return Math.sin(2 * Math.PI * 440 * t); }
  </script>
  <section>Song Examples</section><section>PreK-21 ladder</section>`;

const canonicalLike = `
  <h1>BSA Research Instrument</h1>
  <h2>Simulated Capture</h2>
  <p>The trace below is synthetic demonstration data, not field data yet.</p>
  <script>
    // keyed on the interval from the tonic, never on absolute pitch
    const INTERVAL_MAP = {
      'P1': 'Adinkrahene', 'M2': 'Akoma Ntoso', 'm3': 'Boa Me',
      ${FILLER.map((n, i) => `'${['M3', 'P4', 'P5', 'M6', 'M7'][i]}': '${n}'`).join(', ')}
    };
    function symbolFor(semitone, tonic) { return INTERVAL_MAP[intervalName(semitone - tonic)]; }
    function trace(t) { return Math.sin(t); }
  </script>
  <section>Pulse Map</section><section>Archive</section>
  <section>Song Examples</section><section>PreK-21 ladder</section>`;

test('a pitch-class build is read as pitch-class, an interval build as interval', () => {
  assert.equal(mappingEvidence(translatorLike).basis, 'pitch-class');
  assert.equal(mappingEvidence(canonicalLike).basis, 'interval');
});

test('the symbol count is not inflated by names contained in longer names', () => {
  assert.equal(symbolsIn(translatorLike).length, 6);
  assert.equal(symbolsIn(canonicalLike).length, 8);
  assert.ok(symbolsIn(canonicalLike).includes('Akoma Ntoso'));
  assert.ok(!symbolsIn(canonicalLike).includes('Akoma'), '"Akoma" inside "Akoma Ntoso" must not count twice');
});

test('a live-capture claim with no audio input path is a fault', () => {
  const c = captureHonesty(translatorLike);
  assert.ok(c.claims.length > 0);
  assert.equal(c.realInput, false);
  assert.ok(c.faults.some((f) => /no audio input path/.test(f)));
});

test('a synthesised signal that says so is not a fault', () => {
  const c = captureHonesty(canonicalLike);
  assert.deepEqual(c.claims, []);
  assert.equal(c.synthetic, true);
  assert.equal(c.disclosed, true);
  assert.deepEqual(c.faults, []);
});

test('a real input path clears the claim', () => {
  const live = `<h2>Live Audio Capture</h2><script>navigator.mediaDevices.getUserMedia({audio:true})</script>`;
  assert.deepEqual(captureHonesty(live).faults, []);
});

test('the definition of done rejects the Translator and accepts the reconciled shape', () => {
  const bad = judge(inspect(translatorLike), contract);
  assert.ok(bad.some((f) => f.startsWith('DOD-2')), 'pitch-class map must be caught');
  assert.ok(bad.some((f) => f.startsWith('DOD-3')), 'six symbols must be caught');
  assert.ok(bad.some((f) => f.startsWith('DOD-5')), 'unbacked live claim must be caught');
  assert.ok(bad.some((f) => /DOD-7/.test(f)), 'a missing Pulse Map must be caught');

  assert.deepEqual(judge(inspect(canonicalLike), contract), []);
});

test('the contract states what it does not know rather than filling it in', () => {
  const inventory = contract.divergences.find((d) => d.id === 'symbol-inventory');
  assert.equal(inventory.expected_count, 8);
  assert.deepEqual(inventory.must_include, ['Adinkrahene', 'Akoma Ntoso', 'Boa Me']);
  assert.ok(contract.not_established_here.length >= 3);
});
