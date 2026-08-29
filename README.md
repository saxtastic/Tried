# ayeyoty.co — technovenue

A static venue built strictly for Apple hardware — iPhone, Apple Watch, iPad and
MacBook — served from Cloudflare Workers Static Assets.

This is the previous `ayeyoty.co` scaffold re-targeted. Same domain, same worker,
same deployment path; the placeholder page is now a four-floor venue that changes
layout, input model and content density with the device that arrived.

Claims below carry a register mark: **[O]** observed in this repository, **[D]**
documented against a named source, **[I]** inferred, **[V]** unverified. The
unverified ones are unverified for one reason, stated once here: this repository
was built in a Linux container with Chromium and no Apple hardware, so every
WebKit-specific behaviour is a design intention until it is run on a device.

---

## The four floors

| Floor | Tier name | Width | What changes |
|---|---|---|---|
| Apple Watch — *the doorway* | `watch` | ≤ 319px | One idea per screen. Blur, shadow, device art and supporting prose all drop. Buttons go full width. Only the relevant install card survives. |
| iPhone — *the floor* | `phone` | ≤ 767px | Single column inside the safe area. Primary action pinned within thumb reach above the bottom inset. |
| iPad — *the gallery* | `pad` | ≤ 1179px | Bays reflow to a grid, measure capped at 46rem. Hover affordances only when a pointing device is attached. |
| MacBook — *the booth* | `desk` | ≥ 1180px | Four bays across, hero artwork, hover lift, keyboard navigation. |

Split View and Slide Over on iPad land on the `phone` floor. That is the intended
result, not a gap: the tier follows the viewport it is given, not the hardware
it is running on. **[I]**

## Tiers are defined once, in CSS

`public/venue.css` sets a custom property on `:root`:

```css
:root { --tier: "desk"; }
@media (max-width: 1179px) { :root { --tier: "pad"; } }
@media (max-width:  767px) { :root { --tier: "phone"; } }
@media (max-width:  319px) { :root { --tier: "watch"; } }
```

`public/venue.js` reads the resolved value back with `getComputedStyle` and never
compares a width itself. Move a breakpoint in the stylesheet and the script, the
tier chip, the marked bay and the install ordering all follow. **[O]** — asserted
by `npm run check`.

There is no user-agent sniffing anywhere in the layout path. The one user-agent
read on the page is quarantined in `appleHardware()`, used only to show a fallback
notice, and labelled `(guess)` in the readout where it is displayed. **[O]**

## What was verified here, and what was not

| Claim | Register | Basis |
|---|---|---|
| Four viewports resolve to four distinct tiers, one bay marked, no horizontal scroll, clean console | **[O]** | `npm run check`, Chromium 1194, four fixed viewports |
| Dark mode, light mode and `prefers-reduced-motion` all repaint without reload | **[O]** | Playwright contexts with `colorScheme` and `reducedMotion` set |
| Page loads no third-party resource and touches no storage API | **[O]** | `grep` over `public/`; only own-origin URLs and XML namespaces present |
| Strict CSP (`default-src 'none'`) is satisfiable — no inline `<style>`, no `style=` attribute, no inline handler | **[O]** | `grep` over `public/*.html`; JS mutates style through CSSOM, which CSP does not gate |
| `font: -apple-system-body` on `:root` opts the page into Dynamic Type, so `rem` tracks the reader's text-size setting | **[V]** | Documented Safari behaviour; not reachable from Chromium. Chromium reports the 16px default, which is the intended fallback |
| `env(safe-area-inset-*)` returns non-zero on a notched iPhone and keeps content clear of the home indicator | **[V]** | Probes read `0 / 0 / 0 / 0` in Chromium — correct there, unproven on device |
| Add to Home Screen (iOS/iPadOS) and Add to Dock (Safari 17+) produce a standalone window with the supplied icon | **[V]** | Manifest and `apple-touch-icon` are in place; the install flow itself is untested here |
| Apple Watch hands web content a viewport narrower than any iPhone | **[V]** | The `watch` breakpoint is set at 319px because that clears the narrowest common iPhone width, not because a watch was measured — see the open item below |
| Cloudflare Workers Static Assets applies `public/_headers` at deploy | **[V]** | Not exercised; no deploy was run from this container |

## Open items

- ⟦FILL: the CSS viewport width Apple Watch actually reports for web content⟧ —
  until that is measured on a watch, `319px` is a floor chosen to sit under
  every iPhone, not a fitted breakpoint. If the real number is far below it, the
  `watch` tier is currently claiming widths no watch will ever send, and the
  breakpoint should move down rather than the layout change.
- ⟦FILL: measured Dynamic Type behaviour at the accessibility sizes⟧ — the layout
  is built to hold at the large accessibility text sizes; that has not been seen.

## Local development

```bash
npm install
npm run dev      # wrangler dev
npm run check    # tier assertions across four viewports (needs Playwright)
npm run icons    # re-render the PNG icons from scripts/make-icons.py
```

`npm run check` is deterministic: fixed viewports, no network, no randomness. It
proves the tier logic and the layout in Chromium. Chromium is not Safari — it
cannot prove any row marked **[V]** above.

## Deploy

```bash
npm run deploy
```

Publishes `public/` under the Worker name `ayeyoty-co`. Authenticate first with
`npx wrangler login`. Attach the domain in the Cloudflare dashboard under
**Workers & Pages → ayeyoty-co → Settings → Domains & Routes**, or uncomment the
`[[routes]]` blocks in `wrangler.toml`.

## Layout

```
public/
├── index.html            the venue
├── 404.html              same shell, no floor
├── venue.css             tokens, tiers, the four floors
├── venue.js              tier readout and keyboard navigation
├── app.webmanifest       Home Screen / Dock installation
├── _headers              CSP, cache, transport headers
├── robots.txt · sitemap.xml
└── icons/                apple-touch-icon, manifest icons, favicon, mask icon
scripts/
├── make-icons.py         renders the mark to PNG — stdlib only, no dependencies
└── check-tiers.mjs       the tier assertions behind `npm run check`
```

The icon geometry exists twice, in `scripts/make-icons.py` and in
`public/icons/favicon.svg`. They are kept identical by hand; change one and
change the other. **[O]**

## Standing constraints

Carried over from the governing instruction this work was commissioned under, and
held here as repository rules:

- **No browser storage.** No cookie, no `localStorage`, no `sessionStorage`, no
  IndexedDB. Readout state lives for the life of the tab. A reading that survives
  the tab is a record, and this page does not keep records.
- **No third-party requests.** No fonts, no analytics, no CDN. Typography is the
  Apple system stack, which is already on every device this venue targets.
- **Nothing is transmitted.** Every value in the stage monitor is measured in the
  reader's own browser and stays there.

These are why the CSP in `_headers` can be `default-src 'none'` rather than a
list of exceptions.
