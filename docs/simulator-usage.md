# Running the simulator

Two front ends, one engine. The modules under `public/simulator/engine/` are
plain ESM with no dependencies, so the CLI imports them directly and the browser
loads the same files from the edge.

## CLI

```bash
npm run sim                              # full report on the bundled template
npm run sim -- --track civil,ip          # restrict to tracks
npm run sim -- --regime originalist      # fix the interpretive regime
npm run sim -- --policy over_dense       # force an institutional policy regime
npm run sim -- --sweep                   # the two sweeps only
npm run sim -- --paradox                 # the governance layer analysis only
npm run sim -- --vectors                 # the statutory challenge only
npm run sim -- --json > report.json      # machine-readable
npm run sim -- --case my-case.json --institution my-inst.json
```

`--case` and `--institution` take either a bare filename inside
`public/simulator/corpus/` or an absolute path.

## Browser

```bash
npm run dev          # wrangler dev, then open /simulator/
```

The page exposes the interpretive regime, the policy regime, and track
filtering as live controls, and will hand you the full report as JSON.

It needs a server — any static one will do, `python3 -m http.server` from
`public/` is enough — because the engine is a set of ES modules and browsers
refuse to load modules from `file://` (they are blocked as cross-origin from
origin `null`). Once served it makes no network requests beyond its own origin:
no fonts, no CDN, no analytics, no API. Measured at fourteen requests, all
same-origin, so it runs with the network unplugged. It does not run by
double-clicking the file.

If you need the simulator somewhere there is no browser at all, use the CLI. It
prints the whole argument as text, and `--json` gives the same content as a data
file.

## Tests

```bash
npm test
```

## Editing the corpus

Everything the engine reasons over lives in `public/simulator/corpus/`.

### `lexicon.json` — dated senses of the operative words

```json
{
  "id": "discrimination",
  "label": "discrimination",
  "origin_year": 1866,
  "senses": [
    { "from": 1964, "to": 2000, "gloss": "…", "reach": ["disparate_treatment", "disparate_impact"] },
    { "from": 2001, "to": null,  "gloss": "…", "reach": ["disparate_treatment"], "narrowed_by": "Alexander v. Sandoval (2001)" }
  ]
}
```

`reach` is the list of theories the sense will carry. A sense with fewer reaches
than its predecessor is detected as a narrowing event and attributed.

### `provisions.json` — statutes, regulations, charters

The field that does the most work is `confers_private_right`. Setting it to
`false` is what turns a winnable claim into a barred one, and what generates the
`restore_private_right` vector.

### `precedents.json` — authorities

```json
{
  "id": "sandoval",
  "favours": "respondent",
  "covers": ["civil.private_right"],
  "holding": "…",
  "rationale": "…",
  "rationale_scope": "broad",
  "reliance": 0.85, "workability": 0.8, "erosion": 0.15, "factual_change": 0.2,
  "distinguishable_on": [{ "fact": "intent_evidence_present", "value": true, "note": "…" }]
}
```

`covers` tags match by prefix in both directions, so `civil.private_right`
covers `civil.private_right.disparate_impact`. The four factors drive the
entrenchment score, which decides whether the recommended move is to
distinguish, limit, press for displacement, or route to the legislature.

### `conditions.json` — what has to be proved

Elements carry a declarative `test`. The available predicates:

| Predicate | Meaning |
|---|---|
| `{"fact": "k"}` | look `k` up in the case record |
| `{"term": "t", "reach": "m"}` | does the governing sense of `t` reach theory `m`? |
| `{"provision": "p", "confers_private_right": true}` | forum check |
| `{"institution": "published_policy", "ref": "x"}` | is `x` published? |
| `{"institution": "settled_practice", "ref": "x"}` | is `x` a settled practice? |
| `{"institution": "has_conflict"}` | are conflicting policies recorded? |
| `{"institution": "enabling_standard"}` | does the enabling act supply a standard? |
| `{"institution": "discretion_above", "value": 0.5}` | discretion threshold |
| `{"all": […]}`, `{"any": […]}`, `{"not": …}` | composition |

Set an element's `term` (alongside a `term` test) to bring it into the drift and
gap analysis.

`standard` selects the threshold: `preponderance`, `clear_and_convincing`,
`substantial_evidence`, `arbitrary_capricious`, or `de_novo`.

Note the difference between the **rule** and the **vehicle**. A charter supplies
the rule that binds the institution; the review statute supplies the forum. Name
the review statute in `provision`, and the charter in the element tests — naming
the charter as the vehicle bars the claim on a technicality the doctrine does
not actually impose.

### `case.template.json` — the record

Facts are `{ value, strength, source?, note? }`. `strength` is how well the
record carries the point, not how much you like it. `value: null` means
disputed, and is scored at a heavy discount rather than as a loss.

`attacks` is what makes the governance layer work:

```json
"attacks": [
  { "layer": "constitutive", "weight": 1, "statement": "…" },
  { "layer": "competence",   "weight": 1, "statement": "…" }
],
"relief_requires_disavowal": true
```

Anything at the `constitutive` layer drives the self-defeat score up and gets
rewritten by the reframe. See §8 of the model document for why.

### `institution.template.json` — the respondent's policy profile

`regime` is inferred from `policy_density` and `conflicts` unless set
explicitly. Recording at least one entry in `conflicts` while leaving
`enabling_act_supplies_standard` false is what fires the necessity–silence
conflict.

## Adding a track

Tracks are just strings on conditions. Add conditions with a new `track` value
and it appears in the CLI filter, the browser toggles, and the by-track
disposition automatically. If the new track should be able to run the
necessity–silence argument, add it to `nsTracks` in `engine/agents.js`.
