/**
 * Registry of legal-slot pages (Scope 5). Each is a certification-readiness element
 * that ships as a MARKED PLACEHOLDER — never real legal text. The reviewed legal
 * pack is a separate, counsel-gated deliverable (decomposition ③), expressly not
 * this work item.
 */

export interface LegalSlot {
  slug: string;
  title: string;
  /** What certification review looks for on this surface. */
  reviewNeeds: string;
  /** Placeholder bullet points a fork/counsel fills in. */
  points: string[];
}

export const LEGAL_SLOTS: Record<string, LegalSlot> = {
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    reviewNeeds: "Terms of service / use, governing the patient relationship and platform use.",
    points: [
      "[Scope of service + platform-vs-medical-practice roles]",
      "[Eligibility + acceptable use]",
      "[Payment, billing cadence, and itemized inclusions — no bundled promise that contradicts the model]",
      "[Limitation of liability + dispute terms]",
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    reviewNeeds: "How patient data is collected, used, shared, and protected; HIPAA posture.",
    points: [
      "[Categories of data collected + purposes]",
      "[Sharing with pharmacies / clinicians / processors]",
      "[Patient rights + how to exercise them]",
      "[Security posture + breach handling]",
    ],
  },
  consent: {
    slug: "consent",
    title: "Consent",
    reviewNeeds:
      "Telehealth informed consent + consent to communications, surfaced at the right point.",
    points: [
      "[Telehealth informed-consent language]",
      "[Consent to record (if any capture step requires it)]",
      "[Communications / contact consent]",
    ],
  },
  returns: {
    slug: "returns",
    title: "Returns & Fulfillment Policy",
    reviewNeeds: "Fulfillment, cancellation, and returns terms — consistent across every surface.",
    points: [
      "[Fulfillment + shipping expectations]",
      "[Cancellation window + how to cancel, surfaced at point of sale]",
      "[Returns reality for medication + any compensating guarantee]",
    ],
  },
  "provider-disclosure": {
    slug: "provider-disclosure",
    title: "Provider Disclosure",
    reviewNeeds: "Who the providers are, entity separation, and licensure disclosures.",
    points: [
      "[Independent medical practice / provider network identity]",
      "[Entity-separation disclosure: technology platform vs medical practice]",
      "[State licensure + how to verify]",
    ],
  },
};

export const LEGAL_SLUGS = Object.keys(LEGAL_SLOTS);
