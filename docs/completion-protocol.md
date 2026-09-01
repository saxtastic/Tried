# Definition of completion

```bash
npm run complete                    # every gate, retest and benchmark
npm run complete -- --fast          # skip gates marked slow (the browser one)
npm run complete -- --json
npm run complete -- --strict        # non-zero unless the verdict is `complete`
npm run complete -- --known-open G4 # non-zero unless the only failures are the listed ids
```

The protocol is a record — `corpus/enoch/protocol/completion.json` — and
`scripts/completion.mjs` only executes it. That split is the point: what counts
as finished is something a reader can open and argue with, not a condition
buried in a script.

Enoch administers it, which fixes its scope. Enoch rules on **order**, never on
merit: this tool will say a gate was not run and will never say the work was not
worth doing. The protocol carries a `not_benchmarks` list naming what it refuses
to score, and a test asserts the protocol contains no executable code — a record
that could decide what passes it is not a record.

## Three verdicts

| verdict | means |
|---|---|
| `complete` | every gate passed and every benchmark read `met` |
| `incomplete` | something named came back failing, and it is printed |
| `test_retest` | the gates hold but a benchmark could not be *read* |

`test_retest` is the same third verdict a proposal resolves to, and it is not a
softer failure. It is the honest answer when the record does not separate the
outcomes, and it names the measurement that would. A skipped gate produces it
too: a skipped gate is not a passed gate.

## Gates

| id | command | asserts |
|---|---|---|
| G1 | `npm test` | every assertion in `test/` holds on this tree |
| G2 | `node sim/verify.mjs --strict` | nothing claims a basis it does not have |
| G3 | `node scripts/check-propose.mjs` | every proposal states seed, runs, thresholds, sensitivity |
| G4 | `node scripts/enoch.mjs --strict` | no point of order stands unanswered |
| G5 | `node scripts/check-tiers.mjs` | every surface resolves its tier at four viewports |
| G6 | `node scripts/build-registry.mjs --check` | the fellowships registry is in step with `data/open-calls/` |
| G7 | `node scripts/check-registry.mjs` | every reference record declares a basis and names an https source |
| G8 | `node scripts/check-vantage.mjs` | the vantage configuration is internally consistent |

G5 is the only gate with a prerequisite, and the browser Playwright wants must match the one the
machine already has. In this container that is Chromium 141 (Playwright build 1194) at
`/opt/pw-browsers`, which is why `package.json` pins `playwright` at `1.56.0`:
a newer Playwright looks for build 1234 and fails on a missing executable
rather than on anything about the site. `--fast` skips G5 and the run reports `test_retest`
rather than `complete`, because a skipped gate is not a passed gate. **[O]**

## Retest is a gate, not a nicety

Anything this repository generates must produce byte-identical output on a
second run from the same inputs. That is not fastidiousness: a report that
changes between runs cannot be cited, and a stale premise shipped for hours
here once because nothing was watching.

Each retest runs its producer **twice** and compares stdout; where the producer
writes files it compares those too, and against what was on disk *before* the
first run. A bundle that regenerates identically but differs from the committed
copy is stale — a different fault, reported as one.

## Benchmarks

Declared per project, in the project's own file. A project that declares no
benchmark is reported as **undeclared**, which is not the same as complete: it
is unmeasured. Four currently are.

A gate can also fail on something the project running the protocol cannot
close. G4 currently fails on `Q2-SURVIVAL`: two vantages answered, no
arbitration written, and one of the two answers is the simulator's own — and no
question is closed by the asker answering it. Enoch reports it out of order and
does not excuse it. A protocol that let a project mark another project's
obligation as satisfied would be certifying its own compliance, which is the
one thing the office exists to prevent.

The check vocabulary lives in the runner and is named from the protocol:
`basis_declared`, `owner_items_are_owed`, `csp_clean`,
`no_typed_score_claims_derivation`, `derivation_named`, `test_named`,
`command_produces`. A benchmark naming a check the runner does not implement is
a test failure, not a silent `test_retest` nobody reads.

## The one thing no script may answer

`owner_items_are_owed` exists to keep a hole open. Every item in
`awaiting_owner` is a question put to a person, and nothing derives it away —
the benchmark reads `unmet` if any item is marked answered in the file rather
than by the owner. Answered questions move to `resolved` carrying the answer,
who gave it and what changed, rather than being deleted; a question that
vanishes when it is answered leaves no way to check afterwards what the answer
was.

## Running without a session

`.github/workflows/gates.yml` runs the whole protocol on every push and every
pull request, and writes both the verdict and `npm run outstanding` into the run
summary, so the answer is readable from a phone. Before it existed, everything
here ran only when somebody chose to run it — which is how a stale premise
shipped for hours with nothing watching.

### The one allowance, and why it is where it is

The workflow invokes `--known-open G4`. G4 is `enoch --strict`, currently out of
order because `Q2-SURVIVAL` has two answers and no arbitration — and one of them
is the simulator's own, so it cannot close it.

That declaration lives in the workflow, in a file a reviewer reads, and **not**
in `completion.json`. A record that could excuse a failure against itself is the
structured-compliance shield this repository already found once, in accounting's
rules-versus-principles literature, and modelled as a defeater. The flag changes
the **exit code only**. The verdict in the summary still reads INCOMPLETE and
still names G4.

It cannot rot. The runner exits non-zero on three things besides an uncovered
failure:

| | |
|---|---|
| `no such id` | an allowance naming nothing looks like coverage and holds nothing open |
| `stale allowance` | the id is passing — delete the allowance to get green |
| `not covered` | something is failing that the allowance does not name |

So an allowance nobody needs any more turns the build red until it is deleted,
which is the only way one does not quietly accumulate.

**Not covered by the test suite:** the exit codes themselves. G1 is `npm test`,
so a test that ran the runner would run itself. All four paths were exercised by
hand on 2026-09-01 (unknown → 1, stale → 1, uncovered → 1, covered-only → 0).
What the suite does hold is the drift that would actually happen: an assertion
that every id the workflow names still exists in the protocol.
