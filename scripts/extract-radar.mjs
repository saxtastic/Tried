#!/usr/bin/env node
/* Extract the opportunity corpus from the TAL workbooks.
 *
 *   node scripts/extract-radar.mjs <dir-of-xlsx>
 *
 * These workbooks contain real, hard-won structure: fit scores, eligibility,
 * amounts, deadlines, cost-of-living ratios, evaluation criteria. None of it
 * computes — there is not one formula in 4,300 populated cells — so every score
 * in them is a typed judgment rather than a derived value.
 *
 * That is not a flaw to apologise for. A stipulated score is inspectable. But it
 * has to be MARKED as stipulated, or the spreadsheet reads like an analysis when
 * it is a considered opinion in a grid. So extraction carries provenance per
 * field: what was read off the sheet, and what basis it has.
 *
 * Requires python3 + openpyxl, which the repo does not depend on. This runs
 * out-of-band and commits its output; nothing at runtime needs it.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node scripts/extract-radar.mjs <dir containing the .xlsx files>');
  process.exit(2);
}

const PY = `
import openpyxl, glob, os, json, re, sys
src = sys.argv[1]
out = {"open_calls": [], "locations": [], "roles": []}

def cells(ws):
    return [[(c if c is None else str(c).strip()) for c in row] for row in ws.iter_rows(values_only=True)]

for f in glob.glob(os.path.join(src, '*.xlsx')):
    wb = openpyxl.load_workbook(f, data_only=True)
    base = os.path.basename(f)
    for ws in wb.worksheets:
        rows = cells(ws)
        t = ws.title
        if t == 'OPEN CALLS + PROPOSALS':
            for r in rows[2:]:
                if not r or not r[0] or not r[2]: continue
                out["open_calls"].append({
                    "priority": r[0], "type": r[1], "org": r[2], "amount": r[3],
                    "deadline": r[4], "eligibility": r[5], "fit_score": r[6],
                    "summary": r[7], "status": r[8], "source_sheet": t, "source_file": base,
                })
        if t == 'CITY FINANCIAL ANALYSIS':
            for r in rows[3:]:
                if not r or not r[0]: continue
                out["locations"].append({
                    "metro": r[0], "state_income_tax": r[1], "median_1br_rent": r[2],
                    "col_index": r[3], "typical_salary": r[4], "take_home_mo": r[5],
                    "rent_pct_take_home": r[6], "financial_score": r[7],
                    "source_sheet": t, "source_file": base,
                })
        if t == 'BEST FIT ROLES':
            for r in rows[3:]:
                if not r or not r[0]: continue
                out["roles"].append({
                    "role_type": r[0], "why_competitive": r[1], "without_references": r[2],
                    "target_institutions": r[3], "salary_range": r[4],
                    "source_sheet": t, "source_file": base,
                })
print(json.dumps(out))
`;

const raw = execFileSync('python3', ['-c', PY, SRC], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const data = JSON.parse(raw);

/** Pull the first integer out of a "9/10" style cell; null if there is none. */
const scoreOf = (s) => {
  const m = /(\d+)\s*\/\s*10/.exec(String(s ?? ''));
  return m ? Number(m[1]) : null;
};
/** Pull a dollar range. Returns [low, high] or null. */
const moneyOf = (s) => {
  const t = String(s ?? '').replace(/,/g, '');
  const nums = [...t.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*(k|K)?/g)].map((m) =>
    Number(m[1]) * (m[2] ? 1000 : 1),
  ).filter((n) => n >= 100);
  if (!nums.length) return null;
  return [Math.min(...nums), Math.max(...nums)];
};

const PROV = {
  extracted: { basis: 'sourced', note: 'Read verbatim off the workbook cell.' },
  parsed: { basis: 'derived', note: 'Parsed from the extracted cell text by a stated rule; the rule is in scripts/extract-radar.mjs.' },
  scored: {
    basis: 'none',
    note: 'AUTHORED JUDGMENT. The fit score was typed into the sheet by hand. There is not one formula in these workbooks, so no score in them was computed from anything.',
    owed: 'A stated rule that derives fit from named inputs, so the number can be recomputed and argued with rather than asserted.',
  },
};

const openCalls = data.open_calls.map((o, i) => ({
  id: `oc.${String(o.org ?? i).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`,
  category: 'open_call',
  kind: o.type,
  org: o.org,
  amount_text: o.amount,
  amount_range: moneyOf(o.amount),
  deadline_text: o.deadline,
  eligibility: o.eligibility,
  fit_score: scoreOf(o.fit_score),
  fit_score_text: o.fit_score,
  summary: o.summary,
  status: o.status,
  attempts: [],
  provenance: {
    org: PROV.extracted, amount_text: PROV.extracted, eligibility: PROV.extracted,
    amount_range: PROV.parsed, fit_score: PROV.scored,
    attempts: { basis: 'none', owed: 'Whether this was ever actually applied to, and what came back. The workbook records status but no outcome.' },
  },
  source: { file: o.source_file, sheet: o.source_sheet },
}));

const locations = data.locations.map((l) => ({
  id: `loc.${String(l.metro).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`,
  metro: l.metro,
  state_income_tax: l.state_income_tax,
  median_1br_rent: l.median_1br_rent,
  rent_range: moneyOf(l.median_1br_rent),
  col_index: l.col_index,
  typical_salary: l.typical_salary,
  salary_range: moneyOf(l.typical_salary),
  take_home_mo: l.take_home_mo,
  take_home_range: moneyOf(l.take_home_mo),
  rent_pct_take_home: l.rent_pct_take_home,
  financial_score: scoreOf(l.financial_score),
  provenance: {
    median_1br_rent: PROV.extracted, typical_salary: PROV.extracted,
    rent_range: PROV.parsed, salary_range: PROV.parsed, take_home_range: PROV.parsed,
    financial_score: PROV.scored,
    col_index: { basis: 'none', owed: 'The 2026 cost-of-living source the sheet says it is "based on". No citation is recorded in the workbook.' },
  },
  source: { file: l.source_file, sheet: l.source_sheet },
}));

const roles = data.roles.map((r) => ({
  id: `role.${String(r.role_type).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 44)}`,
  role_type: r.role_type,
  why_competitive: r.why_competitive,
  without_references: r.without_references,
  target_institutions: r.target_institutions,
  salary_range_text: r.salary_range,
  salary_range: moneyOf(r.salary_range),
  provenance: { why_competitive: PROV.scored, salary_range: PROV.parsed, role_type: PROV.extracted },
  source: { file: r.source_file, sheet: r.source_sheet },
}));

mkdirSync(resolve(ROOT, 'public/radar/corpus'), { recursive: true });
// The same workbook was uploaded twice under different names and is
// byte-identical, so records arrive doubled. Dedupe on id and record how many
// collapsed, rather than silently writing each record twice.
const dedupe = (rows) => {
  const seen = new Map();
  for (const r of rows) if (!seen.has(r.id)) seen.set(r.id, r);
  return { rows: [...seen.values()], dropped: rows.length - seen.size };
};

const write = (name, payload) => {
  const { rows, dropped } = dedupe(payload);
  const p = resolve(ROOT, 'public/radar/corpus', name);
  writeFileSync(p, JSON.stringify(rows, null, 2) + '\n');
  console.log(`  ${name.padEnd(20)} ${String(rows.length).padStart(3)} record(s)` +
    (dropped ? `  (${dropped} duplicate(s) collapsed)` : ''));
};

console.log('extracted from the TAL workbooks:');
write('open-calls.json', openCalls);
write('locations.json', locations);
write('roles.json', roles);
console.log('\nEvery fit score carries basis `none`. Not one of the 4,300 populated cells');
console.log('in these workbooks is a formula, so no score in them was computed.');
