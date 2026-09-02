import { Shell } from "@/components/Shell";
import {
  FaqBattery,
  SkuLadder,
  Testimonials,
  ThreeStepRitual,
  TrustTriad,
} from "@/components/patterns";
import { PlaceholderNote } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { entryLink } from "@/lib/purple/entry-links";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ condition: string; campaign: string }>;
}): Promise<Metadata> {
  const { condition, campaign } = await params;
  const brand = getActiveBrand();
  return pageMetadata({
    title: `${brand.condition.name} — ${campaign} campaign`,
    description: `Campaign lander for ${campaign} (${condition}). Placeholder scaffolding; the nav-strip toggle is brand-driven. Replace before launch.`,
  });
}

/**
 * Campaign lander, nested `/condition/{condition}/{campaign}/` (teardown §2 LAUNCH).
 * The nav strip is a template TOGGLE: brand.navStripOnCampaign decides whether paid
 * traffic sees the full nav or a stripped one-road header. The campaign context rides
 * on the entry link as attribution (`entry_*`) + an offering preselect — NOT a
 * copyable promo code, and never able to alter the server-owned question set.
 */
export default async function CampaignLander({
  params,
}: {
  params: Promise<{ condition: string; campaign: string }>;
}) {
  const { condition, campaign } = await params;
  const brand = getActiveBrand();
  const c = brand.condition;
  const cta = entryLink({ entry: { campaign, source: "campaign_lander" } });

  return (
    <Shell brand={brand} stripped={brand.navStripOnCampaign}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">
            Campaign · {condition}/{campaign}
          </div>
          <h1 style={{ maxWidth: 720 }}>{c.heroHeadline}</h1>
          <p className="muted" style={{ maxWidth: 620, fontSize: 18 }}>
            {c.heroSub}
          </p>
          {!brand.contentReviewed ? (
            <PlaceholderNote>
              nav strip is {brand.navStripOnCampaign ? "ON" : "OFF"} for this brand — a template
              toggle
            </PlaceholderNote>
          ) : null}
          <div style={{ marginTop: 14 }}>
            <a className="btn" href={cta}>
              {brand.copy.cta_primary}
            </a>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Campaign context travels as attribution on the entry link. It cannot skip, reorder, or
            preselect answers — the server owns the questionnaire.
          </p>
        </div>
      </section>
      <TrustTriad brand={brand} />
      <ThreeStepRitual brand={brand} />
      <SkuLadder brand={brand} />
      <Testimonials brand={brand} />
      <FaqBattery brand={brand} />
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <a className="btn" href={cta}>
            {brand.copy.cta_primary}
          </a>
        </div>
      </section>
    </Shell>
  );
}
