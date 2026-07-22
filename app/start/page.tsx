import { IntakeRenderer } from "@/components/intake/IntakeRenderer";
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
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") usp.set(k, v);
  }
  const qs = usp.toString();
  const initialQuery = qs ? `?${qs}` : "";

  // The intake is a single-mouth surface with its OWN chrome (progress bar + Back +
  // escape hatch, per INTAKE-SKIN-01) — it renders on the skin canvas, not the site
  // Shell. One question at a time, in the server's order; this template renders, it
  // does not decide.
  return (
    <div className="pl-app">
      <IntakeRenderer initialQuery={initialQuery} />
    </div>
  );
}
