# Verifying the model against other trades

The simulator asserts one construct it invented — the **necessity–silence
conflict** — and several it borrowed. An invented doctrine that only its author
finds compelling is worth very little. So each construct is checked against a
named framework from a profession that had to solve the same structural problem
without any reference to this one.

Convergence from an independent field is evidence the construct is real.
Divergence is evidence the model is wrong. Both happened.

```bash
npm run verify              # the full report
npm run verify -- --json    # machine-readable
```

Nine frameworks: **5 strong, 3 partial, 1 divergent.**

---

## What was corroborated

### The necessity–silence conflict is not idiosyncratic

Three fields reached the same structure independently.

**Civil aviation** (ICAO Annex 19, Just Culture) applies the *substitution
test*: would another similarly trained person, in the same circumstances with
the same information, plausibly have acted the same way? If yes, the finding is
systemic — the defect belongs to the procedure that forced the choice, not to
the person who made it. That is the necessity–silence conflict, derived from
accident data rather than from law.

**Building regulation** already ships the proposed remedy as working practice.
Performance-based codes state an objective; where a builder meets it by other
means, the Authority Having Jurisdiction may approve but must *find and record
equivalency against the stated objective*, and that record is what an appeal
reviews. Discretion is wide, exercised daily, and reviewable. The claim that
standardless discretion is fixable by supplying an objective plus a recorded
finding is not theoretical — an entire industry runs on it.

**Military doctrine** reached the identical conclusion from the opposite
direction. Mission command deliberately refuses to prescribe method, stating
purpose and end state instead, and judges the subordinate's decision against
that intent. A profession whose whole business is irreducible uncertainty
concluded that the answer to unavoidable discretion is *not more rules* but a
stated intent to be judged against.

That is convergence, not coincidence. It also reframes the ask: an institution
resisting a standard because it needs room to judge is resisting the wrong
thing. Intent constrains without prescribing, and it is what makes wide judgment
defensible rather than arbitrary.

### Departure from written process is normal

**Resilience engineering** (work-as-imagined versus work-as-done) and
**Vaughan's normalization of deviance** both hold that the gap between
documented procedure and actual practice is the ordinary operating condition of
a real institution, not a rare failure.

This sharpens the claimant's burden rather than easing it. The question is not
whether the institution departed from its written process — it always does — but
whether it *knew, tolerated and relied on* the departure, and then invoked the
written text against one person after the fact. That is narrower and far more
winnable.

---

## What was corrected

### The rigid regime was scored wrong

This is the divergence, and it is the most valuable result in the exercise.

The simulator scored a rigid, rule-dense institution as **favourable to the
claimant**: more written rules means more to breach, and a published rule binds
its author first.

**Financial reporting spent decades learning the opposite is at least as often
true.** The rules-based versus principles-based debate (US GAAP against IFRS)
established that bright lines are evaded by structuring conduct to fall just
outside them. Density produces gaming, not compliance. A dense rulebook is a
*shield* as much as a sword, because conduct engineered to satisfy every written
requirement while defeating its purpose is formally unimpeachable.

The model now raises that shield in any rule-dense regime, along with the answer
the accounting profession settled on: a rule has an objective; conduct meeting
the text while defeating the objective is not compliance; and a party invoking
the rulebook as a shield must show it made the judgment *at the time* rather
than reconstructing it afterwards.

A rigid institution no longer reads as unambiguously better for the claimant,
and a test now asserts it.

### Deference should be earned the way every other profession earns it

**Medicine** grants deference to expert judgment — but conditionally. Under
*Bolam* as qualified by *Bolitho*, the respondent must produce the professional
standard, show conformity to it, and the court may still reject a standard that
will not bear logical scrutiny.

Educational deference under the *Ewing* line asks for no equivalent showing. The
institution's own characterisation of its decision as academic largely secures
the deference.

That asymmetry is an argument, and the model now carries it: the party seeking
the benefit of deference should carry the burden every comparable profession
carries.

### The construct needed a way to be proved

The simulator asserted that discretion was "functionally required" without
supplying any way to establish it on a record. Aviation's substitution test does
exactly that, and it is a question a record can actually answer. It is now part
of the necessity–silence finding.

---

## The limit that applies to all of it

Every framework surveyed here is **prospective and systemic** — built to improve
what happens next, across a population, often by explicitly declining to assign
individual blame. Aviation buys its diagnosis with a protected reporting channel
and a decision not to pursue individuals. Safety science refuses to adjudicate
at all, because adjudicating suppresses the reporting the method depends on.

Adjudication is **retrospective and individual**. One person's loss is the whole
subject of the proceeding.

The diagnoses transfer. The postures do not. A claim that borrows aviation's
systemic framing along with aviation's no-blame posture will be met — correctly
— with the objection that it is asking the wrong forum for the wrong thing. The
systemic finding has to resolve back into a remedy for one identified person,
and that step is the claimant's to make, not the borrowed framework's.

---

## Known gaps this exercise exposed and did not close

- **No temporal model of practice.** Vaughan's account turns on a *sequence* of
  tolerated departures resetting the baseline. The simulator treats settled
  practice as binary — established or not — with no account of how many
  instances over what period. A real claim needs that sequence, and it is
  exactly what discovery should target. Half-implementing it would be worse than
  naming it.
- **Nondelegation is weaker than the model implies.** The intelligible-principle
  doctrine is the correct doctrinal home for the necessity–silence claim, but it
  almost never succeeds against a public body; courts have accepted very thin
  principles. Its real force is as the reason a *legislature* should act, and
  against private or quasi-private institutions where the deference to
  legislative judgment does not apply.
- **The equivalency finding is harder here.** Building officials decide against
  physical criteria that can be tested independently. Academic and disciplinary
  judgments have no comparable external referent, so a recorded equivalency
  finding is easier to write to a predetermined conclusion.

## The frameworks surveyed

| Trade | Framework | Checks | Verdict |
|---|---|---|---|
| Civil aviation safety | SMS / Just Culture, substitution test | necessity–silence | strong |
| Resilience engineering | Work-as-imagined vs work-as-done | custom and estoppel | strong |
| Organisational sociology | Normalization of deviance | custom and estoppel | strong |
| Building regulation | Performance codes, the AHJ, recorded equivalency | supply an intelligible principle | strong |
| Military command | Mission command, commander's intent | supply an intelligible principle | strong |
| Financial reporting | Rules-based vs principles-based standards | self-binding breach | **divergent** |
| Medicine | Standard of care, peer review | deference | partial |
| Administrative law | Intelligible principle, guidance vs rule | necessity–silence | partial |
| Sports officiating | Clear-and-obvious-error review | standard of review | partial |
