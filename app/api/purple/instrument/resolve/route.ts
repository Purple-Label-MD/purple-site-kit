import { resolveInstrument } from "@/lib/purple/client";
import type { ResolveParams } from "@/lib/purple/mock/edge";
import { NextResponse } from "next/server";

/**
 * Same-origin BFF for GET /instrument/resolve. The browser calls here; the API key
 * (if any) is attached server-side and never reaches the client. Entry-context query
 * params are forwarded verbatim — the server treats them as untrusted regardless.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const keys = [
    "journey_id",
    "offering",
    "prefill_email",
    "prefill_phone",
    "promo",
    "redirect",
    "test",
    "phase",
  ] as const;
  const params: ResolveParams = {};
  for (const k of keys) {
    const v = url.searchParams.get(k);
    if (v) (params as Record<string, string>)[k] = v;
  }
  try {
    const step = await resolveInstrument(params);
    return NextResponse.json(step);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "resolve failed" },
      { status: 502 },
    );
  }
}
