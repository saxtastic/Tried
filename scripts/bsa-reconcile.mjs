/* Reconciliation check for the BSA notation app.
 *
 * Four builds disagree with each other. bsa/reconciliation.json declares which
 * side of each disagreement wins and why. This script reads a directory of
 * builds, extracts what each one actually does -- how it keys symbols, how many
 * it carries, whether its capture claim is backed by an audio input path -- and
 * reports every divergence against the contract.
 *
 *   npm run bsa:reconcile -- --dir path/to/builds
 *   npm run bsa:reconcile -- --dir path/to/builds --canonical BSA_App_v2.html
 *
 * It reads the files; it does not assert from memory. With no files present it
 * says so and exits 2, because a check with nothing to check is not a pass.
 *
 * Exit: 0 contract held, 1 a divergence stands unresolved, 2 nothing to read.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTRACT_PATH = path.join(ROOT, "bsa", "reconciliation.json");

/* The Adinkra names the builds may draw from. Detection is by name, so this
 * list bounds what can be found; a symbol named outside it is reported as
 * unrecognised rather than silently dropped. */
export const ADINKRA_VOCABULARY = [
  "Adinkrahene", "Akoma Ntoso", "Akoma", "Boa Me", "Dwennimmen", "Sankofa",
  "Gye Nyame", "Nyame Dua", "Nyame Biribi Wo Soro", "Nkyinkyim", "Funtunfunefu",
  "Denkyemfunefu", "Aya", "Duafe", "Eban", "Hye Wonhye", "Mate Masie",
  "Nea Onnim", "Odo Nnyew Fie Kwan", "Osram Ne Nsoromma", "Woforo Dua Pa A",
  "Epa", "Fihankra", "Kwatakye Atiko", "Mmere Dane", "Nkonsonkonson",
  "Nsaa", "Nsoromma", "Ohene Aniwa", "Owo Foro Adobe", "Pempamsie",
  "Sesa Woruban", "Tamfo Bebre", "Wawa Aba",
];

const NOTE_LITERAL = /["'`]([A-G](?:#|b|♯|♭)?)(?:-?\d)?["'`]/g;
const INTERVAL_LITERAL =
  /["'`](?:[PMmdA](?:1|2|3|4|5|6|7|8)|unison|octave|tritone|(?:minor|major|perfect|diminished|augmented)\s+\w+)["'`]/gi;
const INTERVAL_KEYWORD = /\b(?:interval|semitone|scaleDegree|degreeFromTonic|tonic|intervalTo|fromTonic)\b/gi;
const PITCHCLASS_KEYWORD = /\b(?:pitchClass|pitch_class|noteName|NOTE_NAMES|noteTo|absolutePitch)\b/gi;

const LIVE_CLAIM = [
  /live\s+audio\s+capture/i,
  /real[-\s]?time\s+transcription/i,
  /the\s+app\s+listens/i,
  /\bnow\s+listening\b/i,
  /start\s+capture(?!\s+simulation)/i,
];
const REAL_INPUT = /\b(?:getUserMedia|MediaRecorder|createMediaStreamSource|AudioWorkletNode|ScriptProcessorNode)\b/;
const SYNTHETIC = /\bMath\.(?:sin|cos|random)\b/;
const DISCLOSURE = /\b(?:simulat\w*|synthes\w*|synthetic|demo(?:nstration)?\s+(?:data|mode)|not\s+field\s+data|placeholder|mock)\b/i;

const FEATURES = {
  "Pulse Map": /pulse\s*map/i,
  Archive: /\barchive\b/i,
  "Song Examples": /song\s*examples?/i,
  "PreK-21 ladder": /pre-?k\s*[-–—to]*\s*21|prek21|pre-?k\s+through\s+21/i,
};

const countOf = (re, text) => (text.match(new RegExp(re.source, re.flags.replace("g", "") + "g")) || []).length;

/* Which side of a symbol occurrence the musical evidence sits on. A symbol
 * name is looked at inside a window of surrounding source; quoted note names
 * on one side, interval tokens on the other. Quoted literals only -- a bare
 * letter A through G is ordinary English and proves nothing. */
export function mappingEvidence(text, { window = 160 } = {}) {
  let pitch = 0;
  let interval = 0;
  const near = [];
  for (const name of ADINKRA_VOCABULARY) {
    const re = new RegExp(name.replace(/\s+/g, "\\s+"), "gi");
    for (const m of text.matchAll(re)) {
      const slice = text.slice(Math.max(0, m.index - window), m.index + name.length + window);
      const p = countOf(NOTE_LITERAL, slice);
      const i = countOf(INTERVAL_LITERAL, slice) + countOf(/\b(?:interval|semitone|fromTonic|scaleDegree)\b/gi, slice);
      pitch += p;
      interval += i;
      if (p || i) near.push({ symbol: name, pitch: p, interval: i });
    }
  }
  const keywords = {
    pitchClass: countOf(PITCHCLASS_KEYWORD, text),
    interval: countOf(INTERVAL_KEYWORD, text),
  };
  const pitchScore = pitch + keywords.pitchClass;
  const intervalScore = interval + keywords.interval;
  let basis = "indeterminate";
  if (intervalScore > pitchScore * 1.5) basis = "interval";
  else if (pitchScore > intervalScore * 1.5) basis = "pitch-class";
  else if (pitchScore || intervalScore) basis = "mixed";
  return { basis, pitchScore, intervalScore, keywords, near };
}

export function symbolsIn(text) {
  const found = ADINKRA_VOCABULARY.filter((name) =>
    new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i").test(text),
  );
  // "Akoma Ntoso" contains "Akoma"; the longer name wins so the count is honest.
  return found.filter((n) => !found.some((other) => other !== n && other.length > n.length && other.includes(n)));
}

export function captureHonesty(text) {
  const claims = LIVE_CLAIM.filter((re) => re.test(text)).map((re) => (text.match(re) || [""])[0].trim());
  const realInput = REAL_INPUT.test(text);
  const synthetic = SYNTHETIC.test(text);
  const disclosed = DISCLOSURE.test(text);
  const faults = [];
  if (claims.length && !realInput) {
    faults.push(`claims live capture (${claims.join("; ")}) with no audio input path`);
  }
  if (synthetic && !realInput && !disclosed) {
    faults.push("synthesises its signal without saying so anywhere in the file");
  }
  return { claims, realInput, synthetic, disclosed, faults };
}

export function featuresIn(text) {
  return Object.fromEntries(Object.entries(FEATURES).map(([k, re]) => [k, re.test(text)]));
}

export function inspect(text) {
  return {
    symbols: symbolsIn(text),
    mapping: mappingEvidence(text),
    capture: captureHonesty(text),
    features: featuresIn(text),
  };
}

/* The automated rows of the definition of done, run against one file. */
export function judge(report, contract) {
  const inventory = contract.divergences.find((d) => d.id === "symbol-inventory");
  const failures = [];

  if (report.mapping.basis !== "interval") {
    failures.push(`DOD-2 symbols are keyed on ${report.mapping.basis}, not interval (pitch ${report.mapping.pitchScore} vs interval ${report.mapping.intervalScore})`);
  }
  if (report.symbols.length !== inventory.expected_count) {
    failures.push(`DOD-3 carries ${report.symbols.length} symbols, expected ${inventory.expected_count}: ${report.symbols.join(", ") || "none"}`);
  }
  for (const required of inventory.must_include) {
    if (!report.symbols.includes(required)) failures.push(`DOD-3 missing required symbol ${required}`);
  }
  for (const fault of report.capture.faults) failures.push(`DOD-5 ${fault}`);
  for (const feature of ["Song Examples", "PreK-21 ladder"]) {
    if (!report.features[feature]) failures.push(`DOD-6 ${feature} did not survive the merge`);
  }
  for (const feature of ["Pulse Map", "Archive"]) {
    if (!report.features[feature]) failures.push(`DOD-7 ${feature} did not survive the merge`);
  }
  return failures;
}

function main(argv) {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const dirArg = argv.indexOf("--dir");
  const canonArg = argv.indexOf("--canonical");
  const dir = dirArg > -1 ? argv[dirArg + 1] : path.join(ROOT, "bsa", "builds");
  const canonical = canonArg > -1 ? argv[canonArg + 1] : contract.canonical_base.file;

  if (!fs.existsSync(dir)) {
    console.error(`No builds directory at ${dir}.`);
    console.error("Put the BSA .html builds there and run again. Nothing was checked.");
    return 2;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
  if (files.length === 0) {
    console.error(`${dir} holds no .html builds. Nothing was checked.`);
    return 2;
  }

  console.log(`Contract: ${path.relative(ROOT, CONTRACT_PATH)}`);
  console.log(`Canonical base declared: ${canonical}\n`);

  const reports = new Map();
  for (const file of files) {
    const report = inspect(fs.readFileSync(path.join(dir, file), "utf8"));
    reports.set(file, report);
    const held = Object.entries(report.features).filter(([, v]) => v).map(([k]) => k);
    console.log(`${file}`);
    console.log(`  symbols  ${report.symbols.length}: ${report.symbols.join(", ") || "none recognised"}`);
    console.log(`  keyed on ${report.mapping.basis} (pitch ${report.mapping.pitchScore}, interval ${report.mapping.intervalScore})`);
    console.log(`  capture  ${report.capture.realInput ? "real input path" : "no input path"}${report.capture.synthetic ? ", synthesised signal" : ""}${report.capture.claims.length ? `, claims: ${report.capture.claims.join("; ")}` : ""}`);
    for (const fault of report.capture.faults) console.log(`           FAULT ${fault}`);
    console.log(`  holds    ${held.join(", ") || "none of the tracked views"}\n`);
  }

  if (!reports.has(canonical)) {
    console.error(`The canonical file ${canonical} is not in ${dir}. Divergences above are reported; the definition of done was not run.`);
    return 2;
  }

  const failures = judge(reports.get(canonical), contract);
  if (failures.length === 0) {
    console.log(`${canonical} holds the contract. Automated rows of the definition of done pass.`);
    console.log("Still yours to confirm by hand: DOD-1, DOD-4, DOD-9, DOD-10.");
    return 0;
  }
  console.log(`${canonical} does not yet hold the contract:`);
  for (const f of failures) console.log(`  - ${f}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
