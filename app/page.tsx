import { Shell } from "@/components/Shell";
import { GrowthHome } from "@/components/growth/GrowthHome";
import {
  ClinicianBios,
  FaqBattery,
  SkuLadder,
  Testimonials,
  ThreeStepRitual,
  TrustTriad,
} from "@/components/patterns";
import { PlaceholderNote } from "@/components/ui";
import { VerticalModules } from "@/components/vertical";
import { getActiveBrand } from "@/lib/brand";
import { entryLink } from "@/lib/purple/entry-links";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const brand = getActiveBrand();
  const isGrowth = brand.archetype === "growth" && brand.growth;
  return pageMetadata({
    title: "Home",
    description: brand.contentReviewed
      ? brand.tagline
      : isGrowth
        ? `${brand.name} — a multi-audience storefront over one program catalog. Placeholder scaffolding; replace before launch.`
        : `${brand.name} — ${brand.condition.name}. Placeholder single-condition starter; replace before launch.`,
  });
}

/**
 * Home page. LAUNCH brands render the single-condition home (entry grammar toggle,
 * teardown §1.10). GROWTH brands render the multi-audience storefront landing
 * (WI-042) — an audience chooser over one catalog config.
 */
export default function HomePage() {
  const brand = getActiveBrand();
  if (brand.archetype === "growth" && brand.growth) {
    return <GrowthHome brand={brand} />;
  }
  const c = brand.condition;

  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">{brand.name}</div>
          <h1 style={{ fontSize: 40, margin: "8px 0 12px", maxWidth: 720 }}>{c.heroHeadline}</h1>
          <p className="muted" style={{ maxWidth: 620, fontSize: 18 }}>
            {c.heroSub}
          </p>
          {!brand.contentReviewed ? (
            <div style={{ marginTop: 8 }}>
              <PlaceholderNote>hero copy is scaffolding — replace before launch</PlaceholderNote>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <a className="btn" href={entryLink()}>
              {brand.copy.cta_primary}
            </a>
            <a className="btn btn--secondary" href={`/condition/${c.slug}`}>
              {brand.copy.cta_secondary}
            </a>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            {!brand.contentReviewed ? (
              <>
                Entry mode: <strong>{brand.entryMode}</strong> (set per brand).{" "}
              </>
            ) : null}
            Eligibility is decided during clinician review; you may not be suitable.
          </p>
        </div>
      </section>

      <TrustTriad brand={brand} />

      {brand.entryMode === "prelander" ? (
        // Pre-lander: thin router → condition/campaign, no long conversion body.
        <section className="section">
          <div className="container">
            <h2>Where to next</h2>
            <div className="grid grid--2" style={{ marginTop: 12 }}>
              <a className="card" href={`/condition/${c.slug}`}>
                <strong>Learn about the {c.name}</strong>
                <p className="muted">Evergreen condition page with education and options.</p>
              </a>
              <a className="card" href={`/condition/${c.slug}/launch-special`}>
                <strong>See the current campaign</strong>
                <p className="muted">A focused campaign lander (nav-stripped per brand).</p>
              </a>
            </div>
          </div>
        </section>
      ) : (
        // Long-scroll single-mouth: the whole conversion document, one intake mouth.
        <>
          <ThreeStepRitual brand={brand} />
          {brand.vertical ? <VerticalModules brand={brand} /> : null}
          <SkuLadder brand={brand} />
          <Testimonials brand={brand} />
          <ClinicianBios brand={brand} />
          <FaqBattery brand={brand} />
          <section className="section">
            <div className="container" style={{ textAlign: "center" }}>
              <h2>Ready when you are</h2>
              <a className="btn" href={entryLink()}>
                {brand.copy.cta_primary}
              </a>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
