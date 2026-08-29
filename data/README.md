# The open-calls reference

One JSON file per open call in `open-calls/`, named for its id.
`record.schema.json` is the contract; `../scripts/build-registry.mjs` is the
enforcement. `npm run build` validates every record and compiles
`../public/fellowships/registry.json`, which is what the Vantage module reads.

## The rule

**A blank field is a finding. A fabricated one is a defect.**

Nothing in a record may be filled in from memory, inferred from a programme's
usual cycle, or carried over from last year. A record carries a deadline only
when something was actually read to obtain it, and the URL that was read goes
in `sourced_from`. The build refuses:

- a `closes` date on a record whose `date_basis` is `none`
- a `date_basis` of `sourced`/`confirmed` without `sourced_from` and `verified`
- an undated record whose `cycle_note` does not carry a `⟦FILL⟧` marker
- a `register` above `V` on a record nobody has verified
- an award figure whose `basis` is `none`
- `register: "I"` anywhere — inference is what this contract exists to prevent

## Provenance ladder

| `date_basis` | Means | `closes` | `verified` | `register` |
|---|---|---|---|---|
| `confirmed` | read off the organisation's own page | a date | the day it was read | `D` |
| `sourced` | read off a named third party in `sourced_from` | a date | the day it was read | `D` |
| `none` + `verified` set | checked; the programme is between cycles | `null` | the day it was checked | `D` |
| `none` + `verified` null | nobody has looked yet | `null` | `null` | `V` |

Raising a record from `sourced` to `confirmed` is the standing work: open its
`source`, read the deadline, and set `date_basis`, `closes`, `verified` and
`sourced_from` to match.

## Adding a record

Create `open-calls/<id>.json` with the id matching the filename. Start it
undated — `closes: null`, `date_basis: "none"`, `verified: null`,
`register: "V"`, and a `cycle_note` carrying `⟦FILL⟧`. Then source the date and
raise it. `npm run build` will tell you what the record is still missing.

## The re-survey ritual

This reference is meant to be re-surveyed on a schedule, not written once. A
re-survey rewrites records under `open-calls/` and may retune the ranking
inputs in `vantage.config.json` — `rank.effort_cost`, `rank.award_value`,
`rank.weights`, the horizon `bands`, and the `profile` fit is scored against.
None of that touches the page: the module reads them at runtime.

A re-survey that cannot source a date must blank it and mark it, exactly as a
first pass would. Re-surveying is not permission to guess.

## What must never appear here

No applicant-identifying data of any kind — in a record, in a draft entry, in
the compiled registry, or in anything exported from it. De-identified is not an
exception. A `drafts` entry is a label and a link, never a person. The
`profile` block in `vantage.config.json` is preferences only: disciplines,
regions, career stage, appetite for effort — no name, no institution, no
identifier.
