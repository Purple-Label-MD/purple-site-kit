// @ts-check
/**
 * Pure catalog PROJECTION logic (WI-042 · Scope 2).
 *
 * The anti-clone law in code: ONE catalog, projected through audience lenses by
 * simple set membership. A shared offering (audiences = [both]) renders in both
 * lenses; an exclusive offering renders in exactly one. No SKU is ever cloned.
 *
 * This lives in a plain `.mjs` module (typed by projection.d.mts) so the RED-first
 * projection self-test can exercise it directly under CI's Node 20 — the same
 * pure-module discipline as copy-guard.mjs. The TypeScript app imports these via
 * lib/catalog/index.ts; they operate structurally on the typed demo catalog.
 */

/** Offerings visible in one audience lens, in catalog order. */
export function offeringsForAudience(catalog, audienceId) {
  return catalog.offerings.filter((o) => o.audiences.includes(audienceId));
}

/** Lab panels visible in one audience lens, in catalog order. */
export function labPanelsForAudience(catalog, audienceId) {
  return catalog.labPanels.filter((p) => p.audiences.includes(audienceId));
}

/** Featured (mega-menu / hero grid) offerings for an audience. */
export function featuredForAudience(catalog, audienceId) {
  return offeringsForAudience(catalog, audienceId).filter((o) => o.featured);
}

/** Distinct category labels present in an audience lens, in first-seen order. */
export function categoriesForAudience(catalog, audienceId) {
  const seen = [];
  for (const o of offeringsForAudience(catalog, audienceId)) {
    if (!seen.includes(o.category)) seen.push(o.category);
  }
  return seen;
}

/** True when an offering is exclusive to a single audience. */
export function isExclusive(offering) {
  return offering.audiences.length === 1;
}

/** Find an offering by slug within an audience lens (null if not projected there). */
export function findOffering(catalog, audienceId, slug) {
  return offeringsForAudience(catalog, audienceId).find((o) => o.slug === slug) ?? null;
}

/** Find a lab panel by slug (audience-independent lookup). */
export function findPanel(catalog, slug) {
  return catalog.labPanels.find((p) => p.slug === slug) ?? null;
}

/** Lab panels of a given kind for an audience (individual vs package split). */
export function panelsByKind(catalog, audienceId, kind) {
  return labPanelsForAudience(catalog, audienceId).filter((p) => p.kind === kind);
}
