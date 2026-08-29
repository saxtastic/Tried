/* ayeyoty.co — technovenue
   Runtime for the four-floor venue. No dependencies, no build step, no storage.

   Three rules this file keeps:
     1. The tier comes from CSS (:root { --tier }), never from a width compared
        in here. venue.css is the only place breakpoints exist.
     2. Capabilities are measured or feature-queried. The single user-agent read
        is quarantined in appleHardware() and labelled as a guess wherever shown.
     3. Nothing is persisted. No cookie, no localStorage, no sessionStorage.
        State lives for the life of the tab and then it is gone. */

(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* --------------------------------------------------------------- tier -- */

  function tier() {
    var v = getComputedStyle(root).getPropertyValue("--tier") || "";
    return v.trim().replace(/^["']|["']$/g, "") || "desk";
  }

  /* ------------------------------------------------------- measurements -- */

  // A probe element whose padding is set to the four safe-area insets, so the
  // resolved values can be read back as pixels rather than guessed at.
  var probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = [
    "position:absolute", "visibility:hidden", "pointer-events:none",
    "top:0", "left:0", "width:0", "height:0",
    "padding-top:env(safe-area-inset-top,0px)",
    "padding-right:env(safe-area-inset-right,0px)",
    "padding-bottom:env(safe-area-inset-bottom,0px)",
    "padding-left:env(safe-area-inset-left,0px)"
  ].join(";");
  document.body.appendChild(probe);

  // Second probe: body text at the reader's Dynamic Type setting. In Safari
  // this reports the size the reader chose; elsewhere it reports the default.
  var typeProbe = document.createElement("span");
  typeProbe.setAttribute("aria-hidden", "true");
  typeProbe.style.cssText = "position:absolute;visibility:hidden;font:-apple-system-body";
  document.body.appendChild(typeProbe);

  function insets() {
    var s = getComputedStyle(probe);
    var px = function (v) { return Math.round(parseFloat(v) || 0); };
    return [px(s.paddingTop), px(s.paddingRight), px(s.paddingBottom), px(s.paddingLeft)];
  }

  function bodyTextSize() {
    var size = parseFloat(getComputedStyle(typeProbe).fontSize);
    return isFinite(size) ? Math.round(size * 10) / 10 : null;
  }

  function mq(query) {
    return window.matchMedia ? window.matchMedia(query).matches : false;
  }

  function displayMode() {
    if (mq("(display-mode: standalone)")) return "standalone";
    if (mq("(display-mode: fullscreen)")) return "fullscreen";
    if (mq("(display-mode: minimal-ui)")) return "minimal-ui";
    if (window.navigator.standalone === true) return "standalone";  // legacy iOS
    return "browser";
  }

  /* The one guess on the page. iPadOS reports itself as a Mac, so a Mac that
     reports touch points is counted as an iPad. Any browser may lie here,
     which is why the readout marks this line and nothing depends on it. */
  function appleHardware() {
    var ua = navigator.userAgent || "";
    var plat = navigator.platform || "";
    if (/iPhone|iPad|iPod|Watch/.test(ua)) return true;
    if (/^iP(hone|ad|od)/.test(plat)) return true;
    if (/Mac/.test(plat) || /Macintosh|Mac OS X/.test(ua)) return !/Android|Windows|Linux x86|CrOS/.test(ua);
    return false;
  }

  /* ------------------------------------------------------------ readout -- */

  var cells = {};
  $$("#readout-list dd").forEach(function (dd) { cells[dd.getAttribute("data-k")] = dd; });

  function set(key, value) {
    if (cells[key]) cells[key].textContent = value;
  }

  function paint() {
    var t = tier();
    var ins = insets();

    root.setAttribute("data-tier", t);
    var label = $("#tier-name");
    if (label) label.textContent = t;

    set("tier", t);
    set("viewport", Math.round(window.innerWidth) + " × " + Math.round(window.innerHeight) + " pt");
    set("dpr", (window.devicePixelRatio || 1).toFixed(2) + "×");
    set("pointer", mq("(pointer: fine)") ? "fine" : mq("(pointer: coarse)") ? "coarse" : "none");
    set("hover", mq("(hover: hover)") ? "yes" : "no");
    set("display", displayMode());
    set("scheme", mq("(prefers-color-scheme: dark)") ? "dark" : "light");
    set("motion", mq("(prefers-reduced-motion: reduce)") ? "reduced" : "full");
    var size = bodyTextSize();
    set("type", size === null ? "—" : size + " px");
    set("insets", ins.join(" / ") + " pt");
    set("apple", appleHardware() ? "yes (guess)" : "no (guess)");

    $$(".bay").forEach(function (bay) {
      var here = bay.getAttribute("data-tier") === t;
      bay.setAttribute("data-active", here ? "true" : "false");
      if (here) { bay.setAttribute("aria-current", "true"); }
      else { bay.removeAttribute("aria-current"); }
    });

    $$("[data-install]").forEach(function (card) {
      var relevant = card.getAttribute("data-install").split(" ").indexOf(t) !== -1;
      card.setAttribute("data-relevant", relevant ? "true" : "false");
      card.style.order = relevant ? "-1" : "0";
    });

    var off = $("#offstage");
    if (off && !appleHardware()) {
      off.removeAttribute("hidden");
      off.setAttribute("data-visible", "true");
    }
  }

  /* Repaint on anything that can move a tier line: resize, rotation, and the
     media features themselves (a menu-bar appearance change, an accessibility
     setting, plugging in a trackpad). */
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; paint(); });
  }

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  window.addEventListener("pageshow", schedule);

  [
    "(prefers-color-scheme: dark)",
    "(prefers-reduced-motion: reduce)",
    "(prefers-contrast: more)",
    "(display-mode: standalone)",
    "(hover: hover)",
    "(pointer: fine)"
  ].forEach(function (q) {
    if (!window.matchMedia) return;
    var m = window.matchMedia(q);
    if (m.addEventListener) m.addEventListener("change", schedule);
    else if (m.addListener) m.addListener(schedule);   // Safari < 14
  });

  /* ---------------------------------------------------------- keyboard --- */
  /* Bound only where there is a keyboard worth binding to. */

  if (mq("(hover: hover) and (pointer: fine)")) {
    var jumps = { "1": "#bay-watch", "2": "#bay-phone", "3": "#bay-pad", "4": "#bay-desk", "r": "#readout" };

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;

      if (e.key === "Escape") {
        window.scrollTo({ top: 0, behavior: mq("(prefers-reduced-motion: reduce)") ? "auto" : "smooth" });
        return;
      }
      var target = jumps[e.key.toLowerCase()];
      if (!target) return;
      var node = $(target);
      if (!node) return;
      e.preventDefault();
      node.scrollIntoView({ behavior: mq("(prefers-reduced-motion: reduce)") ? "auto" : "smooth", block: "center" });
      if (node.hasAttribute("tabindex")) node.focus({ preventScroll: true });
    });
  }

  paint();
})();
