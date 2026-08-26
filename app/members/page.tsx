import { Shell } from "@/components/Shell";
import { PlaceholderNote } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Member sign in",
  description:
    "Member entry — the auth-trio surface. Passwordless hosted sign-in via the gateway; this is operator-facing scaffolding for a fork.",
});

/**
 * Member entry — the auth-trio surface (Scope 2). Login/logout are hosted Universal
 * Login flows on the gateway (passwordless email code, Google, or Apple — never a
 * patient password); the callback completes sign-in. These links go through the
 * app's BFF auth routes, which redirect to the configured gateway (or a mock notice).
 */
export default function MembersPage() {
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Members</div>
          <h1>Member sign in</h1>
          {!brand.contentReviewed ? (
            <PlaceholderNote>
              member portal is a slot — wire real destinations post-auth
            </PlaceholderNote>
          ) : null}
          <p className="muted" style={{ maxWidth: 620 }}>
            Sign-in uses hosted Universal Login (passwordless email, Google, or Apple). No patient
            password is ever collected here. On return, the callback starts a short-lived session.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <a className="btn" href="/api/purple/auth/login">
              Sign in
            </a>
            <a className="btn btn--secondary" href="/api/purple/auth/logout">
              Sign out
            </a>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            In credential-free mock mode these show a placeholder notice instead of contacting a
            live identity provider.
          </p>
        </div>
      </section>
    </Shell>
  );
}
