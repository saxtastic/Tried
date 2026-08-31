/* Workstation — one card per domain, ordered by decay.
 *
 * Three rules, all of them the operator's:
 *   1. Rank and recommend, NEVER filter. Every card renders, including the ones
 *      ranked last, each carrying its ranking reason. A threshold that hides a
 *      card is a decision made where nobody can see it.
 *   2. The outcome type belongs to the CARD, not the system. One ends in a
 *      draft, one in captured answers, one in something addressed and queued.
 *      Every outcome names the file it lands in.
 *   3. No storage. Answers live in memory and leave as text the operator
 *      copies. Close the tab and the interview is gone, by design.
 *
 * Right is not "accept". Right is "interview me now" — the only gesture that
 * ends in something shippable.
 *
 * Data arrives from data.js on the window rather than by fetch: the CSP is
 * default-src 'none', which blocks fetch along with everything else.
 */

(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var state = { cards: [], sets: {}, answers: {} };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function decayLabel(d) {
    if (d.type === "fixed_date") {
      var days = Math.round((new Date(d.on) - Date.now()) / 86400000);
      return d.on + " · " + (days >= 0 ? days + " days" : "passed");
    }
    if (d.type === "soft") return "within " + d.window_days + " days";
    if (d.type === "none") return "does not decay";
    return "unknown";
  }

  function refreshOutcome(card, cardEl) {
    var set = state.sets[card.question_set];
    var out = $(".outcome", cardEl);
    if (!out || !set) return;
    var answers = state.answers[card.id] || {};
    var required = set.questions.filter(function (q) { return !q.optional; });
    var answered = required.filter(function (q) { return answers[q.id]; });

    out.textContent = "";
    var head = el("p", "outcome-head");
    head.appendChild(el("strong", null, answered.length + " of " + required.length + " answered"));
    head.appendChild(document.createTextNode(" · outcome: " + card.outcome));
    out.appendChild(head);

    if (answered.length < required.length) {
      out.appendChild(el("p", "outcome-note",
        "Nothing is generated from a partial interview. The remaining answers are what stop the draft inventing them."));
      return;
    }

    out.appendChild(el("p", "outcome-note", "Ready. " + card.produces));
    var path = el("p", "outcome-path");
    path.appendChild(el("span", "outcome-path-label", "opens at "));
    path.appendChild(el("code", null, card.produces));
    out.appendChild(path);

    out.appendChild(el("p", "outcome-note", "Nothing is stored. Copy this into the session that will execute it."));
    out.appendChild(el("pre", "outcome-payload", JSON.stringify({
      card: card.id, outcome: card.outcome, produces: card.produces,
      question_set: set.id, answers: answers, basis: card.basis, record: card.record
    }, null, 2)));
  }

  function openInterview(card, cardEl) {
    var set = state.sets[card.question_set];
    var drawer = el("div", "drawer");

    if (!set) {
      drawer.appendChild(el("p", "drawer-none", card.owed ||
        "Nothing here has a record behind it, so there is nothing to interview against."));
      var ask = el("p", "drawer-none");
      ask.appendChild(el("strong", null, "The only useful question is what this card should hold. "));
      ask.appendChild(document.createTextNode("Writing five plausible questions would be inventing the domain."));
      drawer.appendChild(ask);
      cardEl.appendChild(drawer);
      return;
    }

    var answers = (state.answers[card.id] = state.answers[card.id] || {});
    set.questions.forEach(function (q) {
      var row = el("div", "q");
      row.appendChild(el("p", "q-ask", q.ask + (q.optional ? "  (optional)" : "")));
      row.appendChild(el("p", "q-why", q.why));

      if (q.type === "one_of") {
        var opts = el("div", "q-opts");
        q.options.forEach(function (opt) {
          var b = el("button", "q-opt", opt);
          b.type = "button";
          b.setAttribute("aria-pressed", "false");
          b.addEventListener("click", function () {
            answers[q.id] = opt;
            Array.prototype.forEach.call(opts.children, function (c) {
              c.setAttribute("aria-pressed", String(c === b));
            });
            refreshOutcome(card, cardEl);
          });
          opts.appendChild(b);
        });
        row.appendChild(opts);
      } else {
        var ta = el("textarea", "q-text");
        ta.rows = 2;
        ta.setAttribute("aria-label", q.ask);
        ta.addEventListener("input", function () {
          answers[q.id] = ta.value;
          refreshOutcome(card, cardEl);
        });
        row.appendChild(ta);
      }
      drawer.appendChild(row);
    });

    if (set.refuses) {
      var r = el("div", "drawer-refuses");
      r.appendChild(el("span", "drawer-refuses-label", "this interview refuses to"));
      set.refuses.forEach(function (x) { r.appendChild(el("span", "refusal", x)); });
      drawer.appendChild(r);
    }

    drawer.appendChild(el("div", "outcome"));
    cardEl.appendChild(drawer);
    refreshOutcome(card, cardEl);
  }

  function render() {
    var stack = $("#stack");
    stack.textContent = "";

    state.cards.forEach(function (card) {
      var c = el("article", "card");
      c.setAttribute("data-basis", card.basis);
      c.id = "card-" + card.id;

      var top = el("div", "card-top");
      top.appendChild(el("span", "card-domain", card.domain));
      top.appendChild(el("span", "card-rank", "#" + card.rank));
      c.appendChild(top);

      c.appendChild(el("h3", null, card.title));

      var decay = el("p", "card-decay");
      decay.appendChild(el("span", "card-decay-when", decayLabel(card.decay)));
      decay.appendChild(document.createTextNode(" — " + card.decay.what_stops));
      c.appendChild(decay);

      c.appendChild(el("p", "card-why", card.rank_reason));

      var prov = el("p", "card-prov");
      prov.appendChild(el("span", "basis basis-" + card.basis, card.basis));
      prov.appendChild(document.createTextNode(card.record || "no record"));
      c.appendChild(prov);

      if (card.blank_fields && card.blank_fields.length) {
        var b = el("p", "card-blank");
        b.appendChild(el("strong", null, "blank: "));
        b.appendChild(document.createTextNode(card.blank_fields.join(", ")));
        c.appendChild(b);
      }

      var acts = el("div", "card-acts");
      [["no", "left", "records why, and it does not come back"],
       ["not now", "down", "returns when its decay window opens"],
       ["interview me", "right", "opens the questions"]].forEach(function (spec) {
        var btn = el("button", "act act-" + spec[1], spec[0]);
        btn.type = "button";
        btn.title = spec[2];
        btn.addEventListener("click", function () {
          if (spec[1] === "right") {
            var open = $(".drawer", c);
            if (open) { open.remove(); btn.setAttribute("aria-expanded", "false"); return; }
            btn.setAttribute("aria-expanded", "true");
            openInterview(card, c);
            return;
          }
          c.setAttribute("data-set-aside", spec[1]);
          var n = $(".card-aside", c) || el("p", "card-aside");
          n.textContent = spec[1] === "left"
            ? "Refused. A reason is required before this is final — the reason is the only thing that stops it returning."
            : "Deferred to its decay window. Not tomorrow, and not a snooze.";
          c.appendChild(n);
        });
        acts.appendChild(btn);
      });
      c.appendChild(acts);
      stack.appendChild(c);
    });

    $("#count").textContent = String(state.cards.length);
  }

  var data = window.WORKSTATION;
  if (!data) {
    $("#stack").appendChild(el("p", "card-blank", "data.js did not load — run npm run workstation:build"));
    return;
  }
  state.cards = data.cards.cards.slice().sort(function (a, b) { return a.rank - b.rank; });
  data.sets.forEach(function (s) { state.sets[s.id] = s; });
  $("#rule").textContent = data.cards.ordering.rule + " Filtering: " + data.cards.ordering.filtering;
  render();
})();
