/**
 * Server-only Purple API client.
 *
 * The ONE place requests are built. Browser code never calls the gateway directly
 * (that would leak the API key); it calls this app's same-origin BFF routes under
 * /api/purple, which call these functions server-side. In mock mode every call is
 * served in-process by lib/purple/mock; in live mode it hits the configured gateway
 * base URL with the per-client bearer key. No endpoint host is ever hardcoded.
 */

import { apiBase, apiKey, brandId, isMockMode } from "@/lib/config";
import * as mock from "@/lib/purple/mock/edge";
import type { ResolveParams } from "@/lib/purple/mock/edge";
import type {
  AddressSuggestion,
  AnswerValue,
  EdgeTenantContext,
  InstrumentStep,
  PublicJourneyStatusRead,
  WebhookEventCatalogEntry,
  WebhookRegistrationCreate,
  WebhookRegistrationCreated,
  WebhookTestFireResult,
} from "@/lib/purple/types";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = apiKey();
  if (!key) {
    throw new Error("PURPLE_API_KEY is required in live mode (server-side only).");
  }
  return {
    Authorization: `Bearer ${key}`,
    "X-Brand-Id": brandId(),
    ...extra,
  };
}

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const problem = body as { title?: string; detail?: string };
    throw new PurpleApiError(
      res.status,
      problem.detail || problem.title || `Purple API error ${res.status}`,
      body,
    );
  }
  return body as T;
}

export class PurpleApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "PurpleApiError";
  }
}

// ── Intake ────────────────────────────────────────────────────────────────────

export async function resolveInstrument(params: ResolveParams): Promise<InstrumentStep> {
  if (isMockMode()) return mock.mockResolve(params);
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  );
  const res = await fetch(`${apiBase()}/instrument/resolve?${qs}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  return parse<InstrumentStep>(res);
}

export async function nextInstrument(
  sessionId: string,
  answer?: AnswerValue,
): Promise<InstrumentStep> {
  if (isMockMode()) return mock.mockNext(sessionId, answer);
  const res = await fetch(`${apiBase()}/instrument/next`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ session_id: sessionId, answer }),
    cache: "no-store",
  });
  // 422 carries the same InstrumentStep shape (issues, no advance).
  if (res.status === 422) return (await res.json()) as InstrumentStep;
  return parse<InstrumentStep>(res);
}

export async function suggestAddress(partial: string): Promise<AddressSuggestion[]> {
  if (isMockMode()) return mock.mockAddressSuggest(partial);
  const qs = new URLSearchParams({ partial });
  const res = await fetch(`${apiBase()}/instrument/address/suggest?${qs}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  const body = await parse<{ suggestions: AddressSuggestion[] }>(res);
  return body.suggestions;
}

export async function abandonInstrument(sessionId: string): Promise<InstrumentStep> {
  if (isMockMode()) return mock.mockAbandon(sessionId);
  const res = await fetch(`${apiBase()}/instrument/abandon`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ session_id: sessionId }),
    cache: "no-store",
  });
  return parse<InstrumentStep>(res);
}

// ── Journey status ──────────────────────────────────────────────────────────

export async function readJourneyStatus(journeyId: string): Promise<PublicJourneyStatusRead> {
  if (isMockMode()) return mock.mockJourneyStatus(journeyId);
  const res = await fetch(`${apiBase()}/journeys/${encodeURIComponent(journeyId)}/status`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  return parse<PublicJourneyStatusRead>(res);
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function listWebhookEventTypes(): Promise<WebhookEventCatalogEntry[]> {
  if (isMockMode()) return mock.mockEventTypes();
  const res = await fetch(`${apiBase()}/webhooks/event-types`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  const body = await parse<{ data: WebhookEventCatalogEntry[] }>(res);
  return body.data;
}

export async function createWebhookRegistration(
  body: WebhookRegistrationCreate,
): Promise<WebhookRegistrationCreated> {
  if (isMockMode()) return mock.mockRegisterWebhook(brandId(), body);
  const res = await fetch(`${apiBase()}/webhooks/registrations`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<WebhookRegistrationCreated>(res);
}

export async function testFireWebhook(
  registrationId: string,
  eventType?: string,
): Promise<WebhookTestFireResult> {
  if (isMockMode()) return mock.mockTestFire();
  const res = await fetch(
    `${apiBase()}/webhooks/registrations/${encodeURIComponent(registrationId)}/test`,
    {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(eventType ? { event_type: eventType } : {}),
      cache: "no-store",
    },
  );
  const body = await parse<{ data: WebhookTestFireResult }>(res);
  return body.data;
}

// ── Tenant context ────────────────────────────────────────────────────────────

export async function tenantSelf(): Promise<EdgeTenantContext> {
  if (isMockMode()) return mock.mockTenantSelf(brandId());
  const res = await fetch(`${apiBase()}/tenants/self`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  const body = await parse<{ data: EdgeTenantContext }>(res);
  return body.data;
}
