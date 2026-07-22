import { BuyControls, BuyControlsView } from "@/components/growth/BuyControls";
import { GrowthShell } from "@/components/growth/StoreChrome";
import { SupplyTermSelector } from "@/components/growth/SupplyTermSelector";
import { PlaceholderNote, SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { findOffering, findPanel, offeringsForAudience } from "@/lib/catalog";
import type { Audience, Offering } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Condition units are prerendered per audience×offering (SSG); the ?mode= toggle is
// applied client-side over the prerendered default so the page stays static.
export const dynamicParams = false;

function resolve(audienceSlug: string, offeringSlug: string) {
  const brand = getActiveBrand();
  const audience = brand.growth?.audiences.find((a) => a.slug === audienceSlug);
  if (!audience || !brand.growth) return null;
  const offering = findOffering(brand.growth.catalog, audience.id, offeringSlug);
  return offering ? { brand, audience, offering } : null;
}

export function generateStaticParams() {
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) return [];
  const params: { audience: string; offering: string }[] = [];
  for (const a of growth.audiences) {
    for (const o of offeringsForAudience(growth.catalog, a.id)) {
      params.push({ audience: a.slug, offering: o.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string; offering: string }>;
}): Promise<Metadata> {
  const { audience, offering } = await params;
  const r = resolve(audience, offering);
  if (!r) return {};
  return pageMetadata({
    title: `${r.offering.name} — ${r.audience.label}`,
    description: `${r.offering.summary} ${r.offering.roleLabel}, shown in the ${r.audience.label} lens. Placeholder scaffolding; replace before launch.`,
  });
}

export default async function OfferingPdp({
  params,
}: {
  params: Promise<{ audience: string; offering: string }>;
}) {
  const { audience: audienceSlug, offering: offeringSlug } = await params;
  const r = resolve(audienceSlug, offeringSlug);
  if (!r) notFound();
  const { brand, audience, offering } = r as {
    brand: typeof r.brand;
    audience: Audience;
    offering: Offering;
  };
  const growth = brand.growth;
  if (!growth) notFound();

  const adjacentPanels = (offering.labsAdjacent ?? [])
    .map((slug) => findPanel(growth.catalog, slug))
    .filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <GrowthShell brand={brand} audience={audience}>
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="eyebrow">
            {audience.label} · {offering.category}
          </div>
          <h1 style={{ fontSize: 34, margin: "8px 0 12px" }}>{offering.name}</h1>
          <p className="muted" style={{ fontSize: 18 }}>
            {offering.whatItIs}
          </p>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Placeholder molecule: {offering.placeholderMolecule}
          </p>
          <PlaceholderNote>
            program copy + pricing are slots — never ship unreviewed
          </PlaceholderNote>

          {/* Supply-term ladder: the merchandising surface, default-expanded */}
          <div style={{ marginTop: 20 }}>
            <SupplyTermSelector terms={offering.supplyTerms} />
          </div>

          {/* Entry-mode toggle + (buy-first) honesty block. Suspense keeps the page SSG. */}
          <div style={{ marginTop: 20 }}>
            <Suspense
              fallback={
                <BuyControlsView
                  mode={growth.funnelMode}
                  offeringSlug={offering.slug}
                  ctaPrimary={brand.copy.cta_primary}
                  ctaSecondary={brand.copy.cta_secondary}
                />
              }
            >
              <BuyControls
                offeringSlug={offering.slug}
                ctaPrimary={brand.copy.cta_primary}
                ctaSecondary={brand.copy.cta_secondary}
                defaultMode={growth.funnelMode}
              />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="section" aria-label="How it works">
        <div className="container">
          <SectionHeading eyebrow="How it works" title="Three steps" />
          <ol className="grid grid--3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {offering.howItWorks.map((s, i) => (
              <li key={s.title} className="card">
                <div className="eyebrow">Step {i + 1}</div>
                <strong>{s.title}</strong>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {adjacentPanels.length ? (
        <section className="section" aria-label="Related labs">
          <div className="container">
            <SectionHeading eyebrow="Qualify with a lab" title="Related diagnostics" />
            <PlaceholderNote>
              a screening panel can be sold as the funnel's front door (qualification-as-product)
            </PlaceholderNote>
            <div className="grid grid--2" style={{ marginTop: 12 }}>
              {adjacentPanels.map((p) => (
                <a key={p.slug} className="card" href={`/labs/${p.slug}`}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {p.why}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-label="FAQ">
        <div className="container">
          <SectionHeading eyebrow="Questions" title="Frequently asked" />
          {offering.faq.map((f) => (
            <details key={f.q} className="card" style={{ marginBottom: 10 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>{f.q}</summary>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </GrowthShell>
  );
}
