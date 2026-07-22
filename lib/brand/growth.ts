import type { BrandConfig } from "@/lib/brand/types";
import { demoAudiences, demoCatalog } from "@/lib/catalog/demo";

/**
 * DEMO BRAND 3 — "Meridian Health" (GROWTH archetype · the SECOND demo site, WI-042).
 *
 * A dual-audience, multi-line storefront grown from ONE catalog config (lib/catalog).
 * It reuses the exact theming MECHANISM proven by aurora/peer — tokens → CSS vars —
 * with its own palette, so the two-brand theming proof still stands and this adds the
 * second archetype. Buy-first funnel by default (the addendum's order-first pattern),
 * with the eligibility-honesty block required beside every buy control.
 *
 * PLACEHOLDER throughout: fictional brand + programs, placeholder molecules, price
 * SLOTS not numbers, hedged claims only. Nothing ports from fortifyhp/Lovable.
 */
export const growth: BrandConfig = {
  brandId: "brd_demo_growth",
  name: "Meridian Health",
  tagline: "A placeholder wordmark for the GROWTH storefront demo.",
  logo: { wordmark: "MERIDIAN", mark: "M" },
  theme: {
    colorBg: "#f6faf9",
    colorSurface: "#ffffff",
    colorText: "#0f2420",
    colorMuted: "#5a6f69",
    colorPrimary: "#0f766e",
    colorPrimaryContrast: "#ffffff",
    colorAccent: "#d7efe9",
    colorBorder: "#dbe8e4",
    fontSans: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    radius: "14px",
    maxWidth: "1120px",
  },
  archetype: "growth",
  entryMode: "prelander",
  navStripOnCampaign: false,
  growth: {
    audiences: demoAudiences,
    catalog: demoCatalog,
    funnelMode: "buy-first",
  },
  // A representative condition so shared LAUNCH-style pages/chrome still resolve.
  condition: {
    slug: "metabolic-program",
    name: "Metabolic Program",
    heroHeadline: "A clear, honest headline goes here.",
    heroSub:
      "Placeholder scaffolding copy. Individual experiences vary; nothing here is a promise of any outcome.",
    threeStep: [
      { title: "Choose a program", body: "Browse the catalog for your audience." },
      { title: "Clinician review", body: "A licensed clinician reviews every order." },
      {
        title: "Ongoing support",
        body: "If suitable, we support you over time. Details are estimates.",
      },
    ],
  },
  skus: [
    {
      id: "sku_entry",
      offeringRef: "offering_growth_starter",
      name: "Entry Option (Placeholder)",
      roleLabel: "Entry option",
      placeholderMolecule: "Compound-A",
      benefit: "A sample entry-tier description. Replace with your own.",
      priceSlot: "$[PRICE]/mo",
      doseNote: "Same placeholder price across sample doses.",
    },
    {
      id: "sku_premium",
      offeringRef: "offering_growth_premium",
      name: "Higher-Strength Option (Placeholder)",
      roleLabel: "Higher-strength option",
      placeholderMolecule: "Compound-B",
      benefit: "A sample higher-strength description. Replace with your own.",
      priceSlot: "$[PRICE]/mo",
      doseNote: "Same placeholder price across sample doses.",
    },
  ],
  faq: [
    {
      q: "How much does it cost?",
      a: "Pricing is a placeholder slot. Itemize your inclusions honestly rather than implying a single bundled promise.",
    },
    {
      q: "Which states do you serve?",
      a: "Placeholder answer — list your served jurisdictions here.",
    },
    {
      q: "What if I don't qualify?",
      a: "A licensed clinician reviews every order. If you are not a fit, you are not charged for a medication you can't receive — see the eligibility note beside each option.",
    },
  ],
  testimonials: [
    {
      attribution: "Placeholder Member",
      quote:
        "A sample, believable placeholder quote. Replace with genuine, permissioned testimonials.",
    },
    {
      attribution: "Placeholder Member",
      quote: "Another placeholder quote used only to demonstrate the component layout.",
    },
  ],
  clinicians: [
    {
      namePlaceholder: "Dr. [Clinician Name]",
      credentialSlot: "[Credentials, license #, jurisdiction]",
      bioSlot:
        "[Short clinician bio — first-class provider identity is the estate-wide leapfrog. Fill with real, verifiable details.]",
      photoSlot: "[clinician-photo]",
    },
  ],
  trustTriad: [
    {
      label: "Confidential",
      note: "Placeholder — describe your privacy posture (counsel-reviewed).",
    },
    { label: "Licensed clinicians", note: "Placeholder — describe your clinical model." },
    { label: "Tracked shipping", note: "Placeholder — describe fulfillment." },
  ],
  copy: {
    cta_primary: "See if this is a fit",
    cta_secondary: "Browse programs",
    member_entry: "Member sign in",
    seal_slot_note: "Certification seal placement only — never ship a seal you have not earned.",
  },
};
