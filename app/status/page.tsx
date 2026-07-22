import { Shell } from "@/components/Shell";
import { getActiveBrand } from "@/lib/brand";
import { readJourneyStatus } from "@/lib/purple/client";

/**
 * Journey-status read example (Scope 2). A read-only projection: identifiers + a
 * status value only, never patient data, never an input to any decision. Server
 * component — it calls the client directly with the server-side key.
 */
export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ journey_id?: string }>;
}) {
  const { journey_id } = await searchParams;
  const brand = getActiveBrand();

  let statusView: Awaited<ReturnType<typeof readJourneyStatus>> | null = null;
  let error: string | null = null;
  if (journey_id) {
    try {
      statusView = await readJourneyStatus(journey_id);
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not read status.";
    }
  }

  return (
    <Shell brand={brand}>
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="eyebrow">Enrollment status</div>
          <h1>Check enrollment status</h1>
          <form method="get" style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input
              type="text"
              name="journey_id"
              placeholder="jny_…"
              defaultValue={journey_id ?? ""}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn">
              Read status
            </button>
          </form>

          {error ? <p style={{ color: "#b00" }}>{error}</p> : null}
          {statusView ? (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="muted" style={{ fontSize: 13 }}>
                {statusView.journey_id}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
                {statusView.public_status}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                status contract {statusView.status_version} · identifiers + status only
              </div>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 16 }}>
              Enter an enrollment id (jny_…) to read its public status.
            </p>
          )}
        </div>
      </section>
    </Shell>
  );
}
