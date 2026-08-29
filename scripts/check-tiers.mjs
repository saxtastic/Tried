/* Tier check for the venue.
 *
 * Serves ./public over a loopback port, opens it at four viewports, and asserts
 * that the floor the CSS reports is the floor that was expected, that exactly
 * one bay is marked, that nothing scrolls sideways, and that the console stays
 * clean. Reproducible: fixed viewports, no network, no randomness.
 *
 *   npm run check
 *
 * Requires Playwright's Chromium. Chromium is not Safari, so this proves the
 * tier logic and the layout, not WebKit-specific behaviour -- Dynamic Type and
 * the safe-area insets still have to be checked on device.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

const VIEWPORTS = [
  { name: "watch", width: 208, height: 264, expect: "watch" },
  { name: "iphone", width: 393, height: 852, expect: "phone" },
  { name: "ipad", width: 834, height: 1112, expect: "pad" },
  { name: "macbook", width: 1440, height: 900, expect: "desk" },
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("check-tiers: playwright is not installed. `npm i -D playwright` and retry.");
  process.exit(2);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(ROOT, url === "/" ? "index.html" : url);
  // Mirror Workers Static Assets: a directory resolves to its index.html.
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
    file = path.join(ROOT, "404.html");
    res.statusCode = 404;
  }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
let failures = 0;

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(base, { waitUntil: "networkidle" });

  const got = await page.evaluate(() => ({
    tier: document.documentElement.dataset.tier,
    chip: document.getElementById("tier-name").textContent,
    marked: [...document.querySelectorAll('.bay[data-active="true"]')].map((b) => b.id),
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    monitorFilled: [...document.querySelectorAll("#readout-list dd")].every((d) => d.textContent !== "—"),
  }));

  const problems = [];
  if (got.tier !== vp.expect) problems.push(`tier ${got.tier} != ${vp.expect}`);
  if (got.chip !== vp.expect) problems.push(`chip ${got.chip} != ${vp.expect}`);
  if (got.marked.length !== 1) problems.push(`${got.marked.length} bays marked`);
  if (got.sideways) problems.push("horizontal scroll");
  if (!got.monitorFilled) problems.push("monitor has unfilled rows");
  if (errors.length) problems.push(`console: ${errors.join(" | ")}`);

  // The fleet subtree runs on the same shell, so it must resolve the same tier.
  await page.goto(new URL("/fleet/", base).href, { waitUntil: "networkidle" });
  const sub = await page.evaluate(() => ({
    tier: document.documentElement.dataset.tier,
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    roster: document.querySelectorAll(".crew").length,
  }));
  if (sub.tier !== vp.expect) problems.push(`/fleet/ tier ${sub.tier} != ${vp.expect}`);
  if (sub.sideways) problems.push("/fleet/ horizontal scroll");
  if (sub.roster < 1) problems.push("/fleet/ roster empty");

  // The fellowships subtree runs on the same shell and must behave the same.
  await page.goto(new URL("/fellowships/", base).href, { waitUntil: "networkidle" });
  await page.waitForSelector('#vantage[data-state="ready"]', { timeout: 5000 }).catch(() => {});
  const fel = await page.evaluate(() => ({
    tier: document.documentElement.dataset.tier,
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    cards: document.querySelectorAll("#vantage-surface .item").length,
  }));
  if (fel.tier !== vp.expect) problems.push(`/fellowships/ tier ${fel.tier} != ${vp.expect}`);
  if (fel.sideways) problems.push("/fellowships/ horizontal scroll");
  if (fel.cards < 1) problems.push("/fellowships/ surface empty");

  if (problems.length) failures++;
  console.log(
    `${problems.length ? "FAIL" : "PASS"}  ${vp.name.padEnd(8)} ${vp.width}×${vp.height}` +
      (problems.length ? `  — ${problems.join("; ")}` : "")
  );
  await context.close();
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
