import type { WebhookDeliveryEnvelope } from "@/lib/purple/types";
import { resolveWebhookSecret, verifySignature } from "@/lib/purple/webhook-verify";
import { NextResponse } from "next/server";

/**
 * Example webhook receiver (Scope 2). This is the endpoint you register with Purple.
 *
 * Discipline demonstrated:
 *   • verify X-Purple-Signature against the RAW bytes with a constant-time compare
 *     BEFORE trusting anything in the body; reject with 401 on mismatch (fail closed)
 *   • event-reference mode: the body carries identifiers + type only, never detail —
 *     fetch full detail through the authenticated API under your own token
 *   • X-Purple-Delivery is the idempotency key; de-dupe on it in a real handler
 *
 * A fork points its registration URL here (or copies this handler).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-purple-signature");
  const secret = resolveWebhookSecret();

  if (!verifySignature(secret, raw, signature)) {
    // Fail closed: an unverifiable delivery is never processed.
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let envelope: WebhookDeliveryEnvelope;
  try {
    envelope = JSON.parse(raw) as WebhookDeliveryEnvelope;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Reference-only: acknowledge fast, then (in a real handler) enqueue a fetch of the
  // full event detail by id via the authenticated API. We only echo identifiers here.
  const delivery = request.headers.get("x-purple-delivery") ?? envelope.delivery_id;
  return NextResponse.json({
    ok: true,
    acknowledged_delivery: delivery,
    event_id: envelope.event?.id,
    event_name: envelope.event?.name,
    test: envelope.event?.test ?? false,
  });
}
