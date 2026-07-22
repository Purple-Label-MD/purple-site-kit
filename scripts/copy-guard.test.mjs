/**
 * RED-first proof for the copy-guard (governance-lite ①: "proven RED-first").
 *
 * This is DURABLE, not a one-time demo: it runs on every CI push. It asserts that
 *   (a) each rule fires on a planted violation (RED), and
 *   (b) the real repository tree is clean (GREEN).
 * If a future edit either weakens a rule or introduces a violation, CI goes red.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { RULES, scanContent, scanRepo } from "./copy-guard.mjs";

// One planted violation per rule, with the file path that makes the rule apply.
const PLANTED = {
  "outcome-guarantee": {
    rel: "app/page.tsx",
    text: "Guaranteed results — you will lose weight or your money back.",
  },
  "scarcity-urgency": {
    rel: "app/page.tsx",
    text: "Act now — only 3 left and the approval window ends tonight!",
  },
  "superlative-efficacy": {
    rel: "app/page.tsx",
    text: "The most effective, clinically proven treatment on the market.",
  },
  "unmarked-filler": {
    rel: "docs/x.md",
    text: "Lorem ipsum dolor sit amet. TODO: write real copy.",
  },
  "hardcoded-endpoint": {
    rel: "lib/purple/client.ts",
    text: 'const base = "https://api.example.com/v1";',
  },
};

test("RED-first: every rule fires on a planted violation", () => {
  for (const rule of RULES) {
    const planted = PLANTED[rule.id];
    assert.ok(planted, `no planted fixture for rule ${rule.id}`);
    const hits = scanContent(planted.text, planted.rel).filter((v) => v.ruleId === rule.id);
    assert.ok(hits.length > 0, `rule ${rule.id} failed to catch its planted violation`);
  }
});

test("RED-first: a planted violation in a real content file would be caught", () => {
  // Simulates a bad string slipping into a shipped page.
  const bad = "Our miracle drug melts away fat — guaranteed results, act now!";
  const hits = scanContent(bad, "app/condition/[condition]/page.tsx");
  assert.ok(hits.length >= 2, "expected multiple rules to fire on a stacked violation");
});

test("allow-marker exempts a genuine meta-discussion line", () => {
  const meta = 'Never write "most effective" on an Rx product. copyguard-allow';
  const hits = scanContent(meta, "docs/certification-readiness.md");
  assert.equal(hits.length, 0, "copyguard-allow should exempt this meta line");
});

test("allow-marker does NOT exempt hardcoded endpoints", () => {
  const sneaky = 'const b = "https://api.evil.com/v1"; // copyguard-allow';
  const hits = scanContent(sneaky, "lib/purple/client.ts").filter(
    (v) => v.ruleId === "hardcoded-endpoint",
  );
  assert.ok(hits.length > 0, "hardcoded-endpoint must not be exemptable by the marker");
});

test("GREEN: the real repository tree is clean", () => {
  const violations = scanRepo();
  assert.equal(
    violations.length,
    0,
    `expected a clean tree, found:\n${violations.map((v) => `  ${v.file}:${v.line} [${v.ruleId}] ${v.text}`).join("\n")}`,
  );
});
