#!/usr/bin/env node
/* Coworker fleet — deployment and management.
 *
 *   node scripts/fleet.mjs survey      roster and counts
 *   node scripts/fleet.mjs questions   core questions, who was asked, who answered
 *   node scripts/fleet.mjs check       policy findings, exits non-zero on error
 *   node scripts/fleet.mjs plan        the management actions the findings imply
 *   node scripts/fleet.mjs render      writes public/fleet/index.html
 *   node scripts/fleet.mjs all         check, plan, render
 *
 * Declared inputs live in fleet/fleet.json. Nothing here reaches the network.
 *
 * WHAT THIS DOES NOT DO: it does not call the session API. `plan` names the
 * exact tool and arguments for each action and stops there, because the acting
 * side of deployment runs through the Claude Code Remote MCP tools held by an
 * operator session, not through an HTTP client in this repository. A tool that
 * pretended otherwise would be guessing at an endpoint it has never called.
 * Read the plan, then execute it deliberately.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPINE = path.join(ROOT, "fleet", "fleet.json");
const OUT = path.join(ROOT, "public", "fleet", "index.html");

const fleet = JSON.parse(fs.readFileSync(SPINE, "utf8"));
const QUESTIONS = path.join(ROOT, "fleet", "questions.json");
const core = fs.existsSync(QUESTIONS) ? JSON.parse(fs.readFileSync(QUESTIONS, "utf8")) : { questions: [], vantages: {}, rules: [] };

const TERMINAL = new Set(["archived", "failed"]);
const LIVE_PROJECT = new Set(["starting", "building", "review", "stalled"]);

const project = (id) => fleet.projects.find((p) => p.id === id);
const surveyedAt = fleet.surveys.at(-1)?.at ?? "unknown";

/* ------------------------------------------------------------ globbing --- */
/* Only the two forms the spine uses: a literal path, or a prefix ending in *. */

function globOverlap(a, b) {
  const norm = (g) => (g.endsWith("*") ? g.slice(0, -1) : g);
  const [x, y] = [norm(a), norm(b)];
  const wildA = a.endsWith("*");
  const wildB = b.endsWith("*");
  if (wildA && wildB) return x.startsWith(y) || y.startsWith(x);
  if (wildA) return b.startsWith(x);
  if (wildB) return a.startsWith(y);
  return a === b;
}

/* -------------------------------------------------------------- checks --- */

function check() {
  const findings = [];
  const add = (rule, severity, subject, detail) =>
    findings.push({ rule, severity, subject, detail });

  const live = fleet.coworkers.filter((c) => !TERMINAL.has(c.status));

  // P1 — one writer per path
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const [a, b] = [live[i], live[j]];
      const pa = project(a.project);
      const pb = project(b.project);
      if (!pa || !pb || pa.id === pb.id) continue;
      if (!pa.repo || pa.repo !== pb.repo) continue;
      const clashes = pa.owns.filter((ga) => pb.owns.some((gb) => globOverlap(ga, gb)));
      if (clashes.length) {
        add("P1", "error", `${pa.id} × ${pb.id}`,
          `both claim ${clashes.join(", ")} in ${pa.repo}`);
      }
    }
  }

  // P2 — a live base branch must be declared as inherited
  for (const p of fleet.projects) {
    if (!p.base_branch) continue;
    const upstream = fleet.projects.find(
      (q) => q.id !== p.id && q.branch === p.base_branch && LIVE_PROJECT.has(q.state)
    );
    if (upstream && p.inherits !== upstream.id) {
      add("P2", "error", p.id,
        `base branch ${p.base_branch} is still being pushed to by ${upstream.id}; declare "inherits": "${upstream.id}"`);
    }
  }

  // P13 — a stacked pull request targets the branch it stacks on
  for (const p of fleet.projects) {
    if (!p.inherits || !p.pull_request) continue;
    const up = project(p.inherits);
    if (up && p.pull_request_base && p.pull_request_base !== up.branch) {
      add("P13", "error", `${p.id} → PR #${p.pull_request}`,
        `targets ${p.pull_request_base} but stacks on ${up.id} (${up.branch}); its diff shows ${up.id}'s work as its own`);
    }
  }

  // P9 — no product claim without a record behind it
  for (const p of fleet.projects) {
    const sells = (p.vantages_held ?? []).includes("content-marketing") || p.survival?.produces_artifact;
    if (!sells) continue;
    if (!p.catalogue_provenance) {
      add("P9", "error", p.id,
        "holds the content-marketing vantage or produces an artifact, but declares no catalogue_provenance: every public field needs a named record or an explicit blank");
    }
  }

  // P10 — a vantage nobody holds is a gap, not an absence
  const held = new Set(fleet.projects.flatMap((p) => p.vantages_held ?? []));
  for (const v of Object.keys(core.vantages ?? {})) {
    if (v === "note") continue;
    if (!held.has(v)) {
      add("P10", "warn", v, "no project holds this vantage — the questions it would ask are not being asked by anyone else");
    }
  }

  // P11 — a core question put out and not answered is a decision made by default
  for (const q of core.questions ?? []) {
    if (q.arbitration) continue;
    const asked = q.asked_of.length;
    const answered = q.answers.length;
    if (answered === 0) {
      add("P11", "warn", q.id, `put to ${asked} vantage-holder(s), ${answered} answered — unanswered, so it resolves by whatever happens first`);
    } else if (answered < asked) {
      add("P11", "warn", q.id, `${answered} of ${asked} answered — arbitrating now would decide it on a partial record`);
    } else if (!q.note) {
      // Fully answered and unarbitrated is the case the rule originally missed:
      // answers accumulate, nothing resolves, and nothing says so. A question
      // deliberately held open carries a note explaining why; one that just
      // stalled does not.
      add("P11", "warn", q.id, `${answered} of ${asked} answered and not arbitrated, with no note saying why it is held`);
    }
  }

  // P8 — a shared file is owned by one project; the rest declare the claim
  const owner = new Map();
  for (const p of fleet.projects) {
    for (const g of p.owns) if (!g.endsWith("*")) owner.set(g, p.id);
  }
  for (const p of fleet.projects) {
    for (const f of p.claims_disputed ?? []) {
      const holder = owner.get(f);
      if (holder && holder !== p.id) {
        add("P8", "error", `${p.id} → ${f}`,
          `owned by ${holder}; ${p.id} changes it too, so whichever of PR #${project(holder).pull_request} / PR #${p.pull_request} merges second conflicts`);
      }
    }
  }

  // P7 — an inherited base is merged, not assumed
  for (const p of fleet.projects) {
    if (!p.inherits) continue;
    const up = project(p.inherits);
    // merged_upstream discharges it: the merge is the thing the rule asks for,
    // and the fixed source revision never changes to record that it happened.
    if (up && p.source_revision && p.source_revision !== up.branch && !p.merged_upstream) {
      add("P7", "warn", p.id,
        `declares inherits: ${up.id} but was checked out from ${p.source_revision}; ${up.branch} has to be merged into ${p.branch} before it pushes`);
    }
  }

  // P3 — a blocked coworker is an operator debt
  for (const c of fleet.coworkers) {
    if (c.status === "blocked" && !c.unblocked_by) {
      add("P3", "error", c.session, `blocked on ${c.blocked_on ?? "an unnamed prompt"} with no action recorded`);
    }
  }

  // P4 — terminal work is retired; stale work is surfaced
  for (const c of fleet.coworkers) {
    const p = project(c.project);
    if (c.status === "failed") {
      add("P4", "warn", c.session, "session failed and is still unarchived");
    }
    if (p?.state === "done" && c.status !== "archived") {
      add("P4", "warn", c.session, `project ${p.id} is done but the session is ${c.status}`);
    }
    if (c.status === "idle" && p?.state === "stalled") {
      add("P4", "warn", c.session, `idle on a stalled project — nothing has read it, and it holds no repository`);
    }
  }

  // P5 — a ritual without a Routine is an intention
  for (const p of fleet.projects) {
    if (!p.ritual) continue;
    const bound = fleet.routines.some((r) => r.project === p.id);
    if (!bound) add("P5", "warn", p.id, "declared a ritual with no Routine bound to it");
  }

  // P6 — deployment goes to a declared environment
  const declared = new Set(fleet.environments.map((e) => e.id));
  for (const c of fleet.coworkers) {
    const p = project(c.project);
    if (!p?.repo || TERMINAL.has(c.status)) continue;
    if (!c.environment || !declared.has(c.environment)) {
      add("P6", "warn", c.session, `works ${p.repo} from outside a declared environment`);
    }
  }

  return findings;
}

/* ---------------------------------------------------------------- plan --- */
/* Each entry names the tool and arguments an operator session runs. */

function plan(findings) {
  const actions = [];

  // P8 fires once per disputed file; one relay per project is what an operator
  // actually sends, so collapse the findings before emitting the action.
  const disputed = new Map();
  for (const f of findings) {
    if (f.rule !== "P8") continue;
    const id = f.subject.split(" → ")[0];
    if (!disputed.has(id)) disputed.set(id, []);
    disputed.get(id).push(f.subject.split(" → ")[1]);
  }
  for (const [id, files] of disputed) {
    const p = project(id);
    actions.push({
      why: `${id} changes ${files.join(", ")}, all owned by another project`,
      tool: "create_trigger + fire_trigger",
      args: { persistent_session_id: "<the claiming session>", prompt: `merge the owning branch, then re-apply your changes to ${files.join(", ")} on top` },
      note: `PR #${p.pull_request} and the owning PR both touch these; whichever merges second conflicts. Cheaper now than after.`,
    });
  }

  for (const f of findings) {
    if (f.rule === "P3") {
      const c = fleet.coworkers.find((x) => x.session === f.subject);
      actions.push({
        why: `${c.title} is blocked and nothing is owed back to it`,
        tool: "create_trigger + fire_trigger",
        args: { persistent_session_id: c.session, prompt: "<the decision it is waiting on>" },
        note: "A trigger bound to the session is the delivery path; ListAgents does not reach cloud siblings.",
      });
    }
    if (f.rule === "P4" && f.detail.includes("failed")) {
      const c = fleet.coworkers.find((x) => x.session === f.subject);
      actions.push({
        why: `${c.title} cannot be continued — ${c.failure ?? "session failed"}`,
        tool: "archive_session",
        args: { session_id: c.session },
        note: "Archives the session only. Its branch stays; here it is the repository default.",
      });
    }
    if (f.rule === "P4" && f.detail.includes("idle on a stalled project")) {
      const c = fleet.coworkers.find((x) => x.session === f.subject);
      actions.push({
        why: `${c.title} is review-ready and unread since ${c.last_activity.slice(0, 10)}`,
        tool: "decision required — no tool",
        args: { session_id: c.session },
        note: "Adopt it into an environment and a repo, or archive it. Leaving it idle is the one option that loses the work.",
      });
    }
    if (f.rule === "P7") {
      const p = project(f.subject);
      const up = project(p.inherits);
      actions.push({
        why: f.detail,
        tool: "create_trigger + fire_trigger",
        args: { persistent_session_id: "<the builder session>", prompt: `git fetch origin ${up.branch} && git merge origin/${up.branch}` },
        note: "Relay it; the session cannot change the source it was created against.",
      });
    }
    if (f.rule === "P5") {
      const p = project(f.subject);
      actions.push({
        why: `${p.name} is declared a ritual and nothing recurs`,
        tool: "create_trigger",
        args: { name: `${p.id} re-survey`, persistent_session_id: "<the builder session>", cron_expression: "<cadence, UTC>" },
        note: "Bind after the subtree exists; a Routine firing into an empty surface is noise.",
      });
    }
    if (f.rule === "P13") {
      const p = project(f.subject.split(" \u2192 ")[0]);
      actions.push({
        why: f.detail,
        tool: "update_pull_request — the owning session's call, not the operator's",
        args: { pullNumber: p.pull_request, base: project(p.inherits).branch },
        note: "One field. Retargeting someone else's PR changes what their reviewers see, so relay it rather than doing it.",
      });
    }
    if (f.rule === "P1" || f.rule === "P2") {
      actions.push({
        why: f.detail,
        tool: "fleet/fleet.json — declare or separate",
        args: { subject: f.subject },
        note: "A path collision is a merge conflict that has not happened yet. Resolve it in the spine before it lands in git.",
      });
    }
  }

  // One call per project: set_session_tags applies the same add-list to every
  // session id it is given, so a single mixed call would stamp each session
  // with every project's tag.
  const byProject = new Map();
  for (const c of fleet.coworkers) {
    if (TERMINAL.has(c.status) || !project(c.project)?.repo) continue;
    if (!byProject.has(c.project)) byProject.set(c.project, []);
    byProject.get(c.project).push(c.session);
  }
  for (const [id, sessions] of byProject) {
    actions.push({
      why: `the roster is only legible if ${id} sessions carry their project`,
      tool: "set_session_tags",
      args: { session_ids: sessions, add: [`project:${id}`] },
      note: "Tags are how a later survey groups sessions without reading every transcript.",
    });
  }

  return actions;
}

/* -------------------------------------------------------------- output --- */

const STATUS_ORDER = { blocked: 0, failed: 1, running: 2, idle: 3, archived: 4 };

function questions() {
  console.log(`core questions — ${core.questions.length} open\n`);
  for (const q of core.questions) {
    const state = q.arbitration ? "arbitrated" : `${q.answers.length}/${q.asked_of.length} answered`;
    console.log(`  ${q.id.padEnd(14)} [${state}]  ${q.vantages.join(" · ")}`);
    console.log(`  ${"".padEnd(14)} ${q.question}`);
    for (const a of q.answers) console.log(`  ${"".padEnd(14)} └ ${a.vantage}: ${a.summary}`);
    if (q.arbitration) {
      console.log(`  ${"".padEnd(14)} → decided: ${q.arbitration.decision}`);
      if (q.arbitration.held_opposition)
        console.log(`  ${"".padEnd(14)} → held open: ${q.arbitration.held_opposition}`);
    }
    console.log();
  }
  const gaps = Object.keys(core.vantages).filter(
    (v) => v !== "note" && !fleet.projects.some((p) => (p.vantages_held ?? []).includes(v))
  );
  console.log(`  vantages: ${Object.keys(core.vantages).filter((v) => v !== "note").join(", ")}`);
  console.log(`  unheld:   ${gaps.length ? gaps.join(", ") : "none"}`);
}

function survey() {
  console.log(`fleet survey — observed ${surveyedAt}\n`);
  const rows = [...fleet.coworkers].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );
  for (const c of rows) {
    const p = project(c.project);
    console.log(
      `  ${c.status.padEnd(9)} ${(p?.id ?? "—").padEnd(12)} ${c.model.padEnd(17)} ${c.title}`
    );
    if (c.blocked_on) console.log(`  ${"".padEnd(9)} └ blocked on: ${c.blocked_on}`);
    if (c.unblocked_by) console.log(`  ${"".padEnd(9)} └ answered by: ${c.unblocked_by}`);
  }
  const byState = fleet.projects.reduce((acc, p) => ((acc[p.state] = (acc[p.state] ?? 0) + 1), acc), {});
  console.log(
    `\n  ${fleet.coworkers.length} coworkers · ${fleet.projects.length} projects (` +
      Object.entries(byState).map(([k, v]) => `${v} ${k}`).join(", ") +
      `) · ${fleet.environments.length} environment · ${fleet.routines.length} routines`
  );
}

function report(findings) {
  if (!findings.length) {
    console.log("fleet check — clean against all policy rules");
    return 0;
  }
  console.log("fleet check\n");
  for (const f of findings) {
    console.log(`  ${f.severity.toUpperCase().padEnd(5)} ${f.rule}  ${f.subject}`);
    console.log(`        ${f.detail}`);
  }
  const errors = findings.filter((f) => f.severity === "error").length;
  console.log(`\n  ${errors} error(s), ${findings.length - errors} warning(s)`);
  return errors;
}

function printPlan(actions) {
  console.log("\nfleet plan — run these through the operator session's MCP tools\n");
  actions.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.tool}`);
    console.log(`     why:  ${a.why}`);
    console.log(`     args: ${JSON.stringify(a.args)}`);
    if (a.note) console.log(`     note: ${a.note}`);
    console.log();
  });
}

/* -------------------------------------------------------------- render --- */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function render(findings, actions) {
  const card = (c) => {
    const p = project(c.project);
    return `        <article class="crew" data-status="${esc(c.status)}">
          <span class="crew-status">${esc(c.status)}</span>
          <h3>${esc(c.title)}</h3>
          <p class="crew-role">${esc(p?.name ?? c.project)} · ${esc(c.role)}</p>
          <dl>
            <dt>model</dt><dd>${esc(c.model)}</dd>
            <dt>branch</dt><dd>${esc(p?.branch ?? "—")}</dd>
            <dt>last active</dt><dd>${esc(c.last_activity.slice(0, 10))}</dd>
          </dl>
          ${c.blocked_on ? `<p class="crew-note">blocked on ${esc(c.blocked_on)}</p>` : ""}
          ${c.unblocked_by ? `<p class="crew-note">answered by ${esc(c.unblocked_by)}</p>` : ""}
          ${c.failure ? `<p class="crew-note">${esc(c.failure)}</p>` : ""}
        </article>`;
  };

  const finding = (f) =>
    `        <li data-severity="${esc(f.severity)}"><span class="tag">${esc(f.rule)}</span>
          <strong>${esc(f.subject)}</strong> — ${esc(f.detail)}</li>`;

  const action = (a, i) =>
    `        <li><span class="tag">${i + 1}</span>
          <strong>${esc(a.tool)}</strong>
          <span class="act-why">${esc(a.why)}</span>
          <code>${esc(JSON.stringify(a.args))}</code>
          ${a.note ? `<span class="act-note">${esc(a.note)}</span>` : ""}</li>`;

  const errors = findings.filter((f) => f.severity === "error").length;
  const live = fleet.coworkers.filter((c) => !TERMINAL.has(c.status)).length;

  const qCard = (q) => `        <article class="q" data-state="${q.arbitration ? "arbitrated" : q.answers.length ? "partial" : "open"}">
          <span class="q-id">${esc(q.id)}</span>
          <span class="q-state">${q.arbitration ? "arbitrated" : `${q.answers.length}/${q.asked_of.length} answered`}</span>
          <h3>${esc(q.question)}</h3>
          <p class="q-why">${esc(q.why_core)}</p>
          <p class="q-vantages">${q.vantages.map((v) => `<span>${esc(v)}</span>`).join("")}</p>
          ${q.answers.map((a) => `<p class="q-answer"><strong>${esc(a.vantage)}</strong> ${esc(a.summary)}</p>`).join("")}
          ${q.arbitration ? `<p class="q-decision"><strong>decided</strong> ${esc(q.arbitration.decision)}</p>` : ""}
          ${q.arbitration?.held_opposition ? `<p class="q-held"><strong>held open</strong> ${esc(q.arbitration.held_opposition)}</p>` : ""}
        </article>`;

  const tally = (list, key) =>
    list.reduce((acc, x) => ((acc[x[key]] = (acc[x[key]] ?? 0) + 1), acc), {});
  const glanceRow = (k, v) => `          <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`;
  const glance = [
    ...Object.entries(tally(fleet.coworkers, "status")).map(([k, v]) => glanceRow(k, v)),
    glanceRow("projects", fleet.projects.length),
    glanceRow("routines", fleet.routines.length),
    glanceRow("findings", `${errors} err / ${findings.length - errors} warn`),
  ].join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Fleet — ayeyoty.co</title>
<meta name="description" content="Deployment and management surface for the Claude coworkers building this repository." />
<meta name="theme-color" content="#f6f5fa" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0b0c10" media="(prefers-color-scheme: dark)" />
<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="mask-icon" href="/icons/mask-icon.svg" color="#7c5cff" />
<link rel="stylesheet" href="/venue.css" />
<link rel="stylesheet" href="/fleet/fleet.css" />
<script src="/venue.js" defer></script>
</head>
<body>

<a class="skip" href="#crew">Skip to the roster</a>

<header class="chrome">
  <div class="shell">
    <a class="wordmark" href="/">aye<span>yoty</span>.co</a>
    <p class="chip" id="tier-chip" aria-live="polite">tier: <span id="tier-name">—</span></p>
  </div>
</header>

<main>
  <section class="shell hero">
    <div class="hero-copy">
      <p class="eyebrow">subtree · fleet</p>
      <h1><span class="wide-only">${live} live coworkers. <em>One environment.</em></span><span class="watch-only">Fleet</span></h1>
      <p class="lede">Every Claude session working this repository, what it owns, what it is
        blocked on, and what the policy says is owed. Generated from
        <code>fleet/fleet.json</code> — surveyed ${esc(surveyedAt)}, never edited by hand.</p>
      <div class="actions">
        <a class="btn btn--primary" href="#crew">The roster</a>
        <a class="btn btn--quiet wide-only" href="#questions">Core questions</a>
      </div>
    </div>

    <div class="hero-art glance" aria-label="Fleet at a glance">
      <p class="eyebrow">at a glance</p>
      <dl>
${glance}
      </dl>
    </div>
  </section>

  <section class="shell" id="crew">
    <div class="section-head">
      <h2>Roster</h2>
      <p>Blocked and failed first. A coworker is legible when you can name its project, its
        branch and the thing standing in its way without opening its transcript.</p>
    </div>
    <div class="crew-grid">
${[...fleet.coworkers].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)).map(card).join("\n")}
    </div>
  </section>

  <section class="shell" id="questions">
    <div class="section-head">
      <h2>Core questions</h2>
      <p>Put to every live coworker at once, not relayed down a chain. Arbitration records what was
        decided and what did not reconcile — a synthesis showing no residue was an average.</p>
    </div>
    <div class="q-grid">
${core.questions.map(qCard).join("\n")}
    </div>
  </section>

  <section class="shell" id="findings">
    <div class="section-head">
      <h2>Policy</h2>
      <p>${errors ? `${errors} error, ` : "No errors. "}${findings.length - errors} warning${findings.length - errors === 1 ? "" : "s"} against ${fleet.policy.length} rules.</p>
    </div>
    <ul class="findings">
${findings.length ? findings.map(finding).join("\n") : '        <li data-severity="clean">Nothing outstanding.</li>'}
    </ul>
  </section>

  <section class="shell" id="plan">
    <div class="section-head">
      <h2>What is owed</h2>
      <p>The actions the findings imply, in order. Each names the tool and its arguments;
        an operator session runs them. This page executes nothing.</p>
    </div>
    <ul class="plan">
${actions.length ? actions.map(action).join("\n") : "        <li>Nothing owed.</li>"}
    </ul>
  </section>
</main>

<nav class="thumbbar" aria-label="Primary">
  <a class="btn btn--primary" href="#crew">Roster</a>
  <a class="btn btn--quiet" href="/">Venue</a>
</nav>

<footer class="footer">
  <div class="shell">
    <span>Fleet subtree — a surface of ayeyoty.co, not a second site.</span>
    <span class="wide-only">Rendered from fleet/fleet.json. No cookies. No storage.</span>
  </div>
</footer>

</body>
</html>
`;
}

/* ----------------------------------------------------------------- main -- */

const cmd = process.argv[2] ?? "survey";
const findings = check();
const actions = plan(findings);

if (cmd === "survey") {
  survey();
} else if (cmd === "questions") {
  questions();
} else if (cmd === "check") {
  process.exit(report(findings) ? 1 : 0);
} else if (cmd === "plan") {
  printPlan(actions);
} else if (cmd === "render") {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, render(findings, actions));
  console.log(`rendered ${path.relative(ROOT, OUT)} — ${fleet.coworkers.length} coworkers, ${findings.length} findings, ${actions.length} actions`);
} else if (cmd === "all") {
  survey();
  console.log();
  const errors = report(findings);
  printPlan(actions);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, render(findings, actions));
  console.log(`rendered ${path.relative(ROOT, OUT)}`);
  process.exit(errors ? 1 : 0);
} else {
  console.error(`unknown command: ${cmd}\nusage: fleet.mjs survey|questions|check|plan|render|all`);
  process.exit(2);
}
