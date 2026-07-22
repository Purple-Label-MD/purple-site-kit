import type { WebhookDeliveryEnvelope } from "@/lib/purple/types";
import { DEMO_WEBHOOK_SECRET, resolveWebhookSecret, signBody } from "@/lib/purple/webhook-verify";
import { NextResponse } from "next/server";

/**
 * Receiver self-test: POSTs a correctly-signed delivery (expect 200) and a tampered
 * one (expect 401) to the example receiver, proving signature verification fails
 * closed. Hits the real receiver route over the same origin.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const receiver = `${origin}/api/webhooks/receiver`;
  const secret = resolveWebhookSecret();

  const envelope: WebhookDeliveryEnvelope = {
    delivery_id: "whd_0000000000000000000000000000000000000000",
    event: {
      id: "evt_selftest",
      name: "journey.intake.submitted.v1",
      occurred_at: "2026-01-01T00:00:00.000Z",
      tenant_id: "cli_demo_mock",
      brand_id: "brd_demo",
      journey_id: "jny_selftest",
      test: true,
    },
  };
  const raw = JSON.stringify(envelope);
  const goodSig = signBody(secret, raw);
  const badSig = signBody(`${secret}_tampered`, raw);

  async function fire(sig: string) {
    const res = await fetch(receiver, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Purple-Signature": sig,
        "X-Purple-Delivery": envelope.delivery_id,
        "X-Purple-Event": envelope.event.name,
      },
      body: raw,
      cache: "no-store",
    });
    return res.status;
  }

  const validStatus = await fire(goodSig);
  const tamperedStatus = await fire(badSig);

  return NextResponse.json({
    usingDemoSecret: secret === DEMO_WEBHOOK_SECRET,
    valid: { status: validStatus, expected: 200, pass: validStatus === 200 },
    tampered: { status: tamperedStatus, expected: 401, pass: tamperedStatus === 401 },
    allPass: validStatus === 200 && tamperedStatus === 401,
  });
}
