"use client";

/**
 * Headless intake renderer — the drop-in component (Scope 2).
 *
 * Drives the server-authoritative resolve→next loop through the same-origin BFF:
 *   • one node per screen; the server owns sequence, options, and completion
 *   • exclusive-option semantics (server rejects; we surface the 422 issue)
 *   • a prefilled value ALWAYS renders a confirm step — never silently accepted
 *   • file capture via an opaque upload reference (no bytes inlined)
 *   • address typeahead against /instrument/address/suggest
 *   • abandon on drop-off
 *   • progress from SERVER signals only (status + section_id) — never a fabricated %
 *
 * The client decides nothing clinical: it renders what the server returns and
 * submits answers back. Swapping the API base URL (mock ↔ live) changes nothing here.
 */

import type {
  AddressSuggestion,
  AnswerValue,
  InstrumentStep,
  RenderedNode,
} from "@/lib/purple/types";
import { useCallback, useEffect, useRef, useState } from "react";

type Draft = {
  codes: string[];
  value: string;
  pairLo: string;
  pairHi: string;
  addressSuggestionId?: string;
  addressLabel?: string;
  uploadRef?: string;
};

const EMPTY_DRAFT: Draft = { codes: [], value: "", pairLo: "", pairHi: "" };

export function IntakeRenderer({ initialQuery }: { initialQuery: string }) {
  const [step, setStep] = useState<InstrumentStep | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);

  const loadFirst = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/purple/instrument/resolve${initialQuery}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as InstrumentStep;
      sessionRef.current = data.session_id;
      setStep(data);
    } catch {
      setError("Could not start the intake. Check your API configuration.");
    } finally {
      setBusy(false);
    }
  }, [initialQuery]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  // Reset the per-node draft whenever the node changes; seed the confirm step with
  // the server-supplied prefilled value so the patient confirms it explicitly.
  const node = step?.node;
  useEffect(() => {
    if (!node) return;
    setDraft({
      ...EMPTY_DRAFT,
      value:
        node.prefill === "confirm" && node.prefilled_value != null
          ? String(node.prefilled_value)
          : "",
    });
  }, [node]);

  // Best-effort abandon beacon if the patient leaves mid-flow.
  useEffect(() => {
    return () => {
      const sid = sessionRef.current;
      if (sid && step && step.status === "active" && typeof navigator !== "undefined") {
        navigator.sendBeacon?.(
          "/api/purple/instrument/abandon",
          new Blob([JSON.stringify({ session_id: sid })], { type: "application/json" }),
        );
      }
    };
  }, [step]);

  async function submit(answer?: AnswerValue) {
    const sid = sessionRef.current;
    if (!sid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/purple/instrument/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, answer }),
      });
      const data = (await res.json()) as InstrumentStep;
      setStep(data);
    } catch {
      setError("Could not submit your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
        <button type="button" className="btn" onClick={loadFirst}>
          Retry
        </button>
      </div>
    );
  }
  if (!step) return <div className="card">Starting…</div>;

  if (step.status === "complete") {
    return <CompleteView step={step} />;
  }
  if (step.status === "abandoned") {
    return (
      <div className="card">
        <p>This session was marked abandoned. You can start again.</p>
        <button type="button" className="btn" onClick={loadFirst}>
          Start over
        </button>
      </div>
    );
  }

  if (!node) return <div className="card">Loading next step…</div>;

  return (
    <div>
      <ProgressLine node={node} />
      <div className="card" style={{ marginTop: 12 }}>
        {node.copy ? <p style={{ marginTop: 0 }}>{node.copy}</p> : null}
        <NodeControl node={node} draft={draft} setDraft={setDraft} />
        {step.issues?.length ? (
          <ul style={{ color: "#b00", fontSize: 14 }}>
            {step.issues.map((i) => (
              <li key={i.code}>{i.message}</li>
            ))}
          </ul>
        ) : null}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => submit(buildAnswer(node, draft))}
          >
            {node.kind === "display" ? "Continue" : "Next"}
          </button>
          {node.prefill === "confirm" ? (
            <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
              Prefilled from your link — confirm or edit before continuing.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Progress rendered from server signals ONLY — status + section, never a fake %. */
function ProgressLine({ node }: { node: RenderedNode }) {
  return (
    <div className="eyebrow" aria-live="polite">
      Section: {node.section_id.replace(/^sec_/, "").replace(/_/g, " ")}
    </div>
  );
}

function buildAnswer(node: RenderedNode, draft: Draft): AnswerValue | undefined {
  switch (node.control) {
    case "single_select":
    case "multi_select":
      return { codes: draft.codes };
    case "number_pair": {
      const lo = Number(draft.pairLo);
      const hi = Number(draft.pairHi);
      if (Number.isNaN(lo) || Number.isNaN(hi)) return {};
      return { pair: [lo, hi] };
    }
    case "text":
      return { value: draft.value };
    case "email":
      // A confirm step records an explicit patient action, never silent acceptance.
      return { value: draft.value, confirmed: node.prefill === "confirm" ? true : undefined };
    case "address":
      return draft.addressSuggestionId
        ? { address: { suggestion_id: draft.addressSuggestionId } }
        : {};
    case "file":
      return draft.uploadRef
        ? { media: { upload_ref: draft.uploadRef, content_type: "image/png" } }
        : {};
    default:
      return undefined; // display nodes advance with no answer
  }
}

function NodeControl({
  node,
  draft,
  setDraft,
}: {
  node: RenderedNode;
  draft: Draft;
  setDraft: (d: Draft) => void;
}) {
  const options = node.option_codes ?? [];
  switch (node.control) {
    case "single_select":
      return (
        <fieldset style={{ border: "none", padding: 0 }}>
          {options.map((code) => (
            <label key={code} style={{ display: "block", margin: "6px 0" }}>
              <input
                type="radio"
                name={node.node_id}
                checked={draft.codes[0] === code}
                onChange={() => setDraft({ ...draft, codes: [code] })}
              />{" "}
              {labelFor(code)}
            </label>
          ))}
        </fieldset>
      );
    case "multi_select":
      return (
        <fieldset style={{ border: "none", padding: 0 }}>
          {options.map((code) => (
            <label key={code} style={{ display: "block", margin: "6px 0" }}>
              <input
                type="checkbox"
                checked={draft.codes.includes(code)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    codes: e.target.checked
                      ? [...draft.codes, code]
                      : draft.codes.filter((c) => c !== code),
                  })
                }
              />{" "}
              {labelFor(code)}
            </label>
          ))}
        </fieldset>
      );
    case "number_pair":
      return (
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="number"
            placeholder="Low"
            value={draft.pairLo}
            onChange={(e) => setDraft({ ...draft, pairLo: e.target.value })}
          />
          <input
            type="number"
            placeholder="High"
            value={draft.pairHi}
            onChange={(e) => setDraft({ ...draft, pairHi: e.target.value })}
          />
        </div>
      );
    case "text":
      return (
        <textarea
          rows={3}
          style={{ width: "100%" }}
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
      );
    case "email":
      return (
        <input
          type="email"
          style={{ width: "100%" }}
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
      );
    case "address":
      return <AddressControl draft={draft} setDraft={setDraft} />;
    case "file":
      return <FileControl draft={draft} setDraft={setDraft} media={node.media} />;
    default:
      return null; // display
  }
}

function AddressControl({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/purple/instrument/address/suggest?partial=${encodeURIComponent(q)}`,
      );
      const data = (await res.json()) as { suggestions: AddressSuggestion[] };
      if (active) setSuggestions(data.suggestions ?? []);
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);
  return (
    <div>
      <input
        type="text"
        style={{ width: "100%" }}
        placeholder="Start typing an address…"
        value={draft.addressLabel ?? q}
        onChange={(e) => {
          setQ(e.target.value);
          setDraft({ ...draft, addressLabel: undefined, addressSuggestionId: undefined });
        }}
      />
      {suggestions.length ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "8px 0 0",
            border: "1px solid var(--c-border)",
          }}
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: 8,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setDraft({ ...draft, addressSuggestionId: s.id, addressLabel: s.label });
                  setSuggestions([]);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileControl({
  draft,
  setDraft,
  media,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  media?: RenderedNode["media"];
}) {
  return (
    <div>
      <input
        type="file"
        accept={media?.accept?.join(",")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          // Placeholder upload path: a real fork uploads bytes to a short-lived
          // pre-signed URL and submits the returned opaque reference — never inline
          // bytes. Here we synthesize a reference so the flow is demonstrable.
          if (f) setDraft({ ...draft, uploadRef: `upl_sample_${f.name.replace(/\W+/g, "_")}` });
        }}
      />
      {draft.uploadRef ? (
        <div className="muted" style={{ fontSize: 13 }}>
          Staged upload reference: {draft.uploadRef} (placeholder)
        </div>
      ) : null}
    </div>
  );
}

function CompleteView({ step }: { step: InstrumentStep }) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Intake complete (placeholder)</h2>
      <p className="muted">
        The server marked this session complete. Session <code>{step.session_id}</code>, enrollment{" "}
        <code>{step.journey_id}</code>.
      </p>
      <p>
        You can check enrollment status any time on the{" "}
        <a href={`/status?journey_id=${encodeURIComponent(step.journey_id)}`}>status page</a>.
      </p>
      <a className="btn" href={`/checkout?journey_id=${encodeURIComponent(step.journey_id)}`}>
        Continue to checkout (stub)
      </a>
      {step.handoff ? (
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Entry hand-off present (redirect/promo/test are validated server-side; never patient
          data).
        </p>
      ) : null}
    </div>
  );
}

function labelFor(code: string): string {
  // Placeholder humanizer — a live instrument supplies real option labels/copy.
  return code.replace(/^opt_/, "").replace(/_/g, " ");
}
