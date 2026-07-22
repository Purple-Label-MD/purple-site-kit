/**
 * Entry-link composer — the Purple-native replacement for legacy promo-code-tokens.
 *
 * An entry link carries campaign context to the intake mouth as URL parameters:
 * offering preselect + prefill + promo passthrough + redirect + test flag + an
 * `entry_<key>` attribution namespace. Every one of these is UNTRUSTED input the
 * server re-validates and cannot use to alter the question set — see the edge
 * contract's `/instrument/resolve` Δ1 notes. This helper only *composes* links;
 * it never assumes any of them takes effect.
 */

import { defaultOfferingRef } from "@/lib/config";

export interface EntryContext {
  /** Stable catalog offering ref (never a free-text product name). */
  offering?: string;
  /** Stage a contact-email prefill (lands unverified; always confirmed in-flow). */
  prefillEmail?: string;
  /** Stage a contact-phone prefill (same contract as email). */
  prefillPhone?: string;
  /** Opaque promo token, passed through unchanged to the completion hand-off. */
  promo?: string;
  /** Post-completion return URL; honored only if brand-allowlisted (fail closed). */
  redirect?: string;
  /** Per-client test-mode flag. */
  test?: boolean;
  /** Campaign/source attribution tags → funnel-event attributes only (≤10 pairs). */
  entry?: Record<string, string>;
}

const MAX_ENTRY_TAGS = 10;

/**
 * Build the query string for an entry link into the intake renderer route.
 * Defaults `offering` to the configured offering ref when not overridden.
 */
export function composeEntryQuery(ctx: EntryContext = {}): string {
  const params = new URLSearchParams();
  const offering = ctx.offering ?? defaultOfferingRef();
  if (offering) params.set("offering", offering);
  if (ctx.prefillEmail) params.set("prefill_email", ctx.prefillEmail);
  if (ctx.prefillPhone) params.set("prefill_phone", ctx.prefillPhone);
  if (ctx.promo) params.set("promo", ctx.promo);
  if (ctx.redirect) params.set("redirect", ctx.redirect);
  if (ctx.test !== undefined) params.set("test", ctx.test ? "true" : "false");
  if (ctx.entry) {
    for (const [key, value] of Object.entries(ctx.entry).slice(0, MAX_ENTRY_TAGS)) {
      params.set(`entry_${key}`, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** A ready-to-use href into the local intake renderer host page. */
export function entryLink(ctx: EntryContext = {}): string {
  return `/start${composeEntryQuery(ctx)}`;
}

/**
 * Extract only the entry-context params from a URL's search params, to forward to
 * `/instrument/resolve`. Unknown params are dropped; the server fails closed on
 * anything it does not recognise, so this is a convenience filter, not a gate.
 */
export function extractEntryParams(search: URLSearchParams): Record<string, string> {
  const passthrough = ["offering", "prefill_email", "prefill_phone", "promo", "redirect", "test"];
  const out: Record<string, string> = {};
  for (const key of passthrough) {
    const v = search.get(key);
    if (v) out[key] = v;
  }
  let tags = 0;
  for (const [key, value] of search.entries()) {
    if (key.startsWith("entry_") && tags < MAX_ENTRY_TAGS) {
      out[key] = value;
      tags += 1;
    }
  }
  return out;
}
