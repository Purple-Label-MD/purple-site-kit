import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULTS, validateMeta } from "./meta-check.mjs";

/**
 * RED-first proof for the per-page-meta law (WI-042 · Scope 7). Each planted failure
 * mode from the addendum §4① must be caught; a clean set must pass.
 */

const ok = (path, n) => ({
  path,
  title: `Unique title ${n}`,
  description: `Unique description ${n}`,
  ogTitle: `Unique title ${n}`,
  ogDescription: `Unique description ${n}`,
});

test("RED: the §4① failure — every page serves identical (default) meta", () => {
  const pages = ["/a", "/b", "/c"].map((path) => ({
    path,
    title: DEFAULTS.title,
    description: DEFAULTS.description,
    ogTitle: DEFAULTS.title,
    ogDescription: DEFAULTS.description,
  }));
  const rules = new Set(validateMeta(pages).map((v) => v.rule));
  assert.ok(rules.has("default-title"), "default title not caught");
  assert.ok(rules.has("default-description"), "default description not caught");
  assert.ok(rules.has("duplicate-title"), "duplicate title not caught");
});

test("RED: a metaless page is caught", () => {
  const rules = new Set(validateMeta([{ path: "/x" }]).map((v) => v.rule));
  assert.ok(rules.has("missing-title"));
  assert.ok(rules.has("missing-description"));
  assert.ok(rules.has("missing-og-title"));
});

test("RED: two pages sharing a title/description is caught", () => {
  const dupe = { ...ok("/dup", 1), path: "/dup2" };
  const rules = new Set(validateMeta([ok("/a", 1), dupe]).map((v) => v.rule));
  assert.ok(rules.has("duplicate-title"));
  assert.ok(rules.has("duplicate-description"));
});

test("GREEN: a set of unique, non-default, OG-complete pages passes", () => {
  const pages = [ok("/a", 1), ok("/b", 2), ok("/c", 3)];
  assert.deepEqual(validateMeta(pages), []);
});
