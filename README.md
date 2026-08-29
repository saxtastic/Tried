# ayeyoty.co — open calls

A repository reference for applications and fellowships: grants, residencies,
prizes and scholarships, held as flat files, moved through a declarative
workflow, and read on one configurable surface called **Vantage**.

Served from Cloudflare Workers Static Assets, on the four-floor device tiering
this repository already had. Same domain, same worker, same deployment path.

Claims below carry a register mark: **[O]** observed in this repository, **[D]**
documented against a named source, **[I]** inferred, **[V]** unverified. Records
in the reference carry the same marks, for the same reason.

---

## The one thing to read before using this

**No date or award figure in this reference has been confirmed against its
source.** Every programme in `data/open-calls/` is real and every
*Guidelines* link goes to the organisation that runs it — but the deadlines are
placeholders derived from each programme's usual cycle, not readings taken off
the page. All sixteen records are `date_basis: "estimated"`, `verified: null`,
`register: "V"`, and the Vantage module marks every one of them in the
interface. **[O]** — asserted by `npm run check`.

Confirm a record before you plan against it:

```jsonc
// data/open-calls/<id>.json
"closes":     "2026-09-15",   // read off the guidelines page
"date_basis": "confirmed",    // was "estimated"
"verified":   "2026-08-29",   // the day you read it
"register":   "D"             // was "V"
```

The build refuses any record that claims verification it does not have: a null
`verified` with a register above `V` fails `npm run build`. **[O]**

---

## Three files decide everything

| File | Decides | Nothing else may |
|---|---|---|
| `public/venue.css` | the device floor, via `:root { --tier }` | compare a width in JavaScript |
| `data/workflow.json` | stages, transitions, guards | name a stage in engine code |
| `data/vantage.config.json` | which signals render, where, in what order and colour | name a field or band in module code |

Each of these is the same rule at a different level: **declared once, read
back, never duplicated.** The three assertions that hold it are in
`scripts/check-registry.mjs` and they scan the shipped source, not a copy. **[O]**

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
  "award": { "min": null, "max": null, "currency": "USD", "basis": "estimated", "note": "…" },
  "effort": "medium",                    // low | medium | high
  "cycle": "biannual",                   // annual | biannual | rolling | one-off
  "opens": "2026-07-15",
  "closes": "2026-09-10",
  "date_basis": "estimated",             // estimated | confirmed
  "stage": "eligible",                   // must be a stage id in data/workflow.json
  "register": "V",
  "verified": null,
  "source": "https://www.macdowell.org/apply"
}
```

`npm run build` validates every record and compiles `public/registry.json`.
The output is deterministic — records sorted by id, fixed key order, no build
timestamp — which is what makes `npm run build -- --check` a real assertion
rather than a diff against the clock. **[O]**

Sixteen programmes are seeded, spanning arts, film, writing, technology, social
impact and general graduate study. The reference is deliberately not about any
one field.

## The workflow

`data/workflow.json` declares twelve stages and twelve transitions.
`public/workflow.js` executes it and contains no stage id of its own. **[O]**

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
| `phone` | row | 12 | + org, stage, guidelines | shown |
| `pad` | row | all | + close date, kind, fit meter | shown |
| `desk` | card | all | + effort, cycle, summary | shown |

A field the configuration does not list for a floor is **not built**, not built
and hidden — the watch floor pays nothing for it. **[O]** — the browser check
asserts both directions: absent where withheld, present where listed.

Band colour is configuration too. Each band carries a hue and a chroma, the
module sets them as custom properties, and the stylesheet says only *where*
colour goes, never *which*:

```json
{ "id": "now", "label": "Closing", "max_days": 7, "hue": 8, "chroma": 0.16 }
```

Add a band, move a field to another line, change the ordering keys or reweight
fit — none of it touches a line of JavaScript or CSS.

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
| Four viewports resolve to four distinct tiers, no horizontal scroll, clean console | **[O]** | `npm run check:tiers`, Chromium 1194 |
| The module renders at all four floors with the configured unit, row cap, line grouping and field set | **[O]** | `npm run check:vantage`, four fixed viewports |
| No tab control and exactly one module on the page, at every floor | **[O]** | same |
| Every rendered record carries a title and a provenance marker | **[O]** | same |
| A workflow action moves a record to the stage the spec names, with no reload | **[O]** | same, driven end to end |
| `settle()` is idempotent, never stalls, and every stage can reach a terminal stage | **[O]** | `npm run check:data` |
| The engine names no stage; the module names no field, band or width | **[O]** | source scan over the shipped files, comments stripped |
| No record claims a register it has not earned | **[O]** | `npm run build` and `npm run check:data` |
| Every deadline in the reference | **[V]** | placeholders from each programme's usual cycle — see the top of this file |
| Every award figure in the reference | **[V]** | not published or not read; each carries a `⟦FILL⟧` note |
| `font: -apple-system-body` opts the page into Dynamic Type | **[V]** | documented Safari behaviour, not reachable from Chromium |
| `env(safe-area-inset-*)` is non-zero on a notched iPhone | **[V]** | probes read `0 / 0 / 0 / 0` in Chromium — correct there, unproven on device |
| Add to Home Screen / Add to Dock produce a standalone window | **[V]** | manifest and `apple-touch-icon` in place; the install flow is untested here |
| Cloudflare Workers Static Assets applies `public/_headers` at deploy | **[V]** | no deploy was run from this container |

## Open items

- ⟦FILL: the real close date for all sixteen records⟧ — the single thing that
  turns this from a structure into a usable reference. Confirm them one at a
  time against `source`; each one is a four-line edit.
- ⟦FILL: the CSS viewport width Apple Watch actually reports for web content⟧ —
  `319px` is a floor chosen to sit under every iPhone, not a fitted breakpoint.
- ⟦FILL: measured Dynamic Type behaviour at the accessibility sizes⟧ — the
  module is built to hold at the large accessibility sizes; that has not been
  seen on a device.

## Local development

```bash
npm install
npm run dev            # wrangler dev
npm run build          # validate data/ and compile public/registry.json
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
└── vantage.config.json    the module's configuration input
public/
├── index.html             the venue
├── dashboard.html         the dashboard holding the singular module
├── registry.json          GENERATED — do not edit
├── venue.css · venue.js   tokens, tiers, the four floors
├── vantage.css            the module's form
├── vantage.js             the module's runtime
├── workflow.js            the workflow engine
├── _headers               CSP, cache, transport headers
└── icons/ · robots.txt · sitemap.xml · app.webmanifest · 404.html
scripts/
├── build-registry.mjs     validate data/ → public/registry.json
├── check-registry.mjs     engine and configuration assertions
├── check-vantage.mjs      the module at four viewports
├── check-tiers.mjs        the tier assertions
└── make-icons.py          renders the mark to PNG — stdlib only
```

The icon geometry exists twice, in `scripts/make-icons.py` and in
`public/icons/favicon.svg`. They are kept identical by hand. **[O]**

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
`connect-src 'self'`, so the module can read `/registry.json` at runtime instead
of having the reference baked into a script. It is a same-origin GET and opens
no third-party request; the constraint above is intact. The reason is written
into `public/_headers` beside the policy. **[O]**
