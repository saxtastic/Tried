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

### The perpetrator's commercial record

The strongest evidence in this book is not testimony. It is paperwork the
perpetrators created for their own purposes and kept because they needed it.

A bill of sale exists because **title had to be provable against third parties**.
So it was written, witnessed, and entered in the county deed book — and it proves
the transaction to us now for exactly the reason it proved it to them then. The
same is true of estate inventories, division-of-property decrees, chattel
mortgages pledging people as collateral, trading-firm ledgers, and insurance
policies written on enslaved lives. `commercial_record` is a vantage of its own
for this reason: it is not an administrative record kept by a government about a
population, it is *the transacting party's own instrument*.

The federal government's role is worth stating precisely. The Act of 2 March
1807 ended the international trade from 1808 and required a **manifest for every
enslaved person shipped coastwise** — name, age, sex, height, owner, port of
departure, port of arrival. The United States did not prohibit the domestic
trade; it regulated it, demanded the paperwork, and preserved it. The only rung
of the ladder of authority that ever touched that trade did so to document it,
and the document is now the evidence.

This bears directly on an objection the book has to answer. It is often said
that slavery's harms cannot be entered in a log of crimes because they were
lawful where they occurred. The four axes already answer it: `finding.act` says
whether the conduct occurred, `offense` names what it constitutes on its face,
and `process.outcome` records separately that no forum ever treated it as an
offence. A bill of sale establishes the act overwhelmingly. That it established
no crime at the time is a fact about the forum, recorded in its own field, and
it does not travel backwards to unmake the conduct.

And the objection fails on its own terms in at least one entry. The Clotilda
carried roughly 110 people to Alabama in 1860, half a century after the trade was
prohibited and forty years after Congress made participation in it piracy
punishable by death. The conduct was a capital crime when it was committed, the
perpetrators are named — one of them wrote his own account of the voyage — the
wreck was confirmed in 2019, and nobody was ever punished.

The commercial record also carries the only individuation prospect at scale in
this register. Every other collective row here is a count because no source
preserved the names. `PR-COLLECTIVE-DOMESTIC-TRADE` is a count only because this
book has not transcribed them: the deed books, manifests and firm ledgers name
people in very large numbers. The 272 sold by the Maryland Jesuits in 1838 are
named in the sellers' own articles of agreement, which is precisely why several
thousand descendants can identify themselves today and why that entry is the
only one in the corpus where a perpetrator institution's own record produced
material restoration. **Where the names survive, the claim survives with them —
and they survive because someone needed a receipt.**

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

Of the matters running against a perpetrator, the height of the actor bears on
whether anything above them ever heard it — but the corpus has already corrected
this finding once, and the correction is worth keeping in view.

At eighteen entries, ending in 1960, the separation was total: **0 of 4** matters
against an actor at county level or above were ever heard above that level, and
**13 of 13** below it were. The methodology said it "predicts it completely."

Adding entries from the civil rights era and after broke that. Prince Edward
County was a county actor and the matter reached the Supreme Court; the
sterilisation entry has a state actor and reached a federal court. The current
figures are **2 of 7** and **16 of 17**.

The sharper reading is that the original split was measuring era, not echelon:

| Actor at county level or above | Heard above their own rung |
| --- | --- |
| Before the civil rights era | **0 of 3** |
| Civil rights era or later | **2 of 4** |

The forums that could hear a matter against a state actor largely did not exist
for most of this corpus's span. Where an actor was an organ of the state and the
period was Jim Crow or earlier, nothing above it ever heard the matter — the
forum and the actor were the same institution. Where federal civil rights
jurisdiction existed, sometimes something did.

Tuskegee is the instructive exception in the other direction. A federal actor,
running into the 1970s, and the matter still never got above the federal rung: no
criminal process at any level, and a civil settlement in a federal court, which
is the same rung the actor stood on.

All of this is computed on every build by `routeFinding()`, which reports its n.
The n is small and the finding will move again. **It has moved once already, and
the fact that adding entries changed it is the reason the figures are computed
rather than written down.**

One entry carries no perpetrator track at all — *Dred Scott* — because the
conduct was lawful judicial action and there was nothing to prosecute. That is
recorded rather than papered over, and the page says so.

## 7. The claim of sanction

Some of the actors in this book were not mobs. They were persistent, named,
officered bodies that **arrogated the state's function** — they claimed the right
to try, to sentence, and to punish, and they organised themselves to look like
an authority while doing it.

`data/organizations.json` records them, and the analytically load-bearing field
is `claimed_sanction`: what authority the body asserted, and how it made that
assertion visible. The forms recur — ritual, titles and hierarchy, written
notice, disguise or conversely a uniform, published platform, advance notice of
an election it intended to decide by force, and in one case a deliberated
sentence carried out on a stranger because a jury had acquitted someone else.

This is the mirror of the book's other recurring finding. Section 17 records
officials acting *beyond* the statute of their role. These are private bodies
claiming the role entirely. Both are the same displacement of authority, from
opposite directions, and in several entries they meet: a sheriff surrenders
custody and an organisation carries out the sentence.

`respondents.organization` links an entry to the body, and `claimed_sanction` may
also be recorded on the entry where the claim was expressed in that particular
act. The validator requires that a body entered here states what it claimed —
naming an organisation without recording the arrogation would be empty.

### What ever stopped one

`state_response.suppressed` records whether any authority ever put a stop to it.
**Two of six.**

The first Klan was suppressed, and suppressed effectively, by the Enforcement
Acts of 1870 and 1871 — the third of which is the Ku Klux Klan Act — under which
Grant suspended habeas corpus in nine South Carolina counties and hundreds of
prosecutions followed. It is the one occasion in this corpus on which the federal
government destroyed a terrorist organisation rather than declining to act. It
worked. *Cruikshank* then narrowed the constitutional basis for it, and nothing
comparable was attempted for a century.

The United Klans of America was ended in 1987 by a civil verdict of $7 million
obtained by Beulah Mae Donald, whose son the organisation had killed. Its
headquarters was signed over to her. **A tort claim brought by a victim's mother
did what criminal law had done to no such organisation in a hundred years**, and
she died the following year.

The second Klan was formally dissolved in 1944 for an unpaid tax debt.

## 8. Interrogating the record

`scripts/interrogate.mjs` reads the log's own citations and produces a **research
brief**: what an entry currently establishes, what its sources cannot be asked to
establish, the questions the data itself raises, and where the answers would be.

It generates the plan, never the findings. Nothing in it fetches anything or
supplies a fact; every line is derived from what is already recorded, so a brief
cannot claim more than the corpus does.

```bash
npm run record-book:interrogate CL-1918-TURNER          # full brief
npm run record-book:interrogate -- --source SRC-NAACP-PAPERS
npm run record-book:interrogate -- --gaps               # ranked, corpus-wide
npm run record-book:interrogate -- --json CL-1918-TURNER
```

The core of it is that **a source is not reliable or unreliable; it answers some
questions and is silent or self-serving on others.** Every vantage carries three
statements: what it establishes, what it is silent on, and how to press it. A
perpetrator record is the strongest proof of an act and says nothing about harm.
Contemporaneous press supplies a stated cause that is usually the pretext, which
is exactly why reading it against the official finding works. Scholarship
establishes nothing new by construction — its value here is the footnotes.

Questions are raised by conditions in the data, not by judgement:

- attribution `unattributed` → who would have written a name down, and in which
  record group
- a count estimated and never fixed → what would individuate it
- a `collectively_recorded` register row → the individuation task, with that
  row's own sources attached
- restoration none or symbolic → what forum remains, with the **operative**
  impediments named, because those are current law and would have to be met
- `concurrence.diverge` → what independent vantage would resolve it
- a respondent recorded `names_withheld_in_source` → flagged **high priority**,
  because the identification already happened once and it is a retrieval problem
  rather than an investigative one
- unresolved locators → the fetch list

It also proposes sources used by entries facing the same impediments but not yet
cited on this one, on the reasoning that an evidentiary route which worked
against a given bar is likely to work against it again.

Run `--gaps` and the corpus ranks itself by how much is still open. That ranking
is the work plan.

## 9. The child

Harm to children is not a category of entry in this book. It is a stage in most
of them — **11 of 25 entries, in 5 of the 6 periods the log covers.**

`era` places every entry in one or more periods: `atlantic_trade`,
`domestic_trade`, `reconstruction`, `jim_crow`, `civil_rights`, `modern`.
Periodisation is what lets a harm appear as a continuity rather than a series of
incidents, and for children that is the only way it is visible at all, because it
is the same injury arriving in different institutions.

`harmed.children` records how a child was reached, and requires a field the rest
of the schema has no place for: **`carried_into_adulthood`**. That is where the
harm is actually collected. A child kept from literacy could not read a labour
contract at thirty. A child who lost five years of schooling in Prince Edward
County did not get them back and carried lower attainment and earnings for a
working life. A girl sterilised at twelve carries the whole of it into an
adulthood she did not consent to enter that way.

The field exists because **every other field in this book assumes an adult with
capacity** — a claimant who can assert, a forum that can hear. That assumption
fails precisely where most of these injuries begin.

### The two systems

Two institutions reach a child before any court does.

**Schooling.** The anti-literacy statutes made teaching a child a crime, enacted
directly after revolts on the express reasoning that literacy made a person
ungovernable. Prince Edward County closed every public school for five years
rather than admit Black children. Clyde Kennard was imprisoned for applying to a
college. In each the actor is a legislature, a county board, or a state agency —
not a mob.

**Medicine.** The Public Health Service ran a forty-year study on men it
deceived. Eugenics boards and federally funded programmes sterilised women and
girls, two of them aged fourteen and twelve, on a consent their mother could not
read.

**The two meet.** The classification that selected many of those sterilised —
feeblemindedness — was manufactured by intelligence testing applied to Black
children in schools, and the operation was then performed by a health system
acting on that classification. The child passed from one institution to the
other, and the record of the first became the warrant for the second. That is why
they are one entry and not two.

### Where the corpus is still thin

Reconstruction carries two entries and neither records a child harm. That is a
gap in this corpus, not a claim about the period, and `children.html` says so on
the row rather than leaving the zero to be read as a finding.

Adding the three educational and medical entries also corrected a number the book
had reported on itself: `educational` stood at 2 of 22 and the methodology said
the honest response was to write the missing entries rather than broaden the
tagging. That is what these are.

## 10. Rights beyond the enumerated catalogue

The charge was kidnapping. It was also the destruction of a right to live, to
move, to keep a family, to learn, to vote, to hold what one built, and to take
part in what a society makes of itself. `data/rights.json` names twenty-one, and
`rights_violated` links each entry to the ones its conduct destroyed.

**Every right here is tied to the instrument that recognises it, or marked as
recognised by none.** That is the discipline that keeps this from being a list of
grievances: a right either appears in a document that can be cited, or it is
labelled as a moral claim and not passed off as law.

### The caveat that has to come first

**Most of these instruments postdate most of these entries, and none applies
retroactively.** The Universal Declaration is 1948, the Covenants 1966, the
Declaration on the Right to Development 1986 — which the United States voted
against — and the Basic Principles on Reparation 2005.

A right named against an entry therefore *characterises the conduct*, exactly as
`offense[]` does. It is not an assertion that a remedy was available at the time,
and nothing here should be put to a forum as though it were. The rendered page
says this before anything else.

### What the catalogue does show

Eight of the twenty enumerated rights have **no U.S. constitutional analogue at
all** — education, health, property against arbitrary deprivation, participation
in cultural and scientific life, development, reparation, personhood before the
law as such, and consent to medical experimentation as an express term.

Two are worth naming specifically.

**UDHR art. 27 and ICESCR art. 15** — the right to participate in cultural life,
enjoy the arts, and share in scientific advancement and its benefits — is real
positive international law, and it is the closest existing recognition of the
interest in creating and contributing. It has no domestic constitutional
analogue.

**The Basic Principles on Reparation (2005)** name five forms: restitution,
compensation, rehabilitation, satisfaction, and guarantees of non-repetition.
Those map almost exactly onto `restoration.forms` in this book — material,
symbolic, institutional reform. The mapping was not designed. The instrument and
the log arrived at the same categories independently, which is some evidence that
the categories are the right ones.

### The right to an effective remedy is derived, not stored

UDHR art. 8 and ICCPR art. 2(3). **Every entry in this book violates it by
construction**: an established act with no forum, no conviction and no
restoration *is* the denial of an effective remedy. Storing it twenty-five times
would carry no information and would let the count drift, so the validator
rejects it as a stored value and the pages derive it.

### What was foreclosed

`foreclosed_contribution` records the interest no instrument protects: what a
person would have made.

The field states **the input that was destroyed**, and never the output. That
line is not a matter of tone — it is enforced. An entry whose
`foreclosed_contribution.quantifiable` is anything but `false` fails the build.

The reason is the same reason the rest of the book works. A counterfactual
asserted as evidence would be indistinguishable from the fabrications this book's
whole evidentiary standard exists to exclude, and the first reader to catch one
would be right to discard everything else with it. So the corpus records that
Prince Edward County withheld on the order of **ten thousand child-years of
schooling** — which is arithmetic on documented enrolment and a documented
five-year closure — and records nothing whatever about what those children would
have gone on to do.

**The unknowability is the sharper claim.** It is not possible to say what was
lost. That is what makes the loss total rather than measurable, and a specific
guess would shrink it to the size of the guess.

`RT-UNREALISED-CAPACITY` is the one unenumerated right in the catalogue, named
for exactly this and marked as protected by nothing.

### What a repeal would resolve

Each impediment carries `if_removed`: what removing it would actually open. Most
would open nothing, and identifying which is the useful part.

The two that would matter are **limitations** — specifically a tolling provision
running from the date facts became provable rather than from the injury — and
**descendant standing**, which is the bar that makes reparative claims
legislative rather than judicial. No court can create that standing; a
legislature can.

`npm run record-book:interrogate -- --live` runs the whole query: what remains
actionable, by which route, and what has ever actually delivered anything. The
answer is that **every material restoration in this corpus came through a
legislature, a claim bill, or an institution acting on its own record. None came
from a court applying existing law to a historical claim.**

## 11. Legislation with disparate effect

Impediments blocked a remedy. These statutes **were the injury**, working through
the ordinary machinery of law. `data/legislation.json` records nine.

`intent` takes `explicit`, `facially_neutral`, or `unstated`. The middle value is
the one that matters, because **five of the nine name no race at all** and three
remain in force.

### The mechanism is required

Every entry must state `disparate_effect.mechanism`: **how a text that names no
race produced a racial result.** The validator rejects an entry without it.

That rule is what separates this file from a list of grievances. A disparate
outcome is not by itself an indictment of a statute; the channel has to be
nameable. Where it is, the record is strong:

- **The disfranchising constitutions** tested for literacy in a population that
  anti-literacy statutes had spent a century and a half preventing from becoming
  literate. The mechanism was to test for a deficit the same legislatures had
  created — which is why that entry links directly to `CL-1740-ANTI-LITERACY`.
- **The Social Security Act and the NLRA** excluded agricultural and domestic
  workers. Occupational categories, not racial ones — but roughly three in five
  Black workers nationally were in exactly those two, the exclusion was demanded
  by Southern delegations as the price of passage, and the categories were
  therefore selected knowing what they contained. This is the canonical American
  instance of a facially neutral classification chosen for a known result.
- **The GI Bill** is race-neutral in text and was administered by states, banks
  and universities. The mechanism is *delegation*: a neutral entitlement running
  through segregated institutions produces a segregated result without a single
  discriminatory word in the statute.
- **The 100:1 crack and powder ratio** attached a hundredfold sentencing
  difference to a difference in preparation rather than in conduct. It is still
  in force at 18:1.

### Contested is a value, not a hedge

The 1994 Crime Bill is recorded as `contested`, because the causal share is
genuinely disputed: most incarceration growth was at state level and much of it
predates the Act. Entering it as `documented` because it points the expected way
would be the same error the book refuses everywhere else, and the note says so.

### The unverified entry

One entry — contemporary federal employment changes affecting Black women — is
`asserted_not_verified`. It carries **no sources by design**, is rendered in its
own colour behind a warning, and its note says it must not be cited.

It is kept rather than dropped because the assertion is worth testing and **the
test is worth writing down**. What is documented is the *structural exposure*:
Black women have been over-represented in federal civilian employment for
decades, public employment has been a principal route into the Black middle
class, public-sector contraction has previously fallen disproportionately on
Black workers, and Black women complete bachelor's degrees at higher rates than
Black men. None of that establishes the asserted effect. It establishes that the
exposure exists and that the mechanism would be occupational concentration rather
than any racial term.

What is **not** established: any employment figure, any named statute, any causal
attribution. The assistant that built this file has a May 2026 knowledge cutoff
and no network access, so no current series could be consulted.

The entry names what would settle it: BLS Current Population Survey microdata
disaggregated by race and sex, OPM FedScope for federal workforce composition and
separations, EEOC federal workforce reports, and identification of the specific
instrument alleged to have caused it. **It becomes documented when a named
instrument and a measured series are both on file, and not before.**

This is the schema working on live material, which is what it was built for. The
book records the assertion, its mechanism, and its test. It does not adopt it.

## 12. Interstitial harm

`harmed.interstitial` records what falls between the events and is counted
nowhere: property abandoned under threat, exile, testimony never given, kinship
severed by sale, title transferred, and effects that continue to fall on people
who were never present at the event. These harms have no date, no forum, and no
tally in any source. The field exists because leaving them out would let the
book's own structure — one entry, one incident, one disposition — do the same
work of erasure that the tallies do.

## 13. Transmitted harm

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

## 14. "Unpunished" is derived, not asserted

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

## 15. Identity: who is in the register, and on what terms

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

## 16. Impediments

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

## 17. Officials acting beyond their role

A recurring classification is `official_participation` — conduct by sheriffs,
deputies, jailers, guardsmen, and physicians acting under color of law and
outside the authority their office actually conferred. The federal statutes
addressed to it are 18 U.S.C. § 242 (criminal) and 42 U.S.C. § 1983 (civil).

The book flags this separately from private violence because the remedies,
defenses, and immunities differ, and because an officer exceeding the statute of
their role is the case in which the state is both the injurer and the only
available forum.

## 18. Sources

`data/archives.json` is a manifest of the corpora this work draws on, with
locator URLs and access terms. Public-domain texts can be fetched on demand with
`scripts/fetch-archives.mjs`; nothing large is committed to this repository.

URLs in the manifest were written from knowledge of the collections and are
marked `verified: false` until someone resolves them and flips the flag. Treat
an unverified locator as a lead, not a citation.
