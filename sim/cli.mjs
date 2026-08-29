#!/usr/bin/env node
// Command-line driver.
//
//   npm run sim                          full report, the case as pleaded
//   npm run sim -- --track civil,ip      restrict to tracks
//   npm run sim -- --regime originalist  fix the interpretive regime
//   npm run sim -- --policy rigid        force an institutional policy regime
//   npm run sim -- --sweep               interpretive + institutional sweeps only
//   npm run sim -- --paradox             the governance layer analysis only
//   npm run sim -- --vectors             the statutory challenge only
//   npm run sim -- --json                machine-readable

import { loadCorpus } from './load.mjs';
import { run, fullReport } from '../public/simulator/engine/simulate.js';
import { glossOf } from '../public/simulator/engine/principles.js';
import { REGIMES as INTERPRETIVE_REGIMES } from '../public/simulator/engine/lexicon.js';
import { REGIMES as POLICY_REGIMES } from '../public/simulator/engine/institution.js';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};

const C = process.stdout.isTTY && !flag('no-color')
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, c: (s) => `\x1b[36m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, g: (s) => s, r: (s) => s, y: (s) => s, c: (s) => s };

const OUTCOME_COLOR = {
  established: C.g,
  established_on_principle: C.g,
  not_established: C.r,
  not_established_on_principle: C.y,
  barred: C.y,
};

function wrap(text, width = 84, indent = '  ') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else line += ` ${w}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((l) => indent + l).join('\n');
}

function rule(title) {
  return `\n${C.b(title)}\n${C.dim('─'.repeat(Math.max(24, title.length)))}`;
}

const corpus = await loadCorpus({
  caseFile: value('case', 'case.template.json'),
  institution: value('institution', 'institution.template.json'),
});

function die(msg, valid) {
  console.error(`${msg}\n  valid: ${valid.join(', ')}`);
  process.exit(2);
}

const options = {
  regime: value('regime', 'contemporary'),
  policyRegime: value('policy', null),
  tracks: value('track', null)?.split(','),
};

if (!INTERPRETIVE_REGIMES.includes(options.regime)) {
  die(`Unknown interpretive regime "${options.regime}".`, INTERPRETIVE_REGIMES);
}
if (options.policyRegime && !Object.keys(POLICY_REGIMES).includes(options.policyRegime)) {
  die(`Unknown policy regime "${options.policyRegime}".`, Object.keys(POLICY_REGIMES));
}
if (options.tracks) {
  const known = [...new Set(corpus.conditions.map((c) => c.track))];
  const unknown = options.tracks.filter((t) => !known.includes(t));
  if (unknown.length) die(`Unknown track${unknown.length > 1 ? 's' : ''} ${unknown.map((t) => `"${t}"`).join(', ')}.`, known);
}

if (flag('json')) {
  console.log(JSON.stringify(fullReport(corpus, options), null, 2));
  process.exit(0);
}

const report = fullReport(corpus, options);

console.log(rule('GOVERNANCE & CORPUS SIMULATOR'));
console.log(C.dim(`  case ${corpus.claim.id} · year ${report.case_year} · interpretive regime "${report.regime}" · policy regime "${report.policy_regime}"`));
console.log(C.dim(`  ${corpus.claim.disclaimer ?? ''}`));

if (!flag('paradox') && !flag('vectors') && !flag('sweep')) {
  for (const { condition, pro, con, judgment } of report.debates) {
    const paint = OUTCOME_COLOR[judgment.outcome] ?? ((s) => s);
    console.log(rule(`[${condition.track}] ${condition.id}`));
    console.log(`  ${C.dim('standard')} ${judgment.standard}   ${C.dim('outcome')} ${paint(judgment.outcome)}`);

    console.log(`\n  ${C.c('THESIS')} ${C.dim('(proponent)')}`);
    console.log(wrap(pro.thesis, 84, '    '));
    for (const el of judgment.elements) {
      const mark = el.status === 'met' ? C.g('✓') : el.status === 'contested' ? C.y('~') : C.r('✗');
      console.log(`    ${mark} ${el.statement} ${C.dim(`[support ${el.support} · defeat ${el.defeat} · net ${el.net}]`)}`);
      const src = pro.elements.find((e) => e.id === el.id);
      for (const b of src?.because ?? []) console.log(C.dim(wrap(`· ${b}`, 78, '        ')));
    }
    if (pro.necessity_silence?.triggered) {
      console.log(`\n    ${C.y('necessity–silence conflict')}`);
      console.log(C.dim(wrap(pro.necessity_silence.finding, 78, '      ')));
    }

    console.log(`\n  ${C.c('ANTITHESIS')} ${C.dim('(opponent)')}`);
    console.log(wrap(con.antithesis, 84, '    '));
    for (const d of con.defeaters.slice(0, 5)) {
      console.log(`    ${C.r('▸')} ${d.label} ${C.dim(`[${d.strength}]`)}`);
      console.log(C.dim(wrap(d.argument, 78, '      ')));
      if (d.answer?.moves?.length) {
        console.log(C.dim(`      answerable by: ${d.answer.moves.map((m) => m.move).join(', ')} (entrenchment ${d.answer.entrenchment.score}, ${d.answer.entrenchment.posture})`));
      }
    }

    console.log(`\n  ${C.c('JUDGMENT')}`);
    console.log(wrap(judgment.reasoning, 84, '    '));
    console.log(C.dim(`    principled weight — proponent ${judgment.principled.pro} · opponent ${judgment.principled.con} · margin ${judgment.principled.margin}`));
    console.log(C.dim(`    decisive principle — ${judgment.principled.decisive.id}: ${glossOf(judgment.principled.decisive.id)}`));

    console.log(`\n  ${C.c('SYNTHESIS')}`);
    console.log(wrap(judgment.synthesis.synthesis, 84, '    '));
    if (judgment.synthesis.emergent_reading) console.log(C.dim(wrap(judgment.synthesis.emergent_reading, 80, '    ')));

    if (judgment.gaps.length) {
      console.log(`\n  ${C.c('GAPS')}`);
      for (const g of judgment.gaps) {
        console.log(`    ${C.y(g.class)} — ${g.statement}`);
        console.log(C.dim(wrap(g.consequence, 78, '      ')));
      }
    }
    if (judgment.stare_decisis.length) {
      console.log(`\n  ${C.c('STARE DECISIS')}`);
      for (const s of judgment.stare_decisis) {
        console.log(`    ${s.cite} ${C.dim(`(${s.favours}, ${s.entrenchment.posture} ${s.entrenchment.score}) → ${s.recommended_treatment}`)}`);
        console.log(C.dim(wrap(s.entrenchment.reasoning, 78, '      ')));
        if (s.note) console.log(C.y(wrap(s.note, 78, '      ')));
      }
    }
  }
}

if (!flag('vectors') && !flag('paradox')) {
  const sw = report.interpretive_sweep;
  console.log(rule('INTERPRETIVE SWEEP — does the outcome depend on which sense of the words governs?'));
  for (const r of sw.rows) console.log(`  ${r.regime.padEnd(16)} established ${r.established}  barred ${r.barred}  ${C.dim(Object.entries(r.outcomes).map(([k, v]) => `${k}:${v}`).join(' '))}`);
  console.log(wrap(sw.finding, 84, '  '));
  console.log(C.dim(`  best for claimant: ${sw.best_for_claimant} · worst: ${sw.worst_for_claimant}`));

  const inst = report.institutional_sweep;
  console.log(rule('INSTITUTIONAL SWEEP — how do these tests translate to a different institution?'));
  for (const r of inst.rows) {
    const here = r.regime === inst.actual_regime ? C.b(' ← this one') : '';
    console.log(`  ${r.label.padEnd(12)} established ${r.established}  ${C.dim(r.gloss)}${here}`);
    console.log(C.dim(`    claimant theory: ${r.claimant_theory}`));
  }
  console.log(wrap(inst.finding, 84, '  '));

  console.log(rule('THEORY PORTABILITY'));
  for (const row of inst.translation.rows) {
    console.log(`  ${row.label.padEnd(12)} ${row.base_theory_status}`);
    if (row.note) console.log(C.dim(wrap(row.note, 78, '    ')));
  }
}

if (!flag('vectors')) {
  const g = report.disposition.governance;
  console.log(rule('GOVERNANCE — the authority of the premise'));
  console.log(`  self-defeat risk: ${C.r(String(g.self_defeat_risk_before))} as pleaded → ${C.g(String(g.self_defeat_risk_after))} reframed (${g.reframed} attack${g.reframed === 1 ? '' : 's'} moved off the constitutive layer)`);
  console.log(wrap(g.note, 84, '  '));
  console.log(`\n  ${C.c('the shape of a grantable holding')}`);
  console.log(wrap(g.frame.holding_shape, 84, '    '));
  console.log(wrap(g.frame.why_grantable, 84, '    '));
  console.log(`\n  ${C.c('respondent\'s riposte')} ${C.dim(`(${g.counter_move.principle})`)}`);
  console.log(wrap(g.counter_move.argument, 84, '    '));
  console.log(`  ${C.c('answer')}`);
  console.log(wrap(g.counter_move.answer, 84, '    '));
  console.log(`\n  ${C.c('the remedial dialectic')}`);
  console.log(`    ${C.dim('thesis')}     ${g.remedial_dialectic.thesis}`);
  console.log(`    ${C.dim('antithesis')} ${g.remedial_dialectic.antithesis}`);
  console.log(`    ${C.dim('synthesis')}`);
  console.log(wrap(g.remedial_dialectic.synthesis, 84, '      '));
}

console.log(rule('STATUTORY CHALLENGE — where the law has to be changed rather than argued'));
report.disposition.statutory_challenge.forEach((v, i) => {
  console.log(`  ${C.b(`${i + 1}. ${v.title}`)} ${C.dim(`[weight ${v.weight.toFixed(2)} · unlocks ${v.unlocks.join(', ')}]`)}`);
  console.log(wrap(v.why, 82, '     '));
});
if (!report.disposition.statutory_challenge.length) console.log(C.dim('  none — the claim as framed is winnable on existing law.'));

const s = report.disposition.summary;
console.log(rule('DISPOSITION'));
console.log(`  ${s.established}/${s.conditions} conditions established · ${s.barred} barred at the forum · ${s.lost_on_principle} lost on principle`);
console.log(C.dim('  A condition lost on principle with a strong record is the signature of a legislative problem, not a litigation one.\n'));
