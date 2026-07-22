/**
 * Types projected from the Purple public contracts (purple-build
 * packages/contracts/openapi/edge.yaml + journey.yaml). Kept as a hand-maintained
 * subset covering exactly the operations this template calls. The server is always
 * authoritative — these describe the wire shape, not client-owned behaviour.
 */

// ── Intake (edge.yaml /instrument/*) ──────────────────────────────────────────

export type InstrumentStatus = "active" | "complete" | "abandoned";

/** RenderedNode — PRESENTATION ONLY. The client never owns sequence/controls/order. */
export interface RenderedNode {
  node_id: string;
  kind: "question" | "display";
  section_id: string;
  control?: string;
  fact?: string;
  option_codes?: string[];
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
