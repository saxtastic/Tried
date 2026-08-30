#!/usr/bin/env node
// Renders the record book to static pages under public/record-book/.
// Run: npm run record-book:build

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validate, isUnpunished, OUTCOMES } from './validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'record-book');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const NAV = [
  ['index.html', 'Complaint log'],
  ['register.html', 'Register'],
  ['impediments.html', 'Impediments'],
  ['archives.html', 'Archives'],
];

const page = (file, title, lede, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} &middot; Record Book</title>
<link rel="stylesheet" href="record-book.css">
</head>
<body>
<header class="masthead">
  <p class="eyebrow">Record Book</p>
  <h1>${esc(title)}</h1>
  <p class="lede">${lede}</p>
  <nav>${NAV.map(([h, l]) =>
    h === file ? `<span aria-current="page">${esc(l)}</span>`
               : `<a href="${h}">${esc(l)}</a>`).join('')}</nav>
</header>
<main>
${body}
</main>
<footer>
  <p>A documentary record, not a legal filing. Nothing here initiates or preserves a
  cause of action. Every entry is generated from the data files in
  <code>record-book/data/</code>; do not edit these pages by hand.</p>
  <p>Built ${new Date().toISOString().slice(0, 10)}.</p>
</footer>
</body>
</html>
`;

const opts_ = { timeZone: 'UTC', year: 'numeric' };
const fmtDate = (v) => {
  if (!v) return '?';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(v + 'T00:00:00Z').toLocaleDateString('en-GB',
      { ...opts_, day: 'numeric', month: 'long' });
  }
  if (/^\d{4}-\d{2}$/.test(v)) {
    return new Date(v + '-01T00:00:00Z').toLocaleDateString('en-GB', { ...opts_, month: 'long' });
  }
  return v; // a bare year, or a hedge such as "c. 1799" or "after 1857"
};

const dateLabel = (d) => {
  if (!d) return '';
  const opts = { timeZone: 'UTC', year: 'numeric' };
  const fmt = (v) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(v + 'T00:00:00Z').toLocaleDateString('en-GB',
        { ...opts, day: 'numeric', month: 'long' });
    }
    if (/^\d{4}-\d{2}$/.test(v)) {
      return new Date(v + '-01T00:00:00Z').toLocaleDateString('en-GB', { ...opts, month: 'long' });
    }
    return v; // a bare year, or a hedge such as "c. 1799" or "after 1857"
  };
  return d.end && d.end !== d.start ? `${fmt(d.start)} – ${fmt(d.end)}` : fmt(d.start);
};

const placeLabel = (p) =>
  [p?.locality, p?.county && `${p.county} County`, p?.state].filter(Boolean).join(', ')
  || p?.note || '';

const countLabel = (c) => {
  if (!c) return '';
  const n = (v) => v.toLocaleString('en-US');
  if (c.documented != null && c.estimated_high) {
    return `${n(c.documented)} confirmed; estimates to ${n(c.estimated_high)}`;
  }
  if (c.documented != null) return `${n(c.documented)} documented`;
  if (c.estimated_low && c.estimated_high) return `estimated ${n(c.estimated_low)}–${n(c.estimated_high)}`;
  return 'not counted';
};

const list = (items, cls = '') =>
  items?.length ? `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';

// ---------------------------------------------------------------- complaints

function renderComplaints({ complaints, persons, impediments }) {
  const personById = new Map(persons.map((p) => [p.id, p]));
  const impById = new Map(impediments.map((i) => [i.id, i]));

  const entries = complaints.map((c) => {
    const unpunished = isUnpunished(c.process.outcome);
    const harmed = (c.harmed?.persons ?? []).map((id) => {
      const p = personById.get(id);
      return `<a href="register.html#${id}">${esc(p ? p.name.display : id)}</a>`;
    }).join(', ');

    const imps = (c.impediments ?? []).map((id) =>
      `<a class="chip" href="impediments.html#${id}">${esc(impById.get(id)?.name ?? id)}</a>`
    ).join('');

    return `
<article class="entry" id="${c.id}">
  <header>
    <p class="docket">${esc(c.id)}</p>
    <h2>${esc(c.title)}</h2>
    <p class="where">${esc(dateLabel(c.incident.date))}${
      placeLabel(c.incident.place) ? ' &middot; ' + esc(placeLabel(c.incident.place)) : ''}</p>
    <p class="flags">
      <span class="flag ${unpunished ? 'flag-unpunished' : 'flag-punished'}">${
        unpunished ? 'Unpunished' : 'Conviction sustained'}</span>
      <span class="flag">${esc(OUTCOMES[c.process.outcome])}</span>
      <span class="flag flag-${esc(c.verification)}">${esc(c.verification)}</span>
      ${c.respondents?.official_capacity
        ? '<span class="flag flag-official">Acting under colour of law</span>' : ''}
    </p>
  </header>

  <div class="field"><h3>Conduct alleged</h3><p>${esc(c.conduct_alleged)}</p></div>

  <div class="field"><h3>Harmed</h3>
    ${harmed ? `<p>${harmed}</p>` : ''}
    ${c.harmed?.count ? `<p class="meta">Count: ${esc(countLabel(c.harmed.count))}${
      c.harmed.count.note ? ' — ' + esc(c.harmed.count.note) : ''}</p>` : ''}
    ${c.harmed?.collective ? `<p class="meta">Collective: ${esc(c.harmed.collective)}</p>` : ''}
  </div>

  <div class="field"><h3>Respondents</h3><p>${esc(c.respondents.described)}</p></div>

  <div class="field"><h3>Process and disposition</h3>
    ${c.process.forum ? `<p class="meta">Forum: ${esc(c.process.forum)}</p>` : ''}
    <p>${esc(c.process.narrative)}</p>
  </div>

  ${imps ? `<div class="field"><h3>Impediments</h3><p class="chips">${imps}</p></div>` : ''}

  ${(c.remedy?.sought?.length || c.remedy?.granted?.length || c.remedy?.outstanding)
    ? `<div class="field"><h3>Remedy</h3>
        ${c.remedy.sought?.length ? `<p class="meta">Sought</p>${list(c.remedy.sought)}` : ''}
        ${c.remedy.granted?.length ? `<p class="meta">Granted</p>${list(c.remedy.granted)}` : ''}
        ${c.remedy.outstanding ? `<p class="meta">Outstanding</p><p>${esc(c.remedy.outstanding)}</p>` : ''}
      </div>` : ''}

  ${c.status_note ? `<div class="field note"><p>${esc(c.status_note)}</p></div>` : ''}

  <p class="sources">Sources: ${
    (c.sources ?? []).map((s) => `<a href="archives.html#${s}">${esc(s)}</a>`).join(', ')
    || 'none on file'}</p>
</article>`;
  }).join('\n');

  const unpunishedCount = complaints.filter((c) => isUnpunished(c.process.outcome)).length;
  const lede = `${complaints.length} entries. <strong>${unpunishedCount}</strong> record conduct
    for which no perpetrator was ever criminally convicted. The flag is derived from the
    recorded disposition, not asserted: a settlement, an apology, or the exoneration of the
    victim leaves an entry unpunished.`;

  const toc = `<nav class="toc"><h2>Entries</h2><ol>${complaints.map((c) =>
    `<li><a href="#${c.id}">${esc(c.title)}</a> <span>${esc(dateLabel(c.incident.date))}</span></li>`
  ).join('')}</ol></nav>`;

  return page('index.html', 'Complaint log', lede, toc + entries);
}

// ------------------------------------------------------------------ register

function renderRegister({ persons, complaints }) {
  const complaintById = new Map(complaints.map((c) => [c.id, c]));
  const GROUPS = [
    ['named', 'Named', 'The name survives in a source.'],
    ['name_unrecorded', 'Name unrecorded',
     'A distinct individual, attested by the sources, whose name was not preserved. Each gets a row. None is folded into a number.'],
    ['collectively_recorded', 'Recorded only as a count',
     'Where sources preserve no individuation, one row carries the count and says so. These rows are counts. They are not people, and must not be read as people.'],
  ];

  const body = GROUPS.map(([status, heading, gloss]) => {
    const rows = persons.filter((p) => p.identity_status === status);
    if (!rows.length) return '';
    return `<section class="group">
  <h2>${esc(heading)} <span class="tally">${rows.length}</span></h2>
  <p class="gloss">${esc(gloss)}</p>
  ${rows.map((p) => `
  <article class="person" id="${p.id}">
    <h3>${esc(p.name.display)}</h3>
    <p class="flags">
      <span class="flag flag-standing-${esc(p.standing)}">${esc(p.standing.replace(/_/g, ' '))}</span>
      ${p.life?.born || p.life?.died
        ? `<span class="flag">${esc(fmtDate(p.life.born))} – ${esc(fmtDate(p.life.died))}</span>` : ''}
      ${p.count ? `<span class="flag">${esc(countLabel(p.count))}</span>` : ''}
    </p>
    ${p.place ? `<p class="meta">${esc(p.place)}</p>` : ''}
    ${p.role ? `<p><em>${esc(p.role)}</em></p>` : ''}
    ${p.harm ? `<p>${esc(p.harm)}</p>` : ''}
    ${p.count?.basis ? `<p class="meta">Basis of count: ${esc(p.count.basis)}</p>` : ''}
    ${p.attestation ? `<p class="meta">Attestation: ${esc(p.attestation)}</p>` : ''}
    ${p.voice ? `<blockquote>${esc(p.voice.words)}
      <cite>${esc(p.voice.citation)}</cite></blockquote>` : ''}
    ${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
    <p class="sources">
      ${(p.complaints ?? []).map((id) =>
        `<a href="index.html#${id}">${esc(complaintById.get(id)?.title ?? id)}</a>`).join(' &middot; ')}
    </p>
    <p class="consent">${esc(p.consent_note)}</p>
  </article>`).join('')}
</section>`;
  }).join('\n');

  const named = persons.filter((p) => p.identity_status === 'named').length;
  const counted = persons.filter((p) => p.identity_status === 'collectively_recorded')
    .reduce((n, p) => n + (p.count?.documented ?? p.count?.estimated_low ?? 0), 0);

  const lede = `${persons.length} rows. ${named} people are named here.
    The rows that carry counts instead account for at least
    ${counted.toLocaleString('en-US')} more. That disproportion is the register's
    principal finding, and it is not a gap this book can close on its own.
    <strong>Being recorded here is not being made a claimant.</strong>`;

  return page('register.html', 'Victim and claimant register', lede, body);
}

// --------------------------------------------------------------- impediments

function renderImpediments({ impediments, complaints }) {
  const usedBy = (id) => complaints.filter((c) => (c.impediments ?? []).includes(id));
  const body = impediments.map((i) => {
    const cited = usedBy(i.id);
    return `<article class="entry" id="${i.id}">
  <header>
    <p class="docket">${esc(i.id)}</p>
    <h2>${esc(i.name)}</h2>
    <p class="flags">
      <span class="flag">${esc(i.kind)}</span>
      <span class="flag flag-status-${esc(i.status)}">${esc(i.status)}</span>
      <span class="flag">invoked by ${cited.length} ${cited.length === 1 ? 'entry' : 'entries'}</span>
    </p>
  </header>
  <div class="field"><h3>Authority</h3><p>${esc(i.authority)}</p></div>
  <div class="field"><h3>Mechanism</h3><p>${esc(i.mechanism)}</p></div>
  <div class="field"><h3>Effect</h3><p>${esc(i.effect)}</p></div>
  ${i.repudiated_by ? `<div class="field"><h3>Displaced by</h3><p>${esc(i.repudiated_by)}</p></div>` : ''}
  ${i.note ? `<div class="field note"><p>${esc(i.note)}</p></div>` : ''}
  <p class="sources">${cited.map((c) =>
    `<a href="index.html#${c.id}">${esc(c.title)}</a>`).join(' &middot; ') || 'not yet invoked'}</p>
</article>`;
  }).join('\n');

  const operative = impediments.filter((i) => i.status === 'operative').length;
  const lede = `The mechanisms that converted documented injury into non-cognizable claim.
    ${operative} of ${impediments.length} remain <strong>operative law</strong>. Read across the
    links at the foot of each entry: the same few doctrines, most of them about who may hear a
    claim rather than whether the injury occurred, recur across a century and a half.`;

  return page('impediments.html', 'Impediments', lede, body);
}

// ------------------------------------------------------------------ archives

function renderArchives({ archives, complaints, persons }) {
  const usedBy = (id) =>
    complaints.filter((c) => (c.sources ?? []).includes(id)).length +
    persons.filter((p) =>
      (p.sources ?? []).includes(id) || p.voice?.source === id).length;
  const body = `<table class="archives">
<thead><tr><th>Collection</th><th>Holder</th><th>Rights</th><th>Cited by</th></tr></thead>
<tbody>
${archives.map((a) => `<tr id="${a.id}">
  <td>
    <strong>${a.url ? `<a href="${esc(a.url)}" rel="noopener">${esc(a.title)}</a>` : esc(a.title)}</strong>
    ${a.author ? `<br><span class="meta">${esc(a.author)}${a.year ? `, ${a.year}` : ''}</span>` : ''}
    ${a.note ? `<br><span class="note">${esc(a.note)}</span>` : ''}
    ${a.url && !a.verified ? '<br><span class="warn">Locator not yet resolved — treat as a lead, not a citation.</span>' : ''}
  </td>
  <td>${esc(a.holder)}</td>
  <td><span class="flag flag-rights-${esc(a.rights)}">${esc(a.rights.replace(/_/g, ' '))}</span>
      ${a.fetchable ? '<br><span class="meta">fetchable</span>' : ''}</td>
  <td class="meta">${usedBy(a.id) || '—'}</td>
</tr>`).join('')}
</tbody></table>`;

  const fetchable = archives.filter((a) => a.fetchable).length;
  const lede = `${archives.length} collections. ${fetchable} are public domain or open access and
    can be pulled with <code>npm run record-book:fetch</code>; nothing large is committed to this
    repository. Locators marked unresolved were written from knowledge of the collection and have
    not been checked in this session.`;

  return page('archives.html', 'Archives', lede, body);
}

// ----------------------------------------------------------------------- css

const CSS = `:root {
  color-scheme: light dark;
  --bg: #fbfaf7;
  --panel: #ffffff;
  --ink: #1d1c19;
  --ink-soft: #5c5850;
  --rule: #ddd8ce;
  --accent: #7a2119;
  --flag-bg: #efece4;
  --warn: #8a5a00;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16150f;
    --panel: #1e1d16;
    --ink: #e9e5da;
    --ink-soft: #a29c8d;
    --rule: #3a382d;
    --accent: #d98a7e;
    --flag-bg: #2a2820;
    --warn: #d9ac5a;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 16px/1.65 "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
}
a { color: var(--accent); }
main, .masthead, footer { max-width: 46rem; margin: 0 auto; padding: 0 1.25rem; }

.masthead { padding-top: 3rem; padding-bottom: 1rem; border-bottom: 2px solid var(--ink); }
.eyebrow {
  margin: 0; font-size: .7rem; letter-spacing: .22em; text-transform: uppercase;
  color: var(--ink-soft);
}
.masthead h1 { margin: .3rem 0 .6rem; font-size: 2.1rem; line-height: 1.15; font-weight: 600; }
.lede { margin: 0 0 1.2rem; color: var(--ink-soft); }
.masthead nav { display: flex; flex-wrap: wrap; gap: 1.1rem; padding-bottom: .8rem; font-size: .9rem; }
.masthead nav [aria-current] { font-weight: 600; border-bottom: 2px solid var(--accent); }

.toc { margin: 2rem 0 3rem; }
.toc h2 { font-size: .75rem; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-soft); }
.toc ol { padding-left: 1.4rem; }
.toc li { margin: .35rem 0; }
.toc span { color: var(--ink-soft); font-size: .85rem; white-space: nowrap; }

.entry, .person, .group {
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: 3px;
  padding: 1.5rem;
  margin: 0 0 1.75rem;
}
.group { padding-bottom: .5rem; }
.group > h2 { margin-top: 0; font-size: 1.15rem; }
.tally { color: var(--ink-soft); font-weight: 400; font-size: .9rem; }
.gloss { color: var(--ink-soft); font-size: .9rem; margin-top: -.4rem; }
.person { border: 0; border-top: 1px solid var(--rule); border-radius: 0; padding: 1.25rem 0; margin: 0; }
.person h3 { margin: 0 0 .5rem; font-size: 1.05rem; }

.docket { margin: 0; font-size: .7rem; letter-spacing: .16em; color: var(--ink-soft); }
.entry h2 { margin: .25rem 0 .35rem; font-size: 1.35rem; line-height: 1.25; }
.where { margin: 0 0 .75rem; color: var(--ink-soft); font-size: .9rem; }

.flags { display: flex; flex-wrap: wrap; gap: .4rem; margin: .5rem 0 1.1rem; }
.flag {
  display: inline-block; padding: .16rem .55rem; border-radius: 2px;
  background: var(--flag-bg); color: var(--ink-soft);
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .72rem;
  letter-spacing: .04em; text-transform: lowercase;
}
.flag-unpunished { background: var(--accent); color: #fff; text-transform: none; font-weight: 600; }
.flag-punished { background: #2f5d3f; color: #fff; text-transform: none; font-weight: 600; }
.flag-official, .flag-status-operative { outline: 1px solid var(--accent); }
.flag-unverified, .flag-contested { outline: 1px dashed var(--warn); color: var(--warn); }
.flag-standing-claimant { outline: 1px solid var(--accent); }

.field { margin: 1.1rem 0; }
.field h3 {
  margin: 0 0 .25rem; font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: .7rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-soft);
}
.field p { margin: .3rem 0; }
.meta { color: var(--ink-soft); font-size: .88rem; }
.note { color: var(--ink-soft); font-size: .9rem; font-style: italic; }
.warn { color: var(--warn); font-size: .8rem; }
.chips { display: flex; flex-wrap: wrap; gap: .35rem; }
.chip {
  padding: .16rem .55rem; border: 1px solid var(--rule); border-radius: 2px;
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .75rem; text-decoration: none;
}
blockquote {
  margin: .9rem 0; padding: .1rem 0 .1rem 1rem;
  border-left: 3px solid var(--accent); font-size: 1.05rem;
}
blockquote cite {
  display: block; margin-top: .4rem; font-size: .8rem; font-style: normal; color: var(--ink-soft);
}
.sources { margin: 1.1rem 0 0; padding-top: .7rem; border-top: 1px solid var(--rule);
  font-size: .82rem; color: var(--ink-soft); }
.consent { margin: .5rem 0 0; font-size: .76rem; color: var(--ink-soft); font-style: italic; }

.archives { width: 100%; border-collapse: collapse; font-size: .9rem; }
.archives th, .archives td { text-align: left; vertical-align: top; padding: .7rem .6rem;
  border-bottom: 1px solid var(--rule); }
.archives th { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .7rem;
  letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); }
.table-scroll { overflow-x: auto; }

footer { margin: 3rem auto 4rem; padding-top: 1.2rem; border-top: 1px solid var(--rule);
  color: var(--ink-soft); font-size: .82rem; }
`;

// ---------------------------------------------------------------------- main

const data = validate();
if (data.errors.length) {
  for (const e of data.errors) console.error(`  ERROR ${e}`);
  console.error('\nBuild aborted: fix the errors above.');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const files = {
  'index.html': renderComplaints(data),
  'register.html': renderRegister(data),
  'impediments.html': renderImpediments(data),
  'archives.html': renderArchives(data),
  'record-book.css': CSS,
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`  wrote public/record-book/${name}`);
}
console.log(`\n${data.complaints.length} complaints, ${data.persons.length} register entries.`);
