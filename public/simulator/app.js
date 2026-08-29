// Browser driver. Loads the corpus over fetch and runs the same engine the CLI
// runs — there is one implementation, not two.

import { fullReport } from './engine/simulate.js';
import { INTERPRETIVE_REGIMES, REGIME_GLOSS, POLICY_REGIMES, glossOf } from './engine/index.js';
import { corpus } from './corpus.bundle.js';

// The corpus arrives as a module rather than over fetch: the venue's
// Content-Security-Policy is `default-src 'none'` with no connect-src, so fetch
// and XHR are refused. corpus.bundle.js is generated from corpus/*.json by
// `npm run build:corpus`, and `npm test` asserts the two stay in step.

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    // Styles go through CSSOM. A `style` attribute is inline style, which the
    // venue's Content-Security-Policy refuses; assigning through the CSSOM is
    // not covered by style-src and applies normally.
    else if (k === 'style') { if (v) n.style.cssText = v; }
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return n;
};

const OUTCOME_TAG = {
  established: 'ok',
  established_on_principle: 'ok',
  not_established: 'bad',
  not_established_on_principle: 'warn',
  barred: 'warn',
};

const state = {
  regime: 'contemporary',
  policyRegime: '',
  tracks: new Set([...new Set(corpus.conditions.map((c) => c.track))]),
};

// ---- controls -------------------------------------------------------------

const regimeSel = document.getElementById('regime');
for (const r of INTERPRETIVE_REGIMES) {
  regimeSel.append(el('option', { value: r, selected: r === state.regime ? '' : null }, `${r} — ${REGIME_GLOSS[r]}`));
}
const policySel = document.getElementById('policy');
for (const [id, r] of Object.entries(POLICY_REGIMES)) policySel.append(el('option', { value: id }, `${r.label} — ${r.gloss}`));

const tracksBox = document.getElementById('tracks');
for (const t of [...new Set(corpus.conditions.map((c) => c.track))]) {
  const cb = el('input', { type: 'checkbox', checked: '' });
  cb.value = t;
  cb.addEventListener('change', () => {
    if (cb.checked) state.tracks.add(t); else state.tracks.delete(t);
  });
  tracksBox.append(el('label', {}, cb, t));
}

document.getElementById('rerun').addEventListener('click', render);
regimeSel.addEventListener('change', () => { state.regime = regimeSel.value; render(); });
policySel.addEventListener('change', () => { state.policyRegime = policySel.value; render(); });
document.getElementById('download').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: 'governance-simulation.json' });
  document.body.append(a); a.click(); a.remove();
});

let current = null;

// ---- rendering ------------------------------------------------------------

function debateCard({ condition, pro, con, judgment }) {
  const card = el('section', { class: 'card' });
  card.append(el('h2', {},
    el('span', { class: 'tag info' }, condition.track),
    condition.id,
    el('span', { class: `tag ${OUTCOME_TAG[judgment.outcome] ?? ''}` }, judgment.outcome.replace(/_/g, ' ')),
  ));
  card.append(el('p', { class: 'sub' }, `Standard: ${judgment.standard}.`));

  const cols = el('div', { class: 'cols' });

  // Thesis.
  const proBox = el('div', { class: 'side pro' },
    el('h3', {}, 'Thesis — proponent'),
    el('p', { class: 'lead' }, pro.thesis),
  );
  const list = el('ul', { class: 'elements' });
  for (const e of judgment.elements) {
    const src = pro.elements.find((x) => x.id === e.id);
    const li = el('li', {},
      el('span', { class: `mark ${e.status}` }, e.status === 'met' ? '✓' : e.status === 'contested' ? '~' : '✗'),
      e.statement,
      el('div', { class: 'meter' }, el('i', { class: e.status, style: `width:${Math.round(e.net * 100)}%` })),
      el('div', { class: 'because' }, `support ${e.support} · defeat ${e.defeat} · net ${e.net}`),
      ...(src?.because ?? []).map((b) => el('div', { class: 'because' }, `· ${b}`)),
      src?.alternative_reading ? el('div', { class: 'because' }, `↪ ${src.alternative_reading}`) : null,
    );
    list.append(li);
  }
  proBox.append(list);
  if (pro.necessity_silence?.triggered) {
    proBox.append(el('details', {}, el('summary', {}, 'Necessity–silence conflict'), el('p', { class: 'note' }, pro.necessity_silence.finding)));
  }
  cols.append(proBox);

  // Antithesis.
  const conBox = el('div', { class: 'side con' },
    el('h3', {}, 'Antithesis — opponent'),
    el('p', { class: 'lead' }, con.antithesis),
  );
  for (const d of con.defeaters) {
    conBox.append(el('div', { class: 'defeater' },
      el('div', { class: 'dh' }, el('b', {}, d.label), el('span', { class: 'st' }, d.strength)),
      el('p', {}, d.argument),
      d.concession ? el('p', { class: 'note' }, d.concession) : null,
      d.answer?.moves?.length
        ? el('p', {}, `Answerable by: ${d.answer.moves.map((m) => m.move.replace(/_/g, ' ')).join(', ')} (entrenchment ${d.answer.entrenchment.score}, ${d.answer.entrenchment.posture}).`)
        : null,
    ));
  }
  cols.append(conBox);
  card.append(cols);

  // Judgment.
  const p = judgment.principled;
  const total = Math.max(p.pro + p.con, 0.01);
  card.append(el('div', { class: 'judgment' },
    el('h3', {}, 'Judgment'),
    el('p', {}, judgment.reasoning),
    el('div', { class: 'scale' },
      `proponent ${p.pro}`,
      el('span', { class: 'bar' },
        el('i', { class: 'p', style: `width:${(p.pro / total) * 100}%` }),
        el('i', { class: 'c', style: `width:${(p.con / total) * 100}%` }),
      ),
      `opponent ${p.con}`,
    ),
    el('p', { class: 'sub' }, `Decisive principle — ${p.decisive.id}: ${glossOf(p.decisive.id)}`),
  ));

  // Synthesis.
  card.append(el('div', { class: 'synthesis' },
    el('h3', {}, 'Synthesis'),
    el('p', {}, judgment.synthesis.synthesis),
    judgment.synthesis.emergent_reading ? el('p', { class: 'sub' }, judgment.synthesis.emergent_reading) : null,
  ));

  if (judgment.gaps.length) {
    const d = el('details', {}, el('summary', {}, `Gaps (${judgment.gaps.length})`));
    for (const g of judgment.gaps) {
      d.append(el('div', { class: 'gap' }, el('b', {}, g.class.replace(/_/g, ' ')), ' — ', g.statement, el('p', {}, g.consequence)));
    }
    card.append(d);
  }

  if (judgment.stare_decisis.length) {
    const d = el('details', {}, el('summary', {}, `Precedent and stare decisis (${judgment.stare_decisis.length})`));
    for (const s of judgment.stare_decisis) {
      d.append(el('div', { class: 'gap' },
        el('b', {}, s.cite),
        ' ',
        el('span', { class: `tag ${s.favours === 'claimant' ? 'ok' : 'bad'}` }, s.favours),
        ' ',
        el('span', { class: 'tag' }, `${s.entrenchment.posture} ${s.entrenchment.score}`),
        el('p', {}, s.holding),
        el('p', {}, `Rationale: ${s.rationale}`),
        el('p', {}, `${s.entrenchment.reasoning} Recommended treatment: ${s.recommended_treatment.replace(/_/g, ' ')}.`),
        s.note ? el('p', { class: 'note' }, s.note) : null,
      ));
    }
    card.append(d);
  }

  return card;
}

function sweepCard(report) {
  const s = report.interpretive_sweep;
  const card = el('section', { class: 'card' },
    el('h2', {}, 'Interpretive sweep', el('span', { class: `tag ${s.outcome_depends_on_regime ? 'warn' : 'ok'}` }, s.outcome_depends_on_regime ? 'outcome moves' : 'outcome holds')),
    el('p', { class: 'sub' }, 'The same record, read under every regime the words will support.'),
  );
  const t = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Regime'), el('th', {}, 'Reading'), el('th', {}, 'Established'), el('th', {}, 'Barred'))));
  const tb = el('tbody');
  for (const r of s.rows) {
    tb.append(el('tr', { class: r.regime === report.regime ? 'here' : null },
      el('td', {}, r.regime), el('td', {}, REGIME_GLOSS[r.regime]), el('td', { class: 'num' }, r.established), el('td', { class: 'num' }, r.barred)));
  }
  t.append(tb);
  card.append(t, el('p', { class: 'sub spaced' }, s.finding));
  return card;
}

function institutionCard(report) {
  const s = report.institutional_sweep;
  const card = el('section', { class: 'card' },
    el('h2', {}, 'Institutional sweep', el('span', { class: 'tag info' }, `recorded: ${s.actual_regime}`)),
    el('p', { class: 'sub' }, 'How the same tests translate when the institution is loose, rigid, without policy, or drowning in it.'),
  );
  const t = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Regime'), el('th', {}, 'Character'), el('th', {}, 'Claimant theory'), el('th', {}, 'Established'))));
  const tb = el('tbody');
  for (const r of s.rows) {
    tb.append(el('tr', { class: r.regime === s.actual_regime ? 'here' : null },
      el('td', {}, r.label), el('td', {}, r.gloss), el('td', {}, r.claimant_theory.replace(/_/g, ' ')), el('td', { class: 'num' }, r.established)));
  }
  t.append(tb);
  card.append(t, el('p', { class: 'sub spaced' }, s.finding));

  const port = el('details', {}, el('summary', {}, 'Theory portability — what survives a change of venue'));
  for (const row of s.translation.rows) {
    port.append(el('div', { class: 'gap' },
      el('b', {}, row.label), ' — ', row.base_theory_status.replace(/_/g, ' '),
      el('p', {}, `Claimant: ${row.claimant_theory.argument}`),
      el('p', {}, `Respondent: ${row.respondent_theory.argument}`),
      row.note ? el('p', { class: 'note' }, row.note) : null,
    ));
  }
  card.append(port);
  return card;
}

function governanceCard(report) {
  const g = report.disposition.governance;
  const d = g.remedial_dialectic;
  return el('section', { class: 'card' },
    el('h2', {}, 'Governance — the authority of the premise',
      el('span', { class: 'tag bad' }, `pleaded ${g.self_defeat_risk_before}`),
      el('span', { class: 'tag ok' }, `reframed ${g.self_defeat_risk_after}`)),
    el('p', { class: 'sub' }, g.note),
    el('div', { class: 'cols' },
      el('div', { class: 'side con' }, el('h3', {}, "Respondent's riposte"), el('p', { class: 'lead' }, g.counter_move.argument)),
      el('div', { class: 'side pro' }, el('h3', {}, 'Answer'), el('p', { class: 'lead' }, g.counter_move.answer)),
    ),
    el('div', { class: 'judgment' },
      el('h3', {}, 'The shape of a grantable holding'),
      el('p', {}, g.frame.holding_shape),
      el('p', {}, g.frame.why_grantable),
      el('p', { class: 'sub' }, `Conceded: ${g.frame.what_is_conceded}`),
    ),
    el('div', { class: 'synthesis' },
      el('h3', {}, 'The remedial dialectic'),
      el('p', {}, el('b', {}, 'Thesis. '), d.thesis),
      el('p', {}, el('b', {}, 'Antithesis. '), d.antithesis),
      el('p', {}, el('b', {}, 'Synthesis. '), d.synthesis),
    ),
  );
}

function vectorsCard(report) {
  const vs = report.disposition.statutory_challenge;
  const card = el('section', { class: 'card' },
    el('h2', {}, 'Statutory challenge', el('span', { class: 'tag warn' }, `${vs.length} vectors`)),
    el('p', { class: 'sub' }, 'Every place the claim fails for a reason a tribunal cannot fix is a place a legislature can. Ranked by how much of the case each one unlocks.'),
  );
  const ol = el('ol', { class: 'vectors' });
  for (const v of vs) {
    ol.append(el('li', {},
      el('b', {}, v.title),
      el('span', { class: 'unlocks' }, `weight ${v.weight.toFixed(2)} · unlocks ${v.unlocks.join(', ')}`),
      el('p', {}, v.why),
    ));
  }
  card.append(vs.length ? ol : el('p', { class: 'sub' }, 'None — the claim as framed is winnable on existing law.'));
  return card;
}

function driftCard(report) {
  const card = el('section', { class: 'card' },
    el('h2', {}, 'Lexicon drift'),
    el('p', { class: 'sub' }, 'Where the operative words have moved, and what was lost when they did.'),
  );
  for (const d of report.drift.filter(Boolean)) {
    const det = el('details', {}, el('summary', {}, `${d.label} ${d.drifted ? '— drifted' : '— stable'}${d.narrowedBy ? ` · narrowed ${d.narrowedBy.year}` : ''}`));
    const t = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Regime'), el('th', {}, 'Sense'), el('th', {}, 'Reaches'))));
    const tb = el('tbody');
    for (const [regime, r] of Object.entries(d.readings)) {
      if (!r) continue;
      tb.append(el('tr', { class: regime === report.regime ? 'here' : null }, el('td', {}, regime), el('td', {}, r.gloss), el('td', {}, r.reach.join(', '))));
    }
    t.append(tb);
    det.append(t);
    if (d.narrowedBy) det.append(el('p', { class: 'note' }, `Narrowed in ${d.narrowedBy.year} by ${d.narrowedBy.by}, losing: ${d.narrowedBy.lost.join(', ')}.`));
    card.append(det);
  }
  return card;
}

function render() {
  const out = document.getElementById('out');
  out.replaceChildren(el('p', { class: 'loading' }, 'Running…'));

  const report = fullReport(corpus, {
    regime: state.regime,
    policyRegime: state.policyRegime || null,
    tracks: state.tracks.size ? [...state.tracks] : null,
  });
  current = report;

  const frag = document.createDocumentFragment();
  for (const d of report.debates) frag.append(debateCard(d));
  frag.append(sweepCard(report), institutionCard(report), driftCard(report), governanceCard(report), vectorsCard(report));
  frag.append(el('p', { class: 'disclaimer' }, corpus.claim.disclaimer));
  out.replaceChildren(frag);

  const s = report.disposition.summary;
  document.getElementById('disposition').replaceChildren(
    el('div', {}, `${s.established}/${s.conditions} established`),
    el('div', {}, `${s.barred} barred at the forum`),
    el('div', {}, `${s.lost_on_principle} lost on principle`),
  );
}

render();
