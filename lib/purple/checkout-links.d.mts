export interface CheckoutHandoffContext {
  /** Stable catalog offering ref (never a free-text product name). */
  offeringRef: string;
  /** Post-intake variant (PRIMARY): the completed instrument session's journey id. */
  journeyId?: string;
  /** Direct-buy variant: only meaningful together with `therapy`; see module doc. */
  skuId?: string;
  /** Direct-buy variant: only meaningful together with `skuId`; see module doc. */
  therapy?: string;
}

export function composeCheckoutQuery(ctx: CheckoutHandoffContext): string;
export function composeCheckoutHandoff(base: string, ctx: CheckoutHandoffContext): string;
