/**
 * Synthetic instrument definition for the built-in mock.
 *
 * PLACEHOLDER, NON-MEDICAL scaffolding only (extraction law + placeholder-copy law):
 * no real condition, no real medication, no real eligibility logic. Every node here
 * exists to exercise ONE renderer capability so the drop-in component can be verified
 * end-to-end without credentials. The live server owns the real sequence; this is a
 * stand-in the client code treats identically to the real thing.
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
 */
export const MOCK_NODES: MockNode[] = [
  {
    node: {
      node_id: "nd_intro",
      kind: "display",
      section_id: MOCK_SECTIONS.intro,
      display: "static",
      may_auto_advance: false,
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
      option_codes: ["opt_goal_a", "opt_goal_b", "opt_goal_c", "opt_none"],
      copy: "Which placeholder goal best describes you? (Sample single-select — swap for your own.)",
    },
    // Demonstrates exclusive-option semantics: "none" cannot be combined with others.
    exclusiveCode: "opt_none",
  },
  {
    node: {
      node_id: "nd_prefs",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "multi_select",
      fact: "placeholder_preferences",
      required: false,
      option_codes: ["opt_pref_x", "opt_pref_y", "opt_pref_z"],
      copy: "Select any sample preferences that apply. (Multi-select placeholder.)",
    },
  },
  {
    node: {
      node_id: "nd_range",
      kind: "question",
      section_id: MOCK_SECTIONS.about,
      control: "number_pair",
      fact: "placeholder_range",
      required: true,
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
      copy: "Review complete. On a live instrument the server may render a computed summary here. This is a placeholder.",
    },
  },
];

/** Total node count — used only for a coarse, server-derived step indicator. */
export const MOCK_NODE_COUNT = MOCK_NODES.length;
