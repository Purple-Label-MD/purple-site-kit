import { getActiveBrand } from "@/lib/brand";
import type { Metadata } from "next";

/**
 * Per-page metadata builder (WI-042 · Scope 7 · SEO/meta law).
 *
 * The addendum §4① failure was every URL serving the IDENTICAL title/description/OG
 * (indistinguishable to crawlers, unfurlers, AI-search). The kit's law: SSG + a
 * UNIQUE, page-specific title + description generated from data, with a brand-OWNED
 * OG (never a site-builder preview asset). The per-page-meta CI check (scripts/
 * meta-check.mjs) fails closed on duplicate or default meta.
 *
 * The demo template stays noindex (it is placeholder scaffolding); a fork flips
 * robots when its real content lands. Uniqueness is enforced regardless.
 */
export function pageMetadata(opts: {
  /** Page-specific title fragment — MUST be unique per page (no site default). */
  title: string;
  /** Page-specific description — MUST be unique per page. */
  description: string;
}): Metadata {
  const brand = getActiveBrand();
  const title = `${opts.title} · ${brand.name}`;
  return {
    title,
    description: opts.description,
    openGraph: {
      title,
      description: opts.description,
      siteName: brand.name,
      type: "website",
      // Brand-owned OG slot — a fork points this at its own hosted asset.
      images: [{ url: "/og/default.svg", alt: `${brand.name} (placeholder OG)` }],
    },
    // Placeholder template is never indexed; a fork flips this with real content.
    robots: { index: false, follow: false },
  };
}
