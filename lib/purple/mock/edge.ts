/**
 * In-process synthetic edge/journey API for credential-free local runs and CI.
 *
 * This mirrors the shape and key server-authoritative behaviours of the real
 * contracts (edge.yaml + journey.yaml) so the client code path is byte-identical
 * whether it talks to this mock or the live gateway — the ONLY difference is the
 * configured base URL. Session state is process-memory; fine for a demo, never a
 * production store. Contains NO real medical, pricing, or credential data.
 */

import { MOCK_NODES, MOCK_NODE_COUNT } from "@/lib/purple/mock/instrument";
import type {
  AddressSuggestion,
  AnswerValue,
  EdgeTenantContext,
  InstrumentStep,
  PublicJourneyStatus,
  PublicJourneyStatusRead,
  WebhookEventCatalogEntry,
  WebhookRegistrationCreate,
  WebhookRegistrationCreated,
  WebhookTestFireResult,
} from "@/lib/purple/types";

interface Session {
  sessionId: string;
  journeyId: string;
  index: number;
  status: "active" | "complete" | "abandoned";
  prefillEmail?: string;
  promo?: string;
  redirect?: string;
  test?: boolean;
}

const SESSIONS = new Map<string, Session>();

function rid(prefix: string): string {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-x`;
  return `${prefix}_${rand.replace(/-/g, "").slice(0, 24)}`;
}

function stepFor(session: Session, extra?: Partial<InstrumentStep>): InstrumentStep {
  const atEnd = session.index >= MOCK_NODE_COUNT;
  const complete = session.status === "complete" || atEnd;
  const node = complete ? null : structuredClone(MOCK_NODES[session.index]?.node);
  // Stage a prefill onto the confirm node: it renders as prefilled_value and is
  // ALWAYS confirmed explicitly — never silently accepted (edge.yaml prefill=confirm).
  if (node && node.prefill === "confirm" && node.fact === "contact_email" && session.prefillEmail) {
    node.prefilled_value = session.prefillEmail;
  }
  const base: InstrumentStep = {
    session_id: session.sessionId,
    journey_id: session.journeyId,
    // A coarse, SERVER-derived indicator — not a fabricated percentage. The client
    // renders progress from these signals only (the server owns the sequence).
    status: session.status === "abandoned" ? "abandoned" : complete ? "complete" : "active",
    node,
    flags: [],
  };
  if (base.status === "complete") {
    session.status = "complete";
    base.handoff = {
      ...(session.redirect ? { redirect: session.redirect } : {}),
      ...(session.promo ? { promo: session.promo } : {}),
      test: session.test ?? false,
    };
  }
  return { ...base, ...extra };
}

export interface ResolveParams {
  journey_id?: string;
  offering?: string;
  prefill_email?: string;
  prefill_phone?: string;
  promo?: string;
  redirect?: string;
  test?: string;
}

/** GET /instrument/resolve — mint (or resume) a session and return the first node. */
export function mockResolve(params: ResolveParams): InstrumentStep {
  if (params.journey_id) {
    for (const s of SESSIONS.values()) {
      if (s.journeyId === params.journey_id) return stepFor(s);
    }
  }
  const session: Session = {
    sessionId: rid("ses"),
    journeyId: rid("jny"),
    index: 0,
    status: "active",
    prefillEmail: params.prefill_email,
    promo: params.promo,
    redirect: params.redirect,
    test: params.test === "true" || params.test === "1",
  };
  SESSIONS.set(session.sessionId, session);
  const step = stepFor(session);
  // Surface a staged prefill on the confirm node when the flow reaches it; here we
  // just attach it to the session so the email node can render prefilled_value.
  return step;
}

/** POST /instrument/next — validate the answer, advance exactly one step. */
export function mockNext(sessionId: string, answer?: AnswerValue): InstrumentStep {
  const session = SESSIONS.get(sessionId);
  if (!session) {
    // No session → behave like a fresh mint so the demo never dead-ends.
    return mockResolve({});
  }
  if (session.status !== "active") return stepFor(session);

  const current = MOCK_NODES[session.index];
  if (current) {
    const issue = validateAnswer(current.exclusiveCode, current.node.required, answer);
    if (issue) {
      // 422-equivalent: do not advance; return issues on the SAME node.
      return stepFor(session, { issues: [issue] });
    }
  }
  session.index += 1;
  return stepFor(session);
}

function validateAnswer(
  exclusiveCode: string | undefined,
  required: boolean | undefined,
  answer?: AnswerValue,
): { code: string; message: string } | null {
  const codes = answer?.codes ?? [];
  if (exclusiveCode && codes.includes(exclusiveCode) && codes.length > 1) {
    return {
      code: "exclusive_option_violation",
      message: "That option cannot be combined with any other selection.",
    };
  }
  const hasValue =
    (answer?.codes?.length ?? 0) > 0 ||
    answer?.value !== undefined ||
    (answer?.pair?.length ?? 0) === 2 ||
    answer?.confirmed === true ||
    answer?.address !== undefined ||
    answer?.media !== undefined;
  if (required && !hasValue) {
    return { code: "required", message: "This question is required." };
  }
  return null;
}

/** POST /instrument/abandon — mark the session dropped-off. */
export function mockAbandon(sessionId: string): InstrumentStep {
  const session = SESSIONS.get(sessionId);
  if (!session) return mockResolve({});
  session.status = "abandoned";
  return stepFor(session);
}

/** GET /instrument/address/suggest — synthetic, obviously-placeholder suggestions. */
export function mockAddressSuggest(partial: string): AddressSuggestion[] {
  const trimmed = partial.trim();
  if (trimmed.length < 2) return [];
  return [1, 2, 3].map((n) => ({
    id: `addr_sample_${n}`,
    label: `${trimmed} — Sample Suite ${n}00, Example City, ST 00000 (PLACEHOLDER)`,
  }));
}

const STATUS_ROTATION: PublicJourneyStatus[] = ["RECEIVED", "IN_REVIEW", "APPROVED"];
const POST_CHECKOUT_ROTATION: PublicJourneyStatus[] = ["PREPARING", "SHIPPED"];

/**
 * Journeys that completed the mock hosted-checkout walk (WI-084 §4). Process-memory
 * only, same discipline as SESSIONS above — a demo signal, never a production store.
 */
const CHECKOUT_COMPLETED = new Set<string>();

/** GET /journeys/{id}/status — synthetic status projection (identifiers + status only). */
export function mockJourneyStatus(journeyId: string): PublicJourneyStatusRead {
  // Deterministic pick from the id so repeated reads are stable.
  const n = [...journeyId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rotation = CHECKOUT_COMPLETED.has(journeyId) ? POST_CHECKOUT_ROTATION : STATUS_ROTATION;
  return {
    journey_id: journeyId,
    public_status: rotation[n % rotation.length],
    status_version: "v1",
  };
}

/**
 * Mock-only: simulate the hosted checkout's completion signal so the credential-
 * free walkthrough can observe a visible post-checkout status change (WI-084 §4).
 * There is no live counterpart — the real hosted door owns real order truth, which
 * the kit has no public read for (see WI-084 exit report). Callers MUST guard this
 * behind isMockMode() themselves; this module never checks it.
 */
export function mockCompleteCheckout(journeyId: string): PublicJourneyStatusRead {
  CHECKOUT_COMPLETED.add(journeyId);
  return mockJourneyStatus(journeyId);
}

/** GET /webhooks/event-types — a representative slice of the projected catalog. */
export function mockEventTypes(): WebhookEventCatalogEntry[] {
  return [
    {
      name: "journey.prospect.captured.v1",
      family: "journey",
      correlation: "journey_id",
      description: "A prospect was captured and the enrollment journey started.",
    },
    {
      name: "journey.intake.submitted.v1",
      family: "journey",
      correlation: "journey_id",
      description: "The intake questionnaire was submitted.",
    },
    {
      name: "journey.identity.bound.v1",
      family: "journey",
      correlation: "journey_id",
      description: "A patient identity was bound to the journey.",
    },
    {
      name: "journey.step.abandoned.v1",
      family: "journey",
      correlation: "journey_id",
      description: "The patient dropped off before finishing a step.",
    },
    {
      name: "onboarding.client.completed.v1",
      family: "onboarding",
      correlation: "onboarding_id",
      description: "A client finished onboarding.",
    },
  ];
}

/** POST /webhooks/registrations — returns the signing secret ONCE (mock secret). */
export function mockRegisterWebhook(
  brandId: string,
  body: WebhookRegistrationCreate,
): WebhookRegistrationCreated {
  const registration_id = rid("whr");
  return {
    data: {
      registration_id,
      client_id: "cli_demo_mock",
      brand_id: brandId,
      url: body.url,
      event_types: body.event_types,
      enabled: true,
      secret_set: true,
      created_at: new Date().toISOString(),
    },
    secret: rid("psig"),
  };
}

/** POST /webhooks/registrations/{id}/test — single-shot mock delivery outcome. */
export function mockTestFire(): WebhookTestFireResult {
  return { ok: true, delivery_id: rid("whd"), delivered: true, status: 200 };
}

/** GET /tenants/self — echo a synthetic trusted context. */
export function mockTenantSelf(brandId: string): EdgeTenantContext {
  return { client_id: "cli_demo_mock", brand_id: brandId };
}
