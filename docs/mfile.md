# The M file administrator

It does not run between the officers. It runs across all of them at once, on one
input: a manifest of files.

It answers four questions per file — **duplicate**, **iterative**, **novel**,
**functional** — and declares a basis for every verdict. It never renames,
moves, archives or deletes.

```bash
npm run mfile -- --self                 # the four questions, answered on this repository
npm run mfile:scan -- ~/Music --store icloud > m.json
npm run mfile -- m.json                 # then administered
npm run check:mfile                     # what it must never do
```

## The finding, before any file is scanned

Three of the four questions are answerable from bytes. **The fourth is not
answerable from any manifest, at any resolution, ever.**

Duplicate is a fact about content hashes. Iterative is a fact about names, once
the naming rule is known. Novel falls out of both. But *functional* — is this
file still doing something — is a relation between a file and something outside
it, and no amount of scanning a drive produces it. The diagnosis given was that
the files are "not referenced or standardized". The missing reference is not a
gap in the report. It is the answer.

So the administrator reports `unknown` for functional until a reference index
exists, and it never reports `unused`. Those are different claims and only one
of them is safe to act on.

## What it needs, and why it is three questions

| Question | Unblocks |
| --- | --- |
| Point at one folder that is already the worst of it. | duplicate, novel |
| Paste three of your filenames that are the same work at different stages. | iterative |
| When a file is still doing something — what is it doing? | functional |

The second one is the load-bearing one. Normalising a filename down to the work
it is a version of *is* the iterative question, and a default ruleset that
strips `copy`, `(1)`, `final`, `v2` is a guess about one person's cadence.

That guess is not hypothetical. The first `--self` run shipped with a rule
stripping the verb prefix `check-` / `build-` / `make-`, and the report duly
announced that `scripts/check-registry.mjs` was a later version of
`scripts/build-registry.mjs`. It is not; the prefix names what the script does.
The rule was removed. That is the exact failure the criterion exists to prevent,
and it happened on the first attempt, on a store whose conventions were already
known. On twenty years of media with an unreliable cadence it would not have
been caught at all — it would have been a reorganisation.

## Scope

Two files sharing a stem in two folders are versions of each other only if the
folders mean nothing. In a media dump they usually mean nothing; in a built tree
they mean everything. So scope is `directory` or `flat`, declared in the
ruleset, never assumed.

## The stores

`mfile/stores.json` records what is actually reachable from here, which is
almost nothing:

- **on-phone** and **iCloud Drive** — not reachable from this repository. Because
  iCloud Drive mounts as a path on a Mac, `mfile-scan.mjs` runs against it with
  no API and no credential. An `.icloud` placeholder is recorded as
  `not_downloaded` rather than hashed, so scanning never triggers a download.
- **Google Drive** — a connector is attached to this session and has not been
  read. Building an inventory of someone's Drive is a large one-directional act
  and it was not asked for in those words.
- **Box** — no connector attached.

Multiple accounts are recorded as owed rather than modelled. An account is not a
store; it is a boundary between stores that may hold the same file twice, and
until the accounts are named a cross-account duplicate cannot be told from a
backup. Those are opposite verdicts — one is waste, the other is the point.

## The turn cycle

`scripts/turn.mjs` runs the cycle as a cycle:

    extract → save → archive → execute → recheck → posture → report

Each stage runs in order and the report is written from what the stages
returned, not from what the turn intended; a stage that did not run is logged as
not run. `execute` is deliberately not automated — a runner that claimed to have
performed an objective it had only logged would be the precise failure the cycle
exists to prevent. `posture` will include media only from a scanned store, and
with no manifest it includes nothing and says why.

```bash
npm run turn -- "the objective" --manifest m.json
npm run turn -- "the objective" --dry     # nothing written
```

Entries append to `turn/log.jsonl`. Archives are gzip of the extracted state,
written from the standard library so they reproduce without a tar binary.
