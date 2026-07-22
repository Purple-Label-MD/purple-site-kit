import type { BrandConfig } from "@/lib/brand/types";

/**
 * DEMO BRAND 1 — "Aurora Starter" (generic LAUNCH archetype).
 * Long-scroll single-mouth home, nav retained on campaign landers.
 *
 * PLACEHOLDER throughout: fictional brand, fictional condition ("Placeholder Program"),
 * fictional molecules ("Compound-A/B"), price slots not numbers, hedged claims only.
 */
export const aurora: BrandConfig = {
  brandId: "brd_demo_aurora",
  name: "Aurora Starter",
  tagline: "A placeholder wordmark for the LAUNCH starter template.",
  logo: { wordmark: "AURORA", mark: "A" },
  theme: {
    colorBg: "#faf9fc",
    colorSurface: "#ffffff",
    colorText: "#1c1830",
    colorMuted: "#6b6580",
    colorPrimary: "#5b3fb0",
    colorPrimaryContrast: "#ffffff",
    colorAccent: "#e9defb",
    colorBorder: "#e6e2ef",
    fontSans: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    radius: "12px",
    maxWidth: "1080px",
  },
  entryMode: "longscroll",
  navStripOnCampaign: false,
  condition: {
    slug: "placeholder-program",
    name: "Placeholder Program",
    heroHeadline: "A clear, honest headline goes here.",
    heroSub:
      "This is placeholder scaffolding copy. Replace it with your own program's positioning. Individual experiences vary; nothing here is a promise of any outcome.",
    threeStep: [
      {
        title: "Share your details",
        body: "Complete a short, server-guided intake at your own pace.",
      },
      {
        title: "Clinician review",
        body: "A licensed clinician reviews your information where appropriate.",
      },
      { title: "Delivery", body: "If suitable, your order ships to you. Timelines are estimates." },
    ],
  },
  skus: [
    {
      id: "sku_entry",
      offeringRef: "offering_launch_starter",
      name: "Entry Option (Placeholder)",
      roleLabel: "Entry option",
      placeholderMolecule: "Compound-A",
      benefit: "A sample entry-tier description. Replace with your own.",
      priceSlot: "$[PRICE]/mo",
      doseNote: "Same placeholder price across sample doses.",
    },
    {
      id: "sku_premium",
      offeringRef: "offering_launch_premium",
      name: "Higher-Strength Option (Placeholder)",
      roleLabel: "Higher-strength option",
      placeholderMolecule: "Compound-B",
      benefit: "A sample higher-strength description. Replace with your own.",
      priceSlot: "$[PRICE]/mo",
      doseNote: "Same placeholder price across sample doses.",
    },
  ],
  commitmentTiers: [
    {
      id: "m1",
      label: "Monthly (Placeholder)",
      cadenceNote: "Billed monthly.",
      priceSlot: "$[PRICE]/mo",
    },
    {
      id: "m3",
      label: "3-month (Placeholder)",
      cadenceNote: "Billed up front; shown per month.",
      priceSlot: "$[PRICE]/mo",
    },
    {
      id: "m6",
      label: "6-month (Placeholder)",
      cadenceNote: "Billed up front; shown per month.",
      priceSlot: "$[PRICE]/mo",
    },
  ],
  faq: [
    {
      q: "How much does it cost?",
      a: "Pricing is a placeholder slot. Insert your itemized, all-in pricing here; itemize inclusions rather than implying a single bundled promise.",
    },
    {
      q: "Which states do you serve?",
      a: "Placeholder answer — list your served jurisdictions here.",
    },
    {
      q: "Is this right for me?",
      a: "That depends on your situation and a clinician's judgment. Eligibility is decided during review; you may not be suitable.",
    },
    {
      q: "What are the risks and side effects?",
      a: "Placeholder safety copy. Provide balanced risk information reviewed by qualified counsel and clinicians before launch.",
    },
    {
      q: "How fast is shipping?",
      a: "Shipping timelines are estimates and vary. Insert your fulfillment details.",
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
      note: "Placeholder — describe your privacy posture (reviewed by counsel).",
    },
    { label: "Licensed clinicians", note: "Placeholder — describe your clinical model." },
    { label: "Tracked shipping", note: "Placeholder — describe fulfillment." },
  ],
  copy: {
    cta_primary: "See if this is a fit",
    cta_secondary: "Learn more",
    member_entry: "Member sign in",
    seal_slot_note: "Certification seal placement only — never ship a seal you have not earned.",
  },
};
