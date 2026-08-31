# Methodology

How an entry gets into this record book, what each field means, and what the
book refuses to do.

## 1. What this instrument is

A **documentary complaint log**: a structured, source-cited register of injuries
for which no criminal accountability followed, together with the legal
mechanisms that produced that absence.

It is a record. It is not a filing, a lien, a claim of jurisdiction, or a
document with legal effect of any kind. Nothing in it initiates or preserves a
cause of action, and no entry should be presented to any court or agency as
though it did. Reparative claims move through legislatures, courts, and
commissions; a record book supplies evidence to those forums, it does not
substitute for them.

The distinction matters practically. A log that overstates its own authority
gets excluded. A log that documents carefully gets cited.

## 2. Four axes, kept apart

The single most important rule in this book is that **whether the violence
happened, who did it, what a forum said about it, and what ever reached the
harmed are four separate questions.** Collapsing the first three is how a killing
becomes an allegation. Collapsing the last into the third is how punishing an
offender gets mistaken for repairing an injury.

| Axis | Field | Answers |
| --- | --- | --- |
| **Act** | `finding.act` | Did it occur? |
| **Actor** | `finding.attribution` | Who did it? |
| **Forum** | `process.outcome` | What did a court or commission do? |
| **Restoration** | `restoration.forms` | What reached the harmed? |

`finding.act` takes `established`, `contested`, or `unestablished`. It is
answered by bodies, ruins, death records, burned deeds, and contemporaneous
account — **not by a forum, and not by this book's opinion.** An act is
established when the evidence establishes it, whether or not anyone was ever
charged, and whether or not a coroner's jury said the deceased died at the hands
of persons unknown.

`finding.attribution` takes `named_in_sources`, `described_unidentified`,
`unattributed`, or `contested`. It is never inferred from the act. That an
established killing has no identified killer is a fact about the record, and
recording it as such is the opposite of doubting the killing.

The ordinary entry in this book reads: **act established, actor unattributed,
forum no process.** That is not an inconsistency to be resolved. It is the thing
being documented.

### Why this matters

The victim is not the party who has to determine whether a crime occurred, and
neither is a county that declined to look. Framing an established killing as
merely "alleged" adopts the posture of the forum that failed — it makes the
record wait on an authority that never came, and lets the failure to prosecute
retroactively unmake the fact of the violence. The act is captured on its own
evidence. The absence of an actor and the absence of a forum are then recorded
as two further injuries, in their own fields, where they can be counted.

### The fourth axis is the one that matters

Punishing an offender was never the remedy for an injury. It is the state
answering an affront to itself, and it leaves the harmed exactly where it found
them. **The resolve this book measures is restoration to victims, not
adjudication of offenders** — so `restoration` is a separate axis, derived
separately, and neither it nor `process.outcome` is permitted to stand in for
the other.

`restoration.forms` takes any of:

| Form | What it actually does |
| --- | --- |
| `full_restitution` | The harmed are made whole. Occurs nowhere in this corpus. |
| `partial_compensation` | Money or property reaches some of the harmed. |
| `restoration_of_status` | Vacatur, pardon, exoneration. Corrects the state's injury to the victim; touches nothing the perpetrator did. |
| `institutional_reform` | The law changes. Reaches future persons, not these ones. |
| `symbolic` | Apology, marker, resolution, renaming. Costs nothing and returns nothing. |

Only the first two are material, and `isMateriallyRestored` derives from that.
Three entries of eighteen clear it. Four produced nothing whatever. None produced
full restitution.

`restoration.reached` is required and is the field that does the real work: **a
remedy enacted is not a remedy delivered.** Rosewood's compensation reached a
small number of located survivors because most of the dispersed were never found.
The Tuskegee settlement could not reach the wives and children because they were
never enumerated. Recording the form without recording who received it would
reproduce the press release rather than the outcome.

`remedy.outstanding` renders as **Still owed**. That is the live figure — the one
a legislature or commission would need — and it is why the book is worth keeping
even though every entry in it is closed.

### Offences

`offense` names the offences the conduct constitutes on its face — homicide,
arson, kidnapping, mayhem, malicious prosecution. This is a **characterisation
of conduct, never a verdict on a person.** Naming an offence is not naming an
offender; that is what the Actor axis is for, and the rendered pages say so under
every entry. Where no offence is named, `offense_note` must say why.

## 3. The evidentiary standard

`verification` describes the quality of the **documentary record**, which is a
different question again from the three axes above. Every entry carries one:

| Value | Meaning |
| --- | --- |
| `documented` | Attested by at least one identified primary or scholarly secondary source, cited in `sources`. |
| `contested` | Sources conflict on a material fact. The conflict is described in `status_note`, not resolved silently. |
| `unverified` | Recorded as an allegation only. No source on file. Carries no assertion that the conduct occurred. |

**The book never attributes conduct to a person on its own authority.** An entry
whose record is `unverified` cannot carry an established act — the validator
rejects the combination, because nothing on file can establish anything. And an
actor is named only where the sources name one.

Note what this rule does and does not restrain. It restrains *attribution*: the
book will not pronounce a named person guilty. It does not restrain the *act*: a
documented killing is recorded as a killing on the evidence, immediately, with no
forum's permission required. A register that named offenders on its own authority
would be a rumour with formatting. A register that refused to call an established
killing a killing would be a coroner's jury.

## 4. Vantages, and the conundrum of the record

A record assembled from one position can be defeated by an official finding from
another. The county coroner's jury returned *death at the hands of persons
unknown* and that was the only inquiry that would ever occur. Ida B. Wells did
not argue with those findings. She added a vantage: she read the white
newspapers' own accounts of the killings back against the verdicts written to
excuse them, and the hostile source convicted the finding.

So sources are not a flat list here. Every entry carries `citations`, and each
citation records the **vantage** the account was observed from — `victim_testimony`,
`witness`, `perpetrator_record`, `contemporaneous_press`, `investigative`,
`official_investigation`, `official_commission`, `judicial_record`,
`litigation_record`, `administrative_record`, `statistical_series`, `memoir`,
`scholarship`.

**An act established on a single vantage cannot be checked against anything**,
and the validator warns on it. That warning is not pedantry: it found six entries
whose divergences were described in prose while only one kind of source was
actually cited.

The strongest entries are the ones where the vantages are most hostile to each
other. The Tuskegee study's most damning record is the study's own. Clyde
Kennard's exoneration rests on the files of the state agency that framed him. Roy
Bryant and J. W. Milam were acquitted and then described the killing for a fee.
In each, the perpetrator's own vantage is the one that establishes the act.

### Concurrence

`concurrence` is required on every entry and states two things: where the
vantages **agree**, and where they **diverge**. Divergence is described, never
resolved silently, because its shape is itself evidence — and in this corpus it
is almost always evidence about who was counting.

Where the death tolls diverge by an order of magnitude — Colfax, Wilmington,
Elaine, Ocoee, Tulsa — the divergence does not mean the sources are unreliable.
It means no official count was attempted, and the reason no count was attempted
is the same reason no prosecution followed. The three lynching tallies diverge
because they diverge in definition and all three state that they undercount; the
spread between them measures the reporting, not the killing.

### Naming

`respondents.named` records **whom the sources accuse**, with the source that
made the accusation and a status: `confessed`, `confessed_after_acquittal`,
`charged_acquitted`, `charged_no_conviction`, `named_in_source`,
`names_withheld_in_source`, `never_identified`.

The book reports the naming. It does not join it. Every name requires a source,
and the validator rejects one without — because an unsourced name is an
accusation by this book, which it does not make. Nothing in that field is a
finding of guilt, and the rendered pages say so above every list.

`names_withheld_in_source` carries a fact worth its own value. Walter White's
NAACP investigation obtained the names of Mary Turner's killers and transmitted
them to the Governor of Georgia. The names were not published and no prosecution
followed. The record therefore holds an accusation whose subjects were identified
to the state and never charged, which is a different thing from an unsolved
killing, and the schema keeps them different.

## 5. Domains of harm, and the web

`classification` says what kind of event it was — lynching, massacre, wrongful
conviction. `harm_domains` says **what was injured**. They are different
questions, and the second is the more useful one.

Note what this axis is not. It is **not** a classification by identity. The book
does not sort entries by who was harmed; race appears in the record as a fact of
the conduct, never as a filing category. Sorting victims by identity reproduces
the logic that produced the injuries. Sorting *injuries* by what they broke does
the opposite.

| Domain | What it names |
| --- | --- |
| `physiological` | The body. Killing, torture, maiming, disease, treatment withheld. |
| `spiritual` | The soul and the ties that bind it — to ancestors, to the dead, to land, to rite. Desecration, burial denied, severance from lineage. |
| `social` | Standing and belonging. A community dispersed, a class prevented from re-forming, a people driven out. |
| `political` | Self-governance. The franchise, office, representation, standing to be heard. |
| `economic` | Property, wages, land, business, inheritance, and the compounding of what was taken. |
| `educational` | Access to learning, literacy, and credential. |
| `interpersonal` | The bonds between people. Kinship, marriage, parent and child, line of descent. |
| `intrapersonal` | The interior life. Esteem, identity, the self a person is permitted to hold. |

An entry carries as many as apply, and most carry four.

**Soul-tie** is held inside `spiritual` rather than given its own value, because
in this corpus it is never severed alone — it comes with `interpersonal` where
the tie is to kin, and with `spiritual` where it is to ancestors, the dead, or
land. If entries accumulate where the tie is the whole of the injury, it earns
its own domain and should be split out.

### The web

Because domains are shared, the log stops being a list of claims and becomes a
web. Tulsa and chattel enslavement are joined by `economic`; Kennard and Ocoee by
`political`; Till and Mary Turner by `spiritual`. Two entries a century apart are
related by the thing they broke, which is a relation no chronology shows.

`harmWeb()` computes the whole structure — frequency, co-occurrence, and the
entries under each domain — and `web.html` renders it. Nothing is stored, so the
findings cannot drift from the data as entries are added.

Two findings the web surfaced, both computed rather than asserted:

**No cell in the matrix is blank.** Every pair of the eight domains meets
somewhere in the corpus. Five pairs meet in exactly one entry, and it is the same
entry every time — chattel enslavement, which carries all eight domains alone.
Remove it and the web comes apart at five joints. That is a statement about the
corpus and about the thing it records.

**`educational` appears in two entries of eighteen.** That is a gap in this
corpus, not a gap in the history: anti-literacy statutes, the closure of public
schools under massive resistance, and the destruction of school buildings in
several of the massacres already entered all belong here and are not yet written.
The validator reports thinly covered domains on every run, and the honest
response is to add the missing entries rather than to broaden the tagging on the
existing ones until the number looks better.

## 6. The route of authority

Every actor stood somewhere on a ladder: the holder and the overseer, the mob
acting as their proxy, the town, the county, the district, the state, the
federal government, and the Supreme Court above all of it. `respondents.echelon`
records where the actor stood. `process.escalation` records every rung the matter
reached — or failed to — with the forum that sat there and what it did.

This is the nearest thing the book has to an **appeal route**, and it is what
lets the log ask the question the ladder exists for: *was the matter ever heard
above the level of the person who caused it?*

### The two tracks

`track` separates the route running **against the perpetrators** from the route
the state ran **against the harmed** — the survivors of Elaine tried for
surviving, the Groveland men convicted and reconvicted, Clyde Kennard imprisoned
for applying to a college.

They are kept apart because in this corpus the inverted track routinely climbs
higher. Three of the four entries carrying one climbed above their own
perpetrator track, and three reached the Supreme Court. Only one perpetrator
track ever reached that rung, and it went there to be undone: Colfax, where the
corpus's only convictions were vacated in *Cruikshank*.

### The finding

Of the 17 matters running against a perpetrator, the height of the actor
predicts whether anything above them ever heard it, and in this corpus it
predicts it completely:

| Actor stood at | Heard above the actor's own rung |
| --- | --- |
| County level or above | **0 of 4** |
| Below county level | **13 of 13** |

When a mob or a private holder did it, the matter sometimes climbed. When an
organ of the state did it — a county's own officers at Elaine, a county sheriff
at Groveland, a state agency in Kennard's case, a federal service at Tuskegee —
the matter never once got above the level of the body that did it. The forum and
the actor were the same institution.

This is computed on every build from the escalation recorded in each entry. It
moves as entries are added, and it is a statement about this corpus, not a claim
about cases outside it. `routes.html` renders it, and `routeFinding()` reports
the n alongside the result so the small denominator is never hidden.

One entry carries no perpetrator track at all — *Dred Scott* — because the
conduct was lawful judicial action and there was nothing to prosecute. That is
recorded rather than papered over, and the page says so.

## 7. Interstitial harm

`harmed.interstitial` records what falls between the events and is counted
nowhere: property abandoned under threat, exile, testimony never given, kinship
severed by sale, title transferred, and effects that continue to fall on people
who were never present at the event. These harms have no date, no forum, and no
tally in any source. The field exists because leaving them out would let the
book's own structure — one entry, one incident, one disposition — do the same
work of erasure that the tallies do.

## 8. Transmitted harm

`harmed.interstitial` records what falls between events within one generation.
`harmed.transmitted` records what outlives it.

These are different, and the second is the hardest thing in this book to
establish and the easiest to overstate. So the standing of the claim is recorded
**on the claim itself**:

| Standing | Meaning |
| --- | --- |
| `documented` | Established by record: title transferred and never disturbed, a population displaced and kept out, wealth destroyed and not rebuilt, measured effects in later research. |
| `argued_in_literature` | Advanced in a scholarly or clinical framework. Recorded as an argument, with its proponents named, and **never converted into a finding**. |
| `contested` | The literature is in open disagreement. |

Anything other than `documented` requires a note saying whose argument it is and
that the book does not adopt it. The validator enforces that, and further
requires that a claim standing as `argued_in_literature` actually cite a
`clinical_research` vantage — the argument must be attributable to someone.

Five entries carry documented transmission. One carries an argued one.

### Post Traumatic Slave Syndrome

Joy DeGruy's *Post Traumatic Slave Syndrome: America's Legacy of Enduring Injury
and Healing* (2005; revised 2017) is the framework this field was added to hold.
Her argument is that multigenerational trauma from chattel slavery together with
continuing oppression, absent any opportunity to heal, produces adaptive survival
behaviours that outlive the conditions requiring them — she names vacant esteem,
ever-present anger, and racist socialisation.

It is entered on the chattel enslavement complaint as `argued_in_literature`,
with a `clinical_research` vantage, and the note says plainly what it is: an
influential and widely taught framework, used in clinical and community practice,
which is **not** a diagnostic category in the DSM, and which draws on an
intergenerational-transmission literature that is in part actively contested.

That is not a hedge and it is not a demotion. It is the same rule that governs
every other entry, applied to the hardest case. The book records an established
killing as a killing because the evidence establishes it, and records a
theoretical framework as a framework because that is what it is. A record that
inflated the second would forfeit the standing that lets it insist on the first.

The value of the framework to this instrument is that it names an injury the
rest of the schema could not see. Every other field here assumes a harm with a
date, a place, and a person it happened to. DeGruy's subject is the harm that has
none of those and is real anyway — which is exactly the harm a claimant is least
able to plead and a forum least able to hear.

### What could not be retrieved

The bibliography of the monograph, and a complete list of DeGruy's published
articles and instruments, **could not be retrieved**: this session has no network
egress and every host returns 403 at the proxy, NARA's catalogue API included.

`SRC-HISTORICAL-TRAUMA-LIT` records the scholarly field her work sits within —
Brave Heart on historical trauma, Duran and Duran on the soul wound, Danieli's
handbook of multigenerational legacies, Yehuda on biological correlates, Akbar,
the Clarks, Du Bois, Fanon. **That entry is a lineage, not a bibliography.** It
was assembled from knowledge of the field, not retrieved, and it is not a
reconstruction of what DeGruy cites. It is marked as such in the manifest and
must not be presented otherwise. Pull the actual citations from the book's notes.

## 9. "Unpunished" is derived, not asserted

`process.outcome` records what the legal system actually did:

| Outcome | Meaning |
| --- | --- |
| `no_process` | No investigation was ever opened. |
| `investigated_no_charge` | Investigated; no charges filed. |
| `charged_acquitted` | Charges filed; acquittal. |
| `convictions_vacated` | Convictions obtained, then set aside on appeal. |
| `convicted` | Criminal conviction of a perpetrator, sustained. |
| `civil_settlement` | Money paid; no criminal accountability. |
| `legislative_remedy` | A legislature enacted compensation or apology. |
| `posthumous_exoneration` | A wrongly convicted person cleared after death. |
| `unresolved` | Investigation opened and never closed. |

`process.unpunished` is **computed** from that value, not typed by hand. It is
true for every outcome except `convicted`. A civil settlement is not punishment.
A legislative apology is not punishment. An exoneration of the *victim* is not
punishment of the *perpetrator* — it is the state correcting one of its own
injuries while leaving the other untouched, and the book counts it that way.

`scripts/validate.mjs` recomputes the field and fails the build on any
disagreement, so the claim in the title of this book cannot drift from its data.

## 10. Identity: who is in the register, and on what terms

The hardest question this book answers is what to do with a person whose injury
is recorded and whose name is not.

The register (`data/register.json`) holds people, not statistics. Three
identity states:

- **`named`** — the name survives in a source.
- **`name_unrecorded`** — a specific individual, distinguished in the sources as
  a distinct person, whose name was not preserved. They get their own row. They
  are not folded into a number.
- **`collectively_recorded`** — where sources preserve only a count and no
  individuation, one row carries the count and says explicitly that it is a
  count. The book does not manufacture individuals it cannot distinguish, and it
  does not let a count masquerade as a person.

The second state is the point of the register. A death that appears in the
record only as an increment to a tally has been recorded twice as a loss: once
in the killing, once in the accounting. Giving it a row does not recover the
name. It does refuse the arithmetic.

### Standing: nobody is conscripted

`standing` is separate from identity, and this separation is deliberate:

- **`claimant`** — a living person, or a legal representative, who has actually
  asserted a claim. This value is entered only on documented assertion.
- **`decedent_of_record`** — a person whose injury is recorded. No claim is
  asserted on their behalf by this book.
- **`collective`** — a community or class named in the sources.

**Being recorded is not being made a claimant.** A person enters the register
because the injury is documented, not because anyone decided they should be
demanding something. The dead did not consent to the record and cannot consent
to a claim; the book will not put words in their mouths by classing them as
petitioners. What they establish is not a demand. It is the *situs* — the place
where the injury occurred, the fact that it occurred, and the evidence that it
went unanswered. Standing to demand belongs to the living who choose to assert
it, and to their descendants, and it is asserted by them, not by this file.

Every register row carries `consent_note` restating that.

### Voice

Where a source preserves a person's own recorded words, the `voice` field
carries them with its own citation. These are quotations from documents, not
reconstructions. **The book never composes speech for the dead.** If no words
survive, the field is absent — an absence that is itself part of the record.

## 11. Impediments

`data/impediments.json` catalogs the mechanisms that converted a crime into a
non-crime: doctrines of personhood and jurisdiction, immunities, evidentiary and
procedural bars, and the informal practices (coroners' findings of "death at the
hands of persons unknown", exclusion of Black jurors) that did the same work
without a written rule.

This is the analytically load-bearing part of the book. The entries are not a
list of bad outcomes; they are a list of *reasons* — and most of them are still
operative law. Each impediment names whether it is `written` (a statute, a
holding) or `unwritten` (a practice), and whether it remains `operative`,
`superseded`, or `repudiated`.

An entry links to impediments by id. Read across those links and the pattern the
book exists to show becomes legible: the same handful of doctrines, mostly about
who may hear a claim rather than whether the injury occurred, recurring across a
century and a half.

## 12. Officials acting beyond their role

A recurring classification is `official_participation` — conduct by sheriffs,
deputies, jailers, guardsmen, and physicians acting under color of law and
outside the authority their office actually conferred. The federal statutes
addressed to it are 18 U.S.C. § 242 (criminal) and 42 U.S.C. § 1983 (civil).

The book flags this separately from private violence because the remedies,
defenses, and immunities differ, and because an officer exceeding the statute of
their role is the case in which the state is both the injurer and the only
available forum.

## 13. Sources

`data/archives.json` is a manifest of the corpora this work draws on, with
locator URLs and access terms. Public-domain texts can be fetched on demand with
`scripts/fetch-archives.mjs`; nothing large is committed to this repository.

URLs in the manifest were written from knowledge of the collections and are
marked `verified: false` until someone resolves them and flips the flag. Treat
an unverified locator as a lead, not a citation.
