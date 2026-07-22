import { nextInstrument } from "@/lib/purple/client";
import type { AnswerValue } from "@/lib/purple/types";
import { NextResponse } from "next/server";

/** Same-origin BFF for POST /instrument/next. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    session_id?: string;
    answer?: AnswerValue;
  };
  if (!body.session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }
  try {
    const step = await nextInstrument(body.session_id, body.answer);
    return NextResponse.json(step);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "next failed" },
      { status: 502 },
    );
  }
}
