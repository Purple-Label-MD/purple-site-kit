import { Shell } from "@/components/Shell";
import { CounselBanner, PlaceholderNote } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { LEGAL_SLOTS, LEGAL_SLUGS } from "@/lib/legal-slots";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slot = LEGAL_SLOTS[slug];
  if (!slot) return {};
  return pageMetadata({
    title: `${slot.title} (placeholder)`,
    description: `${slot.title} — a REQUIRES-COUNSEL-REVIEW placeholder. Certification review looks for: ${slot.reviewNeeds}`,
  });
}

/** Legal slot page — always a marked placeholder with a REQUIRES-COUNSEL-REVIEW banner. */
export default async function LegalSlotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slot = LEGAL_SLOTS[slug];
  if (!slot) notFound();
  const brand = getActiveBrand();

  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="eyebrow">Legal</div>
          <h1>{slot.title}</h1>
          <CounselBanner topic={slot.title} />
          <PlaceholderNote>
            this entire page is scaffolding — no real legal text ships here
          </PlaceholderNote>
          <p className="muted">
            <strong>Certification review looks for:</strong> {slot.reviewNeeds}
          </p>
          <ul>
            {slot.points.map((p) => (
              <li key={p} className="muted">
                {p}
              </li>
            ))}
          </ul>
          <p className="muted" style={{ fontSize: 12 }}>
            The reviewed legal pack is a separate, counsel-gated deliverable — not part of this
            template. Replace this placeholder only with counsel-drafted, counsel-approved text.
          </p>
        </div>
      </section>
    </Shell>
  );
}
