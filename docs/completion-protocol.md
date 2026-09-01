# Definition of completion

```bash
npm run complete                 # every gate, retest and benchmark
npm run complete -- --fast       # skip gates marked slow (the browser one)
npm run complete -- --json
npm run complete -- --strict     # non-zero unless the verdict is `complete`
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

G5 is the only gate with a prerequisite, and Playwright is deliberately not a
declared dependency: the browser it wants must match the one the machine
already has. In this container that is Chromium 141 (Playwright build 1194) at
`/opt/pw-browsers`, so the gate needs `npm i -D playwright@1.56` — a newer
Playwright looks for build 1234 and fails on a missing executable rather than on
anything about the site. `--fast` skips G5 and the run reports `test_retest`
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
