# Officer corpora

Each officer owns one directory. Nothing outside it may write there, and it
writes nowhere else. That is the whole design, and it exists because the
alternative was tried first: a single shared spine that two branches each held a
copy of, which diverged on every push and conflicted on every merge.

```
corpus/<officer>/
├── integrity.json     what this officer will assert, and what it refuses to
├── premises/*.json    de-aggregated. one premise, one file, one basis
└── proposals/*.json   a hypothesis, its assumptions, and what each rests on
```

## Specificity is a toggle, not a hierarchy

A corpus declares the level it speaks at. `broad` claims hold across the
industry; `local` claims hold for this repository; `instance` claims hold for one
measured artifact. Running at a level admits only premises at or below it, so
turning specificity up narrows what may be asserted rather than adding detail to
a claim already made. A broad claim resting on an instance premise is the error
the toggle exists to catch — one measurement is not an industry.

## Premises stay de-aggregated

One premise per file, each carrying its own basis and its own source. Premises
are never rolled into a summary figure and stored, because an aggregate is where
provenance dies: the mean of nine sourced numbers and one invented one is a
number nobody can trace. `derived_from` names the premises a derived value came
from, and the derivation is recomputed at read time rather than stored.

Four bases, the same four the fellowships registry uses:

| basis | means |
|---|---|
| `confirmed` | measured here, with the command that reproduces it |
| `sourced` | read off a named external record |
| `derived` | computed from named premises, with the rule stated |
| `none` | nothing behind it — the statement is held, not asserted |

A premise with basis `none` is legitimate and useful. It is a question the
officer has not answered, kept where it will be seen, rather than a blank.

## A proposal is a hypothesis

Not a plan and not a pitch. It states what would have to be true, names the
assumptions, and points each assumption at the premises it rests on. It resolves
one of three ways and never any other:

- **in_favor** — the simulation clears the upper threshold
- **nullified** — it falls below the lower threshold
- **test_retest** — it lands between them, which is not a failure. It is the
  honest verdict when the premises do not yet separate the outcomes, and it names
  the measurement that would.

## The number rules

Every simulation declares its seed, its run count and its thresholds in the
proposal itself, never as a constant in the code. Re-running produces
byte-identical output. The result is reported under its stated assumptions and is
never a finding about the world.

An assumption whose premises are all basis `none` gets no number at all. The
verdict for that proposal is `test_retest` regardless of what the other
assumptions do, and the output names the unsourced assumption rather than
averaging over it. A number that cannot be traced to a stated assumption is not
printed.

Sensitivity ships with the point estimate: which assumption, if wrong, moves the
answer most. A proposal that reports a probability without it is incomplete.
