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

| | Count | What that means |
|---|---|---|
| sourced deadline | 6 | read off a named third party on 2026-08-29 — **primary confirmation still owed** |
| confirmed deadline | 0 | read off the organisation's own page. None yet: the container this was built in cannot reach most of those pages |
| checked, between cycles | 3 | the programme's last cycle closed and the next is unannounced |
| not sourced | 7 | nobody has looked. Blank, and marked `⟦FILL⟧` |

The module gives undated records their own band rather than hiding them, so the
reference shows you the work it still owes. **[O]** — asserted by `npm run check`.

Raising a record is a small, checked edit:

```jsonc
// data/open-calls/<id>.json
"closes":       "2026-09-15",
"date_basis":   "confirmed",                 // was "sourced" or "none"
"sourced_from": "https://…",                 // what you actually read
"verified":     "2026-08-29",                // the day you read it
"register":     "D"
```

The build refuses any record that claims more than it can show — a date with no
source, a register above `V` with nothing verified, an award figure with no
basis, or `register: "I"`, since inference is the thing this contract exists to
prevent. `data/README.md` has the full ladder. **[O]**

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
  "id": "macdowell-fellowship",          // must match the filename
  "name": "MacDowell Fellowship",
  "org": "MacDowell",
  "kind": "residency",                   // fellowship | grant | residency | prize | scholarship | accelerator
  "url": "https://www.macdowell.org/apply",
  "summary": "…",
  "disciplines": ["arts", "writing", "music", "film", "architecture"],
  "geography": ["any"],
  "career_stage": ["emerging", "mid", "established"],
  "award": { "min": null, "max": null, "currency": "USD",
             "basis": "none", "note": "⟦FILL: award figure not sourced⟧" },
  "effort": "medium",                    // low | medium | high — the denominator of return on effort
  "cycle": "biannual",
  "opens": null,
  "closes": "2026-09-10",
  "date_basis": "sourced",               // confirmed | sourced | none
  "cycle_note": "Spring–Summer 2027 residency cycle. …",
  "sourced_from": "https://www.macdowell.org/apply/apply-for-fellowship",
  "stage": "eligible",                   // must be a stage id in data/workflow.json
  "drafts": [],                          // { label, href, state } — a label and a link, never a person
  "register": "D",
  "verified": "2026-08-29",
  "source": "https://www.macdowell.org/apply"
}
```

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
| No record carries a date, or an award figure, without a source | **[O]** | `npm run build` and `npm run check:data`; the guard was tested by planting a sourceless date and watching the build reject it |
| Every undated record names what is owed with a `⟦FILL⟧` marker | **[O]** | `npm run check:data` |
| The horizon band groups first and return on effort ranks inside it | **[O]** | `npm run check:data` |
| The six sourced deadlines | **[D]** | read on 2026-08-29 off the third party recorded in each record's `sourced_from` |
| That three programmes are between cycles with nothing to record | **[D]** | same |
| Every award figure except one | **[V]** | not published, or not read. Each carries a `⟦FILL⟧` note |
| The seven unsourced deadlines | **[V]** | nobody has looked. Blank, and grouped into their own band in the interface |
| `font: -apple-system-body` opts the page into Dynamic Type | **[V]** | documented Safari behaviour, not reachable from Chromium |
| `env(safe-area-inset-*)` is non-zero on a notched iPhone | **[V]** | probes read `0 / 0 / 0 / 0` in Chromium — correct there, unproven on device |
| Cloudflare Workers Static Assets applies `public/_headers` at deploy | **[V]** | no deploy was run from this container |

## Open items

- ⟦FILL: the seven unsourced deadlines⟧ — `ashoka-fellowship`,
  `echoing-green-fellowship`, `jerome-hill-artist-fellowship`,
  `knight-arts-tech-fellowship`, `mozilla-technology-fund`, `ted-fellows`,
  `united-states-artists-fellowship`. `npm run build` lists them every run.
- ⟦FILL: primary confirmation for the six sourced deadlines⟧ — each was read off
  a third party, not the organisation's own page. Raising one to `confirmed` is
  a four-line edit.
- ⟦FILL: award figures⟧ — fifteen of sixteen records carry no sourced figure, so
  the ranking scores them at the configured `unknown_award`.
- ⟦FILL: the CSS viewport width Apple Watch actually reports for web content⟧ —
  `319px` is a floor chosen to sit under every iPhone, not a fitted breakpoint.
- ⟦FILL: measured Dynamic Type behaviour at the accessibility sizes⟧.

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
