import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isExclusive,
  labPanelsForAudience,
  offeringsForAudience,
  panelsByKind,
} from "../lib/catalog/projection.mjs";

/**
 * The acceptance criterion in miniature (WI-042 · Scope 2 anti-clone law):
 * a SHARED line renders in both lenses; an EXCLUSIVE line in exactly one. This
 * proves the PROJECTION logic on a trivial fixture; the real demo catalog is
 * proven end-to-end by the build (generateStaticParams) + link-check crawl.
 */
const AUD_A = "aud_a";
const AUD_B = "aud_b";

const fixture = {
  offerings: [
    { slug: "shared", name: "Shared", category: "C", audiences: [AUD_A, AUD_B] },
    { slug: "a-only", name: "A only", category: "C", audiences: [AUD_A] },
    { slug: "b-only", name: "B only", category: "C", audiences: [AUD_B] },
  ],
  labPanels: [
    { slug: "pkg-a", audiences: [AUD_A], tier: "basic", kind: "package" },
    { slug: "ind-shared", audiences: [AUD_A, AUD_B], tier: "basic", kind: "individual" },
  ],
};

test("shared offering renders in BOTH audience lenses", () => {
  const a = offeringsForAudience(fixture, AUD_A).map((o) => o.slug);
  const b = offeringsForAudience(fixture, AUD_B).map((o) => o.slug);
  assert.ok(a.includes("shared"), "shared missing from lens A");
  assert.ok(b.includes("shared"), "shared missing from lens B");
});

test("exclusive offering renders in EXACTLY ONE lens", () => {
  const a = offeringsForAudience(fixture, AUD_A).map((o) => o.slug);
  const b = offeringsForAudience(fixture, AUD_B).map((o) => o.slug);
  assert.ok(a.includes("a-only") && !b.includes("a-only"), "a-only leaked into lens B");
  assert.ok(b.includes("b-only") && !a.includes("b-only"), "b-only leaked into lens A");
});

test("isExclusive distinguishes shared from exclusive", () => {
  assert.equal(isExclusive(fixture.offerings[0]), false);
  assert.equal(isExclusive(fixture.offerings[1]), true);
});

test("lab panels project by audience and split by kind", () => {
  assert.deepEqual(
    labPanelsForAudience(fixture, AUD_B).map((p) => p.slug),
    ["ind-shared"],
    "lens B should see only the shared individual panel",
  );
  assert.deepEqual(
    panelsByKind(fixture, AUD_A, "package").map((p) => p.slug),
    ["pkg-a"],
  );
  assert.deepEqual(
    panelsByKind(fixture, AUD_A, "individual").map((p) => p.slug),
    ["ind-shared"],
  );
});
