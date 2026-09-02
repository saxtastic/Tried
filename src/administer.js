// The administrator's pure core: manifest in, report out.
//
// No filesystem, no network, no dependencies — so the identical code runs in
// the CLI (scripts/mfile.mjs) and at the edge (src/index.js). Two hosts, one
// implementation; a second copy would drift and the two would disagree about
// someone's files.

import CRITERIA from "../mfile/criteria.json" with { type: "json" };
import DOORS from "../mfile/doors.json" with { type: "json" };
import MEDIA from "../mfile/media.json" with { type: "json" };

/** Extension -> kind. Declared in mfile/media.json, never sniffed from bytes. */
const KIND_OF = new Map(MEDIA.kinds.flatMap((k) => k.ext.map((e) => [e, k.key])));

/** What a file claims to be. A claim the name makes, so never basis "confirmed". */
export function kindOf(ext) {
  return KIND_OF.get(String(ext ?? "").toLowerCase()) ?? MEDIA.fallback.key;
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
/**
 * One asset in three albums comes back three times with one identifier.
 * Collapsing them is not an optimisation — reporting them as three duplicates
 * would invite someone to delete two files that do not exist. This is the one
 * destructive mistake the tool could make, so it happens before anything else.
 */
export function collapseAssets(records) {
  const seen = new Map();
  const out = [];
  for (const r of records) {
    if (!r.asset_id) {
      out.push(r);
      continue;
    }
    const first = seen.get(r.asset_id);
    if (!first) {
      seen.set(r.asset_id, r);
      out.push({ ...r, albums: r.album ? [r.album] : [] });
      continue;
    }
    // Same asset, another album. Record the membership; do not add a file.
    const held = out.find((x) => x.asset_id === r.asset_id);
    if (held && r.album && !held.albums.includes(r.album)) held.albums.push(r.album);
  }
  return { records: out, collapsed: records.length - out.length };
}

/** The date a series should be ordered by, and the name of the date used. */
export function orderingDate(r) {
  return r.captured_at
    ? { at: r.captured_at, by: "captured_at" }
    : { at: r.mtime, by: "mtime" };
}

export function administer(manifest, override) {
  const listed = manifest.records ?? [];
  const { records, collapsed } = collapseAssets(listed);
  // No rules supplied means no confirmed cadence, which withholds `iterative`
  // and `novel`. The default is the cautious one on purpose: at the edge there
  // is no rules file to read, and a host that forgets to pass them gets silence
  // rather than a confident wrong answer.
  const rules = override ?? { confirmed: false, rules: [], source: null, scope: "directory" };
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
      const series = [...sameStem].sort((a, b) =>
        String(orderingDate(a).at).localeCompare(String(orderingDate(b).at)),
      );
      iterative = others.length
        ? {
            says: "iterative",
            basis: "derived",
            with: others.map((x) => x.path),
            head: series[series.length - 1].path === r.path,
            ordered_by: orderingDate(r).by,
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

    return { path: r.path, name: r.name, bytes: r.bytes, store: r.store, kind: kindOf(r.ext), stem: stem.replace("\u0000", "/"), duplicate, iterative, novel, functional };
  });

  const count = (k, v) => verdicts.filter((x) => x[k].says === v).length;

  const doors = [...new Set(records.map((r) => (r.asset_id ? "photos" : "files")))].sort();

  return {
    scanned_at: manifest.scanned_at ?? null,
    root: manifest.root ?? null,
    records: records.length,
    listed: listed.length,
    doors,
    collapsed: {
      count: collapsed,
      rule: DOORS.rules[0].rule,
      note: collapsed
        ? `${collapsed} album listing(s) resolved to assets already counted. Not duplicates — one file, listed more than once.`
        : "no asset appeared under more than one album",
      basis: "confirmed",
    },
    dated_by: {
      captured_at: records.filter((r) => r.captured_at).length,
      mtime: records.filter((r) => !r.captured_at).length,
      note: "A series ordered by the wrong date names the wrong file as its head, and the head is the one people keep.",
    },
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
    kinds: [...MEDIA.kinds.map((k) => k.key), MEDIA.fallback.key]
      .map((key) => {
        const of = verdicts.filter((v) => v.kind === key);
        return {
          kind: key,
          files: of.length,
          bytes: of.reduce((n, v) => n + (v.bytes ?? 0), 0),
          duplicate: of.filter((v) => v.duplicate.says === "duplicate").length,
          iterative: of.filter((v) => v.iterative.says === "iterative").length,
          basis: "derived",
          from: "declared extension, not inspected bytes",
        };
      })
      .filter((k) => k.files > 0),
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

