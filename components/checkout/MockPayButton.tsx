"use client";

import { useState } from "react";

/** Client-side runner for the mock hosted-checkout's "pay" step (WI-084 §4). */
export function MockPayButton({ journeyId }: { journeyId: string }) {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    const res = await fetch("/api/purple/checkout/mock-complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ journey_id: journeyId }),
    });
    setResult(JSON.stringify(await res.json(), null, 2));
    setBusy(false);
  }

  return (
    <div>
      <button type="button" className="btn" disabled={busy || result !== null} onClick={pay}>
        {result ? "Paid (mock)" : "Pay (mock)"}
      </button>
      {result ? (
        <>
          <pre style={{ overflow: "auto", fontSize: 12, marginTop: 10 }}>{result}</pre>
          <a
            className="btn btn--secondary"
            href={`/status?journey_id=${encodeURIComponent(journeyId)}`}
          >
            View status →
          </a>
        </>
      ) : null}
    </div>
  );
}
