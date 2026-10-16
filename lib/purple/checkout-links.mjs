/**
 * Checkout-handoff composer (WI-084) — builds the link that hands a shopper off
 * to the platform-hosted checkout on the member origin (WI-074, CHECKOUT-SKIN-01).
 * This is the translation boundary: the kit's own internal query key (`offering`)
 * becomes the hosted route's `offering_ref`; `journey_id` passes through unchanged
 * (already `jny_`-shaped by the mock and by the live edge contract alike).
 *
 * `skuId`/`therapy` carry the direct-buy entry variant (WI-038
 * `clinical_after_pay`, a checkout-first brand): the hosted route refuses a
 * checkout-first link that lacks them ("This buy link is incomplete (missing its
 * product context)"). Their source is the offering's checkout-first link in the
 * brand's welcome kit — arriving on the kit's own `/checkout` as `sku_id` /
 * `therapy` search params, or configured as defaults beside the default offering
 * ref. `resolveCheckoutHandoffContext` below decides which source applies and
 * never pairs one offering's `sku_id`/`therapy` with another offering's ref.
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

/**
 * Resolve the handoff context for the kit's `/checkout` page from its RAW search
 * params (the page passes them straight through, so every forwarded key is
 * decided here, under test) plus the configured defaults (`lib/config.ts`).
 *
 * - `offeringRef`: the `offering` param, else the configured default offering.
 * - `skuId`/`therapy` from the link: if the link carries EITHER, the link is
 *   the sole source for both — whatever it carries is passed through and a
 *   missing one is NOT filled in from config (that could pair a different
 *   offering's product context). The hosted checkout then refuses honestly.
 * - `skuId`/`therapy` from config: only when the link carries neither AND the
 *   resolved offering IS the configured default offering, so the configured
 *   product context always belongs to the offering it rides with.
 *
 * @param {{offering?: string, journey_id?: string, sku_id?: string, therapy?: string}} search
 * @param {{offeringRef?: string, skuId?: string, therapy?: string}} [defaults]
 * @returns {{offeringRef: string, journeyId?: string, skuId?: string, therapy?: string} | undefined}
 *   `undefined` when no offering ref is resolvable at all.
 */
export function resolveCheckoutHandoffContext(search, defaults = {}) {
  const offeringRef = search.offering ?? defaults.offeringRef;
  if (!offeringRef) return undefined;
  const linkCarriesProduct = Boolean(search.sku_id || search.therapy);
  const useDefaults =
    !linkCarriesProduct && Boolean(defaults.offeringRef) && offeringRef === defaults.offeringRef;
  const skuId = linkCarriesProduct ? search.sku_id : useDefaults ? defaults.skuId : undefined;
  const therapy = linkCarriesProduct ? search.therapy : useDefaults ? defaults.therapy : undefined;
  return {
    offeringRef,
    ...(search.journey_id ? { journeyId: search.journey_id } : {}),
    ...(skuId ? { skuId } : {}),
    ...(therapy ? { therapy } : {}),
  };
}
