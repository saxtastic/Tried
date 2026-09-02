#!/usr/bin/env node
// What the M file administrator must never do.
//
// Most of these are refusals. An administrator that reports confidently on a
// store it has not measured is worse than no administrator, because its output
// gets acted on and files get moved.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { administer, kindOf, normaliseStem } from "../src/administer.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

let failed = 0;
function ok(label, cond, detail) {
  if (cond) console.log(`PASS  ${label}`);
  else {
    failed++;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const criteria = read("mfile/criteria.json");
const media = read("mfile/media.json");
const stores = read("mfile/stores.json");
const intake = read("mfile/questions/intake.json");

const rec = (i, over = {}) => ({
  path: `f${i}.jpg`,
  name: `f${i}.jpg`,
  ext: "jpg",
  bytes: 100 + i,
  mtime: `2026-0${i}-01T00:00:00Z`,
  store: "icloud",
  ...over,
});

// --- the criteria file itself -----------------------------------------------

ok(
  "all four questions are declared",
  ["duplicate", "iterative", "novel", "functional"].every((k) =>
    criteria.questions.some((q) => q.key === k),
  ),
);

ok(
  "every question names the inputs it requires",
  criteria.questions.every((q) => Array.isArray(q.requires) && q.requires.length > 0),
);

ok(
  "every question declares what it must not say when degraded",
  criteria.questions.every((q) => q.degraded && q.degraded.must_not_say),
);

ok(
  "no question claims 'confirmed' from an input it does not require",
  criteria.questions.every(
    (q) => q.basis_when_satisfied !== "confirmed" || q.requires.length > 0,
  ),
);

// --- the refusals ------------------------------------------------------------

const bare = { records: [rec(1), rec(2)] };
const bareReport = administer(bare);

ok(
  "with no reference index, functional is never asserted",
  bareReport.verdicts.every((v) => v.functional.says === "unknown"),
);

// The word appears in the verdict, but only in the `withheld` list — as the
// thing being refused. It must never appear as a verdict.
ok(
  "with no reference index, no file is ever called unused",
  bareReport.verdicts.every((v) =>
    ["duplicate", "iterative", "novel", "functional"].every((k) => v[k].says !== "unused"),
  ),
);
ok(
  "and 'unused' is named explicitly as a thing withheld",
  bareReport.verdicts.every((v) => (v.functional.withheld ?? []).includes("unused")),
);

ok(
  "with no confirmed stem rules, iterative is never asserted",
  bareReport.verdicts.every((v) => v.iterative.says !== "iterative"),
);

ok(
  "with no confirmed stem rules, novel is never asserted",
  bareReport.verdicts.every((v) => v.novel.says !== "novel"),
);

ok(
  "with no content hash, duplicate is never asserted",
  bareReport.verdicts.every((v) => v.duplicate.says !== "duplicate"),
);

ok(
  "every withheld question names the input that would unblock it",
  bareReport.withheld.every((w) => w.needs.length > 0),
);

ok(
  "every verdict on every question carries a basis",
  bareReport.verdicts.every((v) =>
    ["duplicate", "iterative", "novel", "functional"].every((k) => typeof v[k].basis === "string"),
  ),
);

ok(
  "no verdict claims a basis outside the repository vocabulary",
  bareReport.verdicts.every((v) =>
    ["duplicate", "iterative", "novel", "functional"].every((k) =>
      ["confirmed", "sourced", "derived", "none"].includes(v[k].basis),
    ),
  ),
);

// --- what it does assert, when it can ---------------------------------------

const hashed = {
  records: [
    rec(1, { content_hash: "aaa" }),
    rec(2, { content_hash: "aaa" }),
    rec(3, { content_hash: "bbb" }),
  ],
};
const hashedReport = administer(hashed);
ok(
  "equal hashes are called duplicate, and confirmed",
  hashedReport.verdicts[0].duplicate.says === "duplicate" &&
    hashedReport.verdicts[0].duplicate.basis === "confirmed",
);
ok(
  "a lone hash is not called duplicate",
  hashedReport.verdicts[2].duplicate.says === "not-duplicate",
);

const rules = { confirmed: true, source: "test", scope: "directory", rules: [{ pattern: " v\\d+$", flags: "", replace: "" }] };
const series = {
  records: [
    { path: "a/work v1.wav", name: "work v1.wav", ext: "wav", bytes: 1, mtime: "2026-01-01T00:00:00Z", store: "s", content_hash: "1" },
    { path: "a/work v2.wav", name: "work v2.wav", ext: "wav", bytes: 2, mtime: "2026-02-01T00:00:00Z", store: "s", content_hash: "2" },
    { path: "b/work v1.wav", name: "work v1.wav", ext: "wav", bytes: 3, mtime: "2026-03-01T00:00:00Z", store: "s", content_hash: "3" },
  ],
};
const seriesReport = administer(series, rules);
ok(
  "under confirmed rules, a version series is found and ordered",
  seriesReport.verdicts[1].iterative.says === "iterative" &&
    seriesReport.verdicts[1].iterative.head === true &&
    seriesReport.verdicts[1].iterative.of === 2,
);
ok(
  "directory scope does not merge the same stem across folders",
  seriesReport.verdicts[2].iterative.says === "not-iterative",
);
ok(
  "flat scope does merge it, when flat scope is declared",
  administer(series, { ...rules, scope: "flat" }).verdicts[2].iterative.says === "iterative",
);

const referenced = administer({
  records: [rec(1), rec(2)],
  reference_index: { refers_to: ["f1.jpg"] },
});
ok(
  "a referenced file is functional, and confirmed",
  referenced.verdicts[0].functional.says === "functional" &&
    referenced.verdicts[0].functional.basis === "confirmed",
);
ok(
  "an unreferenced file is called unreferenced, not unused",
  referenced.verdicts[1].functional.says === "unreferenced" &&
    referenced.verdicts[1].functional.note.includes("not the same as unused"),
);

// --- determinism -------------------------------------------------------------

ok(
  "two runs on one manifest are byte-identical",
  JSON.stringify(administer(hashed)) === JSON.stringify(administer(hashed)),
);

ok(
  "normalisation with no rules changes nothing but case and separators",
  normaliseStem("My Track FINAL.wav", []) === "my track final",
);

// --- the stores --------------------------------------------------------------

ok(
  "every store declares an access status",
  stores.stores.every((s) => typeof s.access === "string" && s.access.length > 0),
);

ok(
  "no store claims reachability it has not got",
  stores.stores.every((s) => s.reachable_from_repository === true || s.access !== "connected"),
);

ok(
  "every unreachable store names what is owed",
  stores.stores.every((s) => s.reachable_from_repository || (s.owed && s.owed.length > 0)),
);

// --- the intake --------------------------------------------------------------

ok("the intake asks three questions or fewer", intake.questions.length <= 3, `${intake.questions.length}`);

ok(
  "every intake question names which verdict it unblocks",
  intake.questions.every((q) => typeof q.unblocks !== "undefined" && q.unblocks.length > 0),
);

ok(
  "the intake refuses to rename, move, archive or delete under any answer",
  intake.refuses.some((r) => /rename|mov|delet/i.test(r)),
);

const unblocked = new Set(intake.questions.flatMap((q) => q.unblocks));
ok(
  "between them the intake questions unblock all four verdicts",
  ["duplicate", "iterative", "novel", "functional"].every((k) => unblocked.has(k)),
);

// --- media kinds -------------------------------------------------------------

const allExt = media.kinds.flatMap((k) => k.ext);
ok("no extension is claimed by two kinds", new Set(allExt).size === allExt.length);
ok("every extension is lowercase and dotless", allExt.every((e) => e === e.toLowerCase() && !e.includes(".")));
ok(
  "every kind says what the scanner cannot read",
  media.kinds.every((k) => typeof k.scanner_cannot_read === "string" && k.scanner_cannot_read.length > 0),
);
ok(
  "no kind claims the scanner reads anything but the directory entry",
  media.kinds.every((k) => k.scanner_reads.every((f) => ["bytes", "mtime", "name"].includes(f))),
);
ok("audio, video, image and document are all declared",
  ["audio", "video", "image", "document"].every((k) => media.kinds.some((m) => m.key === k)));
ok("an unlisted extension falls back rather than being dropped", kindOf("xyzzy") === media.fallback.key);
ok("a video extension classifies as video", kindOf("MOV") === "video");
ok("an audio extension classifies as audio", kindOf("wav") === "audio");

const kinded = administer({
  records: [
    rec(1, { name: "a.wav", ext: "wav", path: "a.wav" }),
    rec(2, { name: "b.mov", ext: "mov", path: "b.mov" }),
    rec(3, { name: "c.zzz", ext: "zzz", path: "c.zzz" }),
  ],
});
ok(
  "the report rolls up by kind, and never at basis confirmed",
  kinded.kinds.length === 3 && kinded.kinds.every((k) => k.basis === "derived"),
);
ok("a kind with no files is omitted rather than shown as zero", !kinded.kinds.some((k) => k.files === 0));

// --- the endpoint ------------------------------------------------------------

const worker = fs.readFileSync(path.join(ROOT, "src", "index.js"), "utf8");
ok("the endpoint stores nothing", /stored: false/.test(worker) && !/KV|R2|D1|caches\.default\.put/.test(worker));
ok("the endpoint is inert without its secret", /if \(!env\.MFILE_TOKEN\)/.test(worker));
ok("the token compare is constant time", /diff \|=/.test(worker) && !/=== env\.MFILE_TOKEN/.test(worker));
ok("the endpoint validates before administering", worker.indexOf("validate(manifest)") < worker.indexOf("administer(manifest)"));
ok("the endpoint bounds the body and the record count", /MAX_BODY/.test(worker) && /MAX_RECORDS/.test(worker));
ok(
  "no token, key or secret is committed",
  !/MFILE_TOKEN\s*=\s*["'][^"']+["']/.test(worker) && !/sk-[a-zA-Z0-9]{16}/.test(worker),
);

const core = fs.readFileSync(path.join(ROOT, "src", "administer.js"), "utf8");
ok("the shared core touches no filesystem and no network", !/node:fs|node:path|fetch\(/.test(core));
ok(
  "unsupplied rules default to unconfirmed, so the edge withholds rather than guesses",
  administer({ records: [rec(1)] }).verdicts[0].iterative.says !== "iterative",
);

// --- the shortcut ------------------------------------------------------------

const shortcut = fs.readFileSync(path.join(ROOT, "ios", "shortcut.md"), "utf8");
ok("the shortcut spec states that Shortcuts cannot hash", /no hashing action/i.test(shortcut));
ok("the shortcut spec carries no literal token", !/X-MFile-Token:\s*[A-Za-z0-9_-]{12,}/.test(shortcut));
ok("the shortcut spec names no move, rename or delete action", /no move, rename, delete or trash action/i.test(shortcut));

// --- the administrator does not mutate --------------------------------------

const src = fs.readFileSync(path.join(ROOT, "scripts", "mfile.mjs"), "utf8");
ok("the administrator never writes, renames or unlinks", !/fs\.(write|rename|unlink|rm|cp|mkdir)/.test(src));
const scan = fs.readFileSync(path.join(ROOT, "scripts", "mfile-scan.mjs"), "utf8");
ok("the scanner never writes, renames or unlinks", !/fs\.(write|rename|unlink|rm|cp|mkdir)/.test(scan));
ok("neither makes a network request", !/fetch\(|https?\.request|node:https/.test(src + scan));

console.log(
  `\n${failed ? `${failed} failed` : "all assertions passed"} — 4 questions, ${media.kinds.length} media kinds, ${stores.stores.length} stores, ${intake.questions.length} intake questions\n`,
);
process.exit(failed ? 1 : 0);
