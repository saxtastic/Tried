// Element tests.
//
// An element is satisfied by a small declarative predicate rather than by prose,
// so both agents are scored against the same thing and the disagreement between
// them is real disagreement rather than an artifact of wording.

import { reaches } from './lexicon.js';
import { profile } from './institution.js';

/**
 * Evaluate a predicate.
 * @returns {{value:'true'|'false'|'unknown', strength:number, because:string[]}}
 */
export function evaluate(pred, ctx) {
  if (!pred) return { value: 'unknown', strength: 0, because: ['no test specified'] };

  if (pred.all) return combineAll(pred.all.map((p) => evaluate(p, ctx)));
  if (pred.any) return combineAny(pred.any.map((p) => evaluate(p, ctx)));
  if (pred.not) return negate(evaluate(pred.not, ctx));

  if (pred.fact) {
    const f = ctx.facts?.[pred.fact];
    if (!f) {
      return { value: 'unknown', strength: 0, because: [`the record is silent on "${pred.fact}"`] };
    }
    const value = f.value === true ? 'true' : f.value === false ? 'false' : 'unknown';
    return {
      value,
      strength: f.strength ?? 0.5,
      because: [`${describeFact(pred.fact, f)}${f.source ? ` (${f.source})` : ''}`],
    };
  }

  if (pred.term) {
    const r = reaches(ctx.lexicon, pred.term, pred.reach, {
      regime: ctx.regime,
      enactedYear: ctx.provision?.enacted,
      caseYear: ctx.caseYear,
    });
    return {
      value: r.hit ? 'true' : 'false',
      strength: r.hit ? 0.8 : 0.75,
      because: [r.reason],
    };
  }

  if (pred.institution) {
    const inst = profile(ctx.institution);
    switch (pred.institution) {
      case 'regime':
        return bool(inst.regime === pred.is, `the institution's policy regime is "${inst.regime}"`);
      case 'published_policy':
        return bool(inst.published_policies.includes(pred.ref), `"${pred.ref}" is ${inst.published_policies.includes(pred.ref) ? '' : 'not '}a published policy`);
      case 'settled_practice':
        return bool(inst.settled_practices.includes(pred.ref), `"${pred.ref}" is ${inst.settled_practices.includes(pred.ref) ? '' : 'not '}a settled practice`);
      case 'has_conflict':
        return bool(inst.conflicts.length > 0, `${inst.conflicts.length} policy conflict(s) are recorded`);
      case 'enabling_standard':
        return bool(inst.enabling_act_supplies_standard, `the enabling act ${inst.enabling_act_supplies_standard ? 'supplies' : 'does not supply'} a governing standard`);
      case 'discretion_above':
        return bool(inst.discretion >= (pred.value ?? 0.5), `discretion is scored at ${inst.discretion}`);
      default:
        return { value: 'unknown', strength: 0, because: [`unknown institution test "${pred.institution}"`] };
    }
  }

  if (pred.provision) {
    const prov = ctx.provisions?.get?.(pred.provision);
    if (!prov) return { value: 'false', strength: 0.6, because: [`provision "${pred.provision}" is not in the corpus`] };
    if (pred.confers_private_right !== undefined) {
      return bool(
        Boolean(prov.confers_private_right) === pred.confers_private_right,
        `${prov.cite ?? prov.id} ${prov.confers_private_right ? 'confers' : 'does not confer'} a private right of action`,
      );
    }
    return bool(true, `${prov.cite ?? prov.id} is in force`);
  }

  return { value: 'unknown', strength: 0, because: ['unrecognised predicate'] };
}

function bool(b, why) {
  return { value: b ? 'true' : 'false', strength: 0.8, because: [why] };
}

function describeFact(key, f) {
  if (f.note) return f.note;
  const label = key.replace(/_/g, ' ');
  if (f.value === true) return `the record establishes ${label}`;
  if (f.value === false) return `the record affirmatively negates ${label}`;
  return `${label} is disputed on this record`;
}

function combineAll(rs) {
  if (rs.some((r) => r.value === 'false')) {
    const fails = rs.filter((r) => r.value === 'false');
    return { value: 'false', strength: Math.max(...fails.map((r) => r.strength)), because: fails.flatMap((r) => r.because) };
  }
  if (rs.some((r) => r.value === 'unknown')) {
    return { value: 'unknown', strength: avg(rs.map((r) => r.strength)), because: rs.flatMap((r) => r.because) };
  }
  return { value: 'true', strength: Math.min(...rs.map((r) => r.strength)), because: rs.flatMap((r) => r.because) };
}

function combineAny(rs) {
  const hits = rs.filter((r) => r.value === 'true');
  if (hits.length) return { value: 'true', strength: Math.max(...hits.map((r) => r.strength)), because: hits.flatMap((r) => r.because) };
  if (rs.some((r) => r.value === 'unknown')) return { value: 'unknown', strength: avg(rs.map((r) => r.strength)), because: rs.flatMap((r) => r.because) };
  return { value: 'false', strength: Math.max(...rs.map((r) => r.strength)), because: rs.flatMap((r) => r.because) };
}

function negate(r) {
  const value = r.value === 'true' ? 'false' : r.value === 'false' ? 'true' : 'unknown';
  return { value, strength: r.strength, because: r.because.map((b) => `it is not the case that ${lowerFirst(b)}`) };
}

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function avg(ns) {
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0;
}
