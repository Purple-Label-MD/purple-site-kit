/**
 * Single source of truth for runtime configuration.
 *
 * ZERO hardcoded endpoints (acceptance criterion + copy-guard rule): every Purple
 * API call resolves its base URL from here, which reads it from the environment.
 * When no base URL is configured the template points at its own in-repo synthetic
 * mock so a fresh clone is runnable and demonstrable with no credentials.
 */

/** The projected public gateway base, INCLUDING the `/v1` prefix (edge.yaml `servers`). */
function rawApiBase(): string | undefined {
  const v = process.env.NEXT_PUBLIC_PURPLE_API_BASE?.trim();
  return v && v.length > 0 ? v : undefined;
}

/**
 * Mock mode is on when explicitly requested OR whenever no real base URL is set.
 * This is what makes the credential-free walkthrough possible; flip it off by
 * setting a real base URL (and, optionally, NEXT_PUBLIC_PURPLE_MOCK=false).
 */
export function isMockMode(): boolean {
  const explicit = process.env.NEXT_PUBLIC_PURPLE_MOCK?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  return rawApiBase() === undefined;
}

/**
 * The live gateway base URL every request is built from. Callers append the
 * operation path (e.g. `/instrument/resolve`) — they never spell out a host.
 * Only reached in live mode; mock mode is served in-process by lib/purple/mock.
 */
export function apiBase(): string {
  const base = rawApiBase();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_PURPLE_API_BASE is required in live mode. Set it in .env.local " +
        "or leave it blank to run against the built-in synthetic mock.",
    );
  }
  return base.replace(/\/+$/, "");
}

/** The active brand id (brd_...) — selects the brand config and rides as X-Brand-Id. */
export function brandId(): string {
  return process.env.NEXT_PUBLIC_PURPLE_BRAND_ID?.trim() || "brd_demo_aurora";
}

/** A stable offering ref preselected on entry links (never a free-text product name). */
export function defaultOfferingRef(): string | undefined {
  return process.env.NEXT_PUBLIC_PURPLE_OFFERING_REF?.trim() || undefined;
}

/** Server-only: per-client M2M API key. Never exposed to the browser. */
export function apiKey(): string | undefined {
  return process.env.PURPLE_API_KEY?.trim() || undefined;
}

/** Server-only: HMAC signing secret for verifying inbound webhook deliveries. */
export function webhookSecret(): string | undefined {
  return process.env.PURPLE_WEBHOOK_SECRET?.trim() || undefined;
}
