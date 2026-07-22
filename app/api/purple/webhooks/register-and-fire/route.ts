import { createWebhookRegistration, testFireWebhook } from "@/lib/purple/client";
import { NextResponse } from "next/server";

/**
 * Demo BFF: registers a webhook endpoint (pointed at this app's own receiver) and
 * test-fires it, returning both results. The signing secret is returned by the
 * registration ONCE — a real fork stores it immediately to verify deliveries.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const created = await createWebhookRegistration({
      url: `${origin}/api/webhooks/receiver`,
      event_types: ["journey.intake.submitted.v1", "journey.step.abandoned.v1"],
    });
    const fired = await testFireWebhook(created.data.registration_id);
    return NextResponse.json({
      registration: {
        registration_id: created.data.registration_id,
        url: created.data.url,
        event_types: created.data.event_types,
        secret_set: created.data.secret_set,
      },
      // Never echo the secret to the browser in a real app; shown here only to make
      // the "shown once" contract visible in the demo.
      secret_preview: `${created.secret.slice(0, 12)}… (store this now — shown once)`,
      test_fire: fired,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "webhook demo failed" },
      { status: 502 },
    );
  }
}
