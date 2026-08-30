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

## The rules

**0. The crime is captured on its own evidence.** Whether the violence happened,
who did it, and what a forum said about it are three separate questions, held in
three separate fields:

| Axis | Field | Answers |
| --- | --- | --- |
| **Act** | `finding.act` | Did it occur? |
| **Actor** | `finding.attribution` | Who did it? |
| **Forum** | `process.outcome` | What did a court do about it? |

The act is answered by bodies, ruins, death records and contemporaneous account —
not by a forum, and not by this book's opinion. The ordinary entry here reads
*act established, actor unattributed, forum no process*, and that is not an
inconsistency to resolve; it is the thing being documented. Framing an
established killing as merely "alleged" would adopt the posture of the county
that declined to look, and let a failure to prosecute retroactively unmake the
fact of the violence. `offense` names what the conduct constitutes on its face —
a characterisation of conduct, never a verdict on a person.

**1. The book never attributes conduct to a person on its own authority.** The
restraint is on the *actor* axis, not the *act* axis. An actor is named only
where the sources name one; an entry whose record is `unverified` cannot carry
an established act, and the validator rejects the combination.

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

**4. What falls between the events is recorded too.** `harmed.interstitial`
carries the harm with no date, no forum and no tally anywhere: property abandoned
under threat, exile, testimony never given, kinship severed by sale, title
transferred, and effects that continue to fall on people who were never present.
Without it, the book's own one-entry-one-incident structure would do the same
work of erasure the tallies do.

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

18 complaint entries, 38 register rows, 10 impediments, 24 archives.

In all 18 the act is **established** on the evidence. In 3 no participant is
identified in any source. In all 18 no perpetrator was ever convicted. Those
three numbers are the shape of the corpus, and the reason the axes are kept
apart: the first is not diminished by the third.

Every complaint being unpunished is a finding about the corpus, not a selection
rule — an entry with a conviction is in scope and would render with a different
flag.

Coverage runs from *Dred Scott* (1857) to the Sovereignty Commission's
prosecution of Clyde Kennard (1960), with two entries — chattel enslavement and
the NAACP's 1889–1918 compilation — carried as explicitly labelled aggregates
rather than allowed to masquerade as individuated records.

## Adding an entry

1. Add to `data/complaints.json`. Everyone harmed gets a row in
   `data/register.json`; every source gets a row in `data/archives.json`.
2. Answer the three axes independently. `finding.act` is what the evidence
   establishes; `finding.attribution` is never inferred from it. Set
   `verification` — which describes the *record*, not the event — honestly:
   `documented` requires a source on file, `contested` requires `status_note` to
   describe the conflict rather than resolve it silently, and `unverified` must
   carry no sources and cannot accompany an established act.
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
