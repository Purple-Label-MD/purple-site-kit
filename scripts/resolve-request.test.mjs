import assert from "node:assert/strict";
import { test } from "node:test";
import { composeResolveRequest, entryPhaseFor } from "../lib/purple/resolve-request.mjs";

test("journey_id rides the X-Journey-Id header, never the query string (live resume contract)", () => {
  const r = composeResolveRequest({ offering: "SYN-TRZ-3M", test: "true", journey_id: "jny_abc" });
  assert.equal(r.headers["X-Journey-Id"], "jny_abc");
  assert.ok(!r.query.includes("journey_id"), `query must not carry journey_id: ${r.query}`);
  assert.equal(new URLSearchParams(r.query).get("offering"), "SYN-TRZ-3M");
});

test("no journey ⇒ no resume header; empty/undefined params are dropped", () => {
  const r = composeResolveRequest({ offering: "SYN-TRZ-3M", promo: undefined, redirect: "" });
  assert.deepEqual(r.headers, {});
  assert.equal(r.query, "offering=SYN-TRZ-3M");
});

test("phase passes through to the query", () => {
  const r = composeResolveRequest({ offering: "X", phase: "qualification" });
  assert.equal(new URLSearchParams(r.query).get("phase"), "qualification");
});

test("pay-first brands request the qualification layer unless the link names a phase", () => {
  assert.equal(entryPhaseFor("pay-first", undefined), "qualification");
  assert.equal(entryPhaseFor("pay-first", "clinical"), "clinical");
  assert.equal(entryPhaseFor("questionnaire-first", undefined), undefined);
  assert.equal(entryPhaseFor(undefined, null), undefined);
});
