# The opportunity radar

A second surface on the same engine discipline as the simulator: `/radar/`.
It reads the four uploaded TAL workbooks and answers one question — what is
open, what was tried, and at what cost — without turning anybody's typed
opinion into a measurement.

## What the workbooks actually contained

Measured, not assumed. Two of the four uploads (`TAL_Master_OS_2026.xlsx` under
two names) are byte-identical, md5 `55aa970c060909e3d2f3cde094082616`. Across
all four:

| | count |
|---|---|
| populated cells | 4,300 |
| typed text | 4,040 |
| typed numerics | 260 |
| **formulas** | **0** |

Every score in them — `9/10`, `TAL Financial Score`, `22%–28% ✅` — is a string
somebody typed. That does not make them worthless; it makes them a **data model
and a stated preference**, which is a real asset, and not an analysis, which is
what they look like. The whole radar is built on keeping that distinction
visible. **[O]**

`TAL_AGENT_OS.py`'s `scan_open_calls()` is the same shape of problem from the
other direction: it asks a model to *produce* fifteen open calls with amounts
and deadlines. That is generated copy formatted as data. Nothing in this repo
calls it, and the extractor reads the sheets instead. **[O]**

## What was kept

- **The schemas.** Open calls, metros, best-fit roles. The column choices are
  the owner's own research and they are good ones.
- **The content.** 10 open calls, 12 metros, 6 role types, extracted verbatim
  where they were read off a cell.
- **The typed scores** — kept, and kept labelled. See below.

## What was not kept

- The generation path in `TAL_AGENT_OS.py`.
- Any implication that a typed score was computed.
- The duplicate workbook (collapsed on `id`; the extractor reports how many).

## Provenance, per field

The same four bases the rest of the repository uses.

| basis | in the radar |
|---|---|
| `sourced` | read verbatim off a named sheet and cell |
| `derived` | parsed or classified by a rule stated in the code, naming the rule |
| `none` | a typed score, or a field nothing could be read from |
| `confirmed` | not used here — nothing in the radar was measured in this repo |

`npm run outstanding` walks `public/radar/corpus/` and reports all 50 of them.

## The three fields the workbooks did not have

Return category, effort, and a deadline as a *date*. These are the only three
the board needs, and they are exactly the three that would have had to be
computed — which is why a workbook with no formulas does not have them.

They are derived in `public/radar/engine/classify.js` by named rules. Every rule
declares the fields it reads (`on`) and why it fires (`because`), and every row
reports which rules produced its values. A rule that does not fire yields `null`
and basis `none`; nothing is guessed into place to make a row look complete.

The effort rules are ordered, and the order is the argument:

```
E1 trivial   micro-grant, drop-in
E2 heavy     ≥ $50k — a budget, a narrative and letters, whatever it is called
E3 moderate  residency or fellowship — a full packet at any stipend
E4 light     ≤ $5k — existing materials, lightly tailored
E5 moderate  anything else called a grant or an award
```

Size beats kind at both ends; a residency sits between them. Disagree and the
fix is to move a rule, which shows up in the diff and is reported on every row
it changes. A test pins the order so it cannot drift silently.

## Two things the board refuses to do

**It does not produce a single ranking.** Returns are grouped — money, shelter,
food, distribution, venue, work, standing — because a single ordering forces
cash and shelter onto one axis and they are not on one axis. A pipeline that
only counts money misses most of how a year actually gets survived.

**It does not read unknown as pass.** A recurring call has no date, so its
feasibility is `null`, not `true`. An opportunity with no effort estimate gets
no return-per-hour and no feasibility at all, and says so on the card. Both are
tested.

## Reconciliation with the fellowships reference

The fellowships project keeps `data/open-calls/` — sixteen calls read off each
organisation's own page, every field carrying an https source and a read date,
driven by a declared stage machine. The workbooks cover some of the same
ground. Left alone the board would count MacDowell twice and show two different
deadlines for it, which is worse than either list on its own.

`public/radar/engine/reconcile.js` holds one rule: **where both carry a call,
the sourced record wins.** The registry read it off the page and dated the read;
the workbook row is a typed recollection. The one thing the workbook holds alone
— the fit score — rides across carrying its basis, and nothing else does.

Current state: 25 calls, 16 from the reference and 9 held only in the
workbooks. One superseded (MacDowell). One near-match reported and **not**
merged: `NEA — Art Works` against the NEA's `Grants for Arts Projects`. One is
the other's former name and a reconciler has no business asserting that, so
both stay on the board and the decision is owed to a person.

Matching is token overlap plus a named acronym list (NEA, NSF, USA, TED). That
list is the reconciler's recall limit and is stated as one: an acronym it does
not know is a match it cannot make, and it cannot detect that it missed one.

The registry's `stage` translates into the radar's attempt vocabulary by reading
the workflow's own `committed` and `terminal` flags rather than a second copy of
the stage list. `lapsed` — a deadline that went by without a submission —
produces **no attempt**, because it is the opposite of having tried. `awarded`
is the one stage the radar names by hand, since `awarded` and `declined` are
both terminal and both committed and the flags cannot separate them; a test
asserts the id still exists upstream, so a rename fails loudly rather than
silently reclassifying a win as a loss.

The reference is copied into `public/radar/corpus.bundle.js` at build time and
read, never written. The `complete` protocol's T1 retest compares the committed
bundle against a fresh build, so a change upstream surfaces as a stale bundle
rather than as a page quietly serving last week's deadlines.

## Untried is not closed

Straight out of `attempts.js`. Most rows read `untried` — which for the workbook
half is what the sheets say and not what happened, since they carry a `TODO`
status and record no outcome anywhere. The reference half is better: its stages
carry real progress, and drafting, review and submitted come through as
attempts. Never-applied and
applied-and-rejected are different findings, and the board reports the first as
an *absence* (level `info`), never as a failure. Which of the workbook rows were actually
sent is `AO-7`, and it is the single field that would change the page most.

## Running it

```bash
npm run build:corpus     # regenerate public/radar/corpus.bundle.js from the JSON
npm test                 # 41 assertions over the engine, the rules, the corpus and the reconciler
node scripts/extract-radar.mjs <dir-of-xlsx>   # re-extract (needs python3 + openpyxl)
```

The page imports `corpus.bundle.js` rather than fetching it: the venue ships
`default-src 'none'` with no `connect-src`, so `fetch` and XHR are refused
outright. Verified by rendering `/radar/` under the shipped policy at 208, 393
and 1440 points — board rendered, no console errors, no sideways scroll. **[O]**
