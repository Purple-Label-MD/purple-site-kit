import { GrowthShell } from "@/components/growth/StoreChrome";
import { PlaceholderNote, SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { categoriesForAudience, offeringsForAudience } from "@/lib/catalog";
import type { Audience } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Audience is a first-class catalog DIMENSION expressed as the root segment. Only the
// configured audiences resolve (SSG); anything else 404s.
export const dynamicParams = false;

function audienceBySlug(slug: string): { audience: Audience } | null {
  const brand = getActiveBrand();
  const audience = brand.growth?.audiences.find((a) => a.slug === slug);
  return audience ? { audience } : null;
}

export function generateStaticParams() {
  const brand = getActiveBrand();
  return (brand.growth?.audiences ?? []).map((a) => ({ audience: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience } = await params;
  const found = audienceBySlug(audience);
  if (!found) return {};
  return pageMetadata({
    title: `${found.audience.label} programs`,
    description: `Browse the ${found.audience.label} program catalog — a config-driven storefront lens. ${found.audience.identityTagline}`,
  });
}

export default async function AudienceStorefront({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience: slug } = await params;
  const found = audienceBySlug(slug);
  if (!found) notFound();
  const { audience } = found;
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) notFound();

  const categories = categoriesForAudience(growth.catalog, audience.id);
  const offerings = offeringsForAudience(growth.catalog, audience.id);

  return (
    <GrowthShell brand={brand} audience={audience}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">{audience.label}</div>
          <h1 style={{ fontSize: 40, margin: "8px 0 12px", maxWidth: 760 }}>
            {audience.heroHeadline}
          </h1>
          <p className="muted" style={{ maxWidth: 640, fontSize: 18 }}>
            {audience.heroSub}
          </p>
          <PlaceholderNote>
            audience voice + hero are scaffolding — replace before launch
          </PlaceholderNote>
        </div>
      </section>

      {/* Homepage-as-storefront: card grid, price deferred to the PDP, grouped by category */}
      {categories.map((cat) => (
        <section className="section" key={cat} aria-label={cat}>
          <div className="container">
            <SectionHeading eyebrow="Programs" title={cat} />
            <div className="grid grid--3" style={{ marginTop: 8 }}>
              {offerings
                .filter((o) => o.category === cat)
                .map((o) => (
                  <a key={o.slug} className="card" href={`/${audience.slug}/${o.slug}`}>
                    <div className="eyebrow">{o.roleLabel}</div>
                    <strong>{o.name}</strong>
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
                      {o.summary}
                    </p>
                    <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                      Pricing on the program page →
                    </div>
                  </a>
                ))}
            </div>
          </div>
        </section>
      ))}

      {/* VERTICAL overlay ×2, composed per audience (not forked) */}
      <section className="section" aria-label="For this audience">
        <div className="container">
          <div className="card">
            <div className="eyebrow">{audience.negativeExperience.heading}</div>
            <p style={{ margin: "4px 0 0" }}>{audience.negativeExperience.body}</p>
          </div>
          <div className="grid grid--2" style={{ marginTop: 16 }}>
            {audience.audienceMedicalContent.map((m) => (
              <div key={m.heading} className="card">
                <strong>{m.heading}</strong>
                <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
                  {m.body}
                </p>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Peer-mirror casting: {audience.peerMirrorCasting}. Imagery: {audience.imagerySlot}
          </p>
        </div>
      </section>

      {/* Labs cross-sell teaser */}
      <section className="section" aria-label="Labs">
        <div className="container">
          <div className="card">
            <strong>Advanced lab diagnostics</strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Panels are sold as their own product line (marketing-complete; fulfillment wakes with
              the labs lane). <a href="/labs">Explore labs →</a>
            </p>
          </div>
        </div>
      </section>
    </GrowthShell>
  );
}
