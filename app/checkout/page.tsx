import { Shell } from "@/components/Shell";
import { CounselBanner } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Checkout (stub)",
  description:
    "The checkout stub — a placeholder funnel terminus that takes no payment and shows no pricing. It wakes when the commerce lane ships.",
});

/**
 * CHECKOUT — STUB (Scope 2). Deliberately not implemented: the commerce family has
 * not landed. This page exists so the funnel terminates somewhere honest and the
 * walkthrough can reach it. It wakes when the commerce endpoints are published;
 * nothing here blocks on it. Collects NO payment details and shows NO real pricing.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ journey_id?: string; offering?: string; next?: string }>;
}) {
  const { journey_id, offering, next } = await searchParams;
  const brand = getActiveBrand();
  // Buy-first (WI-042 §4): the stub is the terminus of the buy step; from here the
  // patient continues to the clinician-guided intake. Only same-origin paths honored.
  const intakeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return (
    <Shell brand={brand} stripped>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Checkout</div>
          <h1>Checkout — stub</h1>
          <div className="counsel-banner" role="alert">
            🧱 CHECKOUT STUB — not wired. The commerce family has not shipped. This is a placeholder
            terminus for the funnel; it takes no payment and shows no pricing. It will be replaced
            when the commerce endpoints are published.
          </div>
          <p className="muted">
            {journey_id ? (
              <>
                Enrollment <code>{journey_id}</code> reached checkout.
              </>
            ) : offering ? (
              <>
                Buy-first path for <code>{offering}</code> reached the checkout stub. No payment is
                taken; a licensed clinician reviews every order and unqualified orders are refunded
                in full.
              </>
            ) : (
              "No enrollment id was supplied."
            )}
          </p>
          <CounselBanner topic="pricing presentation + purchase terms (when commerce lands)" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {intakeNext ? (
              <a className="btn" href={intakeNext}>
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
