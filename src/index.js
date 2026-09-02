// The venue, plus one endpoint.
//
// Everything is a static file except POST /mfile/manifest, which takes a
// manifest from the iPhone Shortcut, runs the administrator on it, and hands
// back the report. It stores nothing — the phone keeps its own manifest and
// saves the report next to it. An endpoint that quietly kept an inventory of
// someone's drive would be a different thing than the one that was asked for.

import { administer } from "./administer.js";

const MAX_BODY = 8 * 1024 * 1024; // a manifest is names and numbers; 8 MB is ~40k files
const MAX_RECORDS = 50000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-MFile-Token",
  "Access-Control-Max-Age": "86400",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

/** Constant-time compare, so a wrong token leaks no timing signal. */
function tokenMatches(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string") return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Reject anything that is not the shape the schema describes, before the
 * administrator sees it. A malformed record would otherwise produce a verdict,
 * and a verdict on a record nobody validated is the worst output this can give.
 */
function validate(manifest) {
  if (!manifest || typeof manifest !== "object") return "body is not an object";
  if (!Array.isArray(manifest.records)) return "records is not an array";
  if (manifest.records.length > MAX_RECORDS) return `more than ${MAX_RECORDS} records`;
  for (let i = 0; i < manifest.records.length; i++) {
    const r = manifest.records[i];
    if (!r || typeof r !== "object") return `record ${i} is not an object`;
    if (typeof r.path !== "string" || !r.path) return `record ${i} has no path`;
    if (typeof r.name !== "string" || !r.name) return `record ${i} has no name`;
    if (typeof r.bytes !== "number" || !Number.isFinite(r.bytes)) return `record ${i} has no numeric bytes`;
    if (r.content_hash !== undefined && typeof r.content_hash !== "string") {
      return `record ${i} has a non-string content_hash`;
    }
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/mfile/manifest") {
      return env.ASSETS.fetch(request);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "POST a manifest here. See mfile/manifest.schema.json." }, 405);
    }

    // No token configured means the endpoint is off, not open. A deploy that
    // forgets the secret must not become a public compute endpoint.
    if (!env.MFILE_TOKEN) {
      return json({ error: "endpoint not configured", owed: "wrangler secret put MFILE_TOKEN" }, 503);
    }
    if (!tokenMatches(request.headers.get("X-MFile-Token") ?? "", env.MFILE_TOKEN)) {
      return json({ error: "bad or missing X-MFile-Token" }, 401);
    }

    const length = Number(request.headers.get("Content-Length") ?? 0);
    if (length > MAX_BODY) {
      return json({ error: `manifest larger than ${MAX_BODY} bytes`, hint: "scan one folder at a time" }, 413);
    }

    let manifest;
    try {
      manifest = await request.json();
    } catch {
      return json({ error: "body is not valid JSON" }, 400);
    }

    const bad = validate(manifest);
    if (bad) return json({ error: `manifest rejected: ${bad}` }, 422);

    // Rules are not passed, so `iterative` and `novel` come back withheld.
    // That is correct until the cadence is confirmed, and the report says so
    // in its own `withheld` list rather than leaving it to be inferred.
    const report = administer(manifest);

    return json({
      administered_at: new Date().toISOString(),
      stored: false,
      note: "Nothing was kept. This endpoint computes and forgets; the report is yours to save.",
      report,
    });
  },
};
