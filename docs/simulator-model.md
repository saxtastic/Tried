# The model behind the simulator

This document explains what the simulator is doing and why, so that its outputs
can be argued with rather than merely read. It is a model of legal reasoning,
not a source of legal advice, and the case bundled with it is a template of
dials rather than a record of anything that happened.

---

## 1. Why a simulator at all

In the class of disputes this is built for — an individual against an
institution, across civil-rights, administrative, intellectual-property and
fiduciary dimensions at once — the record is usually not what decides the case.
Both sides can reach the same documents. What decides it is which principle the
tribunal treats as load-bearing, which sense of which word it adopts, and
whether the claimant is in a forum that is allowed to say so.

Those three things are arguable, and because they are arguable they are
simulable. That is the whole design premise: build the two agents, give them the
same corpus, and make the disagreement between them explicit enough to score.

## 2. Two agents, deliberately asymmetric

**The proponent** works forward. It takes each condition, evaluates its elements
against the record and the governing sense of the operative terms, and
assembles a rule.

**The opponent** does not need a theory of the case. It works through a
catalogue of defeaters — element unmet, no private right, the narrowest
reading, deference, discretion, exhaustion, timeliness, adverse precedent, and
the self-defeating premise — and needs only one of them to land.

Modelling that asymmetry matters. A simulator with two mirror-image advocates
produces flattering results, because it implicitly assumes the answering side
has to build something. It does not. It has to break one thing.

## 3. Judgment on principle

The bench nets each element (`support × (1 − defeat)`) against the standard of
proof, which sorts elements into met, contested, and unmet. Unmet elements sink
the condition regardless of principle: no amount of principle rescues an element
the record does not carry.

Contested elements — the ones inside the margin, where the tribunal could go
either way — are decided by **principled margin**. Each side's position carries
the weighted principles it vindicates, and the bench states which principle was
decisive. That is why every judgment names one.

The practical value is in the failure mode. A condition that loses **on
principle** with a strong record is telling you something specific: the evidence
was never the problem, and no amount of additional discovery will fix it. That
is the signature of a legislative problem wearing a litigation costume.

## 4. Words move, and the movement is the case

The lexicon holds dated senses for each operative term, and every condition is
scored under five regimes: originalist, enactment-era, contemporary, purposive,
and strict-textual.

The worked example is `discrimination`. In 1964 the word, as the statute used
it, reached both differential treatment and unjustified differential effect. It
does not reach effects today — not because the word changed in ordinary English,
but because *Alexander v. Sandoval* (2001) held that a private claimant cannot
enforce the regulations that reach them. The simulator records that as a
**narrowing event** with an attribution and a list of what was lost.

The interpretive sweep then answers one question: does the outcome move when the
regime moves? If it does, the dispute is about the words rather than about what
happened, and the durable fix is a definition rather than a better record. That
is a finding you can hand to a legislator; "we should have won" is not.

## 5. Precedent as a weight, not a wall

Each precedent carries Casey-style factors — reliance, workability, doctrinal
erosion, factual change, age — that resolve into an entrenchment score and one
of four postures:

| Posture | What to do |
|---|---|
| `entrenched` | It will not move judicially. Route it to the legislature. |
| `stable_but_pressable` | Confine it to its rationale; argue for a narrow reading. |
| `vulnerable` | Preserve the displacement argument, but win on distinction. |
| `ripe_for_displacement` | Press it directly, and plead the statutory fix in the alternative. |

The move ordering is deliberate: distinguish before limiting, limit before
pressing for overruling, and route to the legislature when the precedent is
immovable. Routing is not a fallback. Against something like *Sandoval* it is
the strongest available posture, because a statute displacing a holding does not
ask any court to admit error — it changes the text the holding construed, which
is the one move that is always available.

## 6. The gap register

A gap is where neither the enacted text nor any authority actually decides the
question. Four classes, each with its own legislative answer:

- **first impression** — nothing covers it; decided by principle → *codify the rule*
- **textual silence** — the provision never uses the operative term → *name the conduct*
- **definitional drift** — the reach depends on which sense governs → *define the term*
- **conflicting authority** — the authorities divide → *resolve the split*

Gaps are only registered for elements actually in play. An uncontested factual
element is not a question of first impression merely because no court has
bothered to say so.

## 7. Institutional translation

The same argument does not survive a change of venue, so every case is re-run
against four policy regimes.

| Regime | Claimant's theory | Respondent's answer |
|---|---|---|
| **Loose** — custom and judgment | Custom and estoppel | No rule, no violation |
| **Rigid** — dense enforced rules | Self-binding breach | Process followed |
| **Absent** — no policy at all | Standardless, therefore arbitrary | No reviewable standard |
| **Over-dense** — rules that conflict | Necessity–silence conflict | Reasonable reconciliation |

The portability table reports, for each regime, whether your actual theory
transfers, transfers weakened, or dies — which tells you how much of your
position is a real principle and how much is an artifact of this particular
institution's looseness.

### The necessity–silence conflict

The fourth regime is the one usually missed, and it is the most productive.

Where an institution's policy set is internally inconsistent, some provision
must be disapplied in every case. Discretion is therefore **functionally
required** for the institution to operate at all. But where the principal act
supplies no standard for choosing which provision yields, the discretion
actually exercised **can never be cited to any source**.

The result is power that must be used and cannot be justified: unreviewable by
construction, not by design. And the defect is not the individual decision. It
is the silence that makes every such decision unaccountable — which is why
winning one case does not fix it, and why the remedy is an amendment supplying
the standard rather than a judgment about one exercise.

## 8. The authority of the premise

This is the knot the simulator exists to untie.

You are asking a governing authority for relief, and part of your case is that
it governed wrongly. If the claim is framed as *this body has no rightful
authority*, then a grant of relief is the body conceding its own standing to
grant relief — which it cannot do, and which dissolves the remedy in the act of
awarding it. Push hard enough on the premise and you argue yourself out of the
forum. Stated at its sharpest: they cannot grant reparations if the grant
requires them to concede the totality of their governance.

The resolution is that "authority" is not one thing. It is three, and only two
of them are contestable:

1. **Constitutive** — the power to be the authority at all. Attacking this layer
   forfeits the forum. Nothing is gained here and everything is lost.
2. **Warrant** — the justification claimed for holding that power: stated
   purposes, published commitments, the charter's own terms. Fully contestable,
   and contesting it does not unseat the authority. It holds the authority to
   its own terms.
3. **Competence** — the particular exercise. Contestable and correctable as a
   matter of routine.

So the non-self-defeating frame is: **relief is not a concession of governance,
it is an exercise of it.** The respondent is asked to do what its own
constitutive commitments already oblige. Granting confirms the authority rather
than surrendering it — which is precisely why it *can* be granted.

The reparations form of the same move:

> **Thesis.** The remedy is owed because the conduct departed from the
> instrument.
> **Antithesis.** Granting it would admit a defect so deep that the authority to
> grant anything is in question.
> **Synthesis.** The obligation arises *from* the instrument, so performance is
> an act of authority *under* it. The respondent does not concede that it should
> not govern; it demonstrates that it does — by holding itself to the terms it
> wrote. The deeper the departure, the more the correction is required to
> preserve the authority, not to dissolve it.

The simulator scores this. A claim pleaded at the constitutive layer gets a
self-defeat risk near 1. The reframe converts each constitutive attack into the
warrant-level claim it was really making, and the risk drops to near zero
without giving up a single fact. In the bundled template it moves from 1.0 to
0.05.

The respondent's riposte — *your theory denies the premise on which any award
would rest* — is modelled explicitly as a defeater, and answered explicitly,
because it will be made and it needs an answer on the record rather than in a
footnote.

## 9. The statutory challenge is the output

Every place the claim fails for a reason a tribunal cannot fix is a place a
legislature can. The simulator collects those and ranks them by how much of the
case each unlocks:

- **restore private right** — the duty exists and was found enforceable in
  substance; only the forum is missing
- **supersede precedent** — where the holding is judicially immovable
- **define the term** — where the outcome turns on which dated sense governs
- **supply an intelligible principle** — where the necessity–silence conflict fires
- **resolve the split**, **name the conduct**, **codify the rule**
- **tolling and exhaustion** — where the institution controls both the internal
  clock and the internal remedy

This is why the simulator does not treat a barred claim as a loss. A bar is not
a finding that the conduct was lawful. It is a finding that *this forum is not
the one that says so* — and that distinction is the entire content of the
legislative case.

## 10. Passages — the intervals between the findings

Every section above scores a **state**: an element met, a condition established,
a precedent entrenched. States are what doctrine talks about, so states are what
got built first.

But nobody experiences a state. What a person experiences is the **passage**
between two of them — the interval after the record is requested and before the
record exists as a document. That interval is where claims are actually lost,
and they are not lost for doctrinal reasons.

This is the same gap the cross-domain verification found and could not close: no
temporal model. The passage layer is the fix, and it is a better frame than a
simple clock, because it names *what happens in the interval* rather than only
how long the interval is.

### The glitch

The record as **provisionally requested** and the record as **actually
documented** are not the same object. The delta between them is not an absence
of evidence — it *is* evidence:

| Glitch | What it tells you |
|---|---|
| `null_return` | A body required to hold the record produced nothing. Either it was never made (failure to maintain) or it is gone (worse). The institution must say which. |
| `reconstructed` | The document postdates the decision it explains. A rationalisation, not a record — and it earns none of the deference a contemporaneous document would. |
| `timed_out` | The interval simply ran. Where a body controls both the clock and the remedy, an unbounded process is a limitations defence nobody had to plead. |
| `substituted` | What arrived answers a question nobody asked. Substitution implies someone read the request and declined it. |
| `partial` | What is missing was selected by the party with an interest in the selection. |

Each is scored for evidentiary value and surfaces as a finding to plead in its
own right, not as a hole in the case.

### What the interval costs, and what carries a claim across it

Five decays run against the claim: **evidence** (retention schedules do their
work), **memory**, **standing** (the claimant graduates, leaves, or is removed,
and the status that made them owed something lapses), **capacity** (their ability
to keep going), and **salience** (everyone else stops finding it urgent).

Against those, five sustains — and the model is strict that a sustain only
offsets the decays it actually *reaches*. Representation carries the procedural
load and the clock; it does not restore capacity, and the model refuses to
pretend otherwise. Only one term reaches capacity:

**Spontaneous community engagement.** People who show up without being organised
into showing up. It is structurally lopsided — many follow the case, the
claimant knows few of them back — and the model scores that asymmetry as its
*strength*, not a defect. Reciprocal support is capped by how many relationships
one exhausted person can maintain. Asymmetric support is not capped, which is
exactly why it is the term that survives a long interval. It is a real relation
doing real work on unequal terms, and modelling it as anything softer would be
both untrue and useless.

### What is a finding here, and what is not

Capacity is the heaviest decay in this model and nothing but people touches it —
and that is **not a finding**. It is heaviest because its rate was set highest,
and only community reaches it because the reach lists were written that way.
Both are true by construction. Reporting either as though the model discovered
it would be laundering an authored judgment through an engine, which is exactly
the failure the register question was about.

Every weight here is stipulated, declares `basis: 'stipulated'` in the data, and
carries a `measurable_by` field naming what would have to exist for it to become
a number with a record behind it. For most of them the honest answer is *nothing
available here*.

So `sensitivity()` sorts every conclusion into three classes by perturbing all
weights ±40% simultaneously:

| Class | Meaning | Reportable? |
|---|---|---|
| `by_construction` | Follows from how the model is defined. Perturbation cannot touch it. | Never as a finding |
| `fragile` | Flips within a plausible weight range. | Only alongside the weights |
| `robust` | Survives every perturbation tried. | Yes |

On the template case, one conclusion is robust: **the claim does not survive
every passage intact.** That holds whatever the numbers. Which *particular*
passages fail is fragile — three distinct outcomes across the range — so the
passages must never be named without naming the weights.

That distinction is the whole value of stipulating weights rather than fitting
them. A stipulated weight is inspectable; a fitted one is not. But inspectable
only helps if the report says which of its own outputs are assumptions wearing
the costume of results.

### The transition as prose

There is a second, literal reading of all this, borrowed from writing rather than
from law. Findings emitted as discrete blocks with nothing between them read as a
*list*, not an argument. The connective tissue is what makes a sequence into a
case.

So every passage generates its transition sentence — what happened between one
finding and the next, in prose — and the CLI prints them between the condition
blocks. The passage is the part a reader skips and a tribunal never sees, which
is precisely why it has to be written.

### Why it is not decoration

A claim lost in an interval has not been decided against. It has been
**outlasted** — and the record shows the two identically. So the passages feed
the statutory challenge like every other failure: a null return produces
*mandatory retention with a stated consequence*; a timed-out or reconstructed
passage produces *bound the interval and date the reasons*; standing lost mid-process
produces *freeze standing for the duration of a pending matter*, because standing
that lapses on the institution's own timetable rewards delay directly.

## 11. What this is not

It is not a predictor. The weights are stipulated, not fitted, and the corpus is
small by design so that every input is inspectable. Its value is in forcing the
argument into a form where the disagreements are locatable: change a fact
strength, a principle weight, or a sense boundary, and watch what moves. Where
nothing moves, you have found something robust. Where everything moves, you have
found the thing worth arguing about.
