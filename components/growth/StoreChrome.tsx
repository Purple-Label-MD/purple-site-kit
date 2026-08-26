/**
 * GROWTH storefront chrome (WI-042 · Scope 3): a condition-first mega-menu curating
 * top lines per audience + an audience switcher, over the SAME footer as LAUNCH.
 * Nav curates the featured lines; the full catalog lives in the storefront grid and
 * footer — the teardown's "curate the nav, footer holds the long tail" grammar.
 */

import { SiteFooter } from "@/components/chrome";
import type { BrandConfig } from "@/lib/brand/types";
import { categoriesForAudience, featuredForAudience, offeringsForAudience } from "@/lib/catalog";
import type { Audience } from "@/lib/catalog/types";

function requireGrowth(brand: BrandConfig) {
  if (!brand.growth) throw new Error("GrowthShell requires a growth-archetype brand config.");
  return brand.growth;
}

export function GrowthNav({ brand, audience }: { brand: BrandConfig; audience: Audience }) {
  const growth = requireGrowth(brand);
  const featured = featuredForAudience(growth.catalog, audience.id);
  return (
    <nav className="site-nav container" aria-label="Primary">
      <a className="wordmark" href={`/${audience.slug}`}>
        {brand.logo.wordmark}
      </a>
      <div className="links">
        {/* Mega-menu: curated top lines for this audience */}
        <details className="megamenu">
          <summary>Programs</summary>
          <div className="megamenu__panel card">
            {featured.map((o) => (
              <a key={o.slug} href={`/${audience.slug}/${o.slug}`}>
                {o.name}
              </a>
            ))}
            <a href={`/${audience.slug}`} style={{ fontWeight: 600 }}>
              All programs →
            </a>
          </div>
        </details>
        {growth.catalog.labPanels.length > 0 ? <a href="/labs">Labs</a> : null}
        <a href="/about">About</a>
        <a href="/faq">FAQ</a>
        {/* Audience switcher — the root split, from config */}
        {growth.audiences.map((a) => (
          <a
            key={a.id}
            href={`/${a.slug}`}
            aria-current={a.id === audience.id ? "true" : undefined}
            style={{ fontWeight: a.id === audience.id ? 700 : undefined }}
          >
            {a.label}
          </a>
        ))}
        <a className="btn" href={`/${audience.slug}`}>
          {brand.copy.cta_primary}
        </a>
      </div>
    </nav>
  );
}

/** Count of catalog lines in an audience lens — a small storefront-breadth signal. */
export function audienceLineCount(brand: BrandConfig, audience: Audience): number {
  const growth = requireGrowth(brand);
  return offeringsForAudience(growth.catalog, audience.id).length;
}

export function categoriesFor(brand: BrandConfig, audience: Audience): string[] {
  const growth = requireGrowth(brand);
  return categoriesForAudience(growth.catalog, audience.id);
}

/** Storefront page shell: mega-menu nav + content + shared footer. */
export function GrowthShell({
  brand,
  audience,
  children,
}: {
  brand: BrandConfig;
  audience: Audience;
  children: React.ReactNode;
}) {
  return (
    <>
      <GrowthNav brand={brand} audience={audience} />
      <main>{children}</main>
      <SiteFooter brand={brand} />
    </>
  );
}

/** Audience-independent nav (labs root + other cross-audience pages). */
export function GrowthTopNav({ brand }: { brand: BrandConfig }) {
  const growth = requireGrowth(brand);
  return (
    <nav className="site-nav container" aria-label="Primary">
      <a className="wordmark" href="/">
        {brand.logo.wordmark}
      </a>
      <div className="links">
        {growth.audiences.map((a) => (
          <a key={a.id} href={`/${a.slug}`}>
            {a.label}
          </a>
        ))}
        {growth.catalog.labPanels.length > 0 ? (
          <a href="/labs" style={{ fontWeight: 700 }}>
            Labs
          </a>
        ) : null}
        <a href="/about">About</a>
        <a href="/faq">FAQ</a>
        <a href="/members">{brand.copy.member_entry}</a>
      </div>
    </nav>
  );
}

/** Shell for cross-audience pages (labs root, transparency, ritual). */
export function GrowthGenericShell({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: React.ReactNode;
}) {
  return (
    <>
      <GrowthTopNav brand={brand} />
      <main>{children}</main>
      <SiteFooter brand={brand} />
    </>
  );
}
