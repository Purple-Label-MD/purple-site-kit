"use client";

import { useState } from "react";

/** Client-side demo runner for the webhook register/fire flow and receiver self-test. */
export function WebhookDemo() {
  const [regResult, setRegResult] = useState<string | null>(null);
  const [selfTest, setSelfTest] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runRegister() {
    setBusy(true);
    const res = await fetch("/api/purple/webhooks/register-and-fire", { method: "POST" });
    setRegResult(JSON.stringify(await res.json(), null, 2));
    setBusy(false);
  }
  async function runSelfTest() {
    setBusy(true);
    const res = await fetch("/api/webhooks/selftest");
    setSelfTest(JSON.stringify(await res.json(), null, 2));
    setBusy(false);
  }

  return (
    <div className="grid grid--2" style={{ marginTop: 16 }}>
      <div className="card">
        <strong>Register + test-fire</strong>
        <p className="muted" style={{ fontSize: 14 }}>
          Registers a webhook pointed at this app&rsquo;s receiver and fires a test event.
        </p>
        <button type="button" className="btn" disabled={busy} onClick={runRegister}>
          Run
        </button>
        {regResult ? (
          <pre style={{ overflow: "auto", fontSize: 12, marginTop: 10 }}>{regResult}</pre>
        ) : null}
      </div>
      <div className="card">
        <strong>Receiver signature self-test</strong>
        <p className="muted" style={{ fontSize: 14 }}>
          Sends a valid delivery (expect 200) and a tampered one (expect 401) to prove the receiver
          fails closed.
        </p>
        <button type="button" className="btn" disabled={busy} onClick={runSelfTest}>
          Run
        </button>
        {selfTest ? (
          <pre style={{ overflow: "auto", fontSize: 12, marginTop: 10 }}>{selfTest}</pre>
        ) : null}
      </div>
    </div>
  );
}
