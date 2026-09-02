#!/usr/bin/env node
// Renders the record book to static pages under public/record-book/.
// Run: npm run record-book:build

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { feasibility, CONFIRMATION, validate, isUnpunished, isMateriallyRestored, OUTCOMES, ACT, ATTRIBUTION,
         RESTORATION, VANTAGE, TRANSMISSION, DOMAINS, harmWeb,
         ECHELON, DISPOSITION, rungOf, routes, routeFinding,
         ERAS, childrenAcrossEras } from './validate.mjs';
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'record-book');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const NAV = [
  ['index.html', 'Complaint log'],
  ['web.html', 'Web of harm'],
  ['routes.html', 'Route of authority'],
  ['children.html', 'The child'],
  ['rights.html', 'Rights'],
  ['legislation.html', 'Legislation'],
  ['lexicon.html', 'Language'],
  ['precedent.html', 'Precedent'],
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
    const restored = isMateriallyRestored(c.restoration.forms);
    const harmed = (c.harmed?.persons ?? []).map((id) => {
      const p = personById.get(id);
      return `<a href="register.html#${id}">${esc(p ? p.name.display : id)}</a>`;
    }).join(', ');

    const named = c.respondents?.named ?? null;
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
    <dl class="axes">
      <div><dt>Act</dt><dd class="axis-${esc(c.finding.act)}" title="${esc(ACT[c.finding.act])}">${
        esc(c.finding.act)}</dd></div>
      <div><dt>Actor</dt><dd class="axis-${esc(c.finding.attribution)}" title="${
        esc(ATTRIBUTION[c.finding.attribution])}">${
        esc(c.finding.attribution.replace(/_/g, ' '))}</dd></div>
      <div><dt>Forum</dt><dd class="axis-outcome">${esc(OUTCOMES[c.process.outcome])}</dd></div>
      <div><dt>Restoration</dt><dd class="axis-rest-${restored ? 'material' : 'none'}">${
        c.restoration.forms.length
          ? esc(c.restoration.forms.map((f) => f.replace(/_/g, ' ')).join(', '))
          : 'none'}</dd></div>
    </dl>
    <p class="flags">
      <span class="flag ${unpunished ? 'flag-unpunished' : 'flag-punished'}">${
        unpunished ? 'Unpunished' : 'Conviction sustained'}</span>
      <span class="flag flag-${esc(c.verification)}">record: ${esc(c.verification)}</span>
      ${c.respondents?.official_capacity
        ? '<span class="flag flag-official">Acting under colour of law</span>' : ''}
    </p>
    <p class="domains">${c.harm_domains.map((dm) =>
      `<a class="domain domain-${esc(dm)}" href="web.html#${esc(dm)}" title="${
        esc(DOMAINS[dm])}">${esc(dm)}</a>`).join('')}</p>
    ${c.offense.length
      ? `<p class="offenses">${c.offense.map((o) =>
          `<span class="offense">${esc(o.replace(/_/g, ' '))}</span>`).join('')}</p>
         <p class="meta offense-caveat">Offences named characterise the conduct. Naming an
         offence is not naming an offender: that is the Actor axis above.</p>`
      : `<p class="meta">${esc(c.offense_note ?? '')}</p>`}
  </header>

  <div class="field"><h3>Conduct</h3><p>${esc(c.conduct)}</p></div>

  <div class="field"><h3>Harmed</h3>
    ${harmed ? `<p>${harmed}</p>` : ''}
    ${c.harmed?.count ? `<p class="meta">Count: ${esc(countLabel(c.harmed.count))}${
      c.harmed.count.note ? ' — ' + esc(c.harmed.count.note) : ''}</p>` : ''}
    ${c.harmed?.collective ? `<p class="meta">Collective: ${esc(c.harmed.collective)}</p>` : ''}
  </div>

  ${c.harmed?.interstitial ? `<div class="field"><h3>Interstitial harm</h3>
    <p>${esc(c.harmed.interstitial)}</p>
    <p class="meta">What falls between the recorded events, and is counted nowhere.</p>
  </div>` : ''}

  <div class="field"><h3>Rights violated</h3>
    <p class="chips">${(c.rights_violated ?? []).map((r) =>
      `<a class="chip" href="rights.html#${r}">${esc(RIGHTS.get(r)?.name ?? r)}</a>`).join('')}</p>
    <p class="meta">Every entry also violates the right to an effective remedy, by construction —
    an established act with no forum, no conviction and no restoration <em>is</em> that denial.
    It is derived rather than listed here.</p>
  </div>

  ${c.foreclosed_contribution ? `<div class="field foreclosed"><h3>Foreclosed</h3>
    <p>${esc(c.foreclosed_contribution.basis)}</p>
    <p class="note">${esc(c.foreclosed_contribution.note)}</p>
  </div>` : ''}

  ${c.harmed?.children ? `<div class="field children"><h3>Reached as a child</h3>
    <p class="chips">${c.harmed.children.mechanism.map((m) =>
      `<span class="chip">${esc(m.replace(/_/g, ' '))}</span>`).join('')}</p>
    <p>${esc(c.harmed.children.carried_into_adulthood)}</p>
    <p class="meta">What the child carried into adulthood.</p>
  </div>` : ''}

  ${c.harmed?.transmitted ? `<div class="field transmitted"><h3>Transmitted harm
    <span class="flag flag-trans-${esc(c.harmed.transmitted.standing)}">${
      esc(c.harmed.transmitted.standing.replace(/_/g, ' '))}</span></h3>
    <p>${esc(c.harmed.transmitted.description)}</p>
    <p class="meta">${esc(TRANSMISSION[c.harmed.transmitted.standing])}</p>
    ${c.harmed.transmitted.note ? `<p class="note">${esc(c.harmed.transmitted.note)}</p>` : ''}
  </div>` : ''}

  <div class="field"><h3>Respondents</h3><p>${esc(c.respondents.described)}</p></div>

  <div class="field"><h3>Process and disposition</h3>
    ${c.process.forum ? `<p class="meta">Forum: ${esc(c.process.forum)}</p>` : ''}
    <p>${esc(c.process.narrative)}</p>
  </div>

  <div class="field"><h3>Route of authority</h3>
    <p class="meta">The actor stood at <strong>${esc(c.respondents.echelon.replace(/_/g, ' '))}</strong>.
    Each rung the matter reached, or failed to.</p>
    <ol class="ladder">${(c.process.escalation ?? []).map((r) => `<li class="rung ${
      (r.track ?? 'against_perpetrators') === 'against_the_harmed' ? 'rung-inverted' : ''}">
      <span class="rung-name">${esc(r.rung.replace(/_/g, ' '))}</span>
      <span class="rung-body"><strong>${esc(r.forum)}</strong>
        <span class="rung-disp">${esc(r.disposition.replace(/_/g, ' '))}</span>
        ${(r.track ?? 'against_perpetrators') === 'against_the_harmed'
          ? '<span class="rung-track">run against the harmed</span>' : ''}
        ${r.note ? `<br><span class="meta">${esc(r.note)}</span>` : ''}</span>
    </li>`).join('')}</ol>
  </div>

  ${imps ? `<div class="field"><h3>Impediments</h3><p class="chips">${imps}</p></div>` : ''}

  ${named ? `<div class="field"><h3>Named in the sources</h3>
    <p class="meta">Whom the sources accuse, with the source that made the accusation. The book
    reports the naming; it does not join it. Nothing here is a finding of guilt.</p>
    <ul class="named">${named.map((r) => `<li>
      <strong>${esc(r.name)}</strong> <span class="flag flag-resp-${esc(r.status)}">${
        esc(r.status.replace(/_/g, ' '))}</span>
      <br><span class="meta">${esc(r.role)}</span>
      ${r.note ? `<br>${esc(r.note)}` : ''}
      <br><span class="meta">Named by <a href="archives.html#${r.source}">${esc(r.source)}</a></span>
    </li>`).join('')}</ul>
  </div>` : ''}

  <div class="field"><h3>Concurrence of vantages</h3>
    <p><span class="meta">Agree —</span> ${esc(c.concurrence.agree)}</p>
    <p><span class="meta">Diverge —</span> ${esc(c.concurrence.diverge)}</p>
  </div>

  <div class="field restoration ${restored ? '' : 'restoration-none'}"><h3>Restoration</h3>
    ${c.restoration.forms.length
      ? `<ul>${c.restoration.forms.map((f) =>
          `<li><strong>${esc(f.replace(/_/g, ' '))}</strong> — ${esc(RESTORATION[f])}</li>`).join('')}</ul>`
      : `<p><strong>${esc(c.restoration.none_note)}</strong></p>`}
    <p class="meta">Reached</p><p>${esc(c.restoration.reached)}</p>
    ${c.remedy?.sought?.length ? `<p class="meta">Sought</p>${list(c.remedy.sought)}` : ''}
    ${c.remedy?.outstanding ? `<p class="meta">Still owed</p><p>${esc(c.remedy.outstanding)}</p>` : ''}
  </div>

  ${c.status_note ? `<div class="field note"><p>${esc(c.status_note)}</p></div>` : ''}

  <p class="sources">Vantages: ${
    (c.citations ?? []).map((x) =>
      `<a href="archives.html#${x.source}" title="${esc(VANTAGE[x.vantage])}">${
        esc(x.vantage.replace(/_/g, ' '))}</a>`).join(' &middot; ') || 'none on file'}</p>
</article>`;
  }).join('\n');

  const established = complaints.filter((c) => c.finding.act === 'established').length;
  const unpunishedCount = complaints.filter((c) => isUnpunished(c.process.outcome)).length;
  const unattributed = complaints.filter((c) => c.finding.attribution === 'unattributed').length;
  const material = complaints.filter((c) => isMateriallyRestored(c.restoration.forms)).length;
  const none = complaints.filter((c) => !c.restoration.forms.length).length;
  const lede = `${complaints.length} entries. Each is read on three independent axes.
    <strong>Act</strong>: did the violence occur — answered by bodies, ruins and records, not by a
    forum. <strong>Actor</strong>: who did it. <strong>Forum</strong>: what a court or commission
    did about it. In ${established} entries the act is established on the evidence; in
    ${unattributed} no participant is identified in any source; in ${unpunishedCount} no
    perpetrator was ever convicted. The crime is captured whether or not anyone was ever
    made to answer for it, because those are not the same question.
    <br><br>A fourth axis records the only resolve that reaches the harmed.
    <strong>${material} of ${complaints.length}</strong> entries produced anything material for
    the victims; <strong>${none}</strong> produced nothing at all; <strong>none</strong> produced
    full restitution. Punishing an offender was never the remedy for an injury, and this book
    measures the remedy separately from the punishment so that neither can stand in for the
    other.`;

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


// ------------------------------------------------------------- web of harm
// Form: bars for magnitude (8 values, direct-labelled); a ranked list for the
// strongest joins, which answers "what travels together" more directly than a
// matrix; and the matrix itself, which is the only form that shows ABSENCE -
// the pairs that never co-occur. Every cell prints its value, so colour is
// redundant encoding rather than the sole channel.
function renderWeb({ complaints }) {
  const web = harmWeb(complaints);
  const byId = new Map(complaints.map((c) => [c.id, c]));
  const max = Math.max(...Object.values(web.frequency));
  const ranked = [...web.names].sort((a, b) => web.frequency[b] - web.frequency[a]);
  const peak = Math.max(...web.joins.map((j) => j.n), 1);
  // 5 sequential steps, light->dark; validated for monotonic lightness and
  // >=4.5 text contrast against the ink each step carries.
  const step = (n) => (n === 0 ? 0 : Math.min(5, Math.ceil((n / peak) * 5)));

  const bars = `<section class="group"><h2>What was injured</h2>
    <p class="gloss">How many of the ${complaints.length} entries record injury in each domain.</p>
    <table class="bars"><tbody>
    ${ranked.map((n) => `<tr>
      <th scope="row">${esc(n)}</th>
      <td class="bar-cell"><span class="bar" style="width:${(web.frequency[n] / max) * 100}%"></span>
        <span class="bar-value">${web.frequency[n]}</span></td>
      <td class="meta domain-def">${esc(DOMAINS[n])}</td>
    </tr>`).join('')}
    </tbody></table></section>`;

  const joins = `<section class="group"><h2>What travels together</h2>
    <p class="gloss">Domains that co-occur in the same entry, strongest first. These
    joins are the web: two entries a century apart are related by the thing they broke.</p>
    <ol class="joins">${web.joins.slice(0, 12).map((j) => `<li>
      <span class="join-pair">${esc(j.a)} <span class="meta">+</span> ${esc(j.b)}</span>
      <span class="join-bar" style="width:${(j.n / peak) * 100}%"></span>
      <span class="join-n">${j.n}</span></li>`).join('')}</ol></section>`;

  // Which pairs hang by a single entry, and which entry. Computed, because the
  // finding changes as entries are added and the prose must not outlive it.
  const single = web.joins.filter((j) => j.n === 1).map((j) => {
    const who = complaints.filter(
      (c) => c.harm_domains.includes(j.a) && c.harm_domains.includes(j.b));
    return { ...j, entry: who[0] };
  });
  const carriers = [...new Set(single.map((x) => x.entry.id))];
  const soleCarrier = carriers.length === 1 ? byId.get(carriers[0]) : null;
  const blanks = web.joins.length < (web.names.length * (web.names.length - 1)) / 2;

  const matrix = `<section class="group"><h2>Co-occurrence</h2>
    <p class="gloss">Every pair of domains, and how many entries join them.${
      blanks
        ? ' A blank cell is a finding: the corpus holds no entry joining those two domains.'
        : ` <strong>No cell is blank</strong> — every pair of domains meets somewhere in
            the corpus.`}${
      single.length && soleCarrier
        ? ` ${single.length} of them meet in exactly one entry, and it is the same entry
            every time: <a href="index.html#${soleCarrier.id}">${esc(soleCarrier.title)}</a>.
            Remove it and the web comes apart at ${single.length} joints — which is a
            statement about the corpus and about the thing it records.`
        : ''}</p>
    <div class="table-scroll"><table class="matrix"><thead><tr><td></td>
    ${web.names.map((n) => `<th scope="col"><span>${esc(n)}</span></th>`).join('')}
    </tr></thead><tbody>
    ${web.names.map((a) => `<tr><th scope="row">${esc(a)}</th>
      ${web.names.map((b) => {
        if (a === b) return '<td class="cell-self" aria-label="same domain">—</td>';
        const n = web.pairs[a][b];
        return `<td class="cell cell-${step(n)}" title="${esc(a)} + ${esc(b)}: ${n} ${
          n === 1 ? 'entry' : 'entries'}">${n || ''}</td>`;
      }).join('')}</tr>`).join('')}
    </tbody></table></div></section>`;

  const index = `<section class="group"><h2>The index</h2>
    <p class="gloss">Each domain and the entries it joins. This is the web made navigable.</p>
    ${ranked.map((n) => `<div class="domain-block" id="${esc(n)}">
      <h3>${esc(n)} <span class="tally">${web.frequency[n]}</span></h3>
      <p class="meta">${esc(DOMAINS[n])}</p>
      <ul>${web.entriesByDomain[n].map((id) =>
        `<li><a href="index.html#${id}">${esc(byId.get(id).title)}</a></li>`).join('')}</ul>
    </div>`).join('')}</section>`;

  const thin = ranked.filter((n) => web.frequency[n] <= 2);
  const lede = `Entries are classified by <strong>what was injured</strong>, not by who was
    injured and not only by what kind of event it was. Because domains are shared, the log
    stops being a list and becomes a web: Tulsa and chattel enslavement are joined by
    <em>economic</em>; Kennard and Ocoee by <em>political</em>; Till and Mary Turner by
    <em>spiritual</em>.${thin.length ? ` <strong>${thin.map((n) => esc(n)).join(', ')}</strong>
    ${thin.length === 1 ? 'appears' : 'appear'} in ${thin.map((n) => web.frequency[n]).join(' and ')}
    ${thin.length === 1 && web.frequency[thin[0]] === 1 ? 'entry' : 'entries'} — a gap in this
    corpus, not a gap in the history, and a direction for the next entries rather than a
    reason to pad the existing ones.` : ''}`;

  return page('web.html', 'Web of harm', lede, bars + joins + matrix + index);
}


// ------------------------------------------------------- route of authority
function renderRoutes({ complaints }) {
  const rt = routes(complaints);
  const f = routeFinding(complaints);
  const byRung = (r) => rungOf(r);

  const finding = `<section class="group finding"><h2>The finding</h2>
    <p>Of the ${f.n} matters in this log that ran against a perpetrator, the height of the actor
    predicts whether anything above them ever heard it — and it predicts it completely.</p>
    <table class="bars"><tbody>
      <tr><th scope="row">Actor at county level or above</th>
        <td class="bar-cell"><span class="bar" style="width:${
          f.high.n ? (f.high.escaped / f.high.n) * 100 : 0}%"></span>
          <span class="bar-value">${f.high.escaped} of ${f.high.n}</span></td>
        <td class="meta domain-def">heard above the actor's own rung</td></tr>
      <tr><th scope="row">Actor below county level</th>
        <td class="bar-cell"><span class="bar" style="width:${
          f.low.n ? (f.low.escaped / f.low.n) * 100 : 0}%"></span>
          <span class="bar-value">${f.low.escaped} of ${f.low.n}</span></td>
        <td class="meta domain-def">heard above the actor's own rung</td></tr>
    </tbody></table>
    <p class="note">When a mob or a private holder did it, the matter sometimes climbed. When an
    organ of the state did it — a county's own officers, a state agency, a federal service — the
    matter never once got above the level of the body that did it. The forum and the actor were
    the same institution. ${f.high.ids.map((id) =>
      `<a href="index.html#${id}">${esc(rt.find((r) => r.id === id).title)}</a>`).join('; ')}.</p>
    <p class="meta">n = ${f.n}. Computed on every build from the escalation recorded in each entry;
    it moves as entries are added, and is not a claim about cases outside this corpus.${
      f.noTrack.length ? ` ${f.noTrack.length} entry carries no perpetrator track at all —
      <a href="index.html#${f.noTrack[0]}">${esc(rt.find((r) => r.id === f.noTrack[0]).title)}</a>,
      where the conduct was lawful judicial action and there was nothing to prosecute.` : ''}</p>
  </section>`;

  const ceilings = `<section class="group"><h2>Where each matter stopped</h2>
    <p class="gloss">The highest rung reached on the track against perpetrators, and the
    disposition that ended it. Sorted by how high the matter climbed.</p>
    <div class="table-scroll"><table class="routes">
    <thead><tr><th>Entry</th><th>Actor stood at</th><th>Climbed to</th><th>Ended in</th></tr></thead>
    <tbody>${rt.filter((r) => r.against)
      .sort((a, b) => byRung(b.against.ceiling.rung) - byRung(a.against.ceiling.rung))
      .map((r) => `<tr>
        <td><a href="index.html#${r.id}">${esc(r.title)}</a></td>
        <td class="meta">${esc(r.actor.replace(/_/g, ' '))}</td>
        <td class="${r.escaped ? '' : 'stuck'}">${esc(r.against.ceiling.rung.replace(/_/g, ' '))}${
          r.escaped ? '' : ' <span class="meta">(no higher than the actor)</span>'}</td>
        <td><span class="disp">${esc(r.against.terminal.disposition.replace(/_/g, ' '))}</span></td>
      </tr>`).join('')}</tbody></table></div></section>`;

  const inverted = rt.filter((r) => r.harmed);
  // Computed, not asserted: an earlier draft claimed every inverted track
  // climbed higher, and Kennard's does not.
  const higher = inverted.filter(
    (r) => !r.against || byRung(r.harmed.ceiling.rung) > byRung(r.against.ceiling.rung));
  const higherCount = higher.length;
  const toSupreme = inverted.filter((r) => r.harmed.ceiling.rung === 'supreme').length;
  const lower = inverted.filter((r) => !higher.includes(r));
  const lowerNote = lower.length
    ? ` The exception${lower.length === 1 ? ' is' : 's are'} ${lower.map((r) =>
        `<a href="index.html#${r.id}">${esc(r.title)}</a>`).join('; ')}, where the actor was
      itself an organ of the state and neither track left that level.`
    : '';
  const inversion = `<section class="group"><h2>The inverted track</h2>
    <p class="gloss">${inverted.length} entries carry a second route: the one the state ran
    <em>against the people it had already injured</em>. ${higherCount} of ${inverted.length} climbed
    higher than the same entry's track against the perpetrators${
      toSupreme ? `, and ${toSupreme} reached the Supreme Court` : ''}. Only one perpetrator track
    ever reached that rung, and it went there to be undone:
    <a href="index.html#CL-1873-COLFAX">Colfax</a>, where the corpus's only convictions were
    vacated.${lowerNote}</p>
    ${inverted.map((r) => `<div class="domain-block">
      <h3><a href="index.html#${r.id}">${esc(r.title)}</a></h3>
      <p class="meta">Against perpetrators: climbed to
        <strong>${esc(r.against ? r.against.ceiling.rung.replace(/_/g, ' ') : 'nothing')}</strong>,
        ended in ${esc(r.against ? r.against.terminal.disposition.replace(/_/g, ' ') : '—')}.
        <br>Against the harmed: climbed to
        <strong>${esc(r.harmed.ceiling.rung.replace(/_/g, ' '))}</strong>,
        ended in ${esc(r.harmed.terminal.disposition.replace(/_/g, ' '))}.</p>
    </div>`).join('')}</section>`;

  const ladder = `<section class="group"><h2>The ladder</h2>
    <p class="gloss">Rungs in order of authority. An actor stands on one; a matter climbs, or does not.</p>
    <ol class="ladder ladder-key">${ECHELON.map((e) => {
      const actors = complaints.filter((c) => c.respondents.echelon === e).length;
      const reached = complaints.filter(
        (c) => (c.process.escalation ?? []).some((r) => r.rung === e)).length;
      return `<li class="rung"><span class="rung-name">${esc(e.replace(/_/g, ' '))}</span>
        <span class="rung-body"><span class="meta">${actors} ${
          actors === 1 ? 'entry has an actor' : 'entries have actors'} at this level;
          ${reached} ${reached === 1 ? 'matter reached' : 'matters reached'} it</span></span></li>`;
    }).join('')}</ol></section>`;

  const lede = `Every actor stood somewhere on a ladder of authority — the holder and the overseer,
    the mob acting as their proxy, the town, the county, the state, and above them the federal
    government and the Supreme Court. Every matter either climbed that ladder or stopped.
    <strong>This page records where each one stopped and what stopped it</strong>, which is the
    nearest thing this book has to an appeal route.`;

  return page('routes.html', 'Route of authority', lede, finding + ceilings + inversion + ladder);
}


// ------------------------------------------------------------------ children
function renderChildren({ complaints }) {
  const k = childrenAcrossEras(complaints);
  const byId = new Map(complaints.map((c) => [c.id, c]));
  const populated = k.rows.filter((r) => r.entries > 0);
  const maxE = Math.max(...populated.map((r) => r.entries));

  const across = `<section class="group"><h2>Across the eras</h2>
    <p class="gloss">Entries in each period, and how many record harm reaching children as
    children. The question this answers is whether that is a feature of one era or the constant.</p>
    <table class="bars"><tbody>${populated.map((r) => `<tr>
      <th scope="row">${esc(r.era.replace(/_/g, ' '))}</th>
      <td class="bar-cell">
        <span class="bar" style="width:${(r.children / maxE) * 100}%"></span>
        <span class="bar-value">${r.children} of ${r.entries}</span></td>
      <td class="meta domain-def">${r.children
        ? esc([...new Set(r.mechanisms)].slice(0, 4).map((m) => m.replace(/_/g, ' ')).join(', '))
        : 'no entry in this period records a child harm — a gap in the corpus, not a claim about the period'}</td>
    </tr>`).join('')}</tbody></table></section>`;

  const entries = `<section class="group"><h2>The entries</h2>
    <p class="gloss">Each entry that reached a child, what it did, and what the child carried
    into adulthood. This last column is the point: the injury is inflicted on a child and
    collected from an adult, often by an institution that appears nowhere in the entry.</p>
    ${k.ids.map((id) => {
      const c = byId.get(id);
      return `<div class="domain-block">
        <h3><a href="index.html#${id}">${esc(c.title)}</a>
          <span class="tally">${esc((c.era ?? []).join(', ').replace(/_/g, ' '))}</span></h3>
        <p class="chips">${c.harmed.children.mechanism.map((m) =>
          `<span class="chip">${esc(m.replace(/_/g, ' '))}</span>`).join('')}</p>
        <p>${esc(c.harmed.children.carried_into_adulthood)}</p>
      </div>`;
    }).join('')}</section>`;

  const ed = complaints.filter((c) => (c.harm_domains ?? []).includes('educational'));
  const systems = `<section class="group finding"><h2>The two systems</h2>
    <p>Two institutions reach a child before any court does, and this book now carries
    ${ed.length} entries in which one of them is the actor rather than the setting.</p>
    <ul>
      <li><strong>Schooling.</strong> The anti-literacy statutes made teaching a child a crime,
        and were enacted directly after revolts on the express reasoning that literacy made a
        person ungovernable. Prince Edward County closed every public school for five years
        rather than admit Black children to them. Clyde Kennard was imprisoned for applying to
        a college. In each the actor is a legislature, a county board, or a state agency.</li>
      <li><strong>Medicine.</strong> The Public Health Service ran a forty-year study on men it
        deceived. Eugenics boards and federally funded programmes sterilised women and girls,
        two of them aged fourteen and twelve, on a consent their mother could not read.</li>
    </ul>
    <p class="note">The two meet. The classification that selected many of those sterilised —
    feeblemindedness — was manufactured by intelligence testing applied to Black children in
    schools, and the operation was then performed by a health system acting on that
    classification. The child passed from one institution to the other, and the record of the
    first became the warrant for the second.</p>
  </section>`;

  const lede = `Harm to children is not a category of entry in this book. It is a stage in most
    of them. <strong>${k.total} of ${complaints.length}</strong> entries record an injury that
    reached a child as a child, in ${populated.filter((r) => r.children).length} of the
    ${populated.length} periods the log covers.
    <br><br>Every other field here assumes an adult with capacity — a claimant who can assert,
    a forum that can hear. <code>harmed.children</code> exists because that assumption fails at
    exactly the point where most of these injuries begin, and because the field it requires —
    <em>what the child carried into adulthood</em> — is where the harm is actually collected.`;

  return page('children.html', 'The child', lede, across + systems + entries);
}


// -------------------------------------------------------------------- rights
function renderRights({ complaints, rights, impediments }) {
  const byRight = new Map(rights.map((r) => [r.id, []]));
  for (const c of complaints) for (const r of c.rights_violated ?? []) byRight.get(r)?.push(c);

  const enumerated = rights.filter((r) => r.status === 'enumerated');
  const unenumerated = rights.filter((r) => r.status === 'unenumerated');
  const domestic = enumerated.filter((r) => r.instruments.some((i) => i.startsWith('U.S. Const')));
  const intlOnly = enumerated.filter((r) => !r.instruments.some((i) => i.startsWith('U.S. Const')));

  const caveat = `<section class="group finding"><h2>Read this first</h2>
    <p><strong>Most of these instruments postdate most of these entries, and none applies
    retroactively.</strong> The Universal Declaration is 1948; the Covenants are 1966; the
    Declaration on the Right to Development is 1986 and the United States voted against it; the
    Basic Principles on Reparation are 2005.</p>
    <p>A right named against an entry therefore <em>characterises the conduct</em>, exactly as
    <code>offense[]</code> does. It is not an assertion that a remedy was available at the time,
    and nothing here should be presented to a forum as though it were. The book gains nothing by
    overstating this and loses the standing that makes the rest of it usable.</p>
    <p class="meta">What the catalogue does show is which interests the conduct destroyed that the
    domestic constitutional catalogue has never recognised at all — ${intlOnly.length} of the
    ${enumerated.length} enumerated rights here have no U.S. constitutional analogue, including
    education, health, property against arbitrary deprivation, and participation in cultural and
    scientific life.</p>
  </section>`;

  const list = (rs, title, gloss) => `<section class="group"><h2>${title}</h2>
    <p class="gloss">${gloss}</p>
    ${rs.map((r) => {
      const es = byRight.get(r.id) ?? [];
      return `<div class="domain-block" id="${r.id}">
        <h3>${esc(r.name)} <span class="tally">${es.length} ${es.length === 1 ? 'entry' : 'entries'}</span></h3>
        <p class="chips">${r.instruments.length
          ? r.instruments.map((i) => `<span class="chip">${esc(i)}</span>`).join('')
          : '<span class="chip chip-warn">no instrument recognises this</span>'}</p>
        ${r.note ? `<p class="meta">${esc(r.note)}</p>` : ''}
        ${es.length ? `<ul>${es.map((c) =>
          `<li><a href="index.html#${c.id}">${esc(c.title)}</a></li>`).join('')}</ul>` : ''}
      </div>`;
    }).join('')}</section>`;

  const foreclosed = complaints.filter((c) => c.foreclosed_contribution);
  const fc = `<section class="group"><h2>What was foreclosed</h2>
    <p class="gloss">The interest that no instrument protects: what a person would have made.
    ${foreclosed.length} entries record its destruction. <strong>Each states the input that was
    destroyed, which is a fact, and none states the output, which is unknowable.</strong> That
    line is enforced by the validator, not by discipline — an entry claiming to know what would
    have been produced fails the build.</p>
    <p class="note">This is not modesty. A counterfactual asserted as evidence would be
    indistinguishable from the fabrications this book's entire evidentiary standard exists to
    exclude, and the first reader to notice would be right to discard everything else with it.
    The unknowability is also the sharper claim: it is not possible to say what was lost, and
    that is what makes the loss total rather than measurable.</p>
    ${foreclosed.map((c) => `<div class="domain-block">
      <h3><a href="index.html#${c.id}">${esc(c.title)}</a></h3>
      <p>${esc(c.foreclosed_contribution.basis)}</p>
    </div>`).join('')}</section>`;

  const repeal = `<section class="group"><h2>What a repeal would actually resolve</h2>
    <p class="gloss">Each impediment, and what removing it would open. Most would open nothing,
    and saying which is the useful part.</p>
    ${impediments.map((i) => `<div class="domain-block">
      <h3>${esc(i.name)} <span class="flag flag-status-${esc(i.status)}">${esc(i.status)}</span></h3>
      <p>${esc(i.if_removed)}</p>
    </div>`).join('')}</section>`;

  const lede = `The charge was kidnapping. It was also the destruction of a right to live, to
    move, to keep a family, to learn, to vote, to hold what one built, and to take part in what a
    society makes of itself. <strong>${rights.length} rights are named here</strong>, each tied to
    the instrument that recognises it — or marked as recognised by none.
    <br><br>${unenumerated.length} is unenumerated: the interest a person has in their own
    unrealised work. No instrument protects it. The book records that as a gap in the
    instruments, not as a right it can assert on anyone's behalf.`;

  return page('rights.html', 'Rights', lede,
    caveat + list(enumerated, 'Recognised somewhere',
      'Each right, the instrument that recognises it, and the entries that violated it.') +
    list(unenumerated, 'Recognised nowhere',
      'Named because the conduct destroyed it, and marked because no positive instrument reaches it.') +
    fc + repeal);
}


// --------------------------------------------------------------- legislation
function renderLegislation({ legislation, complaints }) {
  const byId = new Map(complaints.map((c) => [c.id, c]));
  const documented = legislation.filter((l) => l.disparate_effect.status === 'documented');
  const contested = legislation.filter((l) => l.disparate_effect.status === 'contested');
  const unverified = legislation.filter((l) => l.disparate_effect.status === 'asserted_not_verified');
  const neutral = legislation.filter((l) => l.intent === 'facially_neutral');
  const live = legislation.filter((l) => l.still_operative === true);

  const card = (l) => `<article class="entry leg-${esc(l.disparate_effect.status)}" id="${l.id}">
    <header>
      <p class="docket">${esc(l.id)}</p>
      <h2>${esc(l.name)}</h2>
      <p class="where">${esc(l.citation)}${l.enacted ? ` &middot; ${esc(l.enacted)}` : ''}</p>
      <p class="flags">
        <span class="flag flag-intent-${esc(l.intent)}">${esc(l.intent.replace(/_/g, ' '))}</span>
        <span class="flag flag-legstatus-${esc(l.disparate_effect.status)}">${
          esc(l.disparate_effect.status.replace(/_/g, ' '))}</span>
        ${l.still_operative === true ? '<span class="flag flag-official">still operative</span>' : ''}
        ${l.population ? `<span class="flag">${esc(l.population)}</span>` : ''}
      </p>
    </header>
    <div class="field"><h3>Effect</h3><p>${esc(l.disparate_effect.described)}</p></div>
    <div class="field mechanism"><h3>Mechanism</h3>
      <p>${esc(l.disparate_effect.mechanism)}</p>
      <p class="meta">How the text produced the result. Required on every entry: without it this
      would be an accusation rather than a record.</p>
    </div>
    ${l.amended_or_repealed ? `<div class="field"><h3>Since</h3>
      <p>${esc(l.amended_or_repealed)}</p></div>` : ''}
    ${l.note ? `<div class="field note-block"><p>${esc(l.note)}</p></div>` : ''}
    <p class="sources">${(l.complaints ?? []).length
      ? 'Linked entries: ' + l.complaints.map((id) =>
          `<a href="index.html#${id}">${esc(byId.get(id)?.title ?? id)}</a>`).join(' &middot; ')
      : ''}${(l.sources ?? []).length
      ? `${(l.complaints ?? []).length ? '<br>' : ''}Sources: ` + l.sources.map((sid) =>
          `<a href="archives.html#${sid}">${esc(sid)}</a>`).join(', ')
      : (l.disparate_effect.status === 'asserted_not_verified' ? 'No sources on file — by design.' : '')}</p>
  </article>`;

  const warn = unverified.length ? `<section class="group unverified-warning">
    <h2>One entry here is unverified and must not be cited</h2>
    ${unverified.map((l) => `<p><strong>${esc(l.name)}</strong> — ${esc(l.note)}</p>`).join('')}
    <p class="meta">It is kept in the file rather than dropped because the assertion is worth
    testing and the test is worth writing down. It is rendered below with every other entry, in
    its own colour, carrying no sources, because an entry that looked like the others would be
    mistaken for one.</p>
  </section>` : '';

  const lede = `Impediments blocked a remedy. These statutes <strong>were the injury</strong>,
    working through the ordinary machinery of law. ${legislation.length} are recorded:
    ${documented.length} documented, ${contested.length} contested, ${unverified.length} asserted
    and unverified. <strong>${neutral.length} name no race at all</strong>, and
    ${live.length} remain in force.
    <br><br>Every entry must state its <strong>mechanism</strong> — how a text that names no race
    produced a racial result. That field is required by the validator, because without it this
    page would be a list of accusations rather than a record.`;

  return page('legislation.html', 'Legislation with disparate effect', lede,
    warn +
    `<section class="group"><h2>Documented</h2><p class="gloss">The effect is established on
      evidence, and each names the channel it worked through.</p></section>` +
    documented.map(card).join('') +
    (contested.length ? `<section class="group"><h2>Contested</h2><p class="gloss">The literature
      is in open disagreement about the effect or its causal share. Recorded as contested rather
      than documented, because adopting a disputed finding for pointing the expected way is the
      same error this book refuses everywhere else.</p></section>` + contested.map(card).join('') : '') +
    (unverified.length ? `<section class="group"><h2>Asserted, not verified</h2><p class="gloss">
      No source on file. Carries no finding.</p></section>` + unverified.map(card).join('') : ''));
}

// ------------------------------------------------------------------ archives

function renderLexicon({ lexicon, complaints }) {
  const senses = lexicon.reduce((n, t) => n + t.senses.length, 0);
  const containers = lexicon.filter((t) => t.container);
  const opConfirmed = lexicon.filter(
    (t) => (t.confirmation.method ?? []).includes('operational_consequence'));

  const body = `
<section class="note">
  <p><strong>Three things are kept apart here, and collapsing them is how a record gets
  falsified.</strong> What a word <em>denotes</em> is dictionary work. What a speaker
  <em>did</em> by choosing it lives in the contrast set &mdash; the word that was available
  and not used. And the deployment is never confirmed from the word itself: it is confirmed
  from <strong>what the word licensed</strong>. Greenwood was a <q>riot</q> in every official
  record until 2001, and fire policies of the period carried riot-exclusion clauses. The word
  was not a description of the event. It was the instrument that voided the claims.</p>
  <p>${lexicon.length} terms carry ${senses} distinct senses here
  (${(senses / lexicon.length).toFixed(1)} each). A term earns an entry only if choosing it
  over an available alternative changed what could be claimed, paid, barred or recorded, and
  the validator rejects any term with fewer than two senses, any reading with nothing that
  could defeat it, and any container term that does not state its own cost.
  ${opConfirmed.length} of ${lexicon.length} are confirmed by consequence rather than by
  reading.</p>
</section>

${containers.length ? `<section class="note note--warn">
  <h2>Container terms</h2>
  <p>An aggregating word buys a count and charges for it. ${containers.map((t) =>
    `<strong>${esc(t.term)}</strong> aggregates ${esc(t.container.aggregates)}
     It buys: ${esc(t.container.buys)} It hides: ${esc(t.container.hides)}
     <em>Cost:</em> ${esc(t.container.cost)}`).join('</p><p>')}</p>
</section>` : ''}

${lexicon.map((t) => `
<article class="entry" id="${esc(t.id)}">
  <h2>${esc(t.term)}</h2>
  <p class="lede">${esc(t.question)}</p>
  <div class="table-scroll"><table class="senses">
    <thead><tr><th>Sense</th><th>Gloss</th><th>Deployed by</th><th>What it does</th></tr></thead>
    <tbody>${t.senses.map((sn) => `
      <tr><th scope="row">${esc(sn.sense)}</th><td>${esc(sn.gloss)}</td>
      <td>${esc(sn.deployed_by)}</td><td>${esc(sn.does_work)}</td></tr>`).join('')}
    </tbody>
  </table></div>
  <dl>
    <dt>Contested axis</dt><dd>${esc(t.contested_axis)}</dd>
    <dt>Confirmed by</dt><dd>${t.confirmation.method.map((m) =>
      `<strong>${esc(m.replace(/_/g, ' '))}</strong> &mdash; ${esc(CONFIRMATION[m])}`).join('<br>')}</dd>
    <dt>Evidence</dt><dd>${esc(t.confirmation.evidence)}</dd>
    <dt>What would show this reading is wrong</dt>
    <dd class="defeat">${esc(t.confirmation.defeasible_by)}</dd>
    <dt>Bears on</dt><dd>${t.bears_on.map((b) => `<code>${esc(b)}</code>`).join(' ') || '&mdash;'}</dd>
    <dt>Registers</dt><dd>${(t.registers ?? []).map(esc).join(', ') || '&mdash;'}</dd>
  </dl>
</article>`).join('')}`;

  return page('lexicon.html', 'Language',
    'Words whose definition did operational work &mdash; what each one meant, what deploying ' +
    'it accomplished, and how that is confirmed from consequence rather than from the text.',
    body);
}

function renderPrecedent({ precedents }) {
  const f = feasibility(precedents);
  const enacted = precedents.filter((p) => p.machinery !== 'not_reached');
  const declined = precedents.filter((p) => p.machinery === 'not_reached');

  const body = `
<section class="note">
  <h2>The claim under test</h2>
  <p><strong>That reparation is refused as a matter of principle, not prevented as a matter of
  capacity.</strong> This page does not argue it. It computes it, on every build, from the
  programmes below, and it is built so it can fail: if any enacted programme had required an
  instrument that did not already exist, the line beneath would say so.</p>
  <p class="finding">${f.enacted} of ${f.n} programmes on file were enacted and executed
  (${f.governmental} governmental). <strong>${f.novel}</strong> required machinery that did not
  already exist.${f.capacityIsNotTheConstraint
    ? ' Every one reused ordinary appropriation, claims, settlement or conveyance machinery &mdash; ' +
      'the same instruments a legislature uses on any ordinary day. On this evidence the residual ' +
      'obstacle is a decision.'
    : ' The claim is falsified on the present data.'}</p>
  <p>This is a finding about ${f.enacted} programmes, not a prediction about the next one. Scale,
  class definition and political cost are real questions and are not answered here. What is
  answered is narrower and load-bearing: <em>the machinery exists, and has been used.</em></p>
</section>

<section class="note note--warn">
  <h2>Who was paid</h2>
  <p>${f.toHarmed} of ${f.enacted} enacted programmes ran to the harmed.
  <strong>${f.toHolders}</strong> ran to the holders of title:
  ${f.toHoldersIds.map((i) => `<code>${esc(i)}</code>`).join(', ')}.</p>
  <p>Compensation for slavery has already been legislated, appropriated and delivered in the
  Anglo-American tradition &mdash; to the party holding title, within a year of enactment, on
  both sides of the Atlantic. The identification problem, the valuation problem and the
  administration problem were all solved. They were solved for the owners.</p>
</section>

<div class="table-scroll"><table class="ledger">
  <thead><tr><th>Programme</th><th>Enacted</th><th>Beneficiary</th><th>Machinery</th>
  <th>To first payment</th></tr></thead>
  <tbody>${enacted.map((p) => `
    <tr><th scope="row"><a href="#${esc(p.id)}">${esc(p.name)}</a></th>
    <td>${esc(p.enacted)}</td>
    <td class="${p.beneficiary === 'holders_of_title' ? 'to-holders' : ''}">${esc(p.beneficiary.replace(/_/g, ' '))}</td>
    <td>${esc(p.machinery)}</td><td>${esc(p.enacted_to_first_payment)}</td></tr>`).join('')}
  </tbody>
</table></div>

${declined.map((p) => `
<section class="note note--warn" id="${esc(p.id)}">
  <h2>The control: ${esc(p.name)}</h2>
  <p>${esc(p.notes)}</p>
  <p>${esc(p.machinery_note)}</p>
</section>`).join('')}

${enacted.map((p) => `
<article class="entry" id="${esc(p.id)}">
  <h2>${esc(p.name)}</h2>
  <p class="lede">${esc(p.harm)}</p>
  <dl>
    <dt>Jurisdiction</dt><dd>${esc(p.jurisdiction)} &middot; ${esc(p.instrument)}, ${esc(p.enacted)}</dd>
    <dt>Class</dt><dd>${esc(p.class)}</dd>
    <dt>Beneficiary</dt><dd>${esc(p.beneficiary.replace(/_/g, ' '))} &mdash;
      reached the harmed: <strong>${p.reached_the_harmed ? 'yes' : 'no'}</strong></dd>
    <dt>Amount</dt><dd>${esc(p.amount)} <span class="muted">(figures ${esc(p.figures_precision)})</span></dd>
    <dt>Delivery</dt><dd>${esc(p.delivery)}</dd>
    <dt>Machinery</dt><dd><strong>${esc(p.machinery)}</strong> &mdash; ${esc(p.machinery_note)}</dd>
    <dt>Enacted to first payment</dt><dd>${esc(p.enacted_to_first_payment)}</dd>
    ${p.notes ? `<dt>Note</dt><dd>${esc(p.notes)}</dd>` : ''}
  </dl>
</article>`).join('')}

<section class="note">
  <p><strong>Locators are not resolved.</strong> This environment has no outbound network, so
  no figure on this page has been checked against a source here. Amounts marked approximate are
  approximate. Resolving them is the first task on this file, and until it is done these
  entries carry the same standing as any other unverified locator in this book.</p>
</section>`;

  return page('precedent.html', 'Precedent',
    'Reparative programmes that were actually enacted and executed, entered to test one claim: ' +
    'that the obstacle is principle rather than feasibility.',
    body);
}

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

.axes {
  display: flex; flex-wrap: wrap; gap: 0; margin: .9rem 0 .8rem;
  border: 1px solid var(--rule); border-radius: 2px; overflow: hidden;
}
.axes > div { flex: 1 1 9rem; min-width: 9rem; padding: .5rem .7rem;
  border-right: 1px solid var(--rule); }
.axes > div:last-child { border-right: 0; }
.axes dt {
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .62rem;
  letter-spacing: .18em; text-transform: uppercase; color: var(--ink-soft);
}
.axes dd { margin: .2rem 0 0; font-size: .9rem; }
.axis-established { color: var(--accent); font-weight: 600; }
.axis-contested, .axis-unestablished { color: var(--warn); }
.axis-unattributed { font-style: italic; color: var(--ink-soft); }
.offenses { display: flex; flex-wrap: wrap; gap: .3rem; margin: .6rem 0 .3rem; }
.offense {
  padding: .14rem .5rem; border: 1px solid var(--accent); border-radius: 2px;
  color: var(--accent); font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: .72rem; letter-spacing: .02em;
}
.offense-caveat { font-size: .76rem; margin-top: .1rem; }
.axis-rest-none { color: var(--accent); font-weight: 600; }
.axis-rest-material { color: #2f5d3f; font-weight: 600; }
@media (prefers-color-scheme: dark) { .axis-rest-material { color: #7fb894; } }
.domains { display: flex; flex-wrap: wrap; gap: .3rem; margin: .5rem 0 .2rem; }
.domain {
  padding: .12rem .5rem; border-radius: 10px; text-decoration: none;
  background: var(--flag-bg); color: var(--ink-soft);
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .7rem; letter-spacing: .03em;
}
.domain:hover { color: var(--accent); }

/* Sequential ramp, light -> dark. Monotonic OKLCH lightness; each step's ink
   validated at >= 4.5 text contrast. Dark mode is stepped from the dark surface,
   not flipped. Every cell also prints its value, so colour is redundant. */
:root {
  --seq-1: #f6e7e3; --seq-2: #e8c3ba; --seq-3: #d4948a; --seq-4: #b45c4e; --seq-5: #7a2119;
  --seq-ink-lo: #1d1c19; --seq-ink-hi: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --seq-1: #2e211d; --seq-2: #4a2c26; --seq-3: #6e3d34; --seq-4: #8f4e42; --seq-5: #d98a7e;
    --seq-ink-lo: #e9e5da; --seq-ink-hi: #16150f;
  }
}

.bars { width: 100%; border-collapse: collapse; }
.bars th { text-align: left; font-weight: 400; padding: .3rem .7rem .3rem 0;
  white-space: nowrap; font-size: .92rem; }
.bars td { padding: .3rem 0; vertical-align: middle; }
.bar-cell { width: 40%; white-space: nowrap; }
.bar {
  display: inline-block; height: 10px; background: var(--seq-5);
  border-radius: 0 3px 3px 0; vertical-align: middle;
}
.bar-value { margin-left: .5rem; font-size: .85rem; color: var(--ink-soft); }
.domain-def { padding-left: .9rem !important; width: 45%; }

.joins { list-style: none; padding: 0; margin: .5rem 0 0; }
.joins li { display: flex; align-items: center; gap: .6rem; padding: .28rem 0;
  border-top: 1px solid var(--rule); }
.join-pair { flex: 0 0 15rem; font-size: .88rem; }
.join-bar { height: 8px; background: var(--seq-4); border-radius: 0 3px 3px 0; max-width: 45%; }
.join-n { color: var(--ink-soft); font-size: .82rem; }

.matrix { border-collapse: separate; border-spacing: 2px; font-size: .8rem; }
.matrix th { font-weight: 400; color: var(--ink-soft);
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .68rem; }
.matrix thead th { vertical-align: bottom; padding: 0 0 .3rem; }
.matrix thead th span { display: inline-block; writing-mode: vertical-rl;
  transform: rotate(180deg); letter-spacing: .04em; }
.matrix tbody th { text-align: right; padding-right: .4rem; white-space: nowrap; }
.matrix td { width: 2.4rem; height: 2.1rem; text-align: center; border-radius: 2px;
  color: var(--seq-ink-lo); }
.cell-0 { background: var(--panel); outline: 1px solid var(--rule); }
.cell-1 { background: var(--seq-1); }
.cell-2 { background: var(--seq-2); }
.cell-3 { background: var(--seq-3); }
.cell-4 { background: var(--seq-4); color: var(--seq-ink-hi); }
.cell-5 { background: var(--seq-5); color: var(--seq-ink-hi); }
@media (prefers-color-scheme: dark) {
  .cell-4 { color: var(--seq-ink-lo); }
  .cell-5 { color: var(--seq-ink-hi); }
}
.cell-self { background: transparent; color: var(--rule); }
.matrix tbody tr:hover th { color: var(--accent); }
.matrix td:hover { outline: 2px solid var(--accent); }

.ladder { list-style: none; counter-reset: rung; padding: 0; margin: .5rem 0 0; }
.ladder .rung { display: flex; gap: .8rem; padding: .45rem 0;
  border-top: 1px solid var(--rule); font-size: .9rem; }
.rung-name { flex: 0 0 7.5rem; font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: .68rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft);
  padding-top: .18rem; }
.rung-body { flex: 1; }
.rung-disp { display: inline-block; margin-left: .4rem; padding: .05rem .45rem;
  border: 1px solid var(--rule); border-radius: 2px;
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .68rem; color: var(--ink-soft); }
.rung-track { display: inline-block; margin-left: .35rem; padding: .05rem .45rem;
  border-radius: 2px; background: var(--accent); color: #fff;
  font-family: ui-sans-serif, system-ui, sans-serif; font-size: .66rem; }
.rung-inverted .rung-name { color: var(--accent); }
.ladder-key .rung-name { flex: 0 0 9rem; }
.finding { border-left: 3px solid var(--accent); }
.routes { width: 100%; border-collapse: collapse; font-size: .88rem; }
.routes th, .routes td { text-align: left; vertical-align: top; padding: .5rem .6rem .5rem 0;
  border-bottom: 1px solid var(--rule); }
.routes th { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .68rem;
  letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); }
.routes .stuck { color: var(--accent); font-weight: 600; }
.disp { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .74rem; }

.domain-block { padding: .9rem 0; border-top: 1px solid var(--rule); }
.domain-block h3 { margin: 0 0 .2rem; font-size: 1rem; }
.domain-block ul { margin: .4rem 0 0; padding-left: 1.2rem; font-size: .9rem; }
.domain-block li { margin: .2rem 0; }

.children { border-left: 3px solid var(--accent); padding-left: .9rem; }
.foreclosed { border-left: 3px solid var(--accent); padding-left: .9rem; }
.mechanism { border-left: 3px solid var(--accent); padding-left: .9rem; }
.flag-intent-facially_neutral { outline: 1px solid var(--accent); }
.flag-legstatus-contested, .flag-legstatus-asserted_not_verified {
  outline: 1px dashed var(--warn); color: var(--warn);
}
.leg-asserted_not_verified { border-style: dashed; border-color: var(--warn); }
.leg-contested { border-left: 3px solid var(--warn); }
.unverified-warning { border: 2px dashed var(--warn); }
.unverified-warning h2 { color: var(--warn); }
.note-block { background: var(--flag-bg); padding: .8rem; border-radius: 2px; font-size: .9rem; }
.chip-warn { border-color: var(--warn); color: var(--warn); }
.transmitted { border-left: 3px solid var(--rule); padding-left: .9rem; }
.transmitted h3 { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.flag-trans-argued_in_literature, .flag-trans-contested {
  outline: 1px dashed var(--warn); color: var(--warn);
}
.restoration { border-left: 3px solid var(--rule); padding-left: .9rem; }
.restoration-none { border-left-color: var(--accent); }
.restoration ul { margin: .3rem 0; padding-left: 1.2rem; }
.named { list-style: none; padding: 0; margin: .6rem 0 0; }
.named > li { padding: .6rem 0; border-top: 1px solid var(--rule); font-size: .92rem; }
.flag-resp-confessed_after_acquittal, .flag-resp-confessed {
  background: var(--accent); color: #fff; text-transform: none; font-weight: 600;
}

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

.senses, .ledger { border-collapse: collapse; width: 100%; margin: .8rem 0 1.1rem;
  font-size: .88rem; }
.senses th, .senses td, .ledger th, .ledger td { text-align: left; vertical-align: top;
  padding: .5rem .7rem; border-bottom: 1px solid var(--rule); }
.senses thead th, .ledger thead th { font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: .7rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--ink-soft); white-space: nowrap; }
.senses tbody th, .ledger tbody th { font-weight: 600; white-space: nowrap; }
.ledger .to-holders { color: var(--warn); font-weight: 600; }
.defeat { border-left: 3px solid var(--warn); padding-left: .7rem; }
.muted { color: var(--ink-soft); font-size: .85em; }

footer { margin: 3rem auto 4rem; padding-top: 1.2rem; border-top: 1px solid var(--rule);
  color: var(--ink-soft); font-size: .82rem; }
`;

// ---------------------------------------------------------------------- main

const data = validate();
const RIGHTS = new Map(data.rights.map((r) => [r.id, r]));
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
  'web.html': renderWeb(data),
  'routes.html': renderRoutes(data),
  'children.html': renderChildren(data),
  'rights.html': renderRights(data),
  'legislation.html': renderLegislation(data),
  'lexicon.html': renderLexicon(data),
  'precedent.html': renderPrecedent(data),
  'archives.html': renderArchives(data),
  'record-book.css': CSS,
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`  wrote public/record-book/${name}`);
}
console.log(`\n${data.complaints.length} complaints, ${data.persons.length} register entries.`);
