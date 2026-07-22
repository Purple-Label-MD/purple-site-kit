import { Shell } from "@/components/Shell";
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

/** Evergreen condition page: education + options, nav retained. */
export default async function ConditionPage({
  params,
}: {
  params: Promise<{ condition: string }>;
}) {
  const { condition } = await params;
  const brand = getActiveBrand();
  const c = brand.condition;

  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Program · {condition}</div>
          <h1 style={{ maxWidth: 700 }}>{c.name}</h1>
          <p className="muted" style={{ maxWidth: 620, fontSize: 18 }}>
            {c.heroSub}
          </p>
          <PlaceholderNote>
            evergreen education copy — replace with counsel-reviewed content
          </PlaceholderNote>
          <div style={{ marginTop: 14 }}>
            <a className="btn" href={entryLink()}>
              {brand.copy.cta_primary}
            </a>
          </div>
        </div>
      </section>
      <TrustTriad brand={brand} />
      <ThreeStepRitual brand={brand} />
      {brand.vertical ? <VerticalModules brand={brand} /> : null}
      <SkuLadder brand={brand} />
      <Testimonials brand={brand} />
      <ClinicianBios brand={brand} />
      <FaqBattery brand={brand} />
    </Shell>
  );
}
