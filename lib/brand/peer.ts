import type { BrandConfig } from "@/lib/brand/types";

/**
 * DEMO BRAND 2 — "Peer Path" (VERTICAL overlay archetype).
 * Pre-lander home, nav STRIPPED on campaign landers, plus the vertical overlay:
 * identity at the brand layer, a negative-experience module, peer-mirror casting,
 * and audience-specific medical-content slots (the credibility piece both real
 * verticals omitted). Proves a second brand from config/tokens ALONE — same
 * components, different data. All copy placeholder + hedged; no real demographic
 * targeting claims, no real meds, no real prices.
 */
export const peer: BrandConfig = {
  brandId: "brd_demo_peer",
  name: "Peer Path",
  tagline: "A placeholder wordmark for the VERTICAL overlay demo.",
  logo: { wordmark: "PEER PATH", mark: "P" },
  theme: {
    colorBg: "#fbf7f4",
    colorSurface: "#ffffff",
    colorText: "#241a17",
    colorMuted: "#7a6b64",
    colorPrimary: "#b8562f",
    colorPrimaryContrast: "#ffffff",
    colorAccent: "#f6e3d6",
    colorBorder: "#ece0d8",
    fontSans: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    radius: "18px",
    maxWidth: "1040px",
    // Rethemes the intake skin via tokens ONLY (INTAKE-SKIN-01 §6) — the two-brand
    // retheme proof: aurora keeps the BRAND-01 default (#6D28D9), peer diverges here.
    intake: {
      accent: "#b8562f",
      accentTint: "#f6e3d6",
      canvas: "#fbf7f4",
      ink: "#241a17",
      cardBorder: "#ece0d8",
      radius: "18px",
    },
  },
  entryMode: "prelander",
  navStripOnCampaign: true,
  condition: {
    slug: "placeholder-program",
    name: "Placeholder Program",
    heroHeadline: "Supportive, plain-language headline goes here.",
    heroSub:
      "Placeholder vertical copy. Speak to your audience in their own language. Experiences differ; this is not a promise of results.",
    threeStep: [
      { title: "Tell us about you", body: "A short, judgment-free intake, guided by the server." },
      { title: "Clinician review", body: "A licensed clinician reviews where appropriate." },
      {
        title: "Ongoing support",
        body: "If suitable, we support you over time. Details are placeholders.",
      },
    ],
  },
  skus: [
    {
      id: "sku_entry",
      offeringRef: "offering_launch_starter",
      name: "Entry Option (Placeholder)",
      roleLabel: "Entry option",
      placeholderMolecule: "Compound-A",
      benefit: "Sample entry-tier copy for the vertical brand.",
      priceSlot: "$[PRICE]/mo",
      doseNote: "Same placeholder price across sample doses.",
    },
    {
      id: "sku_premium",
      offeringRef: "offering_launch_premium",
      name: "Higher-Strength Option (Placeholder)",
      roleLabel: "Higher-strength option",
      placeholderMolecule: "Compound-B",
      benefit: "Sample higher-strength copy for the vertical brand.",
      priceSlot: "$[PRICE]/mo",
      doseNote: "Same placeholder price across sample doses.",
    },
  ],
  faq: [
    {
      q: "Is this a fit for me?",
      a: "It depends on your situation and clinician judgment. You may not be suitable — eligibility is decided during review.",
    },
    { q: "What does it cost?", a: "Placeholder pricing slot. Itemize your inclusions honestly." },
    {
      q: "What should I know about safety?",
      a: "Placeholder safety copy — provide balanced, counsel-reviewed risk information.",
    },
    {
      q: "Do you have content specific to my situation?",
      a: "This slot is for audience-specific medical content reviewed by clinicians and counsel — the credibility piece to fill before launch.",
    },
  ],
  testimonials: [
    {
      attribution: "Placeholder Member",
      quote: "A placeholder peer-mirror quote.",
      castingNote: "[casting locked to target audience — metadata only]",
    },
    {
      attribution: "Placeholder Member",
      quote: "Another placeholder peer quote.",
      castingNote: "[casting locked to target audience — metadata only]",
    },
  ],
  clinicians: [
    {
      namePlaceholder: "Dr. [Clinician Name]",
      credentialSlot: "[Credentials, license #, jurisdiction]",
      bioSlot: "[Audience-matched clinician bio slot — fill with real, verifiable details.]",
      photoSlot: "[clinician-photo]",
    },
  ],
  trustTriad: [
    { label: "Private", note: "Placeholder privacy posture (counsel-reviewed)." },
    { label: "Licensed clinicians", note: "Placeholder clinical model." },
    { label: "Discreet shipping", note: "Placeholder fulfillment." },
  ],
  copy: {
    cta_primary: "See if this is a fit",
    cta_secondary: "Learn more",
    member_entry: "Member sign in",
    seal_slot_note: "Certification seal placement only — never ship a seal you have not earned.",
  },
  vertical: {
    identityTagline: "[Ambient identity tagline slot — carried at the brand layer.]",
    negativeExperience: {
      heading: "What we're not",
      body: "Placeholder for the negative-experience / stigma-inversion module. Name the bad experience your audience met elsewhere — as prominent as your benefits — in honest, non-disparaging language.",
    },
    peerMirrorCasting: "[peer-mirror proof: testimonial casting demographic-locked by design]",
    audienceMedicalContent: [
      {
        heading: "Audience medical content slot A",
        body: "[Life-stage / eligibility content, clinician- and counsel-reviewed.]",
      },
      {
        heading: "Audience medical content slot B",
        body: "[Demographic FAQ content, clinician- and counsel-reviewed.]",
      },
    ],
  },
};
