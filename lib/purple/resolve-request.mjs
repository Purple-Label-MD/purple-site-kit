/**
 * Pure composer for the live `GET /instrument/resolve` request (no server needed —
 * CI-testable via `node --test`, mirroring lib/purple/checkout-links.mjs).
 *
 * Two live-gateway facts this encodes, both verified against the dev gateway:
 *   1. An enrollment RESUMES only from the `X-Journey-Id` request header. A `journey_id`
 *      query parameter is ignored and the gateway silently mints a brand-new journey —
 *      so the id must never ride the query string.
 *   2. `phase=qualification|clinical` selects which layer of the instrument to serve.
 *      A pay-first brand (welcome-pack checkout mode `clinical_after_pay`) serves the
 *      qualification layer first, hands off to the hosted checkout, and the clinical
 *      layer runs after payment.
 */

/**
 * Split resolve params into the query string and the extra request headers.
 * @param {Record<string, string | undefined>} params
 * @returns {{ query: string, headers: Record<string, string> }}
 */
export function composeResolveRequest(params) {
  const { journey_id, ...rest } = params;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) if (v != null && v !== "") qs.set(k, v);
  const headers = journey_id ? { "X-Journey-Id": journey_id } : {};
  return { query: qs.toString(), headers };
}

/**
 * The `phase` the intake host should request for a brand's checkout mode, unless the
 * entry link already names one (a campaign may override; `clinical` resumes after pay).
 * @param {"pay-first" | "questionnaire-first" | undefined} checkoutMode
 * @param {string | null | undefined} current
 * @returns {string | undefined}
 */
export function entryPhaseFor(checkoutMode, current) {
  if (current) return current;
  return checkoutMode === "pay-first" ? "qualification" : undefined;
}
