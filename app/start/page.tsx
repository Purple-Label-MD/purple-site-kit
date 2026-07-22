import { Shell } from "@/components/Shell";
import { IntakeRenderer } from "@/components/intake/IntakeRenderer";
import { getActiveBrand } from "@/lib/brand";

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
  const brand = getActiveBrand();

  return (
    <Shell brand={brand} stripped>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Intake</div>
          <h1 style={{ marginTop: 4 }}>Let&rsquo;s get started</h1>
          <p className="muted">
            This questionnaire is served by the Purple intake API. One question at a time, in the
            server&rsquo;s order — this template renders, it does not decide.
          </p>
          <IntakeRenderer initialQuery={initialQuery} />
        </div>
      </section>
    </Shell>
  );
}
