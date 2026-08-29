/* ayeyoty.co — open-calls reference
   Workflow engine. Executes data/workflow.json; declares nothing itself.

   Four rules this file keeps:
     1. No stage id, transition id or label is written in here. Every one of
        them comes from the compiled spec. Add a stage to data/workflow.json
        and this engine carries it without being touched.
     2. Guards are structured objects, walked directly. There is no expression
        parser, no `new Function`, no eval. A strict CSP is not something this
        file has to be excused from.
     3. Settling is deterministic and idempotent. settle() run twice on the
        same input gives the same output, and applies auto transitions until
        no guard holds — with a hard cap so a mis-declared cycle in the spec
        stalls loudly instead of hanging the tab.
     4. Nothing is persisted. Stage changes live for the life of the tab. */

(function (global) {
  "use strict";

  var MAX_AUTO_HOPS = 8;   /* a spec cycle stalls here rather than spinning */

  /* ------------------------------------------------------------- paths -- */

  function read(scope, path) {
    if (typeof path !== "string") return undefined;
    var parts = path.split(".");
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /* ------------------------------------------------------------ guards -- */

  var OPS = {
    eq:  function (a, b) { return a === b; },
    ne:  function (a, b) { return a !== b; },
    lt:  function (a, b) { return typeof a === "number" && a < b; },
    lte: function (a, b) { return typeof a === "number" && a <= b; },
    gt:  function (a, b) { return typeof a === "number" && a > b; },
    gte: function (a, b) { return typeof a === "number" && a >= b; },
    in:  function (a, b) { return Array.isArray(b) && b.indexOf(a) !== -1; },
    truthy: function (a) { return !!a; },
    falsy:  function (a) { return !a; }
  };

  /* A guard is one of:
       { all: [guard, ...] }  { any: [guard, ...] }  { not: guard }
       { path: "a.b", op: "lt", value: 0 }
     Anything else is a spec error and evaluates false rather than throwing,
     so one bad guard cannot take the surface down with it. */
  function holds(guard, scope) {
    if (!guard || typeof guard !== "object") return true;   /* no guard = open */

    if (Array.isArray(guard.all)) {
      return guard.all.every(function (g) { return holds(g, scope); });
    }
    if (Array.isArray(guard.any)) {
      return guard.any.some(function (g) { return holds(g, scope); });
    }
    if (guard.not) return !holds(guard.not, scope);

    var op = OPS[guard.op];
    if (!op) return false;
    return op(read(scope, guard.path), guard.value);
  }

  /* ----------------------------------------------------------- compile -- */

  function compile(spec) {
    var byId = {};
    var ordered = (spec.stages || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    ordered.forEach(function (s) { byId[s.id] = s; });

    var transitions = (spec.transitions || []).slice();

    function stage(id) {
      return byId[id] || null;
    }

    /* Manual transitions offered out of the call's current stage, in spec
       order, with any guard on them satisfied. */
    function actions(scope) {
      var from = scope.call && scope.call.stage;
      return transitions.filter(function (t) {
        return t.mode === "manual" &&
          (t.from || []).indexOf(from) !== -1 &&
          holds(t.guard, scope);
      });
    }

    /* Apply every auto transition whose guard holds, repeatedly, until the
       stage stops moving. Returns the settled stage id and the trail of
       transition ids that fired — the trail is what the interface shows so a
       reader can see why a call moved without them touching it. */
    function settle(scope) {
      var current = scope.call && scope.call.stage;
      var fired = [];
      var hops = 0;

      while (hops++ < MAX_AUTO_HOPS) {
        var moved = null;
        for (var i = 0; i < transitions.length; i++) {
          var t = transitions[i];
          if (t.mode !== "auto") continue;
          if ((t.from || []).indexOf(current) === -1) continue;
          /* Re-scope so a guard can read the stage the engine is now on,
             not the one the record was authored with. */
          var view = { call: assign({}, scope.call, { stage: current }), derived: scope.derived };
          if (!holds(t.guard, view)) continue;
          moved = t;
          break;
        }
        if (!moved) break;
        current = moved.to;
        fired.push(moved.id);
      }

      return {
        stage: current,
        fired: fired,
        stalled: hops > MAX_AUTO_HOPS
      };
    }

    /* Apply a manual transition by id. Refuses anything the spec does not
       currently offer, so a stale button cannot move a record sideways. */
    function apply(scope, transitionId) {
      var offered = actions(scope);
      for (var i = 0; i < offered.length; i++) {
        if (offered[i].id === transitionId) return offered[i].to;
      }
      return null;
    }

    return {
      spec: spec,
      initial: spec.initial,
      stages: ordered,
      stage: stage,
      actions: actions,
      settle: settle,
      apply: apply,
      holds: holds
    };
  }

  /* Object.assign is not reachable in every browser this venue targets. */
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }

  global.Workflow = { compile: compile, holds: holds, read: read, assign: assign, OPS: OPS };
})(typeof globalThis !== "undefined" ? globalThis : this);
