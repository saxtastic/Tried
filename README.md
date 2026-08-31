# ayeyoty.co — open calls

The **fellowships subtree**: a repository reference for applications and
fellowships — grants, residencies, prizes and scholarships — held as flat
files, moved through a declarative workflow, and read on one configurable
surface called **Vantage** at [`/fellowships/`](public/fellowships/).

It is a room in this building, not a second building. It opens from the venue's
Subtrees section, runs on the venue's four tiers, uses the venue's tokens, and
holds the venue's constraints. It adds no colour, no font and no breakpoint of
its own.

Claims below carry a register mark: **[O]** observed in this repository, **[D]**
documented against a named source, **[I]** inferred, **[V]** unverified. Records
in the reference carry the same marks, for the same reason.

---

## The one thing to read before using this

**A blank field is a finding. A fabricated one is a defect.**

No deadline in this reference was carried over from a programme's usual cycle or
filled in from memory. A record carries a date only when something was actually
read to obtain it, and the URL that was read is in `sourced_from`. As it stands:

| Field group | Populated | Basis |
|---|---|---|
| `closes` | 6/16 | `sourced` — read off a named third party on 2026-08-29. **Primary confirmation still owed on all of them.** |
| `eligibility` | 3/16 | `derived` — `stated` is read from the source; the enum arrays map it into this schema's vocabulary |
| `requirements` | 3/16 | `sourced` — what an application actually costs to assemble. `effort` derives from this |
| `award` | 1/16 | `sourced` |
| `cycle` | 9/16 | `derived` |
| `summary` | 0/16 | **all blank.** No description was ever read verbatim; the previous text was written from general knowledge and has been removed |

The module gives undated records their own band rather than hiding them, so the
reference shows you the work it still owes. **[O]** — asserted by `npm run check`.

Raising a record is a small, checked edit — set the field and its provenance
entry together:

```jsonc
// data/open-calls/<id>.json
"closes": "2026-09-15",
"provenance": {
  "closes": { "basis": "confirmed", "from": "https://…", "read": "2026-08-29" }
}
```

The build refuses a populated field whose basis is `none`, a populated field
whose `from` names no https source, a blank field whose `why` carries no `⟦FILL⟧`
marker, an `eligibility` claiming basis `sourced` when its enum arrays are a
mapping, and any record that stores `effort`. Those five guards were tested by
planting violations and watching the build reject them. `data/README.md` has the
full ladder.

## Three files decide everything

| File | Decides | Nothing else may |
|---|---|---|
| `public/venue.css` | the device floor, via `:root { --tier }` | compare a width in JavaScript |
| `data/workflow.json` | stages, transitions, guards | name a stage in engine code |
| `data/vantage.config.json` | which signals render, where, on which line, in what order and colour, and how return on effort is scored | name a field or band in module code |

Each of these is the same rule at a different level: **declared once, read
back, never duplicated.** The three assertions that hold it are in
`scripts/check-registry.mjs` and they scan the shipped source, not a copy. **[O]**

The module lives at `public/fellowships/`; the shell it runs on lives at the root
and belongs to the venue.

---

## The reference

`data/open-calls/` holds one JSON file per open call, named for its id.
`data/record.schema.json` is the contract in prose; the enforcement lives in
`scripts/build-registry.mjs`, so adding a record can never add a dependency.

```jsonc
{
  "id": "macdowell-fellowship",
  "name": "MacDowell Fellowship",
  "org": "MacDowell",
  "kind": "residency",
  "url": "https://www.macdowell.org/apply",
  "summary": null,                       // blank: nothing was read verbatim
  "eligibility": {
    "stated": "Artists in architecture, film/video, … at least 21 …",
    "disciplines": ["architecture", "film", "writing", "music", "arts"],
    "geography": ["any"],
    "career_stage": ["emerging", "mid", "established"]
  },
  "requirements": {                      // what effort derives from
    "essays": 1, "recommendations": 0, "work_sample": true,
    "endorsement": false, "fee_usd": 30,
    "stated": "Project proposal, a list of professional achievements, and a current work sample …"
  },
  "award": { "min": null, "max": null, "currency": "USD", "basis": "none", "note": "⟦FILL: …⟧" },
  "cycle": "biannual",
  "opens": null,
  "closes": "2026-09-10",
  "cycle_note": "Spring–Summer 2027 residency cycle. …",
  "stage": "eligible",
  "drafts": [],
  "provenance": {                        // one entry per product field
    "closes":       { "basis": "sourced", "from": "https://…", "read": "2026-08-29" },
    "summary":      { "basis": "none", "why": "⟦FILL: no verbatim description was read⟧" },
    "eligibility":  { "basis": "derived", "from": "https://…", "read": "2026-08-29",
                      "rule": "stated is read from the source; the enum arrays map it into this schema's vocabulary" },
    "requirements": { "basis": "sourced", "from": "https://…", "read": "2026-08-29" },
    "award":        { "basis": "none", "why": "⟦FILL: no award figure was read⟧" },
    "kind":         { "basis": "derived", "from": "https://…", "rule": "classified from the programme's own description" },
    "cycle":        { "basis": "derived", "from": "https://…", "read": "2026-08-29", "rule": "…" }
  },
  "source": "https://www.macdowell.org/apply"
}
```

There is no `effort` field. Effort is **derived** from `requirements` at read
time through the rule in `data/vantage.config.json`, because a stored grading is
an opinion and it is the denominator of the ranking. The build rejects any record
that stores one. A record whose requirements were never read has no effort, and
the ranking uses the configured unknown cost rather than a silent middle value.

`npm run build` validates every record and compiles `public/fellowships/registry.json`.
The output is deterministic — records sorted by id, fixed key order, no build
timestamp — which is what makes `npm run build -- --check` a real assertion
rather than a diff against the clock. **[O]**

Sixteen programmes are seeded, spanning arts, film, writing, technology, social
impact and general graduate study. The reference is deliberately not about any
one field.

## The workflow

`data/workflow.json` declares twelve stages and twelve transitions.
`public/fellowships/workflow.js` executes it and contains no stage id of its own. **[O]**

```
discovered → screening → eligible → drafting → review → submitted → decision → awarded
                  ↓                    ↓                                     ↘ declined
             ineligible            passed              (auto) ─────────────→ lapsed
```

Guards are structured objects, walked directly:

```json
{ "all": [ { "path": "derived.days", "op": "lt", "value": 0 } ] }
```

There is no expression parser, no `new Function`, no `eval` — which is why the
engine needs no exemption from the strict CSP. **[O]**

Two transitions are automatic. A call whose close date has passed without a
submission moves to `lapsed`; a submitted call past its close date moves to
`decision`. Both are applied by the engine at read time, and wherever one
fires the module says so on the record, because a stage the reader did not set
has to explain itself. `settle()` is idempotent and capped, so a mis-declared
cycle in the spec stalls loudly instead of hanging the tab. **[O]**

Stage moves made in the interface live for the life of the tab. Reload and the
reference is back as the repository has it — see the standing constraints below.

## Vantage — the singular module

One module. No tabs. There is no view mode to choose between: the surface is
composed from `data/vantage.config.json`, and configuration is the only thing
that decides what it holds. **[O]** — `npm run check:vantage` fails if any
`role="tab"`, `role="tablist"` or `.tabs` element appears, or if more than one
`.module` is on the page.

A field declares what it shows, what kind of thing it is, which floors get it,
and which line of the item it sits on:

```json
{ "id": "fit", "role": "meter", "from": "derived.fit",
  "line": "signals", "tiers": ["pad", "desk"], "label": "fit" }
```

so the interface re-forms from configuration alone:

| Floor | Unit | Rows | Fields built | Actions |
|---|---|---|---|---|
| `watch` | line | 3 | title, countdown, provenance | withheld |
| `phone` | row | 12 | + return meter, org, drafts, stage, guidelines | shown |
| `pad` | card | all | + close date, kind, fit meter, effort, award, cycle terms | shown |
| `desk` | card | all | + summary | shown |

A field the configuration does not list for a floor is **not built**, not built
and hidden — the watch floor pays nothing for it. **[O]** — the browser check
asserts both directions: absent where withheld, present where listed.

Band colour is configuration too. Each band carries a hue and a chroma, the
module sets them as custom properties, and the stylesheet says only *where*
colour goes, never *which*:

```json
{ "id": "week", "label": "Within 7 days", "max_days": 7, "hue": 8, "chroma": 0.16 }
```

Add a band, move a field to another line, change the ordering keys or reweight
fit — none of it touches a line of JavaScript or CSS.

### Return on effort

Deadline foresight is the primary lens: calls are grouped by a 7 / 30 / 90-day
horizon, and **inside each band the top of the list is the best return for the
effort it costs**. Award value and eligibility fit are weighed against effort to
submit, all from `rank` in the configuration:

```json
"rank": {
  "effort_cost": { "low": 1, "medium": 1.6, "high": 2.4 },
  "award_value": [ { "up_to": 10000, "value": 0.35 },
                   { "up_to": 50000, "value": 0.7 },
                   { "up_to": null,  "value": 1.0 } ],
  "unknown_award": 0.5,
  "weights": { "award": 2, "fit": 3 }
}
```

An award figure nobody has sourced scores at `unknown_award` rather than zero,
so a missing number neither flatters nor punishes a call — and the card marks it
missing either way. Two bands sit outside the horizon: a call whose date has
passed, and a call with no sourced date at all. **[O]** — `npm run check`
asserts the band groups first and return ranks inside it.

Pipeline stages are secondary to the radar: the stage is a foot-line field, not
the thing the surface is organised around.

### Fit

Scored from `fit.criteria` against `profile`, both in the configuration. The
module compares two lists it was told to compare and divides by the weights it
was given; it does not know what "geography" means. `"any"` on either side is a
wildcard. The profile is the one place the reader describes themselves, and
nothing in it is transmitted anywhere.

---

## The four floors

Carried over unchanged, and Vantage rides on them. Tiers are defined once:

```css
:root { --tier: "desk"; }
@media (max-width: 1179px) { :root { --tier: "pad"; } }
@media (max-width:  767px) { :root { --tier: "phone"; } }
@media (max-width:  319px) { :root { --tier: "watch"; } }
```

`venue.js` and `vantage.js` both read the resolved value back with
`getComputedStyle` and neither compares a width. Move a breakpoint in the
stylesheet and the tier chip, the marked bay, the install ordering, the module's
density and its field list all follow. **[O]**

Split View and Slide Over on iPad land on the `phone` floor. That is the
intended result: the tier follows the viewport it is given, not the hardware it
is running on. **[I]**

## What was verified here, and what was not

| Claim | Register | Basis |
|---|---|---|
| Four viewports resolve to four distinct tiers on `/`, `/fleet/` and `/fellowships/`, no horizontal scroll, clean console | **[O]** | `npm run check:tiers`, Chromium 1194 |
| The module renders at all four floors with the configured unit, row cap, line grouping and field set | **[O]** | `npm run check:vantage`, four fixed viewports |
| No tab control and exactly one module on the page, at every floor | **[O]** | same |
| Every rendered record carries a title and a provenance marker | **[O]** | same |
| Fields are counted by role, so the check itself names no field id | **[O]** | same |
| A workflow action moves a record to the stage the spec names, with no reload | **[O]** | same, driven end to end |
| `settle()` is idempotent, never stalls, and every stage can reach a terminal stage | **[O]** | `npm run check:data` |
| The engine names no stage; the module names no field, band, colour or width | **[O]** | source scan over the shipped files, comments stripped |
| Every product field names the record it came from, or is blank and says what is owed | **[O]** | `npm run build` and `npm run check:data`, enforced per field rather than only on dates and money |
| A populated field with no source, an over-claimed `eligibility` basis, and a stored `effort` are all rejected | **[O]** | each planted as a violation and observed failing the build |
| `effort` is derived from sourced requirements and never stored | **[O]** | `npm run check:data` |
| The six sourced deadlines, and the eligibility and requirements for three records | **[D]** | read on 2026-08-29 off the third party named in each field's provenance entry |
| That three programmes are between cycles with nothing to record | **[D]** | same |
| Every `summary` | **[V]** | blank. None was read verbatim, so none is published |
| The ten unsourced deadlines and thirteen unsourced eligibilities | **[V]** | nobody has looked. Blank, marked, and grouped into their own band in the interface |
| `font: -apple-system-body` opts the page into Dynamic Type | **[V]** | documented Safari behaviour, not reachable from Chromium |
| `env(safe-area-inset-*)` is non-zero on a notched iPhone | **[V]** | probes read `0 / 0 / 0 / 0` in Chromium — correct there, unproven on device |
| Cloudflare Workers Static Assets applies `public/_headers` at deploy | **[V]** | no deploy was run from this container |

## Open items

- ⟦FILL: ten unsourced deadlines⟧ — `npm run build` lists them every run.
- ⟦FILL: eligibility and requirements for thirteen records⟧ — until these are
  read, those records score no fit and no derived effort, and the ranking uses
  the configured unknown values for both.
- ⟦FILL: primary confirmation for the six sourced deadlines⟧ — every one is
  `sourced`, none is `confirmed`; this container cannot reach most organisation
  pages directly.
- ⟦FILL: award figures⟧ — fifteen of sixteen records carry none.
- ⟦FILL: every `summary`⟧ — all blank. A description is a claim about the
  programme, so it is quoted with a source or it is not published.
- ⟦FILL: the CSS viewport width Apple Watch actually reports for web content⟧.

## Local development

```bash
npm install
npm run dev            # wrangler dev
npm run build          # validate data/ and compile the registry
npm run check          # data + tiers + module, all of it
npm run check:data     # engine and configuration assertions, no browser
npm run check:tiers    # the four floors
npm run check:vantage  # the module at the four floors
npm run icons          # re-render the PNG icons
```

`npm run check` is deterministic: fixed viewports, no network beyond loopback,
no randomness. It proves the tier logic, the workflow and the module in
Chromium. Chromium is not Safari, so it cannot prove any row marked **[V]**.

Playwright is pinned to the version carrying Chromium 1194 so both browser
checks run against the same build. **[O]**

## Deploy

```bash
npm run deploy         # builds the registry, then wrangler deploy
```

Publishes `public/` under the Worker name `ayeyoty-co`. Authenticate first with
`npx wrangler login`. Attach the domain in the Cloudflare dashboard under
**Workers & Pages → ayeyoty-co → Settings → Domains & Routes**, or uncomment the
`[[routes]]` blocks in `wrangler.toml`.

## Layout

```
data/
├── open-calls/*.json      one record per open call — the reference
├── record.schema.json     the record contract, in prose
├── workflow.json          stages, transitions, guards
├── vantage.config.json    the module's configuration input and ranking inputs
└── README.md              the provenance ladder and the re-survey ritual
public/                    the venue shell — owned by the venue, not this subtree
├── index.html             the venue, with the Subtrees section this opens from
├── venue.css · venue.js   tokens, tiers, the four floors
├── _headers               CSP, cache, transport headers
├── fleet/                 the other subtree
└── fellowships/           THIS SUBTREE
    ├── index.html         the page
    ├── fellowships.css    its form — no token, font or breakpoint of its own
    ├── vantage.js         the module's runtime
    ├── workflow.js        the workflow engine
    └── registry.json      GENERATED — do not edit
scripts/
├── build-registry.mjs     validate data/ → public/fellowships/registry.json
├── check-registry.mjs     engine, provenance and configuration assertions
├── check-vantage.mjs      the module at four viewports
├── check-tiers.mjs        the tier assertions for the shell and both subtrees
├── fleet.mjs              the fleet subtree's own renderer
└── make-icons.py          renders the mark to PNG — stdlib only
```

The icon geometry exists twice, in `scripts/make-icons.py` and in
`public/icons/favicon.svg`. They are kept identical by hand. **[O]**

## Subtrees

Work that is not the venue opens from the venue's main page, on the venue's tiers
and under the venue's constraints. A subtree is a room in this building, never a
second building — it shares `venue.css`, `venue.js`, the four tiers, the CSP and
the no-storage rule, and adds only what is its own.

Live subtrees:

| Route | What it is |
|---|---|
| `/fleet/` | Deployment and management surface for the Claude coworkers building this repository. |

## The fleet layer

`fleet/fleet.json` is the spine: environments, projects, coworkers, the policy
rules, and an append-only log of management operations actually executed. Every
record carries the register it was established at and the time it was observed.
Declared inputs live there; none of them are constants inside the code. **[O]**

```bash
node scripts/fleet.mjs survey    # roster, blocked and failed first
node scripts/fleet.mjs check     # policy findings; exits non-zero on an error
node scripts/fleet.mjs plan      # the actions the findings imply
node scripts/fleet.mjs render    # writes public/fleet/index.html
npm run fleet                    # all four
```

The policy rules the checker enforces:

| | Rule |
|---|---|
| P1 | One writer per path. Two live coworkers claiming overlapping globs is a merge conflict that has not happened yet. |
| P2 | A live base branch is declared as inherited, not assumed. |
| P3 | A blocked coworker is an operator debt — it carries the action taken, or an open plan entry. |
| P4 | Terminal work is retired. Idle work nobody has read is surfaced for a decision. |
| P5 | A ritual without a Routine is an intention. |
| P6 | Deployment goes to a declared environment. |
| P7 | An inherited base is merged, not assumed — a session's source revision is fixed at creation. |

**What the CLI does not do.** It does not call the session API. `plan` names the
exact tool and arguments for each action and stops. The acting side runs through
the Claude Code Remote MCP tools held by an operator session, not through an HTTP
client in this repository — writing one would mean guessing at an endpoint this
repository has never called. **[D]** — stated at the head of `scripts/fleet.mjs`.

P1 and P7 both earned their place by firing on real state during the first run:
P1 caught the venue claiming `public/*`, which silently swallowed the fellowships
subtree, and P7 caught a session that had been told to inherit a branch it could
not check out. **[O]**

## Standing constraints

Carried over and still held:

- **No browser storage.** No cookie, no `localStorage`, no `sessionStorage`, no
  IndexedDB. A stage moved in the interface lives for the life of the tab and
  then it is gone. A reading that survives the tab is a record, and the record
  belongs in `data/`, in a commit, not in the reader's browser.
- **No third-party requests.** No fonts, no analytics, no CDN. Typography is the
  Apple system stack.
- **Nothing is transmitted.** The fit profile, and every stage move made on the
  surface, stay in the reader's own browser.

One relaxation was made against the original `default-src 'none'`:
`connect-src 'self'`, so the module can read `/fellowships/registry.json` at runtime instead
of having the reference baked into a script. It is a same-origin GET and opens
no third-party request; the constraint above is intact. The reason is written
into `public/_headers` beside the policy. **[O]**

The default remains `default-src 'none'`; every directive in `_headers` is a
named exception to it, and each one is written down beside the policy. **[O]**

## Governance & corpus simulator

An adversarial simulator for legal and institutional argument. One agent argues
that a set of conditions is satisfied; a second argues that it is not. A bench
decides each contested element on principle, records the gaps where no authority
reaches, sweeps every interpretation the operative words will bear, re-runs the
case against four kinds of institution, resolves the governance paradox into a
holding a body can actually grant, and outputs the statutory challenge that
follows from wherever the claim failed.

```bash
npm run sim          # full report in the terminal
npm run sim -- --json > report.json
npm test             # engine tests
npm run dev          # then open /simulator/ for the browser version
```

It reasons over four tracks at once — civil rights, administrative and
educational law, intellectual property, fiduciary duty — plus a governance track
for the authority of the premise itself. The engine has no dependencies and no
model calls: it is a deterministic rules engine, so every output can be traced
to a corpus entry or a stipulated weight.

- [`docs/simulator-model.md`](docs/simulator-model.md) — what it models and why
- [`docs/simulator-usage.md`](docs/simulator-usage.md) — running it, and editing the corpus
- [`docs/cross-domain-verification.md`](docs/cross-domain-verification.md) — the model checked against frameworks in other trades

Every construct is verified against a named framework from a profession that had
to solve the same structural problem independently — aviation's just culture,
performance-based building codes, military mission command, financial reporting
standards, the medical standard of care. Nine frameworks: five corroborate, three
partly, and one contradicted the model outright and changed it.

```bash
npm run verify       # the cross-domain report
```

The bundled case is a parameterised template, not a record of any real
proceeding. It is a working example and a set of dials.
