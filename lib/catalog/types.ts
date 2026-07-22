/**
 * GROWTH catalog model (WI-042 · Scope 2/3/6).
 *
 * The GROWTH archetype renders an entire multi-line storefront from ONE catalog
 * config projected through audience LENSES. The anti-clone law is the tightest
 * constraint here: audience is a first-class DIMENSION on a single set of shared
 * offerings + per-audience exclusives — never two catalogs, never a cloned SKU.
 *
 * Everything a page needs (including its per-page SEO meta) is data on these nodes.
 * All content is placeholder scaffolding: fictional programs, placeholder molecules,
 * price SLOTS never real numbers, hedged claims only.
 */

/** An audience id, e.g. "aud_m" / "aud_w". Labels + slugs are brand TOKENS, not law. */
export type AudienceId = string;

/** Supply framing (the ship-vs-bill split is ready as data; §5 supply-term ladder). */
export interface SupplyTerm {
  id: string;
  /** Display label, e.g. "1 month" (a framing token, not a law). */
  label: string;
  /** Cadence note — align the commercial rhythm to the clinical protocol. */
  cadenceNote: string;
  /** Visible price SLOT — never a real number (governance-lite ③). */
  priceSlot: string;
}

/** Per-page SEO/meta leaves, generated from catalog data (§7 · anti-duplicate-meta law). */
export interface PageMeta {
  /** Unique, page-specific title — NEVER the site default. */
  title: string;
  /** Unique, page-specific description. */
  description: string;
}

/** One catalog line. Rendered as a condition unit (LP → chooser → intake/checkout). */
export interface Offering {
  slug: string;
  name: string;
  /** Category grouping the mega-menu curates by (a token, not a medical claim). */
  category: string;
  /** Set membership — shared line ⇒ both audiences; exclusive ⇒ exactly one. */
  audiences: AudienceId[];
  /** Curated into the per-audience mega-menu / featured grid. */
  featured?: boolean;
  /** NEUTRAL role label, no superlatives. */
  roleLabel: string;
  /** Placeholder molecule — NEVER a real medication. */
  placeholderMolecule: string;
  /** Card blurb (storefront grid); price is deferred to the PDP. */
  summary: string;
  /** PDP body slots. */
  whatItIs: string;
  howItWorks: { title: string; body: string }[];
  /** Default-open supply-term ladder (§5). */
  supplyTerms: SupplyTerm[];
  /** Objection-ordered PDP FAQ (doubles as a safety surface). */
  faq: { q: string; a: string }[];
  /** Lab-panel slugs cross-linked as qualification-on-ramps (§6). */
  labsAdjacent?: string[];
}

export type LabTier = "basic" | "intermediate" | "advanced";
export type LabKind = "individual" | "package";

/** A lab panel — marketing-complete, fulfillment-stubbed (§6). */
export interface LabPanel {
  slug: string;
  name: string;
  audiences: AudienceId[];
  /** Ladder rung. */
  tier: LabTier;
  /** Individual test vs bundled package. */
  kind: LabKind;
  /** Panel PDP grammar: name → what's tested → why → sample type → turnaround. */
  whatsTested: string[];
  why: string;
  sampleType: string;
  turnaround: string;
  /** Offering slugs this panel qualifies a customer for (qualification-as-product). */
  therapyOnRamp?: string[];
}

/** Per-audience voice / imagery / proof slots — the VERTICAL overlay, composed ×2. */
export interface Audience {
  id: AudienceId;
  /** URL segment — a brand token (e.g. "men" / "women"), never law. */
  slug: string;
  label: string;
  heroHeadline: string;
  heroSub: string;
  /** Ambient identity carried at the audience layer. */
  identityTagline: string;
  /** "What we're NOT" — negative-experience / stigma-inversion module slot. */
  negativeExperience: { heading: string; body: string };
  /** Peer-mirror proof: casting demographic-locked by design (metadata only). */
  peerMirrorCasting: string;
  /** Audience-specific medical-content slots (the omitted credibility piece). */
  audienceMedicalContent: { heading: string; body: string }[];
  /** Imagery direction slot (never a shipped licensed asset). */
  imagerySlot: string;
}

/** The single catalog, projected per audience. */
export interface Catalog {
  offerings: Offering[];
  labPanels: LabPanel[];
}
