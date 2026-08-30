# Record Book

A structured, source-cited **complaint log of documented crimes that went
unpunished**, together with the legal mechanisms that produced that outcome, and
a register of the people harmed.

It is built as data first and rendered to static pages under
`public/record-book/`, so the record can be queried, audited, corrected, and
cited independently of how it happens to look.

## What it is, and what it is not

**It is** a documentary instrument. Every entry names its sources, records what
the legal process actually did, and states plainly where the record is thin.

**It is not** a filing, a lien, an assertion of jurisdiction, or a document with
any legal effect. Nothing in it initiates or preserves a cause of action, and no
entry should be presented to a court or agency as though it did. Reparative
claims move through legislatures, courts, and commissions. A record book supplies
evidence to those forums; it does not stand in for one.

That distinction is load-bearing. A log that overstates its own authority gets
excluded from the proceedings it was built for. A log that documents carefully
gets cited in them.

## The three rules

1. **The book never converts an allegation into a finding.** An entry marked
   `unverified` records that someone alleged something. It does not record that
   the thing happened. Only a court, a commission, or a documented confession
   moves an entry, and the mover is named in the entry.

2. **"Unpunished" is derived, never typed.** `process.unpunished` is computed
   from the recorded disposition and is checked on every build. A civil
   settlement is not punishment. A legislative apology is not punishment. The
   exoneration of the victim is not punishment of the perpetrator. Because the
   field is derived, the claim in the title cannot drift away from the data.

3. **Being recorded is not being made a claimant.** A person enters the register
   because the injury is documented, not because anyone decided they should be
   demanding something. The dead did not consent to the record and cannot
   consent to a claim. What they establish is not a demand — it is the site: that
   the injury occurred, where, and that it went unanswered. Standing to demand
   belongs to the living who choose to assert it.

`METHODOLOGY.md` sets all of this out in full, including how the register handles
a person whose injury survives and whose name does not.

## Layout

| Path | Contents |
| --- | --- |
| `data/complaints.json` | The log. One entry per documented injury and its disposition. |
| `data/register.json` | Victims and claimants. Identity status and standing are recorded separately. |
| `data/impediments.json` | The doctrines and practices that made the injury non-cognizable. |
| `data/archives.json` | Manifest of the corpora the book draws on, with locators and rights. |
| `schema/*.schema.json` | JSON Schema for each record type, for external tooling. |
| `scripts/validate.mjs` | Enums, referential integrity, and the derivation of `unpunished`. |
| `scripts/build.mjs` | Renders `public/record-book/`. Refuses to build on a validation error. |
| `scripts/fetch-archives.mjs` | Pulls public-domain texts into `record-book/corpus/` (gitignored). |
| `METHODOLOGY.md` | Evidentiary standard, identity convention, standing, impediments. |

## Commands

```bash
npm run record-book:validate   # check the data; exits non-zero on error
npm run record-book:build      # validate, then render public/record-book/
npm run record-book:fetch      # pull fetchable public-domain texts
npm run record-book:fetch -- --list    # what is fetchable, and under what rights
npm run record-book:fetch -- --check   # resolve locators without downloading
```

The build is deterministic and derived entirely from `data/`. Do not hand-edit
anything under `public/record-book/`; it is overwritten.

## Current state

18 complaint entries, 38 register rows, 10 impediments, 24 archives. Every
complaint currently in the log is unpunished — none records a sustained criminal
conviction of a perpetrator. That is a finding about the corpus, not a selection
rule: an entry with a conviction is in scope and would render with a different
flag.

Coverage runs from *Dred Scott* (1857) to the Sovereignty Commission's
prosecution of Clyde Kennard (1960), with two entries — chattel enslavement and
the NAACP's 1889–1918 compilation — carried as explicitly labelled aggregates
rather than allowed to masquerade as individuated records.

## Adding an entry

1. Add to `data/complaints.json`. Everyone harmed gets a row in
   `data/register.json`; every source gets a row in `data/archives.json`.
2. Set `verification` honestly. `documented` requires at least one source on
   file. `contested` requires `status_note` to describe the conflict, not resolve
   it silently. `unverified` must carry no sources — it is an allegation, and the
   validator enforces that it stays one.
3. Do not write `process.unpunished`. It is derived, and the validator rejects a
   stored value that disagrees with the derivation.
4. Run `npm run record-book:validate`, then `npm run record-book:build`.

### The standing task

`PR-COLLECTIVE-NAACP-3224` carries 3,224 people as a single number. Under the
book's own rule in `METHODOLOGY.md` section 4, each of them is entitled to an
individuated row. Producing those rows means archival work in the collections
listed in `data/archives.json`, county by county. That work is the reason this
repository holds data rather than prose, and it is not finished.

## A note on the locators

URLs in `data/archives.json` were written from knowledge of the collections and
are marked `verified: false`. They have **not** been resolved: the environment
this was built in has no general outbound network access, and every host returns
403 at the proxy. Run `npm run record-book:fetch -- --check` somewhere with
egress, then set `verified: true` for the ids that resolve. Until then, treat an
unverified locator as a lead, not a citation — which is what the rendered
Archives page says on each one.
