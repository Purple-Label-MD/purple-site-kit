import { LabGate } from "@/components/growth/LabGate";
import { GrowthGenericShell } from "@/components/growth/StoreChrome";
import { SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Package lab panels",
    description:
      "Bundled lab panels in gendered basic/intermediate/advanced ladders. Placeholder scaffolding; fulfillment wakes with the labs lane.",
  });
}

export default function PackageLabs() {
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) notFound();
  const panels = growth.catalog.labPanels.filter((p) => p.kind === "package");

  return (
    <GrowthGenericShell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Labs · Packages</div>
          <h1 style={{ fontSize: 34, margin: "8px 0 12px" }}>Package panels</h1>
          <LabGate />
          {brand.growth?.audiences.map((a) => {
            const forAudience = panels.filter((p) => p.audiences.includes(a.id));
            if (!forAudience.length) return null;
            return (
              <div key={a.id} style={{ marginTop: 16 }}>
                <SectionHeading eyebrow={a.label} title={`${a.label} packages`} />
                <div className="grid grid--3" style={{ marginTop: 8 }}>
                  {forAudience.map((p) => (
                    <a key={p.slug} className="card" href={`/labs/${p.slug}`}>
                      <div className="eyebrow">{p.tier}</div>
                      <strong>{p.name}</strong>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16 }}>
            <a className="btn btn--secondary" href="/labs/individual">
              See individual panels →
            </a>
          </div>
        </div>
      </section>
    </GrowthGenericShell>
  );
}
