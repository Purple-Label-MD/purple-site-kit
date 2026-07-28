import { Shell } from "@/components/Shell";
import { MockPayButton } from "@/components/checkout/MockPayButton";
import { getActiveBrand } from "@/lib/brand";
import { isMockMode } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = pageMetadata({
  title: "Checkout (mock)",
  description:
    "A credential-free simulation of the platform-hosted checkout, in the same shape as the real handoff.",
});

/**
 * A credential-free simulation of the platform-hosted checkout (WI-084 §3/§4) —
 * same params, same two entry variants, no real payment surface anywhere. Only
 * reachable in mock mode; a real member-portal base always wins in live mode
 * (see app/checkout/page.tsx).
 */
export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    offering_ref?: string;
    journey_id?: string;
    sku_id?: string;
    therapy?: string;
    next?: string;
  }>;
}) {
  if (!isMockMode()) redirect("/");
  const { offering_ref, journey_id, next } = await searchParams;
  const brand = getActiveBrand();
  const intakeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <Shell brand={brand} stripped>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Checkout</div>
          <h1>Mock hosted checkout</h1>
          <div className="counsel-banner" role="alert">
            🧪 SIMULATION — this page stands in for the platform-hosted checkout (CHECKOUT-SKIN-01)
            in credential-free mock mode. It takes no payment and shows no real pricing.
          </div>
          <p className="muted">
            Offering <code>{offering_ref}</code>
            {journey_id ? (
              <>
                {" "}
                · Enrollment <code>{journey_id}</code>
              </>
            ) : null}
          </p>
          {journey_id ? (
            <MockPayButton journeyId={journey_id} />
          ) : (
            <>
              <p className="muted">
                This deployment completes your health questions before payment, and this link
                carries no enrollment — start with your health questions and you&rsquo;ll come back
                here with everything attached. (This is the honest lock state the real hosted
                checkout renders for a buy-first entry with no `sku_id`/`therapy` — see the WI-084
                exit report for why the kit cannot supply those today.)
              </p>
              {intakeNext ? (
                <a className="btn" href={intakeNext}>
                  Continue to clinician-guided intake →
                </a>
              ) : null}
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <a className="btn btn--secondary" href="/">
              Back to home
            </a>
          </div>
        </div>
      </section>
    </Shell>
  );
}
