/**
 * Synthetic instrument definition for the built-in mock.
 *
 * PLACEHOLDER, NON-MEDICAL scaffolding only (extraction law + placeholder-copy law):
 * no real condition, no real medication, no real eligibility logic. Every node here
 * exists to exercise ONE renderer capability so the drop-in component can be verified
 * end-to-end without credentials. The live server owns the real sequence; this is a
 * stand-in the client code treats identically to the real thing.
 *
 * WI-043: the select nodes carry the ratified INT-A-09 presentation model —
 * `options: {code, label, sub?, exclusive?}` + `min_selections` + a server `progress`
 * fraction — so the INTAKE-SKIN-01 renderer runs against the target shape and the
 * gateway catch-up (edge.yaml presentation-model micro, a purple-build item) needs
 * zero kit changes. `exclusive` is a data flag, never inferred from label text.
 */

import type { RenderedNode } from "@/lib/purple/types";

/** A mock node plus the minimal server-side validation the mock enforces. */
export interface MockNode {
  node: RenderedNode;
  /** Option code that, if combined with any other, is a server-side exclusive-option violation. */
  exclusiveCode?: string;
}

export const MOCK_SECTIONS = {
  intro: "sec_intro",
  about: "sec_about_you",
  contact: "sec_contact",
  shipping: "sec_shipping",
  review: "sec_review",
} as const;

/**
 * The synthetic node plan. Order is server-owned; the client cannot skip or reorder.
 * Copy is deliberately generic placeholder text, hedged where it makes any claim.
 * `progress` is a coarse but honest server-derived fraction (not client-fabricated).
 */
export const MOCK_NODES: MockNode[] = [
  {
    node: {
      node_id: "nd_intro",
      kind: "display",
      section_id: MOCK_SECTIONS.intro,
      display: "static",
      may_auto_advance: false,
      progress: 0.05,
      copy: "This is a PLACEHOLDER intake for the starter template. Replace every question, option, and label with your own program's server-authored instrument. Nothing here is medical guidance.",
    },
  },
  {
    node: {
      node_id: "nd_goal",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "single_select",
      fact: "placeholder_goal",
      required: true,
      progress: 0.18,
      options: [
        { code: "opt_goal_a", label: "Sample goal A" },
        { code: "opt_goal_b", label: "Sample goal B" },
        { code: "opt_goal_c", label: "Sample goal C" },
        { code: "opt_none", label: "None of these", exclusive: true },
      ],
      copy: "Which placeholder goal best describes you? (Sample single-select — swap for your own.)",
    },
    // Demonstrates exclusive-option semantics: "none" cannot be combined with others.
    exclusiveCode: "opt_none",
  },
  {
    node: {
      node_id: "nd_band",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "single_select",
      fact: "placeholder_band",
      required: true,
      progress: 0.3,
      // Banded choice: the classification rides INSIDE the option (label + muted sub),
      // so the evaluator receives a stable code — never free text, never client parsing.
      options: [
        { code: "opt_band_1", label: "Sample range one", sub: "Band A (placeholder)" },
        { code: "opt_band_2", label: "Sample range two", sub: "Band B (placeholder)" },
        { code: "opt_band_3", label: "Sample range three", sub: "Band C (placeholder)" },
        { code: "opt_band_unknown", label: "I'm not sure", sub: "We may ask you to check" },
      ],
      copy: "Pick the closest sample band. (Banded single-select — the classification is built into each option.)",
    },
  },
  {
    node: {
      node_id: "nd_prefs",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "multi_select",
      fact: "placeholder_preferences",
      required: false,
      min_selections: 0,
      progress: 0.45,
      options: [
        { code: "opt_pref_x", label: "Sample preference X" },
        { code: "opt_pref_y", label: "Sample preference Y" },
        { code: "opt_pref_z", label: "Sample preference Z" },
        { code: "opt_pref_none", label: "None of these", exclusive: true },
      ],
      copy: "Select any sample preferences that apply. (Multi-select placeholder; exclusive 'None' clears the rest.)",
    },
    exclusiveCode: "opt_pref_none",
  },
  {
    // DEGRADED-PATH fixture (WI-043 Δ1): a pre-INT-A-09 gateway node — the server
    // enforces exclusivity (exclusiveCode) but the options carry NO `exclusive` flag,
    // so the client can't clear structurally. Selecting the exclusive option WITH a
    // sibling must resolve SILENTLY on the 422 (most-recent wins, one auto-resubmit,
    // no error copy). Exclusivity is never inferred from the "None" label (INT-A-07).
    node: {
      node_id: "nd_prefs_legacy",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "multi_select",
      fact: "placeholder_preferences_legacy",
      required: false,
      progress: 0.5,
      option_codes: ["opt_leg_a", "opt_leg_b", "opt_leg_none"],
      copy: "Sample legacy multi-select (pre-INT-A-09 gateway; degraded exclusive path).",
    },
    exclusiveCode: "opt_leg_none",
  },
  {
    node: {
      node_id: "nd_range",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "number_pair",
      fact: "placeholder_range",
      required: true,
      progress: 0.55,
      copy: "Enter a sample low and high number. (Number-pair placeholder — not a health metric.)",
    },
  },
  {
    node: {
      node_id: "nd_note",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "text",
      fact: "placeholder_note",
      required: false,
      progress: 0.62,
      copy: "Add an optional free-text note. (Text placeholder.)",
    },
  },
  {
    node: {
      node_id: "nd_email",
      kind: "question",
      section_id: MOCK_SECTIONS.contact,
      control: "email",
      fact: "contact_email",
      required: true,
      progress: 0.72,
      // prefill=confirm: a value staged from an entry link is ALWAYS shown for
      // explicit confirmation, never silently accepted.
      prefill: "confirm",
      copy: "Confirm the best contact email. (Any value prefilled from your entry link is shown here for confirmation only.)",
    },
  },
  {
    node: {
      node_id: "nd_address",
      kind: "question",
      section_id: MOCK_SECTIONS.shipping,
      control: "address",
      fact: "shipping_address",
      required: true,
      progress: 0.83,
      copy: "Start typing a sample shipping address and pick a suggestion. (Address-typeahead placeholder.)",
    },
  },
  {
    node: {
      node_id: "nd_photo",
      kind: "question",
      section_id: MOCK_SECTIONS.shipping,
      control: "file",
      fact: "placeholder_document",
      required: false,
      progress: 0.92,
      media: {
        kind: "image",
        capture_mode: "record_or_upload",
        accept: ["image/png", "image/jpeg"],
        max_bytes: 5_000_000,
        facing: "environment",
      },
      copy: "Optionally attach a sample image. (File-capture placeholder — uploads as an opaque reference; no image content is inspected.)",
    },
  },
  {
    node: {
      node_id: "nd_summary",
      kind: "display",
      section_id: MOCK_SECTIONS.review,
      display: "computed",
      computed_stub: true,
      progress: 0.98,
      copy: "Review complete. On a live instrument the server may render a computed summary here. This is a placeholder.",
    },
  },
];

/** Total node count — used only for a coarse, server-derived step indicator. */
export const MOCK_NODE_COUNT = MOCK_NODES.length;
