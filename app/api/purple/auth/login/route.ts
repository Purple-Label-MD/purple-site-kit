import { apiBase, brandId, isMockMode } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * BFF auth login. In live mode this 302-redirects to the gateway's hosted Universal
 * Login (GET /auth/login?brand=...); the gateway sets its transaction cookie and
 * sends the patient to the login page. In mock mode there is no identity provider,
 * so we redirect to a placeholder notice — the flow shape stays identical.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/members";
  if (isMockMode()) {
    return NextResponse.redirect(new URL("/members/mock-auth", request.url));
  }
  const target = new URL(`${apiBase()}/auth/login`);
  target.searchParams.set("brand", brandId());
  // The gateway honors returnTo only when it is an ABSOLUTE https URL on the brand's
  // redirect allowlist — a bare path like "/members" can never match, so resolve it
  // against this deployment's own origin before handing it over.
  target.searchParams.set("returnTo", new URL(returnTo, url.origin).toString());
  const connection = url.searchParams.get("connection");
  if (connection) target.searchParams.set("connection", connection);
  return NextResponse.redirect(target.toString());
}
