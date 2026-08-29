/* ayeyoty.co — Vantage, the singular open-calls module.

   One module. No tabs. There is no view the reader has to pick between: the
   surface is composed from data/vantage.config.json, and configuration is the
   only thing that decides what it holds.

   Five rules this file keeps:
     1. No field id, band id, stage id or colour appears in here. They arrive
        from /registry.json. Add a field to the configuration and it renders;
        remove one and it stops. This file is not edited either way.
     2. The floor comes from CSS (:root { --tier }), exactly as venue.js reads
        it. No width is compared in here and no breakpoint is duplicated.
     3. A field the configuration does not list for the current floor is never
        built — not built and hidden. The watch floor pays nothing for it.
     4. Every stage change runs through the workflow engine. The module offers
        only the transitions the spec currently allows.
     5. Nothing is persisted and nothing is transmitted. Stage moves live for
        the life of the tab. The fetch of /registry.json is same-origin and is
        the only request the page makes. */

(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (sel) { return document.querySelector(sel); };

  var surface = $("#vantage-surface");
  var strip = $("#vantage-strip");
  var note = $("#vantage-note");
  var glance = $("#vantage-glance");
  var moduleEl = $("#vantage");
  if (!moduleEl || !surface) return;

  var model = null;   /* { config, engine, calls } once loaded */
  var today = startOfUTCDay(new Date());

  /* ---------------------------------------------------------- helpers -- */

  function startOfUTCDay(d) {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  function tier() {
    var v = getComputedStyle(root).getPropertyValue("--tier") || "";
    return v.trim().replace(/^["']|["']$/g, "") || "desk";
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  function toArray(v) {
    if (v === null || v === undefined) return [];
    return Array.isArray(v) ? v : [v];
  }

  /* Wildcard-aware set intersection. "any" on either side matches. */
  function intersects(a, b) {
    if (a.indexOf("any") !== -1 || b.indexOf("any") !== -1) return true;
    for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) !== -1) return true;
    return false;
  }

  function daysUntil(iso) {
    if (!iso) return null;
    var t = Date.parse(iso + "T00:00:00Z");
    if (isNaN(t)) return null;
    return Math.round((t - today) / 86400000);
  }

  /* --------------------------------------------------------- deriving -- */

  /* Bands are configuration. The first band whose ceiling the call fits under
     wins; a call already past its close date takes the band flagged when_past.
     No band id is named here. */
  function bandFor(bands, days) {
    var past = null, undated = null, i, b;
    for (i = 0; i < bands.length; i++) {
      if (bands[i].when_past) past = i;
      if (bands[i].when_undated) undated = i;
    }

    /* No sourced date is its own band, not a guess at one. */
    if (days === null) return undated !== null ? undated : bands.length - 1;
    if (days < 0 && past !== null) return past;

    for (i = 0; i < bands.length; i++) {
      b = bands[i];
      if (b.when_past || b.when_undated) continue;
      if (b.max_days === null || b.max_days === undefined) return i;
      if (days <= b.max_days) return i;
    }
    return bands.length - 1;
  }

  /* Fit is scored from config.fit.criteria against config.profile. The module
     does not know what "geography" means; it compares two lists it was told
     to compare and divides by the weights it was given. */
  function fitFor(config, call) {
    var criteria = (config.fit && config.fit.criteria) || [];
    var total = 0, got = 0;
    for (var i = 0; i < criteria.length; i++) {
      var c = criteria[i];
      var w = c.weight || 0;
      total += w;
      var mine = toArray(config.profile && config.profile[c.profile]);
      var theirs = toArray(call[c.call]);
      if (mine.length && theirs.length && intersects(mine, theirs)) got += w;
    }
    return total ? got / total : 0;
  }

  /* Award value banded by the configuration. An unsourced figure scores at the
     configured unknown value rather than zero, so a missing number neither
     flatters nor punishes a call — the card marks it missing either way. */
  function awardValue(rank, call) {
    var aw = call.award || {};
    if (aw.basis === "none" || (aw.min === null && aw.max === null)) return rank.unknown_award;
    var figure = aw.max !== null && aw.max !== undefined ? aw.max : aw.min;
    var bands = rank.award_value || [];
    for (var i = 0; i < bands.length; i++) {
      if (bands[i].up_to === null || bands[i].up_to === undefined) return bands[i].value;
      if (figure <= bands[i].up_to) return bands[i].value;
    }
    return bands.length ? bands[bands.length - 1].value : 0;
  }

  /* Return on effort: what the configuration says this call is worth, divided
     by what it says the call costs to enter. The module supplies neither. */
  function returnOnEffort(config, call, fit) {
    var rank = config.rank || {};
    var w = rank.weights || {};
    var total = (w.award || 0) + (w.fit || 0);
    if (!total) return 0;
    var worth = ((w.award || 0) * awardValue(rank, call) + (w.fit || 0) * fit) / total;
    var cost = (rank.effort_cost || {})[call.effort];
    if (!cost) cost = 1;
    return worth / cost;
  }

  function awardLabel(call) {
    var aw = call.award || {};
    if (aw.basis === "none" || (aw.min === null && aw.max === null)) return "award not sourced";
    var figure = aw.max !== null && aw.max !== undefined ? aw.max : aw.min;
    return "up to " + (aw.currency || "") + " " + Number(figure).toLocaleString("en-US");
  }

  /* Provenance is the whole point of the reference, so it says three different
     things rather than one: read off the organisation, read off a named third
     party, or nobody has looked. */
  function provenanceFor(call) {
    /* `kind` drives the styling hook, `group` is what a reader is shown when
       records are counted, `label` is what the card itself says. */
    if (call.date_basis === "confirmed") {
      return { kind: "confirmed", group: "confirmed", label: "confirmed " + call.verified };
    }
    if (call.date_basis === "sourced") {
      return { kind: "sourced", group: "sourced", label: "sourced " + call.verified };
    }
    if (call.verified) {
      return { kind: "nocall", group: "no open call", label: "no open call" };
    }
    return { kind: "unsourced", group: "not sourced", label: "date not sourced" };
  }

  /* Everything the configuration can read through a "derived.*" path. */
  function derive(config, engine, call) {
    var days = daysUntil(call.closes);
    var bandIndex = bandFor(config.bands, days);
    var band = config.bands[bandIndex];

    var scope = { call: call, derived: { days: days } };
    var settled = engine.settle(scope);
    var stage = engine.stage(settled.stage);

    var fit = fitFor(config, call);

    return {
      days: days,
      band: band,
      band_order: bandIndex,
      fit: fit,
      ret: returnOnEffort(config, call, fit),
      effort_label: call.effort ? call.effort + " effort" : null,
      award_label: awardLabel(call),
      stage_id: settled.stage,
      stage_label: stage ? stage.label : settled.stage,
      stage_committed: !!(stage && stage.committed),
      terminal: !!(stage && stage.terminal),
      moved: settled.fired,
      stalled: settled.stalled,
      provenance: provenanceFor(call)
    };
  }

  /* ---------------------------------------------------------- reading -- */

  function valueAt(entry, path) {
    return Workflow.read({ call: entry.call, derived: entry.derived }, path);
  }

  function countdownText(days) {
    if (days === null) return "no date";
    if (days === 0) return "closes today";
    if (days === 1) return "1 day left";
    if (days > 0) return days + " days left";
    if (days === -1) return "closed yesterday";
    return "closed " + Math.abs(days) + " days ago";
  }

  /* --------------------------------------------------------- painting -- */

  /* One renderer per role. Roles are the shared vocabulary between this file
     and vantage.css: the configuration assigns a role to a field, and the two
     of them agree on what that role looks like. Field ids never reach here. */
  var ROLES = {
    title: function (v, f, entry) {
      var h = el("h3", "f-title", v);
      h.id = "call-" + entry.call.id;
      return h;
    },
    countdown: function (v) { return el("p", "f-countdown", countdownText(v)); },
    meta: function (v) { return el("p", "f-meta", v); },
    date: function (v) { return el("p", "f-date", v); },
    prose: function (v) { return el("p", "f-prose", v); },
    tag: function (v) { return el("span", "f-tag", v); },
    stage: function (v, f, entry) {
      var n = el("span", "f-stage", v);
      n.setAttribute("data-committed", entry.derived.stage_committed ? "true" : "false");
      return n;
    },
    meter: function (v, f) {
      var pct = Math.round((Number(v) || 0) * 100);
      var n = el("span", "f-meter");
      var bar = el("i");
      bar.style.setProperty("--fill", pct + "%");
      n.appendChild(bar);
      n.appendChild(el("span", null, pct + "%" + (f.label ? " " + f.label : "")));
      n.setAttribute("title", (f.label ? f.label + " " : "") + pct + "%");
      return n;
    },
    provenance: function (v) {
      var n = el("span", "prov prov--" + v.kind);
      n.appendChild(el("i"));
      n.appendChild(el("span", null, v.label));
      return n;
    },
    amount: function (v) { return el("span", "f-amount", v); },
    /* The cycle's terms, or — on an undated record — what is still owed.
       A ⟦FILL⟧ marker is the reference naming its own gap, so it is styled as
       a finding rather than hidden. */
    terms: function (v) {
      var n = el("p", "f-terms", v);
      n.setAttribute("data-owed", /⟦FILL/.test(v) ? "true" : "false");
      return n;
    },
    /* Drafts attached to the opportunity. An empty list is the honest state,
       and it still renders: the attach point is the thing that tells a reader
       nothing has been started yet. */
    drafts: function (v, f, entry) {
      var n = el("div", "f-drafts");
      n.setAttribute("data-empty", v.length ? "false" : "true");
      if (f.label) n.appendChild(el("span", "f-drafts-label", f.label));
      if (!v.length) {
        n.appendChild(el("span", "f-drafts-none", "none attached"));
        return n;
      }
      v.forEach(function (d) {
        var item;
        if (d.href) {
          item = el("a", "f-draft", d.label);
          item.href = d.href;
          item.rel = "noopener noreferrer";
        } else {
          item = el("span", "f-draft", d.label);
        }
        if (d.state) item.setAttribute("data-state", d.state);
        item.setAttribute("aria-describedby", "call-" + entry.call.id);
        n.appendChild(item);
      });
      return n;
    },
    link: function (v, f, entry) {
      var a = el("a", "f-link", f.label || "Guidelines");
      a.href = v;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.setAttribute("aria-describedby", "call-" + entry.call.id);
      return a;
    }
  };

  function renderItem(entry, floor, density) {
    var config = model.config;
    var item = el("article", "item");
    item.setAttribute("data-terminal", entry.derived.terminal ? "true" : "false");
    item.style.setProperty("--band-h", entry.derived.band.hue);
    item.style.setProperty("--band-c", entry.derived.band.chroma);

    /* One row per distinct line value, in the order the configuration first
       mentions it. The module does not know what "signals" or "detail" mean;
       it groups by whatever strings it is given. */
    var lines = [];
    var byLine = {};

    config.fields.forEach(function (f) {
      if (f.tiers.indexOf(floor) === -1) return;      /* never built */
      var render = ROLES[f.role];
      if (!render) return;
      var v = valueAt(entry, f.from);
      if (v === null || v === undefined || v === "") return;
      /* An empty array is a real value here — "no drafts attached" is the
         thing the card needs to say. Only null and "" mean absent. */

      var key = f.line || "signals";
      if (!byLine[key]) {
        byLine[key] = el("div", "item-line");
        byLine[key].setAttribute("data-line", key);
        lines.push(byLine[key]);
      }
      byLine[key].appendChild(render(v, f, entry));
    });

    lines.forEach(function (line) { item.appendChild(line); });

    /* Why a record moved on its own. Shown wherever the spec fired something,
       because a stage the reader did not set needs to explain itself. */
    if (entry.derived.moved.length && density.actions) {
      var labels = entry.derived.moved.map(function (id) {
        var t = model.transitionsById[id];
        return t ? t.label : id;
      });
      item.appendChild(el("p", "f-trail", "moved by the workflow: " + labels.join(" → ")));
    }

    if (density.actions) {
      var offered = model.engine.actions({
        call: { stage: entry.derived.stage_id },
        derived: entry.derived
      });
      if (offered.length) {
        var bar = el("div", "item-actions");
        offered.forEach(function (t) {
          var b = el("button", "act", t.label);
          b.type = "button";
          b.setAttribute("data-call", entry.call.id);
          b.setAttribute("data-transition", t.id);
          bar.appendChild(b);
        });
        item.appendChild(bar);
      }
    }

    return item;
  }

  function compare(entries, order) {
    return entries.slice().sort(function (a, b) {
      for (var i = 0; i < order.length; i++) {
        var key = order[i];
        var av = valueAt(a, key.key);
        var bv = valueAt(b, key.key);
        if (av === null || av === undefined) av = Infinity;
        if (bv === null || bv === undefined) bv = Infinity;
        if (av === bv) continue;
        var cmp = av < bv ? -1 : 1;
        return key.dir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }

  function paint() {
    if (!model) return;

    var config = model.config;
    var floor = tier();
    var density = config.density[floor] || config.density.desk;

    var entries = model.calls.map(function (call) {
      return { call: call, derived: derive(config, model.engine, call) };
    });

    /* Horizon is configuration too: anything further out than it is simply not
       part of this surface. */
    entries = entries.filter(function (e) {
      return e.derived.days === null || e.derived.days <= config.horizon_days;
    });

    entries = compare(entries, config.order);

    var shown = density.max_rows === null || density.max_rows === undefined
      ? entries
      : entries.slice(0, density.max_rows);

    /* --- strip: one tally per band that actually has something in it --- */
    strip.textContent = "";
    config.bands.forEach(function (band, i) {
      var n = entries.filter(function (e) { return e.derived.band_order === i; }).length;
      if (!n) return;
      var t = el("span", "tally");
      t.setAttribute("data-band", band.id);
      t.style.setProperty("--band-h", band.hue);
      t.style.setProperty("--band-c", band.chroma);
      t.appendChild(el("b", null, n));
      t.appendChild(el("span", null, band.label));
      strip.appendChild(t);
    });

    /* --- surface --- */
    surface.textContent = "";
    surface.setAttribute("data-unit", density.unit);

    var lastBand = null;
    shown.forEach(function (entry) {
      if (density.band_headings && entry.derived.band_order !== lastBand) {
        lastBand = entry.derived.band_order;
        var band = entry.derived.band;
        var head = el("p", "band-head", band.label);
        head.style.setProperty("--band-h", band.hue);
        head.style.setProperty("--band-c", band.chroma);
        var count = shown.filter(function (e) { return e.derived.band_order === lastBand; }).length;
        head.appendChild(el("span", null, count));
        surface.appendChild(head);
      }
      surface.appendChild(renderItem(entry, floor, density));
    });

    /* The glance panel counts provenance, not bands — the strip already shows
       bands, and what a reader most needs to know about this reference is how
       much of it has actually been sourced. Rows are grouped by whatever kinds
       come back; no kind is named here. */
    if (glance) {
      glance.textContent = "";
      var kinds = [];
      var seenKind = {};
      entries.forEach(function (e) {
        var k = e.derived.provenance;
        if (!seenKind[k.kind]) { seenKind[k.kind] = { group: k.group, n: 0 }; kinds.push(seenKind[k.kind]); }
        seenKind[k.kind].n++;
      });
      kinds.forEach(function (k) {
        var dt = el("dt", null, k.group);
        var dd = el("dd", null, k.n);
        glance.appendChild(dt);
        glance.appendChild(dd);
      });
      glance.appendChild(el("dt", null, "total"));
      glance.appendChild(el("dd", null, entries.length));
    }

    moduleEl.setAttribute("data-state", entries.length ? "ready" : "empty");

    if (note) {
      var hidden = entries.length - shown.length;
      var bits = [entries.length + " open calls within " + config.horizon_days + " days"];
      if (hidden > 0) bits.push(hidden + " held back by this floor's density");
      var owed = entries.filter(function (e) { return e.derived.days === null; }).length;
      if (owed) bits.push(owed + " with no sourced deadline — that is work the reference still owes, not a gap in the programme");
      note.textContent = bits.join(" · ");
    }
  }

  /* Repaint on anything that can move the floor line — the same set venue.js
     watches, for the same reason. */
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; paint(); });
  }

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  ["(prefers-color-scheme: dark)", "(prefers-contrast: more)", "(hover: hover)", "(pointer: fine)"]
    .forEach(function (q) {
      if (!window.matchMedia) return;
      var m = window.matchMedia(q);
      if (m.addEventListener) m.addEventListener("change", schedule);
      else if (m.addListener) m.addListener(schedule);
    });

  /* ---------------------------------------------------------- actions -- */
  /* Delegated, so buttons rebuilt on every repaint stay live. A move is held
     in memory only: reload and the reference is back as the repository has it. */
  surface.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".act") : null;
    if (!btn || !model) return;

    var id = btn.getAttribute("data-call");
    var transition = btn.getAttribute("data-transition");
    var call = model.byId[id];
    if (!call) return;

    var derived = derive(model.config, model.engine, call);
    var to = model.engine.apply({ call: { stage: derived.stage_id }, derived: derived }, transition);
    if (!to) return;

    call.stage = to;
    paint();
  });

  /* ----------------------------------------------------------- loading -- */

  fetch("/fellowships/registry.json", { credentials: "omit", cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("registry " + r.status);
      return r.json();
    })
    .then(function (data) {
      var config = data.vantage;
      var engine = Workflow.compile(data.workflow);

      var byId = {};
      data.calls.forEach(function (c) { byId[c.id] = c; });

      var transitionsById = {};
      data.workflow.transitions.forEach(function (t) { transitionsById[t.id] = t; });

      model = {
        config: config,
        engine: engine,
        calls: data.calls,
        byId: byId,
        transitionsById: transitionsById
      };

      /* Title and lede are configuration, so they are written here rather than
         in the markup. */
      var title = $("#vantage-title");
      var lede = $("#vantage-lede");
      if (title && config.module.title) title.textContent = config.module.title;
      if (lede && config.module.lede) lede.textContent = config.module.lede;

      paint();
    })
    .catch(function () {
      moduleEl.setAttribute("data-state", "error");
      var lede = $("#vantage-lede");
      if (lede) lede.textContent = "The reference could not be loaded.";
    });
})();
