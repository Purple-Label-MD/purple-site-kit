import { Shell } from "@/components/Shell";
import { WebhookDemo } from "@/components/webhooks/WebhookDemo";
import { getActiveBrand } from "@/lib/brand";
import { listWebhookEventTypes } from "@/lib/purple/client";

/**
 * Webhooks example page (Scope 2): the event catalog, the register/test-fire flow,
 * and the receiver self-test. This is operator-facing documentation for a fork, not
 * a patient surface.
 */
export default async function WebhooksPage() {
  const brand = getActiveBrand();
  let events: Awaited<ReturnType<typeof listWebhookEventTypes>> = [];
  let error: string | null = null;
  try {
    events = await listWebhookEventTypes();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load event types.";
  }

  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Integrations</div>
          <h1>Webhooks</h1>
          <p className="muted" style={{ maxWidth: 640 }}>
            Deliveries are reference-only: the body carries identifiers + event type, and you fetch
            full detail through the authenticated API under your own token. Verify every
            delivery&rsquo;s
            <code> X-Purple-Signature</code> against the raw bytes before trusting it.
          </p>

          <h2 style={{ marginTop: 24 }}>Event catalog</h2>
          {error ? <p style={{ color: "#b00" }}>{error}</p> : null}
          <div className="grid grid--2" style={{ marginTop: 8 }}>
            {events.map((e) => (
              <div key={e.name} className="card">
                <code>{e.name}</code>
                <div className="muted" style={{ fontSize: 13 }}>
                  {e.family} · carries {e.correlation}
                </div>
                <p style={{ fontSize: 14, margin: "6px 0 0" }}>{e.description}</p>
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: 24 }}>Try it</h2>
          <WebhookDemo />
        </div>
      </section>
    </Shell>
  );
}
