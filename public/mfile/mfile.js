// The toggle.
//
// One control with two states. Tabs would say these are two places; they are
// one place seen from one side or the other. The four questions do not change
// when it moves — what changes is whether you are reading what the administrator
// can state or what it is refusing to say and why.
//
// No storage: the position lives for the life of the tab, like every other
// stage on this site. Data arrives as window.MFILE because the CSP is
// default-src 'none' and the page cannot fetch itself.

(function () {
  "use strict";

  var data = window.MFILE;
  var mount = document.getElementById("surface");
  var legend = document.getElementById("legend");
  var tally = document.getElementById("tally");
  if (!data || !mount) return;

  var SIDES = {
    stated: {
      label: "Stated",
      legend:
        "What the administrator will say, and the basis it says it on. Worked on " +
        data.demonstrated_on + " \u2014 invented numbers in the shape a real phone scan arrives in.",
    },
    withheld: {
      label: "Withheld",
      legend:
        "What it refuses to say, which input would change that, and why the refusal is the " +
        "safer output. Three of the four are withheld on any store that has not answered the intake.",
    },
  };

  var side = "stated";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function card(title, body, basis) {
    var c = el("div", "card");
    c.appendChild(el("h3", null, title));
    body.forEach(function (p) {
      c.appendChild(p.nodeType ? p : el("p", null, p));
    });
    if (basis) c.appendChild(el("span", "basis", basis));
    return c;
  }

  function renderTally() {
    tally.textContent = "";
    var a = data.shape.answered;
    var rows = [
      [a.duplicate.duplicate + a.duplicate.candidate, "flagged as duplicate or candidate"],
      [a.iterative.iterative, "placed in a version series"],
      [a.functional.functional, "referred to by something else"],
      [data.shape.records, "files read"],
    ];
    if (side === "withheld") {
      rows = [
        [a.duplicate.candidate, "downgraded to candidate, no hash"],
        [a.iterative.unknown + a.iterative.candidate, "iterative not stated"],
        [a.novel.unknown + a.novel.unique_content, "novel not stated"],
        [a.functional.unknown + a.functional.unreferenced, "function not established"],
      ];
    }
    rows.forEach(function (r) {
      var li = el("li");
      li.appendChild(el("b", null, String(r[0])));
      li.appendChild(el("span", null, r[1]));
      tally.appendChild(li);
    });
  }

  function renderStated() {
    var grid = el("div", "grid");
    data.questions.forEach(function (q) {
      grid.appendChild(
        card(q.key.charAt(0).toUpperCase() + q.key.slice(1), [q.asks, q.rule], "needs " + q.requires.join(", ")),
      );
    });
    data.stores
      .filter(function (s) {
        return s.reachable;
      })
      .forEach(function (s) {
        grid.appendChild(card(s.name, ["Reachable. Access: " + s.access + "."], "store"));
      });
    return grid;
  }

  function renderWithheld() {
    var grid = el("div", "grid");
    (data.demonstrates || []).forEach(function (d) {
      grid.appendChild(card("In this example", [d], "fixture"));
    });
    data.questions.forEach(function (q) {
      var words = [q.withholds].concat(q.also_withholds ? [q.also_withholds] : []);
      var line = el("p");
      line.appendChild(document.createTextNode("It will not say "));
      words.forEach(function (w, i) {
        if (i) line.appendChild(document.createTextNode(" or "));
        line.appendChild(el("em", "withheld-word", w));
      });
      line.appendChild(document.createTextNode(". It says " + q.instead + " instead."));
      var body = [line];
      if (q.because) body.push(q.because);
      grid.appendChild(card(q.key.charAt(0).toUpperCase() + q.key.slice(1), body, "needs " + q.requires.join(", ")));
    });
    data.stores
      .filter(function (s) {
        return !s.reachable;
      })
      .forEach(function (s) {
        grid.appendChild(card(s.name, ["Not reachable. " + (s.owed || "")], "owed"));
      });
    data.refuses.forEach(function (r) {
      grid.appendChild(card("Refused outright", [r], "under any answer"));
    });
    return grid;
  }

  function render() {
    legend.textContent = SIDES[side].legend;
    renderTally();
    mount.textContent = "";
    mount.appendChild(side === "stated" ? renderStated() : renderWithheld());
    Array.prototype.forEach.call(document.querySelectorAll("[data-side]"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.side === side));
    });
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-side]");
    if (!b) return;
    side = b.dataset.side;
    render();
  });

  render();
})();
