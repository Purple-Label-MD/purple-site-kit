import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  composeCheckoutHandoff,
  composeCheckoutQuery,
  resolveCheckoutHandoffContext,
} from "../lib/purple/checkout-links.mjs";

/**
 * Proves the WI-084 handoff composer against the as-merged hosted-checkout entry
 * contract (`apps/member-portal/app/checkout/page.tsx`): `offering_ref` always
 * present, `journey_id` for the post-intake/PRIMARY variant, and `sku_id` +
 * `therapy` for the checkout-first (`clinical_after_pay`) variant, forwarded from
 * the `/checkout` link or the default offering's config — never invented, never
 * paired with a different offering's ref.
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

// ── /checkout forwarding: sku_id/therapy reach the handoff (checkout-first) ──

const DEFAULTS = {
  offeringRef: "offering_launch_starter",
  skuId: "sku_default",
  therapy: "weight",
};

/** The handoff URL the kit's /checkout page would emit for these search params. */
function handoffFor(search, defaults = {}) {
  const ctx = resolveCheckoutHandoffContext(search, defaults);
  assert.ok(ctx, "an offering ref must resolve for this fixture");
  return new URL(composeCheckoutHandoff("https://member.dev.purplelabelmd.com", ctx));
}

test("checkout-first link: offering_ref + sku_id + therapy from the link all reach the handoff", () => {
  const url = handoffFor({ offering: "offering_cfp", sku_id: "sku_cfp_1", therapy: "skin" });
  assert.equal(url.pathname, "/checkout");
  assert.equal(url.searchParams.get("offering_ref"), "offering_cfp");
  assert.equal(url.searchParams.get("sku_id"), "sku_cfp_1");
  assert.equal(url.searchParams.get("therapy"), "skin");
  assert.equal(url.searchParams.has("journey_id"), false);
});

test("checkout-first via config: default offering carries its configured sku_id + therapy", () => {
  const url = handoffFor({}, DEFAULTS);
  assert.equal(url.searchParams.get("offering_ref"), "offering_launch_starter");
  assert.equal(url.searchParams.get("sku_id"), "sku_default");
  assert.equal(url.searchParams.get("therapy"), "weight");
});

test("a missing sku_id is not invented: link carrying therapy alone passes therapy only", () => {
  const url = handoffFor({ offering: "offering_launch_starter", therapy: "skin" }, DEFAULTS);
  assert.equal(url.searchParams.get("therapy"), "skin");
  assert.equal(url.searchParams.has("sku_id"), false);
});

test("a missing therapy is not invented: link carrying sku_id alone passes sku_id only", () => {
  const url = handoffFor({ sku_id: "sku_cfp_1" }, DEFAULTS);
  assert.equal(url.searchParams.get("sku_id"), "sku_cfp_1");
  assert.equal(url.searchParams.has("therapy"), false);
});

test("configured sku_id/therapy never ride with a different offering's ref", () => {
  const url = handoffFor({ offering: "offering_other" }, DEFAULTS);
  assert.equal(url.searchParams.get("offering_ref"), "offering_other");
  assert.equal(url.searchParams.has("sku_id"), false);
  assert.equal(url.searchParams.has("therapy"), false);
});

test("no sku_id/therapy anywhere: offering_ref alone, nothing invented", () => {
  const url = handoffFor({ offering: "offering_launch_starter" }, { offeringRef: "x" });
  assert.equal(url.searchParams.get("offering_ref"), "offering_launch_starter");
  assert.equal(url.searchParams.has("sku_id"), false);
  assert.equal(url.searchParams.has("therapy"), false);
});

test("post-intake: journey_id still rides alongside the product context", () => {
  const url = handoffFor({ journey_id: "jny_abc123" }, DEFAULTS);
  assert.equal(url.searchParams.get("journey_id"), "jny_abc123");
  assert.equal(url.searchParams.get("offering_ref"), "offering_launch_starter");
});

test("no offering resolvable (none on the link, none configured) yields undefined", () => {
  assert.equal(resolveCheckoutHandoffContext({ sku_id: "sku_x", therapy: "skin" }, {}), undefined);
});

test("app/checkout/page.tsx hands its raw search params + configured defaults to the resolver", () => {
  const src = readFileSync(new URL("../app/checkout/page.tsx", import.meta.url), "utf8");
  assert.match(src, /resolveCheckoutHandoffContext\(search,\s*\{/);
  assert.match(src, /skuId:\s*defaultSkuId\(\)/);
  assert.match(src, /therapy:\s*defaultTherapy\(\)/);
  assert.match(src, /composeCheckoutHandoff\(base,\s*handoffCtx\)/);
});
