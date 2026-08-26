/**
 * GROWTH storefront landing (WI-042): an audience chooser over ONE catalog config.
 * The root split (audiences) is the entry; each lens projects the shared catalog +
 * its exclusives. Reuses the shared footer + pattern components; nothing is cloned.
 */

import { SiteFooter } from "@/components/chrome";
import { ClinicianBios, TrustTriad } from "@/components/patterns";
import { PlaceholderNote } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand/types";
import { offeringsForAudience } from "@/lib/catalog";

export function GrowthHome({ brand }: { brand: BrandConfig }) {
  const growth = brand.growth;
  if (!growth) return null;
  return (
    <>
      <nav className="site-nav container" aria-label="Primary">
        <a className="wordmark" href="/">
          {brand.logo.wordmark}
        </a>
        <div className="links">
          {growth.catalog.labPanels.length > 0 ? <a href="/labs">Labs</a> : null}
          <a href="/about">About</a>
          <a href="/faq">FAQ</a>
          <a href="/contact">Contact</a>
          <a href="/members">{brand.copy.member_entry}</a>
        </div>
      </nav>
      <main>
        <section className="section">
          <div className="container">
            <div className="eyebrow">{brand.name}</div>
            <h1 style={{ fontSize: 42, margin: "8px 0 12px", maxWidth: 760 }}>
              {brand.condition.heroHeadline}
            </h1>
            <p className="muted" style={{ maxWidth: 640, fontSize: 18 }}>
              {brand.condition.heroSub}
            </p>
            {!brand.contentReviewed ? (
              <PlaceholderNote>
                storefront landing copy is scaffolding — replace before launch
              </PlaceholderNote>
            ) : null}
          </div>
        </section>

        <section className="section" aria-label="Choose your audience">
          <div className="container">
            <h2>Choose your path</h2>
            <div className="grid grid--2" style={{ marginTop: 12 }}>
              {growth.audiences.map((a) => (
                <a key={a.id} className="card" href={`/${a.slug}`}>
                  <div className="eyebrow">{a.label}</div>
                  <strong>{a.heroHeadline}</strong>
                  <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
                    {a.identityTagline}
                  </p>
                  <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                    {offeringsForAudience(growth.catalog, a.id).length} programs ·{" "}
                    <span>Explore →</span>
                  </div>
                </a>
              ))}
            </div>
            {!brand.contentReviewed ? (
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                One catalog, two lenses: shared programs appear in both; audience-exclusive lines
                appear in exactly one. Never two catalogs, never a cloned SKU.
              </p>
            ) : null}
          </div>
        </section>

        <TrustTriad brand={brand} />
        <ClinicianBios brand={brand} />
      </main>
      <SiteFooter brand={brand} />
    </>
  );
}
