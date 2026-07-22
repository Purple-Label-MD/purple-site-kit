import { LabGate } from "@/components/growth/LabGate";
import { GrowthGenericShell } from "@/components/growth/StoreChrome";
import { SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Individual lab panels",
    description:
      "Single lab panels ordered on their own, including therapy-adjacent screening panels. Placeholder scaffolding; fulfillment wakes with the labs lane.",
  });
}

export default function IndividualLabs() {
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) notFound();
  const panels = growth.catalog.labPanels.filter((p) => p.kind === "individual");

  return (
    <GrowthGenericShell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Labs · Individual</div>
          <h1 style={{ fontSize: 34, margin: "8px 0 12px" }}>Individual panels</h1>
          <LabGate />
          <div className="grid grid--3" style={{ marginTop: 8 }}>
            {panels.map((p) => (
              <a key={p.slug} className="card" href={`/labs/${p.slug}`}>
                <div className="eyebrow">{p.tier}</div>
                <strong>{p.name}</strong>
                <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                  {p.why}
                </p>
              </a>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <SectionHeading eyebrow="Also available" title="Prefer a bundle?" />
            <a className="btn btn--secondary" href="/labs/packages">
              See package panels →
            </a>
          </div>
        </div>
      </section>
    </GrowthGenericShell>
  );
}
