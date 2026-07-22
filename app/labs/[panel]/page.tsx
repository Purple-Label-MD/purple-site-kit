import { LabGate, LabOrderCta } from "@/components/growth/LabGate";
import { GrowthGenericShell } from "@/components/growth/StoreChrome";
import { SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { findOffering, findPanel } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  const brand = getActiveBrand();
  return (brand.growth?.catalog.labPanels ?? []).map((p) => ({ panel: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ panel: string }>;
}): Promise<Metadata> {
  const { panel } = await params;
  const brand = getActiveBrand();
  const p = brand.growth ? findPanel(brand.growth.catalog, panel) : null;
  if (!p) return {};
  return pageMetadata({
    title: `${p.name} — ${p.tier} panel`,
    description: `${p.why} Sample: ${p.sampleType}; turnaround ${p.turnaround}. Placeholder panel; fulfillment wakes with the labs lane.`,
  });
}

export default async function PanelPdp({ params }: { params: Promise<{ panel: string }> }) {
  const { panel } = await params;
  const brand = getActiveBrand();
  const growth = brand.growth;
  if (!growth) notFound();
  const p = findPanel(growth.catalog, panel);
  if (!p) notFound();

  // Therapy on-ramps: the offerings this panel qualifies a customer for (any lens it's in).
  const onRamps = (p.therapyOnRamp ?? [])
    .flatMap((slug) =>
      growth.audiences.map((a) => {
        const o = findOffering(growth.catalog, a.id, slug);
        return o ? { audience: a, offering: o } : null;
      }),
    )
    .filter((x): x is NonNullable<typeof x> => x != null);

  return (
    <GrowthGenericShell brand={brand}>
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <div className="eyebrow">
            {p.tier} · {p.kind} panel
          </div>
          <h1 style={{ fontSize: 32, margin: "8px 0 12px" }}>{p.name}</h1>

          {/* Panel PDP grammar: name → what's tested → why → sample type → turnaround */}
          <SectionHeading eyebrow="What's tested" title="Included markers (placeholder)" />
          <ul>
            {p.whatsTested.map((m) => (
              <li key={m} className="muted">
                {m}
              </li>
            ))}
          </ul>

          <div className="card" style={{ marginTop: 12 }}>
            <strong>Why it matters</strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {p.why}
            </p>
          </div>

          <div className="grid grid--2" style={{ marginTop: 12 }}>
            <div className="card">
              <div className="eyebrow">Sample type</div>
              {p.sampleType}
            </div>
            <div className="card">
              <div className="eyebrow">Turnaround</div>
              {p.turnaround}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <LabGate panelName={p.name} />
            <LabOrderCta />
          </div>
        </div>
      </section>

      {onRamps.length ? (
        <section className="section" aria-label="Where this leads">
          <div className="container">
            <SectionHeading eyebrow="Qualification on-ramp" title="Programs this panel supports" />
            <div className="grid grid--2" style={{ marginTop: 8 }}>
              {onRamps.map(({ audience, offering }) => (
                <a
                  key={`${audience.id}-${offering.slug}`}
                  className="card"
                  href={`/${audience.slug}/${offering.slug}`}
                >
                  <div className="eyebrow">{audience.label}</div>
                  <strong>{offering.name}</strong>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </GrowthGenericShell>
  );
}
