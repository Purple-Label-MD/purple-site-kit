import { apiBase, brandId, isMockMode } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * BFF auth login. In live mode this 302-redirects to the gateway's hosted Universal
 * Login (GET /auth/login?brand=...); the gateway sets its transaction cookie and
 * sends the patient to the login page. In mock mode there is no identity provider,
 * so we redirect to a placeholder notice — the flow shape stays identical.
 */
export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? "/members";
  if (isMockMode()) {
    return NextResponse.redirect(new URL("/members/mock-auth", request.url));
  }
  const target = new URL(`${apiBase()}/auth/login`);
  target.searchParams.set("brand", brandId());
  target.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(target.toString());
}
