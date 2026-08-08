# ayeyoty.co

Static site scaffold hosted on Cloudflare Workers (Static Assets).

## Structure

- `public/` — site files served at the edge (`index.html`, `robots.txt`, etc.)
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

## Next steps

- Replace the placeholder page in `public/index.html` with real content.
- Add more routes/pages as static files under `public/`.
- If you need server-side logic (APIs, redirects, auth), add a Worker entry script and reference it via `main` in `wrangler.toml`.
