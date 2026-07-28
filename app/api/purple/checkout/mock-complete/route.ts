import { isMockMode } from "@/lib/config";
import { mockCompleteCheckout } from "@/lib/purple/mock/edge";
import { NextResponse } from "next/server";

/**
 * Mock-only BFF: simulates the hosted checkout's completion signal (WI-084 §4).
 * There is no live equivalent — real order truth lives entirely on the hosted
 * door, and the kit has no public read for it (see the WI-084 exit report). This
 * route exists solely so the credential-free mock walkthrough stays end-to-end.
 */
export async function POST(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json(
      { error: "mock-complete is only available in mock mode" },
      { status: 400 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as { journey_id?: string };
  if (!body.journey_id) {
    return NextResponse.json({ error: "journey_id is required" }, { status: 400 });
  }
  const status = mockCompleteCheckout(body.journey_id);
  return NextResponse.json({ ok: true, status });
}
