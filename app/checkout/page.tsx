import { Shell } from "@/components/Shell";
import { CounselBanner } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { defaultOfferingRef, defaultSkuId, defaultTherapy, memberPortalBase } from "@/lib/config";
import {
  composeCheckoutHandoff,
  composeCheckoutQuery,
  resolveCheckoutHandoffContext,
} from "@/lib/purple/checkout-links.mjs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Checkout",
  description:
    "Hands off to the platform-hosted checkout — this template never collects payment details or shows real pricing itself.",
});

/**
 * CHECKOUT — the WI-084 wake. This is a HANDOFF, not a payments build: the kit
 * composes a link carrying offering + entry context to the platform-hosted
 * checkout (WI-074, CHECKOUT-SKIN-01) and never renders a payment field of its
 * own. Both WI-038 entry variants ride, per the as-merged hosted contract
 * (`offering_ref` required; `journey_id` for the post-intake/PRIMARY variant;
 * `sku_id`/`therapy` for the direct-buy variant). A checkout-first
 * (`clinical_after_pay`) handoff must carry `offering_ref` + `sku_id` + `therapy`,
 * copied from the offering's checkout-first link in the welcome kit — arriving
 * here as `?offering=…&sku_id=…&therapy=…`, or configured beside the default
 * offering (`NEXT_PUBLIC_PURPLE_SKU_ID` / `NEXT_PUBLIC_PURPLE_THERAPY`). Without
 * both, the hosted checkout refuses the link as incomplete; the kit never
 * invents them nor pairs them with a different offering
 * (`resolveCheckoutHandoffContext`). A questions-first brand's hosted door
 * instead renders its own "start with your health questions" lock.
 * Mock mode composes the identical shape against an in-kit simulation instead
 * (`/checkout/mock`) so the credential-free walkthrough stays end-to-end.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    journey_id?: string;
    offering?: string;
    sku_id?: string;
    therapy?: string;
    next?: string;
  }>;
}) {
  const search = await searchParams;
  const { journey_id, next } = search;
  const brand = getActiveBrand();
  const handoffCtx = resolveCheckoutHandoffContext(search, {
    offeringRef: defaultOfferingRef(),
    skuId: defaultSkuId(),
    therapy: defaultTherapy(),
  });
  // Same-origin-only guard, unchanged from the prior stub.
  const intakeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const base = memberPortalBase();

  if (!handoffCtx) {
    return (
      <Shell brand={brand} stripped>
        <section className="section">
          <div className="container" style={{ maxWidth: 640 }}>
            <div className="eyebrow">Checkout</div>
            <h1>This checkout link isn&rsquo;t complete</h1>
            <p className="muted">
              No offering reference was supplied and none is configured as a default. Nothing was
              charged and nothing was created — start again from an entry link.
            </p>
            <a className="btn btn--secondary" href="/">
              Back to home
            </a>
          </div>
        </section>
      </Shell>
    );
  }

  const { offeringRef } = handoffCtx;
  const handoffHref = base
    ? composeCheckoutHandoff(base, handoffCtx)
    : `/checkout/mock?${composeCheckoutQuery(handoffCtx)}${
        intakeNext ? `&next=${encodeURIComponent(intakeNext)}` : ""
      }`;

  return (
    <Shell brand={brand} stripped>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Checkout</div>
          <h1>Continue to secure checkout</h1>
          {!base ? (
            <div className="counsel-banner" role="alert">
              🧪 MOCK HANDOFF — no member-portal base is configured (
              <code>PURPLE_MEMBER_PORTAL_BASE</code>), so this continues to an in-kit simulation of
              the hosted checkout, not a real payment surface.
            </div>
          ) : null}
          <p className="muted">
            {journey_id ? (
              <>
                Enrollment <code>{journey_id}</code> for <code>{offeringRef}</code> is ready for
                payment. You&rsquo;ll continue to the platform-hosted checkout — this template never
                collects payment details itself.
              </>
            ) : (
              <>
                Buy-first path for <code>{offeringRef}</code>. No health questions were collected
                yet, so the hosted checkout may ask you to complete them first before payment — that
                response comes from the hosted door itself, honestly, not a guess made here.
              </>
            )}
          </p>
          <CounselBanner topic="pricing presentation + purchase terms (rendered by the hosted checkout)" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="btn" href={handoffHref}>
              Continue to checkout →
            </a>
            {intakeNext ? (
              <a className="btn btn--secondary" href={intakeNext}>
                Continue to clinician-guided intake →
              </a>
            ) : null}
            <a className="btn btn--secondary" href="/">
              Back to home
            </a>
          </div>
        </div>
      </section>
    </Shell>
  );
}
