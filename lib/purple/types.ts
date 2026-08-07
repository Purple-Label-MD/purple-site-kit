/**
 * Types projected from the Purple public contracts (purple-build
 * packages/contracts/openapi/edge.yaml + journey.yaml). Kept as a hand-maintained
 * subset covering exactly the operations this template calls. The server is always
 * authoritative — these describe the wire shape, not client-owned behaviour.
 */

// ── Intake (edge.yaml /instrument/*) ──────────────────────────────────────────

export type InstrumentStatus = "active" | "complete" | "abandoned";

/**
 * A rendered option in the ratified INT-A-09 presentation model: a STABLE code plus
 * presentation metadata. `exclusive` is the both-ends hint (INT-A-09): the renderer
 * clears siblings when it is set, and the server independently rejects an
 * exclusive-plus-siblings submission. When the live gateway predates this shape it
 * omits it and the renderer falls back to `option_codes` + the silent-422 path.
 * Exclusivity is NEVER inferred from label text (INT-A-07).
 */
export interface RenderedOption {
  code: string;
  label?: string;
  /** Optional banded sub-label (classification rides inside the option, not free text). */
  sub?: string;
  /** Both-ends exclusive hint — selecting this clears siblings and vice-versa. */
  exclusive?: boolean;
}

/** RenderedNode — PRESENTATION ONLY. The client never owns sequence/controls/order. */
export interface RenderedNode {
  node_id: string;
  kind: "question" | "display" | "consent";
  section_id: string;
  control?: string;
  fact?: string;
  /** Bare stable codes — the shipped shape; the renderer humanizes labels when this is all it has. */
  option_codes?: string[];
  /** Ratified INT-A-09 presentation model — preferred when present (carries label/sub/exclusive). */
  options?: RenderedOption[];
  /** Minimum selections for a multi-select (gating). Absent ⇒ the renderer uses `required` as a min=1 proxy. */
  min_selections?: number;
  /** Server-supplied progress fraction 0..1 (honest under branching). Absent ⇒ no fabricated %. */
  progress?: number;
  required?: boolean;
  /** collect | suppress | confirm — a prefilled value ALWAYS renders at `confirm`. */
  prefill?: "collect" | "suppress" | "confirm";
  prefilled_value?: unknown;
  may_auto_advance?: boolean;
  display?: "static" | "computed";
  offering_refs?: string[];
  computed_stub?: boolean;
  /** Brand theme/copy overlay ride-along — presentation only. */
  theme?: Record<string, unknown>;
  copy?: string;
  /** Display/consent presentation content: headline/body plus namespaced keys
   *  (e.g. `offering.<ref>.name` on offer interstitials) and, on kind:"consent",
   *  the affirmation_label the patient explicitly agrees to (WI-214). */
  content?: { headline?: string; body?: string; affirmation_label?: string } & Record<
    string,
    string | undefined
  >;
  /** kind:"consent" — the version string echoed back in the ConsentAck answer. */
  consent_version?: string;
  /** kind:"consent" — what the affirmation grants (e.g. "treatment"). */
  grants?: string[];
  media?: MediaConfig;
}

export interface MediaConfig {
  kind: "image" | "video";
  capture_mode?: "upload" | "record" | "record_or_upload";
  facing?: "user" | "environment";
  min_duration_s?: number;
  max_duration_s?: number;
  accept?: string[];
  max_bytes?: number;
  resumable?: boolean;
  require_consent?: boolean;
  consent_version?: string;
  consent_fact?: string;
}

export interface ControlIssue {
  code: string;
  message: string;
}

/** Post-completion hand-off; never carries patient data. */
export interface EntryHandoff {
  redirect?: string;
  promo?: string;
  test?: boolean;
}

export interface InstrumentStep {
  session_id: string;
  journey_id: string;
  status: InstrumentStatus;
  node?: RenderedNode | null;
  flags?: string[];
  /** Live edge shape: progress rides the STEP as an object; the mock's legacy
      shape is a bare fraction on the node. The renderer accepts both. */
  progress?: { scope?: string; position_estimate?: number };
  issues?: ControlIssue[];
  handoff?: EntryHandoff;
}

export interface NormalizedAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface AddressAnswer {
  suggestion_id?: string;
  manual?: NormalizedAddress;
  override_state_mismatch?: boolean;
}

export interface MediaAnswer {
  upload_ref: string;
  content_type?: string;
  byte_size?: number;
  duration_s?: number;
}

export interface ConsentAck {
  acknowledged: boolean;
  version?: string;
}

/** An answer for the current question, interpreted per its control type. */
export interface AnswerValue {
  codes?: string[];
  value?: unknown;
  pair?: [number, number];
  confirmed?: boolean;
  address?: AddressAnswer;
  media?: MediaAnswer;
  consent?: ConsentAck;
}

export interface InstrumentNextRequest {
  session_id: string;
  answer?: AnswerValue;
}

export interface AddressSuggestion {
  id: string;
  label: string;
}

// ── Journey status (journey.yaml /journeys/{id}/status) ───────────────────────

export type PublicJourneyStatus =
  | "RECEIVED"
  | "IN_REVIEW"
  | "ACTION_NEEDED"
  | "APPROVED"
  | "DECLINED"
  | "ON_HOLD"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "SUPERSEDED"
  | "REFILL_DUE";

export interface PublicJourneyStatusRead {
  journey_id: string;
  public_status: PublicJourneyStatus;
  status_version: "v1";
}

// ── Webhooks (edge.yaml /webhooks/*) ──────────────────────────────────────────

export type WebhookFamily = "journey" | "onboarding";

export interface WebhookEventCatalogEntry {
  name: string;
  family: WebhookFamily;
  correlation: "journey_id" | "onboarding_id";
  description: string;
}

export interface WebhookRegistrationCreate {
  url: string;
  event_types: string[];
}

export interface WebhookRegistrationView {
  registration_id: string;
  client_id: string;
  brand_id: string;
  url: string;
  event_types: string[];
  enabled: boolean;
  secret_set: true;
  created_at: string;
}

export interface WebhookRegistrationCreated {
  data: WebhookRegistrationView;
  /** The HMAC signing secret (psig_…), shown ONCE. */
  secret: string;
}

/** The outbound webhook body a registered endpoint receives (event-reference mode). */
export interface WebhookEventReference {
  id: string;
  name: string;
  occurred_at: string;
  tenant_id: string;
  brand_id: string;
  journey_id?: string;
  onboarding_id?: string;
  test: boolean;
}

export interface WebhookDeliveryEnvelope {
  delivery_id: string;
  event: WebhookEventReference;
}

export interface WebhookTestFireResult {
  ok: true;
  delivery_id: string;
  delivered: boolean;
  status?: number;
}

// ── Tenant context (edge.yaml /tenants/self) ──────────────────────────────────

export interface EdgeTenantContext {
  client_id: string;
  brand_id: string;
  journey_id?: string;
}
