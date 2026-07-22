import { abandonInstrument } from "@/lib/purple/client";
import { NextResponse } from "next/server";

/** Same-origin BFF for POST /instrument/abandon. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { session_id?: string };
  if (!body.session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }
  try {
    const step = await abandonInstrument(body.session_id);
    return NextResponse.json(step);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "abandon failed" },
      { status: 502 },
    );
  }
}
