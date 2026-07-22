import { Shell } from "@/components/Shell";
import { getActiveBrand } from "@/lib/brand";

/**
 * Placeholder auth notice shown in credential-free mock mode in place of the hosted
 * Universal Login flow. In live mode the BFF auth routes redirect to the gateway's
 * /auth/login and /auth/logout instead, and the gateway owns /auth/callback (it sets
 * the session cookie and returns the patient to your returnTo page).
 */
export default async function MockAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ logout?: string }>;
}) {
  const { logout } = await searchParams;
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Auth (mock)</div>
          <h1>{logout ? "Signed out (mock)" : "Sign in (mock)"}</h1>
          <p className="muted" style={{ maxWidth: 620 }}>
            This is the credential-free placeholder for the hosted login flow. Set a real gateway
            base URL and API key to exercise Universal Login end to end. The auth trio is:
          </p>
          <ul className="muted">
            <li>
              <code>GET /auth/login</code> — begins Universal Login, redirects to the login page.
            </li>
            <li>
              <code>GET /auth/callback</code> — completes login, starts the session (gateway-owned).
            </li>
            <li>
              <code>GET /auth/logout</code> — ends the session (return URL is brand-allowlisted).
            </li>
          </ul>
          <a className="btn" href="/">
            Back to home
          </a>
        </div>
      </section>
    </Shell>
  );
}
