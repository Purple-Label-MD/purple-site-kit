"use client";

/**
 * Buy controls with the entry-mode TOGGLE (WI-042 · Scope 4 + addendum §2.2/§4.③).
 *
 *  - quiz-first : CTA goes intake-first (the LAUNCH grammar) → the intake renderer.
 *  - buy-first  : straight to buy, intake follows purchase. REQUIRED to pair the buy
 *                 control with the eligibility-HONESTY block ("a licensed clinician
 *                 reviews every order; not qualified = automatic full refund") — the
 *                 refund-on-decline law made a selling point. The buy path reaches the
 *                 checkout STUB, which then routes to the intake renderer.
 *
 * `BuyControlsView` is hook-free so it renders SERVER-SIDE into the prerendered HTML
 * (crawlers + link-check see the honesty block and the buy→checkout link). The PDP
 * uses it as the Suspense fallback at the brand-default mode; `BuyControls` then
 * applies a per-campaign `?mode=` override on the client. Page stays SSG.
 */

import type { FunnelMode } from "@/lib/brand/types";
import { entryLink } from "@/lib/purple/entry-links";
import { useSearchParams } from "next/navigation";

/** The eligibility-honesty block — mandatory beside every buy-first buy control. */
export function EligibilityHonesty() {
  return (
    <p className="eligibility-honesty" role="note">
      A licensed clinician reviews every order. If you are not a fit, your order is not dispensed
      and you are refunded in full, automatically — you are never charged for a medication a
      clinician does not approve.
    </p>
  );
}

/** Hook-free presentational controls — safe to prerender on the server. */
export function BuyControlsView({
  mode,
  offeringSlug,
  ctaPrimary,
  ctaSecondary,
}: {
  mode: FunnelMode;
  offeringSlug: string;
  ctaPrimary: string;
  ctaSecondary: string;
}) {
  const intakeHref = entryLink({ offering: offeringSlug });
  // buy-first routes to the checkout stub, carrying the offering + an intake redirect;
  // the stub then continues to the intake renderer (the graded chain).
  const buyHref = `/checkout?offering=${encodeURIComponent(offeringSlug)}&next=${encodeURIComponent(
    intakeHref,
  )}`;

  if (mode === "buy-first") {
    return (
      <div className="buy-controls" data-mode="buy-first">
        <EligibilityHonesty />
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <a className="btn" href={buyHref}>
            Buy now (placeholder)
          </a>
          <a className="btn btn--secondary" href={intakeHref}>
            {ctaSecondary}
          </a>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Entry mode: <strong>buy-first</strong>. No payment is taken — checkout is a stub until the
          commerce lane lands; you then continue to the clinician-guided intake.
        </p>
      </div>
    );
  }

  return (
    <div className="buy-controls" data-mode="quiz-first">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a className="btn" href={intakeHref}>
          {ctaPrimary}
        </a>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Entry mode: <strong>quiz-first</strong>. Eligibility is decided during clinician review; you
        may not be suitable.
      </p>
    </div>
  );
}

/** Client wrapper: applies a per-campaign `?mode=` override over the brand default. */
export function BuyControls({
  offeringSlug,
  ctaPrimary,
  ctaSecondary,
  defaultMode,
}: {
  offeringSlug: string;
  ctaPrimary: string;
  ctaSecondary: string;
  defaultMode: FunnelMode;
}) {
  const search = useSearchParams();
  const override = search.get("mode");
  const mode: FunnelMode =
    override === "buy-first" || override === "quiz-first" ? override : defaultMode;
  return (
    <BuyControlsView
      mode={mode}
      offeringSlug={offeringSlug}
      ctaPrimary={ctaPrimary}
      ctaSecondary={ctaSecondary}
    />
  );
}
