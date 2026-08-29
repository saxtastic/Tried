# ayeyoty.co

Static site scaffold hosted on Cloudflare Workers (Static Assets).

## Structure

- `public/` — site files served at the edge (`index.html`, `robots.txt`, etc.)
- `public/simulator/` — the governance & corpus simulator (engine, corpus, browser UI)
- `sim/` — Node CLI driver for the same engine
- `test/` — engine test suite (`node:test`, no dependencies)
- `docs/` — the model behind the simulator, and how to drive it
- `wrangler.toml` — Cloudflare Workers configuration
- `package.json` — dev/deploy scripts

## Prerequisites

- A Cloudflare account with `ayeyoty.co` added as a zone (its nameservers must point to Cloudflare).
- Node.js installed locally.

## Local development

```bash
npm install
npm run dev
```

This runs the site locally via `wrangler dev`.

## Deploy

```bash
npm run deploy
```

This publishes the `public/` directory to Cloudflare under the Worker name `ayeyoty-co`. You'll need to authenticate first with `npx wrangler login`.

## Connecting the ayeyoty.co domain

1. In the Cloudflare dashboard, go to **Workers & Pages** and open the deployed `ayeyoty-co` worker.
2. Under **Settings > Domains & Routes**, click **Add Custom Domain** and enter `ayeyoty.co` (and `www.ayeyoty.co` if desired).
3. Cloudflare will automatically create the DNS records and issue an SSL certificate, since the zone is already on Cloudflare.
4. Alternatively, uncomment the `[[routes]]` blocks in `wrangler.toml` and redeploy to manage the domain binding as code.

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

The bundled case is a parameterised template, not a record of any real
proceeding. It is a working example and a set of dials.

## Next steps

- Replace the placeholder page in `public/index.html` with real content.
- Add more routes/pages as static files under `public/`.
- If you need server-side logic (APIs, redirects, auth), add a Worker entry script and reference it via `main` in `wrangler.toml`.
