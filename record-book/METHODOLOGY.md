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

## 2. Three axes, kept apart

The single most important rule in this book is that **whether the violence
happened, who did it, and what a forum said about it are three separate
questions.** Collapsing them is how a killing becomes an allegation.

| Axis | Field | Answers |
| --- | --- | --- |
| **Act** | `finding.act` | Did it occur? |
| **Actor** | `finding.attribution` | Who did it? |
| **Forum** | `process.outcome` | What did a court or commission do? |

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

## 4. Interstitial harm

`harmed.interstitial` records what falls between the events and is counted
nowhere: property abandoned under threat, exile, testimony never given, kinship
severed by sale, title transferred, and effects that continue to fall on people
who were never present at the event. These harms have no date, no forum, and no
tally in any source. The field exists because leaving them out would let the
book's own structure — one entry, one incident, one disposition — do the same
work of erasure that the tallies do.

## 5. "Unpunished" is derived, not asserted

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

## 6. Identity: who is in the register, and on what terms

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

## 7. Impediments

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

## 8. Officials acting beyond their role

A recurring classification is `official_participation` — conduct by sheriffs,
deputies, jailers, guardsmen, and physicians acting under color of law and
outside the authority their office actually conferred. The federal statutes
addressed to it are 18 U.S.C. § 242 (criminal) and 42 U.S.C. § 1983 (civil).

The book flags this separately from private violence because the remedies,
defenses, and immunities differ, and because an officer exceeding the statute of
their role is the case in which the state is both the injurer and the only
available forum.

## 9. Sources

`data/archives.json` is a manifest of the corpora this work draws on, with
locator URLs and access terms. Public-domain texts can be fetched on demand with
`scripts/fetch-archives.mjs`; nothing large is committed to this repository.

URLs in the manifest were written from knowledge of the collections and are
marked `verified: false` until someone resolves them and flips the flag. Treat
an unverified locator as a lead, not a citation.
