/**
 * Checkout-handoff composer (WI-084) — builds the link that hands a shopper off
 * to the platform-hosted checkout on the member origin (WI-074, CHECKOUT-SKIN-01).
 * This is the translation boundary: the kit's own internal query key (`offering`)
 * becomes the hosted route's `offering_ref`; `journey_id` passes through unchanged
 * (already `jny_`-shaped by the mock and by the live edge contract alike).
 *
 * `skuId`/`therapy` are accepted because the hosted route's direct-buy entry
 * variant (WI-038 `clinical_after_pay`) reads them, but the kit has no public
 * source for either today (the merchandising read that would supply them is
 * `x-audience: internal`) — callers simply omit them. That is the honest,
 * buildable behavior: the hosted door renders its own honest lock state rather
 * than the kit fabricating values it was never given.
 *
 * Pure and side-effect free — CI-testable directly via `node --test`, no server
 * needed (mirrors lib/catalog/projection.mjs / lib/intake/logic.mjs).
 */

/**
 * Build the query string for the hosted checkout's entry contract
 * (`offering_ref` / `journey_id` / `sku_id` / `therapy` — read directly off the
 * as-merged `apps/member-portal/app/checkout/page.tsx` route, never invented).
 * @param {{offeringRef: string, journeyId?: string, skuId?: string, therapy?: string}} ctx
 * @returns {string}
 */
export function composeCheckoutQuery(ctx) {
  const params = new URLSearchParams();
  params.set("offering_ref", ctx.offeringRef);
  if (ctx.journeyId) params.set("journey_id", ctx.journeyId);
  if (ctx.skuId) params.set("sku_id", ctx.skuId);
  if (ctx.therapy) params.set("therapy", ctx.therapy);
  return params.toString();
}

/**
 * A ready-to-use href into the platform-hosted checkout at `base` (an origin, no path).
 * @param {string} base
 * @param {{offeringRef: string, journeyId?: string, skuId?: string, therapy?: string}} ctx
 * @returns {string}
 */
export function composeCheckoutHandoff(base, ctx) {
  return `${base}/checkout?${composeCheckoutQuery(ctx)}`;
}
