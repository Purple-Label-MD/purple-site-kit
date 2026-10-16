export interface CheckoutHandoffContext {
  /** Stable catalog offering ref (never a free-text product name). */
  offeringRef: string;
  /** Post-intake variant (PRIMARY): the completed instrument session's journey id. */
  journeyId?: string;
  /** Direct-buy variant: checkout-first (`clinical_after_pay`) brands require it, with `therapy`, from the welcome kit. */
  skuId?: string;
  /** Direct-buy variant: checkout-first (`clinical_after_pay`) brands require it, with `skuId`, from the welcome kit. */
  therapy?: string;
}

export function composeCheckoutQuery(ctx: CheckoutHandoffContext): string;
export function composeCheckoutHandoff(base: string, ctx: CheckoutHandoffContext): string;

/** The kit's own `/checkout` search params, raw (snake_case as on the URL). */
export interface CheckoutPageParams {
  offering?: string;
  journey_id?: string;
  sku_id?: string;
  therapy?: string;
}

export interface CheckoutDefaults {
  offeringRef?: string;
  skuId?: string;
  therapy?: string;
}

export function resolveCheckoutHandoffContext(
  search: CheckoutPageParams,
  defaults?: CheckoutDefaults,
): CheckoutHandoffContext | undefined;
