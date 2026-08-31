# The open-calls reference

One JSON file per open call in `open-calls/`, named for its id.
`record.schema.json` is the contract; `../scripts/build-registry.mjs` is the
enforcement. `npm run build` validates every record and compiles
`../public/fellowships/registry.json`, which is what the Vantage module reads.

## The rule

**A blank field is a finding. A fabricated one is a defect.**

Every product field carries its own entry in the record's `provenance` block
naming where it came from, or it is blank and says what is owed. The build
refuses:

- a populated field whose provenance basis is `none`
- a populated field whose `from` names no https source
- a blank field whose `why` carries no `⟦FILL⟧` marker
- a `derived` field that states no transformation rule
- an `eligibility` claiming basis `sourced` — its enum arrays are a mapping into
  this schema's vocabulary, which the source does not use, so `derived` is the
  honest basis
- any record that stores `effort` — it is derived from `requirements`

## The four bases

| Basis | Means | Field |
|---|---|---|
| `confirmed` | read off the organisation's own page | populated |
| `sourced` | read off the named third party in `from` | populated; primary confirmation still owed |
| `derived` | transformed from a named source, with `rule` stating the transformation | populated |
| `none` | no record exists | **blank**, with `why` carrying `⟦FILL⟧` |

## Why effort is derived

`effort` is the denominator of return-on-effort, so an effort grading with
nothing behind it moves what the surface promotes on the strength of an opinion.
It is computed at read time from `requirements` — essays, recommendations, work
sample, endorsement, fee — through the weights and bands in
`../data/vantage.config.json`. The inputs are sourced facts on the record; the
weighting is an editorial position and lives in config, where it is visible as
one. A record whose requirements were never read has no effort and the ranking
uses the configured unknown cost.

This was the Q4-PROVENANCE finding: the earlier contract guarded dates and money
and left `summary`, `eligibility`, `effort`, `kind` and `cycle` unguarded — four
of them enum-checked, which made them read as validated.

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
