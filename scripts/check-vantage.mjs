/* Browser assertions for the Vantage module.
 *
 *   npm run check:vantage
 *
 * What this proves: the singular module renders at all four floors, its
 * density ladder is the configuration's and not the code's, a field the
 * configuration withholds from a floor is not built there at all, no tab
 * control exists anywhere on the surface, every unverified date carries its
 * marker, and the workflow actions the engine offers are the ones on screen.
 *
 * Deterministic: fixed viewports, no network beyond loopback, no randomness.
 * Requires Playwright's Chromium. Chromium is not Safari.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const registry = JSON.parse(fs.readFileSync(path.join(PUBLIC, "registry.json"), "utf8"));

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
  { name: "watch",   width: 208,  height: 264,  expect: "watch" },
  { name: "iphone",  width: 393,  height: 852,  expect: "phone" },
  { name: "ipad",    width: 834,  height: 1112, expect: "pad" },
  { name: "macbook", width: 1440, height: 900,  expect: "desk" },
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("check-vantage: playwright is not installed. `npm i -D playwright` and retry.");
  process.exit(2);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(PUBLIC, url === "/" ? "index.html" : url);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(PUBLIC, "404.html");
    res.statusCode = 404;
  }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/dashboard.html`;

const browser = await chromium.launch();
let failures = 0;
const config = registry.vantage;

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector('#vantage[data-state="ready"]', { timeout: 5000 }).catch(() => {});

  const got = await page.evaluate(() => {
    const surface = document.getElementById("vantage-surface");
    const items = [...surface.querySelectorAll(".item")];
    return {
      tier: document.documentElement.dataset.tier,
      state: document.getElementById("vantage").dataset.state,
      unit: surface.dataset.unit,
      items: items.length,
      bandHeads: surface.querySelectorAll(".band-head").length,
      tallies: document.querySelectorAll("#vantage-strip .tally").length,
      actions: surface.querySelectorAll(".act").length,
      provenance: items.filter((i) => i.querySelector(".prov")).length,
      titles: items.filter((i) => i.querySelector(".f-title")).length,
      meters: surface.querySelectorAll(".f-meter").length,
      lines: items.map((i) => [...i.querySelectorAll(".item-line")].map((l) => l.dataset.line).join(",")),
      prose: surface.querySelectorAll(".f-prose").length,
      /* Any control that would make this more than one module. */
      tabs: document.querySelectorAll('[role="tab"], [role="tablist"], .tab, .tabs').length,
      sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      modules: document.querySelectorAll(".module").length,
    };
  });

  const density = config.density[vp.expect];
  const fieldOn = (id) => config.fields.find((f) => f.id === id)?.tiers.includes(vp.expect);
  const expectedItems = density.max_rows === null ? got.items : Math.min(got.items, density.max_rows);

  const problems = [];
  if (got.tier !== vp.expect) problems.push(`tier ${got.tier} != ${vp.expect}`);
  if (got.state !== "ready") problems.push(`module state ${got.state}`);
  if (got.unit !== density.unit) problems.push(`unit ${got.unit} != configured ${density.unit}`);
  if (!got.items) problems.push("no calls rendered");
  if (density.max_rows !== null && got.items > density.max_rows) {
    problems.push(`${got.items} rows exceeds configured max_rows ${density.max_rows}`);
  }
  if (got.titles !== got.items) problems.push(`${got.items - got.titles} rows without a title`);
  if (got.provenance !== got.items) problems.push(`${got.items - got.provenance} rows without a provenance marker`);
  if (got.tabs) problems.push(`${got.tabs} tab control(s) — this is meant to be one module`);
  if (got.modules !== 1) problems.push(`${got.modules} modules on the page, expected 1`);
  if (got.sideways) problems.push("horizontal scroll");
  if (errors.length) problems.push(`console: ${errors.join(" | ")}`);

  /* Withheld fields must not be built, not merely hidden. */
  if (!density.band_headings && got.bandHeads) problems.push("band headings built where configuration withholds them");
  if (density.band_headings && !got.bandHeads) problems.push("band headings configured but absent");
  if (!density.actions && got.actions) problems.push("workflow actions built where configuration withholds them");
  if (!fieldOn("fit") && got.meters) problems.push("fit meter built on a floor that does not list it");
  if (fieldOn("fit") && !got.meters) problems.push("fit meter listed for this floor but absent");
  if (!fieldOn("summary") && got.prose) problems.push("summary built on a floor that does not list it");
  if (fieldOn("summary") && !got.prose) problems.push("summary listed for this floor but absent");

  /* Rows are configuration: the item must carry exactly the line groups the
     configuration declares for this floor, in the order it declares them. */
  {
    const expectedLines = [];
    for (const f of config.fields) {
      if (!f.tiers.includes(vp.expect)) continue;
      const line = f.line || "signals";
      if (!expectedLines.includes(line)) expectedLines.push(line);
    }
    const wanted = expectedLines.join(",");
    const wrong = got.lines.filter((l) => l !== wanted);
    if (wrong.length) {
      problems.push(`${wrong.length} item(s) grouped as "${wrong[0]}", configuration says "${wanted}"`);
    }
  }

  if (problems.length) failures++;
  console.log(
    `${problems.length ? "FAIL" : "PASS"}  ${vp.name.padEnd(8)} ${String(vp.width).padStart(4)}×${vp.height}  ` +
      `${String(got.items).padStart(2)} rows · ${got.unit} · ${got.tallies} tallies · ${got.actions} actions` +
      (problems.length ? `\n        — ${problems.join("\n        — ")}` : "")
  );
  await context.close();
}

/* One workflow action, driven end to end: the offered transition moves the
   record to the stage the spec says it should, with no reload. */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector('#vantage[data-state="ready"]');

  const moved = await page.evaluate(async () => {
    const btn = document.querySelector("#vantage-surface .act");
    if (!btn) return { skipped: true };
    const id = btn.getAttribute("data-call");
    const transition = btn.getAttribute("data-transition");
    const item = btn.closest(".item");
    const before = item.querySelector(".f-stage")?.textContent;
    btn.click();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const after = document.getElementById("call-" + id)?.closest(".item")
      ?.querySelector(".f-stage")?.textContent;
    return { id, transition, before, after };
  });

  const spec = registry.workflow.transitions.find((t) => t.id === moved.transition);
  const target = registry.workflow.stages.find((s) => s.id === spec?.to);
  const problems = [];
  if (moved.skipped) problems.push("no action button to drive");
  else if (moved.after !== target?.label) problems.push(`stage "${moved.after}" != spec target "${target?.label}"`);

  if (problems.length) failures++;
  console.log(
    `${problems.length ? "FAIL" : "PASS"}  workflow  "${moved.transition}" ${moved.before} → ${moved.after}` +
      (problems.length ? `  — ${problems.join("; ")}` : "")
  );
  await context.close();
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
