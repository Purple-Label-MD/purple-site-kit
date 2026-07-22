import { suggestAddress } from "@/lib/purple/client";
import { NextResponse } from "next/server";

/** Same-origin BFF for GET /instrument/address/suggest. */
export async function GET(request: Request) {
  const partial = new URL(request.url).searchParams.get("partial") ?? "";
  try {
    const suggestions = await suggestAddress(partial);
    return NextResponse.json({ suggestions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "suggest failed" },
      { status: 502 },
    );
  }
}
