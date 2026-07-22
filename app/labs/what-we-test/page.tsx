import { GrowthGenericShell } from "@/components/growth/StoreChrome";
import { CounselBanner, PlaceholderNote, SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "What we test — transparency",
    description:
      "A transparency page listing every marker across the lab panels and why it's measured. Placeholder markers only; replace with clinician- and counsel-reviewed content.",
  });
}

export default function WhatWeTest() {
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) notFound();
  // De-duplicated marker inventory across all panels (placeholder markers).
  const markers = [...new Set(growth.catalog.labPanels.flatMap((p) => p.whatsTested))];

  return (
    <GrowthGenericShell brand={brand}>
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <div className="eyebrow">Labs</div>
          <h1 style={{ fontSize: 34, margin: "8px 0 12px" }}>What we test</h1>
          <p className="muted">
            Transparency page — the full marker inventory across panels. Publishing what's measured
            (and why) is a trust device; keep it accurate and counsel-reviewed.
          </p>
          <PlaceholderNote>
            markers are placeholders — replace with real, reviewed content
          </PlaceholderNote>
          <CounselBanner topic="lab marker descriptions + clinical rationale (YMYL content needs a medical reviewer byline)" />
          <SectionHeading eyebrow="Markers" title="Placeholder marker inventory" />
          <ul>
            {markers.map((m) => (
              <li key={m} className="muted">
                {m} — [why this marker is measured]
              </li>
            ))}
          </ul>
        </div>
      </section>
    </GrowthGenericShell>
  );
}
