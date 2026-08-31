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

**0. Four questions, four fields, never collapsed.**

| Axis | Field | Answers |
| --- | --- | --- |
| **Act** | `finding.act` | Did it occur? |
| **Actor** | `finding.attribution` | Who did it? |
| **Forum** | `process.outcome` | What did a court do about it? |
| **Restoration** | `restoration.forms` | What reached the harmed? |

The act is answered by bodies, ruins, death records and contemporaneous account —
not by a forum, and not by this book's opinion. The ordinary entry here reads
*act established, actor unattributed, forum no process*, and that is not an
inconsistency to resolve; it is the thing being documented. Framing an
established killing as merely "alleged" would adopt the posture of the county
that declined to look, and let a failure to prosecute retroactively unmake the
fact of the violence. `offense` names what the conduct constitutes on its face —
a characterisation of conduct, never a verdict on a person.

**0b. The resolve is restoration, not adjudication.** Punishing an offender was
never the remedy for an injury — it is the state answering an affront to itself,
and it leaves the harmed where it found them. So restoration is its own axis with
its own derivation, and `restoration.reached` is required, because a remedy
enacted is not a remedy delivered. Rosewood's compensation reached a small number
of located survivors; the Tuskegee settlement could not reach wives and children
who were never enumerated. `remedy.outstanding` renders as **Still owed**, which
is the live figure a legislature would need.

**0c. The record shows from where each account was observed.** Every source is
cited with a `vantage` — victim testimony, perpetrator record, hostile
contemporaneous press, official commission, and so on — and `concurrence` states
on every entry where the vantages agree and where they diverge. Divergence is
described, never resolved silently: where death tolls differ by an order of
magnitude, that spread is evidence about who was counting. An act established on
a single vantage cannot be checked against anything, and the validator warns on
it. The strongest entries here are the ones whose vantages are most hostile to
each other — Tuskegee's most damning record is the study's own, Kennard's
exoneration rests on the files of the agency that framed him, and Till's killers
confessed for a fee after their acquittal.

**1. The book never attributes conduct to a person on its own authority.** The
restraint is on the *actor* axis, not the *act* axis. An actor is named only
where the sources name one; an entry whose record is `unverified` cannot carry
an established act, and the validator rejects the combination.

`respondents.named` records **whom the sources accuse**, with the source that
made the accusation and a status (`confessed_after_acquittal`, `charged_acquitted`,
`named_in_source`, `names_withheld_in_source`, …). The book reports the naming; it
does not join it. Every name requires a source and the validator rejects one
without, because an unsourced name would be an accusation by this book. Nothing in
that field is a finding of guilt, and the pages say so above every list.

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

**2b. The route each matter travelled is recorded, rung by rung.**
`respondents.echelon` places the actor on a ladder of authority — private_holder,
proxy, municipal, county, district, state, regional, federal, supreme.
`process.escalation` records every rung the matter reached, or failed to, with
the forum and its disposition. `track` separates the route against the
perpetrators from the one the state ran **against the harmed**.

That yields the nearest thing here to an appeal route, and one finding:

| Actor at county level or above | Heard above their own rung |
| --- | --- |
| Before the civil rights era | **0 of 3** |
| Civil rights era or later | **2 of 4** |

At eighteen entries this read **0 of 4** against **13 of 13**, and the docs said
it "predicts completely." Adding civil-rights-era entries broke that: Prince
Edward County reached the Supreme Court, the sterilisation entry reached a
federal court. The split was measuring **era**, not echelon — the forums that
could hear a matter against a state actor largely did not exist for most of this
corpus's span. Tuskegee is the exception the other way: a federal actor into the
1970s whose matter still never left the federal rung.

Computed on every build with its n reported. **It has moved once already, which
is why it is computed rather than written down.**

**2c. The perpetrator's own paperwork is the strongest evidence here.**
A bill of sale exists because title had to be provable against third parties, so
it was written, witnessed and recorded — and it proves the transaction now for
the reason it proved it then. `commercial_record` is a distinct vantage for
ledgers, manifests, mortgages and policies: not a government record *about* a
population but the transacting party's own instrument. The Act of 2 March 1807
required a manifest naming every enslaved person shipped coastwise, so the only
rung of authority that touched the domestic trade did so to document it.

This answers the objection that slavery's harms cannot be logged as crimes
because they were lawful: `finding.act` records that the conduct occurred,
`offense` names what it constitutes on its face, and `process.outcome` records
separately that no forum treated it as an offence. And it fails outright for the
Clotilda, where the conduct was a capital crime *when committed*, the
perpetrators are named, and nobody was punished.

**2d. The child is a stage in most entries, not a category of them.**
`era` places every entry in one or more periods (`atlantic_trade`,
`domestic_trade`, `reconstruction`, `jim_crow`, `civil_rights`, `modern`), which
is what lets a harm appear as a continuity rather than a series of incidents.
`harmed.children` records how a child was reached and requires
**`carried_into_adulthood`** — where the harm is actually collected. **11 of 25
entries, across 5 of 6 periods.**

The field exists because every other field here assumes an adult with capacity: a
claimant who can assert, a forum that can hear. That assumption fails exactly
where most of these injuries begin.

Two institutions reach a child before any court does, and they meet: the
classification that selected many of those sterilised — feeblemindedness — was
manufactured by intelligence testing applied to Black children in schools, and
the operation was performed by a health system acting on that classification. The
record of the first became the warrant for the second, which is why they are one
entry.

**2e. Rights are named beyond the enumerated catalogue — and tied to instruments.**
`data/rights.json` names 21. Each is bound to the instrument that recognises it
or **marked as recognised by none**, which is what keeps this from being a list of
grievances. Eight have no U.S. constitutional analogue: education, health,
property against arbitrary deprivation, participation in cultural and scientific
life, development, reparation, personhood before the law as such, and consent to
medical experimentation as an express term.

**The caveat comes first, on the page and here.** Most instruments postdate most
entries and none applies retroactively — UDHR 1948, the Covenants 1966, the Right
to Development 1986 (the US voted against), Basic Principles on Reparation 2005.
A right named against an entry *characterises the conduct*, exactly as `offense[]`
does. It is not a claim that a remedy existed then.

The right to an **effective remedy** (UDHR 8, ICCPR 2(3)) is violated by every
entry by construction — an established act with no forum, no conviction and no
restoration *is* that denial — so it is derived, and the validator rejects it as a
stored value.

**`foreclosed_contribution`** records the interest no instrument protects: what a
person would have made. It states **the input destroyed and never the output**,
and that line is enforced — `quantifiable` must be `false` or the build fails.
Prince Edward County withheld on the order of **10,000 child-years of schooling**,
which is arithmetic on documented enrolment; what those children would have gone
on to do is recorded nowhere. A counterfactual asserted as evidence would be
indistinguishable from fabrication, and the unknowability is the sharper claim
anyway: it is not possible to say what was lost, which is what makes the loss
total rather than measurable.

Each impediment carries **`if_removed`** — what repealing it would actually
resolve. Most would resolve nothing; the two that would are limitations (a
tolling provision running from when facts became provable) and descendant
standing. `npm run record-book:interrogate -- --live` runs the whole query.
**Every material restoration in this corpus came through a legislature, a claim
bill, or an institution acting on its own record. None came from a court applying
existing law to a historical claim.**

**2f. Legislation with disparate effect is its own file.**
Impediments blocked a remedy; these statutes **were the injury**, working through
the ordinary machinery of law. `data/legislation.json` records 9 — **5 name no
race at all**, 3 remain in force.

`disparate_effect.mechanism` is **required**, and the validator rejects an entry
without it: a disparate outcome is not by itself an indictment of a statute, so
the channel has to be nameable. The disfranchising constitutions tested for a
literacy deficit the same legislatures had created by statute. The Social
Security Act and NLRA excluded agricultural and domestic workers — occupational
categories containing roughly three in five Black workers, demanded by Southern
delegations as the price of passage. The GI Bill's mechanism is *delegation*: a
neutral entitlement administered through segregated institutions.

The 1994 Crime Bill is `contested`, because the causal share genuinely is —
entering it as documented for pointing the expected way would be the error the
book refuses elsewhere.

**One entry is `asserted_not_verified`** — contemporary federal employment
changes affecting Black women. It carries no sources by design, renders behind a
warning in its own colour, and says it must not be cited. The *structural
exposure* is documented (federal-workforce over-representation, public employment
as a route to the Black middle class, prior austerity effects); the asserted
effect is not. The entry names what would settle it: BLS CPS microdata by race
and sex, OPM FedScope, EEOC reports, and identification of the instrument.
**It becomes documented when a named instrument and a measured series are both on
file, and not before.**

**3a. Entries are classified by what was injured, not by who was injured.**
`harm_domains` carries as many of eight as apply: `physiological`, `spiritual`,
`social`, `political`, `economic`, `educational`, `interpersonal`,
`intrapersonal`. The book never sorts entries by identity — race appears as a
fact of the conduct, never as a filing category, because sorting victims by
identity reproduces the logic that produced the injuries. Sorting *injuries* by
what they broke does the opposite.

Because domains are shared, the log stops being a list and becomes a **web**:
Tulsa and chattel enslavement joined by `economic`, Kennard and Ocoee by
`political`, Till and Mary Turner by `spiritual` — relations no chronology shows.
`harmWeb()` computes frequency, co-occurrence and the per-domain index; `web.html`
renders it. Two findings it surfaced, both computed rather than written:

- **No cell in the co-occurrence matrix is blank.** Every pair of domains meets
  somewhere. Five pairs meet in exactly one entry, and it is the same entry every
  time — chattel enslavement, which carries all eight alone. Remove it and the web
  comes apart at five joints.
- **`educational` appears in 2 of 18 entries.** A gap in the corpus, not in the
  history. The validator reports thinly covered domains on every run, and the
  honest response is to write the missing entries, not to broaden the tagging on
  existing ones until the number improves.

**3b. Harm that outlives the harmed generation is recorded, with its standing.**
`harmed.transmitted` is separate from interstitial harm and carries a `standing`:
`documented` (title transferred and never disturbed, a population kept out,
wealth destroyed and not rebuilt, measured effects), `argued_in_literature`
(advanced in a scholarly or clinical framework, recorded as an argument with its
proponents named and never converted into a finding), or `contested`. Anything
but `documented` requires a note saying whose argument it is and that the book
does not adopt it — and an `argued_in_literature` claim must cite a
`clinical_research` vantage, so the argument is attributable to someone.

Joy DeGruy's *Post Traumatic Slave Syndrome* is entered this way on the chattel
enslavement complaint. It is an influential and widely taught framework, used in
practice, that is not a DSM diagnostic category and draws on a transmission
literature partly in open dispute — and the entry says so. That is not a
demotion; it is the same rule that lets the book insist an established killing is
a killing. Its value here is that it names an injury the rest of the schema
could not see: every other field assumes a harm with a date, a place, and a
person it happened to.

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

25 complaint entries, 52 register rows, 21 rights, 9 statutes, 6 organisations, 10 impediments, 53 archives.

In all 18 the act is **established** on the evidence. In 3 no participant is
identified in any source. In all 18 no perpetrator was ever convicted. 7 name a
respondent the sources accuse, each with its provenance.

On the axis that matters: **3 of 18 produced anything material for the harmed. 4
produced nothing at all. None produced full restitution.** 6 record harm that
outlives the harmed generation — 5 documented, 1 recorded as argued and not
adopted. Those numbers are the
shape of the corpus and the reason the axes are kept apart — the established act
is not diminished by the absent conviction, and neither is answered by an
apology.

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

## Organisations that claimed sanction

`data/organizations.json` records the bodies that were not mobs: persistent,
named, officered organisations that **arrogated the state's function** — claiming
the right to try, sentence and punish, and organising themselves to look like an
authority. `claimed_sanction` records what each asserted and how it made the
claim visible: ritual, hierarchy, written notice, disguise or uniform, published
platform, advance notice of an election it meant to decide by force, and in one
case a deliberated sentence carried out on a stranger because a jury had
acquitted someone else.

`state_response.suppressed` records whether anything ever stopped one. **Two of
six.** The first Klan, by the Enforcement Acts of 1870–71 — effective, and never
attempted again after *Cruikshank* narrowed its basis. The United Klans of
America, by a $7 million civil verdict won in 1987 by Beulah Mae Donald, whose
son it had killed; its headquarters was signed over to her. A tort claim brought
by a victim's mother did what criminal law had done to no such organisation in a
century. The second Klan was dissolved in 1944 for an unpaid tax debt.

## Interrogating the record

`npm run record-book:interrogate` reads the log's own citations and produces a
**research brief** — what an entry establishes, what its sources cannot be asked
to establish, the questions the data raises, and where the answers would be. It
generates the plan, never the findings: nothing fetches, nothing is invented, and
a brief cannot claim more than the corpus does.

```bash
npm run record-book:interrogate CL-1918-TURNER
npm run record-book:interrogate -- --source SRC-NAACP-PAPERS
npm run record-book:interrogate -- --gaps      # ranked, corpus-wide
npm run record-book:interrogate -- --json CL-1918-TURNER
```

Every vantage carries what it **establishes**, what it is **silent on**, and how
to **press** it — because a source is not reliable or unreliable, it answers some
questions and is self-serving on others. Questions are raised by conditions in
the data: an unattributed actor, a count never fixed, a collective register row,
restoration that never came with the operative impediments named, a divergence
between vantages, unresolved locators. A respondent recorded
`names_withheld_in_source` is flagged **high priority** — the identification
already happened once, so it is a retrieval problem, not an investigative one.

`--gaps` ranks the corpus by how much is still open. That ranking is the work plan.

## The archives

47 collections. Beyond the lynching and slavery corpora, the manifest carries:

- **National Archives** — the catalogue API (`SRC-NARA-CATALOG`, a real public
  JSON endpoint the fetch script can query directly), plus RG 60 (Justice, where
  the file explaining a non-prosecution usually is), RG 65 (FBI investigative
  files), RG 21 (federal trial courts), and the 1872 Ku Klux Klan hearings —
  thirteen volumes of sworn testimony from freedpeople, almost none of which
  produced a prosecution.
- **Institutions whose function is preserving narrative** — NMAAHC, the Legacy
  Museum and National Memorial for Peace and Justice, Whitney Plantation,
  Schomburg, Moorland-Spingarn, Amistad, Avery, the IAAM Center for Family
  History, the Emmett Till Interpretive Center. The EJI memorial matters
  particularly to this repository: 800 county monuments naming over 4,400
  victims is the same conversion of a tally back into people that this
  register's standing task describes.
- **Behind the Veil** (Duke) — roughly 1,300 interviews with people who lived
  under segregation. After the WPA narratives, the most important corpus here:
  first-person testimony about the period most of these entries fall in, from
  people who were never asked at the time.
- **Joy DeGruy's work** and the historical trauma field it sits in.

## A note on the locators

URLs in `data/archives.json` were written from knowledge of the collections and
are marked `verified: false`. They have **not** been resolved: the environment
this was built in has no general outbound network access, and every host returns
403 at the proxy. Run `npm run record-book:fetch -- --check` somewhere with
egress, then set `verified: true` for the ids that resolve. Until then, treat an
unverified locator as a lead, not a citation — which is what the rendered
Archives page says on each one.

Two things specifically **could not be retrieved and were not reconstructed**:
the bibliography of *Post Traumatic Slave Syndrome*, and a complete list of
DeGruy's articles and instruments. `SRC-HISTORICAL-TRAUMA-LIT` records the
scholarly field her work sits within — Brave Heart, Duran and Duran, Danieli,
Yehuda, Akbar, the Clarks, Du Bois, Fanon. **That is a lineage, not a
bibliography.** It was assembled from knowledge of the field and is not a
reconstruction of what she cites; the manifest says so, and it must not be
presented otherwise. Pull the real citations from the book's notes.

The NARA catalogue is a JSON API rather than a page. `SRC-NARA-CATALOG` is
handled accordingly — results save as `.json`, `NARA_API_KEY` is sent when set,
and `NARA_QUERY` changes the search.
