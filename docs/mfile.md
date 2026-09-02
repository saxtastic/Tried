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

## Two hosts, one implementation

`src/administer.js` is the whole engine: manifest in, report out, no filesystem
and no network. The CLI wraps it, and so does the Worker. A second copy would
drift, and the two would eventually disagree about someone's files.

It takes stem rules as an argument rather than reading them, because the edge
has no rules file to read. The default when none are passed is *unconfirmed*,
which withholds `iterative` and `novel` — a host that forgets to pass them gets
silence rather than a confident wrong answer.

## Two doors

The same video read through Files and through Photos gives two different
records, and the difference is not noise.

| | Files | Photos |
| --- | --- | --- |
| identity | path | asset id |
| name, size, extension, mtime | yes | yes |
| capture date, duration, dimensions, album | **no** | **yes** |
| people / faces | no | **no** |

Two rules follow, and both are hard rather than advisory:

**An asset id seen more than once is one file listed more than once, never a
duplicate.** Scanning by album returns an asset once per album it belongs to; a
photo in Portfolio, Press and 2026 comes back three times with one identifier.
Reporting that as three duplicates invites someone to delete two files that do
not exist. This is the single destructive mistake this tool could make, so the
collapse happens before any question is asked and the report separates
*listings* from *files*.

**Where a record has a capture date, order by it; otherwise order by mtime, and
say which.** A pair shot in 2019 and 2021 but written to the phone in the
opposite order gets **opposite heads** depending on the date used — and the head
is the file people keep. `check-mfile` asserts that the two really do disagree,
so the rule cannot quietly stop mattering.

A files record and a photos record are never merged on filename alone.
`IMG_4471.MOV` in a folder and in the library are *probably* the same recording.
Without a hash on both sides that is a guess, and the two doors cannot both be
asked for one.

### A claim this corrected

An earlier version of `mfile/media.json` said capture date was out of reach and
that the iterative verdict says mtime, "never when it was taken." That was true
of the files door and it silently generalised to every door. Through Photos the
capture date is available and it is the better date. The correction is recorded
in `mfile/doors.json` rather than edited away, because the shape of the mistake
— a limit of one path stated as a limit of the tool — is the kind worth being
able to find again.

Audio has no richer door: it does not live in the Photos library, so duration,
sample rate and channels stay out of reach until something opens the files.

## Audio, video, images, documents

`mfile/media.json` declares four kinds by extension, plus `other` for anything
unlisted. Extension is a claim the filename makes, not a fact about the bytes,
so the kind is recorded at basis `derived` and never `confirmed`.

The **files door** reads the directory entry and nothing else: name, size,
modification time. Duration, sample rate, resolution and EXIF live inside the
file, and opening them is a second pass that is not written. Each kind records
what that door cannot read, so it is stated rather than discovered — and says
where the photos door covers the gap.

One consequence that neither door removes: **a session file is a bundle, not a
track.** `.logicx`, `.als`, `.band` are directories, so the scan walks into them
and reports their contents. The count inflates and that is not an error — the
parts are files.

## The endpoint

`POST /mfile/manifest`, served by `src/index.js`. It validates the manifest,
administers it, and returns the report. **It stores nothing.** An endpoint that
quietly kept an inventory of someone's drive would be a different tool than the
one that was asked for.

It is inert until its secret exists, so a deploy that forgets the secret serves
the site and refuses the endpoint rather than becoming public compute:

```bash
npx wrangler secret put MFILE_TOKEN
```

The token compare is constant time, the body is capped at 8 MB and 50,000
records, and every record is validated before the administrator sees it — a
verdict on a record nobody validated is the worst output this can give.

## The phone half

[`ios/shortcut.md`](../ios/shortcut.md) builds the scanner as **two** Shortcuts,
one per door. No Mac, no Apple Developer account, fifteen minutes each. They
emit the same manifest a native app would, so nothing is thrown away when the
app arrives.

One thing it cannot do: **Shortcuts has no hashing action.** So the manifest
arrives with no `content_hash` and `duplicate` degrades to *candidate* — matched
on equal size and equal extension, which is a real signal and not a verdict.
That is the degraded path working as designed rather than a gap.

## The surface

`/mfile/` is one toggle with two states, **Stated** and **Withheld** — not tabs.
Tabs would say these are two places; they are one place seen from one side or
the other. The four questions do not change when it moves; what changes is
whether you are reading what the administrator can state or what it refuses to
say and why.

The figures on it come from `mfile/fixture.json`, an invented eighteen-file
phone folder, labelled as invented. It was a `--self` run first, and that was
wrong twice: it made the page a function of every file in the repository, so
`--check` failed on any commit; and it showed a reader this repository's `.mjs`
files when what they want to see is a report on audio, video and photos. The
fixture exercises every case the four questions have to handle — a version
series, two exports of one work, a photo whose mtime is years after its capture.

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

- **on-phone** and **Photos** — reachable only by the Shortcuts, which post to
  the endpoint. This repository never touches the device. Name three albums, not
  the whole library: forty thousand assets returns a report nobody reads.
- **iCloud Drive** — not reachable from here either. Because
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
