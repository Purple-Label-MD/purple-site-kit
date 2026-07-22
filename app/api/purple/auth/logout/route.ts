import { apiBase, isMockMode } from "@/lib/config";
import { NextResponse } from "next/server";

/** BFF auth logout — redirects to the gateway RP-initiated logout, or a mock notice. */
export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? "/";
  if (isMockMode()) {
    return NextResponse.redirect(new URL("/members/mock-auth?logout=1", request.url));
  }
  const target = new URL(`${apiBase()}/auth/logout`);
  target.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(target.toString());
}
