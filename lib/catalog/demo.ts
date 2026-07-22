import type { Audience, Catalog } from "@/lib/catalog/types";

/**
 * DEMO catalog for the GROWTH archetype (WI-042). ONE catalog, two audience lenses.
 *
 * Proof shape (acceptance): SHARED lines carry both audience ids and render in both
 * lenses; EXCLUSIVE lines carry one id and render in exactly one. Nothing is cloned.
 *
 * All placeholder: fictional programs, placeholder molecules ("Compound-…"), price
 * SLOTS ("$[PRICE]") never real numbers, hedged copy only. Category labels are
 * neutral grouping tokens, not medical or efficacy claims.
 */

export const AUD_A = "aud_a";
export const AUD_B = "aud_b";

/** Two demo audiences (labels/slugs are brand tokens — swap freely in a fork). */
export const demoAudiences: Audience[] = [
  {
    id: AUD_A,
    slug: "group-a",
    label: "Audience A",
    heroHeadline: "A clear, honest headline for Audience A goes here.",
    heroSub:
      "Placeholder audience-A positioning. Speak to this audience in their own language. Experiences differ; nothing here promises an outcome.",
    identityTagline: "[Ambient identity tagline for Audience A — carried at the audience layer.]",
    negativeExperience: {
      heading: "What we're not",
      body: "Placeholder stigma-inversion module. Name the poor experience this audience met elsewhere, honestly and without disparaging anyone — as prominent as the benefits.",
    },
    peerMirrorCasting: "[peer-mirror proof: testimonial casting locked to Audience A by design]",
    audienceMedicalContent: [
      {
        heading: "Audience-A medical content slot",
        body: "[Life-stage / eligibility content specific to this audience, clinician- and counsel-reviewed before launch.]",
      },
    ],
    imagerySlot: "[Audience-A imagery direction — never a shipped licensed asset.]",
  },
  {
    id: AUD_B,
    slug: "group-b",
    label: "Audience B",
    heroHeadline: "A clear, honest headline for Audience B goes here.",
    heroSub:
      "Placeholder audience-B positioning. Same catalog, a different lens. Experiences differ; nothing here promises an outcome.",
    identityTagline: "[Ambient identity tagline for Audience B — carried at the audience layer.]",
    negativeExperience: {
      heading: "What we're not",
      body: "Placeholder stigma-inversion module for Audience B. Replace with honest, non-disparaging language.",
    },
    peerMirrorCasting: "[peer-mirror proof: testimonial casting locked to Audience B by design]",
    audienceMedicalContent: [
      {
        heading: "Audience-B medical content slot",
        body: "[Demographic FAQ / eligibility content specific to this audience, clinician- and counsel-reviewed.]",
      },
    ],
    imagerySlot: "[Audience-B imagery direction — never a shipped licensed asset.]",
  },
];

const ladder = (prefix: string) => [
  {
    id: `${prefix}_1`,
    label: "1 month",
    cadenceNote: "Billed monthly; ships monthly (ship-vs-bill split is config-ready).",
    priceSlot: "$[PRICE]/mo",
  },
  {
    id: `${prefix}_3`,
    label: "3 months",
    cadenceNote: "Billed up front; shown per month. Cadence aligned to the protocol.",
    priceSlot: "$[PRICE]/mo",
  },
  {
    id: `${prefix}_6`,
    label: "6 months",
    cadenceNote: "Billed up front; shown per month. Longest placeholder cadence.",
    priceSlot: "$[PRICE]/mo",
  },
];

const genericFaq = [
  {
    q: "How much does it cost?",
    a: "Pricing is a placeholder slot. Insert your itemized, all-in pricing here; itemize inclusions rather than implying a single bundled promise.",
  },
  {
    q: "Is this right for me?",
    a: "That depends on your situation and a clinician's judgment. Eligibility is decided during review; you may not be suitable.",
  },
  {
    q: "What are the risks and side effects?",
    a: "Placeholder safety copy. Provide balanced risk information reviewed by qualified counsel and clinicians before launch.",
  },
];

const howItWorks = [
  { title: "Share your details", body: "Complete a short, server-guided intake at your own pace." },
  {
    title: "Clinician review",
    body: "A licensed clinician reviews your information where appropriate.",
  },
  {
    title: "Ongoing support",
    body: "If suitable, we support you over time. Details are estimates.",
  },
];

/**
 * The demo catalog. Mix of SHARED (both audiences) and EXCLUSIVE (one) offerings +
 * a gendered lab ladder with individual/package split and therapy on-ramps.
 */
export const demoCatalog: Catalog = {
  offerings: [
    // ── Shared lines (render in BOTH lenses) ──────────────────────────────────
    {
      slug: "metabolic-program",
      name: "Metabolic Program (Placeholder)",
      category: "Metabolic",
      audiences: [AUD_A, AUD_B],
      featured: true,
      roleLabel: "Core program",
      placeholderMolecule: "Compound-A",
      summary: "A sample shared program that appears in both audience lenses.",
      whatItIs:
        "Placeholder description of a shared program. Replace with your own clinician-reviewed positioning.",
      howItWorks,
      supplyTerms: ladder("metabolic"),
      faq: genericFaq,
      labsAdjacent: ["panel-metabolic-screen"],
    },
    {
      slug: "sleep-support",
      name: "Sleep Support (Placeholder)",
      category: "Longevity",
      audiences: [AUD_A, AUD_B],
      featured: true,
      roleLabel: "Everyday program",
      placeholderMolecule: "Compound-B",
      summary: "Another shared line — same catalog node, two lenses.",
      whatItIs: "Placeholder shared-program copy.",
      howItWorks,
      supplyTerms: ladder("sleep"),
      faq: genericFaq,
    },
    {
      slug: "skin-hair",
      name: "Skin & Hair (Placeholder)",
      category: "Appearance",
      audiences: [AUD_A, AUD_B],
      roleLabel: "Everyday program",
      placeholderMolecule: "Compound-C",
      summary: "A shared appearance line, curated into both lenses.",
      whatItIs: "Placeholder shared-program copy.",
      howItWorks,
      supplyTerms: ladder("skinhair"),
      faq: genericFaq,
    },
    // ── Audience-A exclusive ──────────────────────────────────────────────────
    {
      slug: "program-a-only",
      name: "Audience-A Program (Placeholder)",
      category: "Hormone support",
      audiences: [AUD_A],
      featured: true,
      roleLabel: "Audience-A line",
      placeholderMolecule: "Compound-D",
      summary: "An exclusive line that renders ONLY in the Audience-A lens.",
      whatItIs: "Placeholder exclusive-program copy for Audience A.",
      howItWorks,
      supplyTerms: ladder("aonly"),
      faq: genericFaq,
      labsAdjacent: ["panel-a-screen"],
    },
    // ── Audience-B exclusive ──────────────────────────────────────────────────
    {
      slug: "program-b-only",
      name: "Audience-B Program (Placeholder)",
      category: "Hormone support",
      audiences: [AUD_B],
      featured: true,
      roleLabel: "Audience-B line",
      placeholderMolecule: "Compound-E",
      summary: "An exclusive line that renders ONLY in the Audience-B lens.",
      whatItIs: "Placeholder exclusive-program copy for Audience B.",
      howItWorks,
      supplyTerms: ladder("bonly"),
      faq: genericFaq,
      labsAdjacent: ["panel-b-screen"],
    },
  ],
  labPanels: [
    // Gendered ladder — packages (basic / intermediate / advanced × audience)
    {
      slug: "panel-a-basic",
      name: "Audience-A Basic Panel (Placeholder)",
      audiences: [AUD_A],
      tier: "basic",
      kind: "package",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]"],
      why: "Placeholder rationale — explain what this basic panel establishes.",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
    },
    {
      slug: "panel-a-intermediate",
      name: "Audience-A Intermediate Panel (Placeholder)",
      audiences: [AUD_A],
      tier: "intermediate",
      kind: "package",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]", "[Marker 4]"],
      why: "Placeholder rationale for the intermediate rung.",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
    },
    {
      slug: "panel-a-advanced",
      name: "Audience-A Advanced Panel (Placeholder)",
      audiences: [AUD_A],
      tier: "advanced",
      kind: "package",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]", "[Marker 4]", "[Marker 5]"],
      why: "Placeholder rationale for the advanced rung.",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
    },
    {
      slug: "panel-b-basic",
      name: "Audience-B Basic Panel (Placeholder)",
      audiences: [AUD_B],
      tier: "basic",
      kind: "package",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]"],
      why: "Placeholder rationale for the Audience-B basic panel.",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
    },
    {
      slug: "panel-b-advanced",
      name: "Audience-B Advanced Panel (Placeholder)",
      audiences: [AUD_B],
      tier: "advanced",
      kind: "package",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]", "[Marker 4]", "[Marker 5]"],
      why: "Placeholder rationale for the Audience-B advanced panel.",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
    },
    // Shared individual panel
    {
      slug: "panel-metabolic-screen",
      name: "Metabolic Screen (Placeholder)",
      audiences: [AUD_A, AUD_B],
      tier: "basic",
      kind: "individual",
      whatsTested: ["[Marker 1]", "[Marker 2]"],
      why: "Placeholder shared individual-panel rationale.",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
      therapyOnRamp: ["metabolic-program"],
    },
    // Therapy-adjacent individual panels — qualification-as-product (§6)
    {
      slug: "panel-a-screen",
      name: "Audience-A Program Screen (Placeholder)",
      audiences: [AUD_A],
      tier: "intermediate",
      kind: "individual",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]"],
      why: "A screening panel a customer buys to enter the Audience-A program funnel (qualification-as-product).",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
      therapyOnRamp: ["program-a-only"],
    },
    {
      slug: "panel-b-screen",
      name: "Audience-B Program Screen (Placeholder)",
      audiences: [AUD_B],
      tier: "intermediate",
      kind: "individual",
      whatsTested: ["[Marker 1]", "[Marker 2]", "[Marker 3]"],
      why: "A screening panel a customer buys to enter the Audience-B program funnel (qualification-as-product).",
      sampleType: "[sample type]",
      turnaround: "[turnaround estimate]",
      therapyOnRamp: ["program-b-only"],
    },
  ],
};
