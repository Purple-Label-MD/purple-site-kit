import assert from "node:assert/strict";
import { test } from "node:test";
import { composeCheckoutHandoff, composeCheckoutQuery } from "../lib/purple/checkout-links.mjs";

/**
 * Proves the WI-084 handoff composer against the as-merged hosted-checkout entry
 * contract (`apps/member-portal/app/checkout/page.tsx`): `offering_ref` always
 * present, `journey_id` for the post-intake/PRIMARY variant, and the honest
 * omission of `sku_id`/`therapy` (no public source in this kit — see the WI-084
 * exit report) rather than inventing values for the direct-buy variant.
 */

test("post-intake variant: offering_ref + journey_id, nothing invented", () => {
  const qs = composeCheckoutQuery({
    offeringRef: "offering_launch_starter",
    journeyId: "jny_abc123",
  });
  const params = new URLSearchParams(qs);
  assert.equal(params.get("offering_ref"), "offering_launch_starter");
  assert.equal(params.get("journey_id"), "jny_abc123");
  assert.equal(params.get("sku_id"), null);
  assert.equal(params.get("therapy"), null);
});

test("buy-first entry with no journey yet: offering_ref alone, no journey_id key emitted", () => {
  const qs = composeCheckoutQuery({ offeringRef: "offering_launch_starter" });
  const params = new URLSearchParams(qs);
  assert.equal(params.get("offering_ref"), "offering_launch_starter");
  assert.equal(params.has("journey_id"), false);
});

test("composeCheckoutHandoff builds a /checkout href off the given origin", () => {
  const href = composeCheckoutHandoff("https://member.dev.purplelabelmd.com", {
    offeringRef: "offering_launch_starter",
    journeyId: "jny_abc123",
  });
  assert.equal(
    href,
    "https://member.dev.purplelabelmd.com/checkout?offering_ref=offering_launch_starter&journey_id=jny_abc123",
  );
});

test("sku_id/therapy ride through when a caller does supply them (direct-buy shape)", () => {
  const qs = composeCheckoutQuery({
    offeringRef: "offering_launch_starter",
    skuId: "sku_demo",
    therapy: "weight",
  });
  const params = new URLSearchParams(qs);
  assert.equal(params.get("sku_id"), "sku_demo");
  assert.equal(params.get("therapy"), "weight");
  assert.equal(params.has("journey_id"), false);
});
