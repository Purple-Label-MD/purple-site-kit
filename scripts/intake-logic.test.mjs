import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isContinueEnabled,
  numberKeyIndex,
  optionsOf,
  resolveExclusive422,
  toggleMulti,
} from "../lib/intake/logic.mjs";

/**
 * INTAKE-SKIN-01 parity — the DETERMINISTIC interaction rules (spec §7), unit-tested
 * with no browser. Motion + computed-style states are covered by the Playwright suite
 * (scripts/parity.mjs). Exclusivity is a DATA flag, never inferred from labels (INT-A-07).
 */

const multiNode = {
  control: "multi_select",
  required: false,
  min_selections: 0,
  options: [
    { code: "a", label: "A" },
    { code: "b", label: "B" },
    { code: "none", label: "None of these", exclusive: true },
  ],
};

// T2 — keyboard number-select maps 1..9 → index, ignores out-of-range / non-digits.
test("T2: number-key select maps to option index", () => {
  assert.equal(numberKeyIndex("1", 4), 0);
  assert.equal(numberKeyIndex("4", 4), 3);
  assert.equal(numberKeyIndex("5", 4), -1);
  assert.equal(numberKeyIndex("0", 4), -1);
  assert.equal(numberKeyIndex("x", 4), -1);
});

// T3 — structural exclusive semantics, BOTH directions, no error state.
test("T3: selecting a sibling then the exclusive clears siblings", () => {
  let sel = [];
  sel = toggleMulti(sel, multiNode, "a"); // [a]
  sel = toggleMulti(sel, multiNode, "b"); // [a,b]
  assert.deepEqual([...sel].sort(), ["a", "b"]);
  sel = toggleMulti(sel, multiNode, "none"); // exclusive clears siblings → [none]
  assert.deepEqual(sel, ["none"]);
});

test("T3: selecting a sibling while exclusive is set clears the exclusive", () => {
  let sel = ["none"];
  sel = toggleMulti(sel, multiNode, "a"); // sibling clears exclusive → [a]
  assert.deepEqual(sel, ["a"]);
  assert.ok(!sel.includes("none"), "exclusive not cleared by sibling");
});

// T3b — degraded path (no client flag): silent resolution, most-recent wins, NAG-FREE.
test("T3b: silent 422 resolution collapses to the most recent selection", () => {
  // Simulate a flagless node: the client couldn't clear structurally, the server 422'd.
  const collapsed = resolveExclusive422("none");
  assert.deepEqual(collapsed, ["none"], "most-recent selection should win");
  // The resolution yields a single code — which can never re-trigger an exclusivity 422.
  assert.equal(collapsed.length, 1);
  // No error string is produced anywhere in the resolution (nag-free by construction).
  assert.equal(typeof collapsed[0], "string");
});

test("T3b: resolution with no prior toggle yields an empty (still nag-free) answer", () => {
  assert.deepEqual(resolveExclusive422(undefined), []);
});

// Gating — visible Continue gating is constraint-driven, not label-driven.
test("gating: min_selections met enables Continue", () => {
  assert.equal(isContinueEnabled(multiNode, 0), true); // min_selections 0
  const requiredNode = { control: "multi_select", required: true };
  assert.equal(isContinueEnabled(requiredNode, 0), false);
  assert.equal(isContinueEnabled(requiredNode, 1), true);
});

// Exclusivity is DATA-driven — never inferred from a label like "None".
test("INT-A-07: exclusivity comes from the flag, not the label text", () => {
  const labelOnly = {
    control: "multi_select",
    options: [
      { code: "a", label: "A" },
      { code: "none", label: "None of these" }, // NO exclusive flag
    ],
  };
  let sel = ["a"];
  sel = toggleMulti(sel, labelOnly, "none"); // must NOT clear siblings (no flag)
  assert.deepEqual([...sel].sort(), ["a", "none"]);
});

// optionsOf normalizes both the ratified shape and the bare-codes fallback.
test("optionsOf: ratified options preferred, else humanized codes", () => {
  assert.equal(optionsOf(multiNode).length, 3);
  assert.deepEqual(
    optionsOf({ option_codes: ["opt_goal_a"] }).map((o) => o.label),
    ["goal a"],
  );
});
