import { IntakeRenderer } from "@/components/intake/IntakeRenderer";
import { getActiveBrand } from "@/lib/brand";
import { entryPhaseFor } from "@/lib/purple/resolve-request.mjs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Start your intake",
  description:
    "The headless intake renderer host — a server-authoritative resolve→next loop, one question per screen. Nav is stripped: a single-mouth surface.",
});

/**
 * Intake host page. Forwards the incoming entry-context query verbatim to the
 * renderer, which starts the server-authoritative resolve→next loop. Nav is
 * stripped here — an intake screen is a single-mouth surface.
 */
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const brand = getActiveBrand();
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") usp.set(k, v);
  }
  // Pay-first brands (welcome-pack checkout mode) serve the qualification layer first and
  // hand off to the hosted checkout; the clinical layer is served after payment.
  const phase = entryPhaseFor(brand.checkoutMode, usp.get("phase"));
  if (phase) usp.set("phase", phase);
  const qs = usp.toString();
  const initialQuery = qs ? `?${qs}` : "";

  // The intake is a single-mouth surface with its OWN chrome (progress bar + Back +
  // escape hatch, per INTAKE-SKIN-01) — it renders on the skin canvas, not the site
  // Shell. One question at a time, in the server's order; this template renders, it
  // does not decide.
  return (
    <div className="pl-app">
      <IntakeRenderer
        initialQuery={initialQuery}
        completeHeadline={brand.copy.intake_complete_headline}
      />
    </div>
  );
}
