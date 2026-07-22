/**
 * Brand configuration model — the theming layer (Scope 4).
 *
 * A brand is expressed ENTIRELY as data: tokens (logo/palette/type), copy slots,
 * merchandising, pattern-component content, and an optional VERTICAL overlay. Two
 * demo brands are built from these configs alone (the two-brand theming proof).
 *
 * Nothing clinical lives here — this config is presentation + merchandising only,
 * mirroring the platform's clinically-inert BrandConfig discipline. All copy is
 * placeholder, hedged where it makes any claim, and visibly replaceable.
 */

export interface ThemeTokens {
  /** CSS custom-property leaves (string|number). Applied at render as :root-scoped vars. */
  colorBg: string;
  colorSurface: string;
  colorText: string;
  colorMuted: string;
  colorPrimary: string;
  colorPrimaryContrast: string;
  colorAccent: string;
  colorBorder: string;
  fontSans: string;
  radius: string;
  maxWidth: string;
}

export interface LogoSlot {
  /** Wordmark text stand-in — replace with a real logo asset in a fork (never shipped here). */
  wordmark: string;
  /** Optional short mark / monogram. */
  mark?: string;
}

export type EntryMode = "prelander" | "longscroll";

/**
 * GROWTH funnel-entry TOGGLE (WI-042 · Scope 4) — orthogonal to the home EntryMode.
 * `buy-first` REQUIRES the eligibility-honesty block adjacent to every buy control
 * (addendum §4.③ + the refund-on-decline law); `quiz-first` sends intake-first.
 */
export type FunnelMode = "quiz-first" | "buy-first";

/** Which archetype a brand config drives. LAUNCH is the single-condition starter. */
export type Archetype = "launch" | "growth";

export interface Sku {
  id: string;
  /** Stable offering ref used on entry links (never a free-text product name). */
  offeringRef: string;
  name: string;
  /** e.g. "Entry option" / "Higher-strength option" — NEUTRAL role labels, no superlatives. */
  roleLabel: string;
  /** Placeholder molecule name — NEVER a real medication. */
  placeholderMolecule: string;
  benefit: string;
  /** Price is a visible placeholder token, never a real number (governance-lite ③). */
  priceSlot: string;
  doseNote: string;
}

export interface CommitmentTier {
  id: string;
  label: string;
  cadenceNote: string;
  priceSlot: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Testimonial {
  /** Attribution is a placeholder; results-vary discipline is enforced in the component. */
  attribution: string;
  quote: string;
  /** Optional demographic casting metadata (vertical overlay) — locked by design. */
  castingNote?: string;
}

export interface ClinicianBio {
  /** Placeholder name — the estate-wide leapfrog: real bios are first-class, but shipped as slots. */
  namePlaceholder: string;
  credentialSlot: string;
  bioSlot: string;
  photoSlot: string;
}

export interface TrustBadge {
  label: string;
  note: string;
}

export interface VerticalOverlay {
  /** Identity carried at the brand layer (ambient targeting). */
  identityTagline: string;
  /** "What we're NOT" — the negative-experience / stigma-inversion module slot. */
  negativeExperience: {
    heading: string;
    body: string;
  };
  /** Peer-mirror proof: testimonial casting demographic-locked by design (metadata only). */
  peerMirrorCasting: string;
  /** Audience-specific medical-content slots (the omitted credibility piece). */
  audienceMedicalContent: { heading: string; body: string }[];
}

export interface BrandConfig {
  brandId: string;
  name: string;
  tagline: string;
  logo: LogoSlot;
  theme: ThemeTokens;
  /** Archetype this brand drives (default "launch" when omitted). */
  archetype?: Archetype;
  /**
   * GROWTH growth-layer (WI-042). Present only for archetype "growth": the audience
   * lenses, the single projected catalog, and the default funnel-entry toggle.
   * A fork swaps the catalog config; the token SHAPE never changes.
   */
  growth?: {
    audiences: import("@/lib/catalog/types").Audience[];
    catalog: import("@/lib/catalog/types").Catalog;
    /** Default entry mode; a campaign may override via ?mode= (Scope 4). */
    funnelMode: FunnelMode;
  };
  /** Home entry grammar — a template TOGGLE, not a single answer (teardown §1.10). */
  entryMode: EntryMode;
  /** Nav-strip toggle on campaign landers (teardown §2 LAUNCH). */
  navStripOnCampaign: boolean;
  /** The single condition this LAUNCH site is built around (placeholder). */
  condition: {
    slug: string;
    name: string;
    /** Long-scroll hero copy / pre-lander promise (placeholder, hedged). */
    heroHeadline: string;
    heroSub: string;
    threeStep: { title: string; body: string }[];
  };
  skus: Sku[];
  commitmentTiers?: CommitmentTier[];
  faq: FaqItem[];
  testimonials: Testimonial[];
  clinicians: ClinicianBio[];
  trustTriad: TrustBadge[];
  /** Copy slots keyed by slot id (brand-overridable display strings). */
  copy: Record<string, string>;
  /** Present only for vertical-branded sites. */
  vertical?: VerticalOverlay;
}
