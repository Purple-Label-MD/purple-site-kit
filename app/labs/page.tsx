import { LabGate } from "@/components/growth/LabGate";
import { GrowthGenericShell } from "@/components/growth/StoreChrome";
import { PlaceholderNote, SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import type { LabTier } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const TIER_ORDER: LabTier[] = ["basic", "intermediate", "advanced"];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Advanced lab diagnostics",
    description:
      "Lab panels sold as a product line — gendered ladders, individual and package options, and therapy-adjacent screening panels. Marketing-complete; fulfillment wakes with the labs lane.",
  });
}

export default function LabsOverview() {
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) notFound();
  const panels = growth.catalog.labPanels;

  return (
    <GrowthGenericShell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Labs</div>
          <h1 style={{ fontSize: 38, margin: "8px 0 12px" }}>Advanced lab diagnostics</h1>
          <p className="muted" style={{ maxWidth: 640, fontSize: 18 }}>
            Panels are their own product line — a paid front door to care (and a retention loop).
            Placeholder scaffolding; no real markers, prices, or clinical claims.
          </p>
          <LabGate />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a className="btn btn--secondary" href="/labs/packages">
              Package panels
            </a>
            <a className="btn btn--secondary" href="/labs/individual">
              Individual panels
            </a>
            <a className="btn btn--secondary" href="/labs/what-we-test">
              What we test
            </a>
            <a className="btn btn--secondary" href="/labs/how-it-works">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Gendered ladder — one section per audience, tiers in order */}
      {growth.audiences.map((a) => {
        const forAudience = panels.filter((p) => p.audiences.includes(a.id));
        return (
          <section className="section" key={a.id} aria-label={`${a.label} panels`}>
            <div className="container">
              <SectionHeading eyebrow={a.label} title={`${a.label} panel ladder`} />
              <div className="grid grid--3" style={{ marginTop: 8 }}>
                {TIER_ORDER.flatMap((tier) =>
                  forAudience
                    .filter((p) => p.tier === tier)
                    .map((p) => (
                      <a key={p.slug} className="card" href={`/labs/${p.slug}`}>
                        <div className="eyebrow">
                          {p.tier} · {p.kind}
                        </div>
                        <strong>{p.name}</strong>
                        <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                          {p.why}
                        </p>
                        {p.therapyOnRamp?.length ? (
                          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Qualification on-ramp →
                          </div>
                        ) : null}
                      </a>
                    )),
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section className="section">
        <div className="container">
          <PlaceholderNote>
            therapy-adjacent panels are qualification-as-product — a customer pays to enter the
            therapy funnel; keep the clinical framing honest and counsel-reviewed
          </PlaceholderNote>
        </div>
      </section>
    </GrowthGenericShell>
  );
}
