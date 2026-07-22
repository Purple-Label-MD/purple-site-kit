/**
 * Outbound-webhook signature verification (Scope 2), server-only.
 *
 * Every delivery carries X-Purple-Signature: "v1=" + hex(HMAC-SHA256(secret, raw
 * body bytes)). Verify against the RAW bytes with a constant-time compare — the
 * outbound mirror of the platform's ingress discipline (edge.yaml WebhookDelivery-
 * Envelope). Never parse-then-reserialize before verifying; sign/verify the exact
 * bytes received.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { webhookSecret } from "@/lib/config";

/** A built-in demo secret so the receiver self-test works credential-free in mock mode. */
export const DEMO_WEBHOOK_SECRET = "psig_demo_local_only_not_a_real_secret";

/** The secret the receiver verifies against: the configured one, or the demo fallback. */
export function resolveWebhookSecret(): string {
  return webhookSecret() ?? DEMO_WEBHOOK_SECRET;
}

/** Compute the signature header value for raw body bytes. */
export function signBody(secret: string, rawBody: string): string {
  const hex = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return `v1=${hex}`;
}

/** Constant-time verification of an X-Purple-Signature header against raw bytes. */
export function verifySignature(secret: string, rawBody: string, header: string | null): boolean {
  if (!header || !header.startsWith("v1=")) return false;
  const expected = signBody(secret, rawBody);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
