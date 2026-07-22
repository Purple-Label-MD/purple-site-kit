import { Shell } from "@/components/Shell";
import { CounselBanner } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";

/**
 * CHECKOUT — STUB (Scope 2). Deliberately not implemented: the commerce family has
 * not landed. This page exists so the funnel terminates somewhere honest and the
 * walkthrough can reach it. It wakes when the commerce endpoints are published;
 * nothing here blocks on it. Collects NO payment details and shows NO real pricing.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ journey_id?: string }>;
}) {
  const { journey_id } = await searchParams;
  const brand = getActiveBrand();
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
            ) : (
              "No enrollment id was supplied."
            )}
          </p>
          <CounselBanner topic="pricing presentation + purchase terms (when commerce lands)" />
          <a className="btn btn--secondary" href="/">
            Back to home
          </a>
        </div>
      </section>
    </Shell>
  );
}
