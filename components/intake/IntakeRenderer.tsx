"use client";

/**
 * Headless intake renderer — the drop-in component, skinned to INTAKE-SKIN-01 (WI-043).
 *
 * The server-authoritative loop is UNCHANGED (INT-A-04): resolve→next→complete through
 * the same-origin BFF, presentation metadata + abandon hook + server-supplied progress
 * exactly as shipped. Only the PRESENTATION/behavior layer is the skin:
 *   • one question per screen, canvas-vs-card depth, centered headline
 *   • single-select cards: click → highlight → 220ms confirm dwell → auto-advance
 *     (input locked during dwell); number keys 1–9 select
 *   • multi-select cards: right-edge accent check; STRUCTURAL exclusive semantics when
 *     the ratified `option.exclusive` flag is present (clear siblings both directions,
 *     no error copy); when the flag is absent the server's 422 drives a SILENT degraded
 *     resolution (most-recent wins, one auto-resubmit, no banner) — WI-043 Δ1
 *   • sticky Continue with visible gating; thin server-fraction progress bar; Back
 *     (client history over visited steps — the contract is forward-only); escape hatch
 *   • 240ms slide-in, `prefers-reduced-motion` ⇒ instant (dwell + slide drop to 0)
 *
 * Exclusivity is a DATA flag, never inferred from label text (INT-A-07). The client
 * decides nothing clinical: it renders what the server returns and submits answers back.
 */

import {
  isContinueEnabled,
  numberKeyIndex,
  optionsOf,
  resolveExclusive422,
  toggleMulti,
} from "@/lib/intake/logic.mjs";
import type {
  AddressSuggestion,
  AnswerValue,
  ControlIssue,
  InstrumentStep,
  RenderedNode,
} from "@/lib/purple/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
const EXCLUSIVE_ISSUE = "exclusive_option_violation";

function seedDraft(node?: RenderedNode | null): Draft {
  return {
    ...EMPTY_DRAFT,
    value:
      node?.prefill === "confirm" && node.prefilled_value != null
        ? String(node.prefilled_value)
        : "",
  };
}

type Visited = { step: InstrumentStep; draft: Draft };

export function IntakeRenderer({ initialQuery }: { initialQuery: string }) {
  const [visited, setVisited] = useState<Visited[]>([]);
  const [pos, setPos] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The offering ref this session entered with (WI-084): the completion step never
  // returns it (the node is null once complete), so it must ride from entry —
  // the checkout handoff's `offering_ref` is required, never optional there.
  const offeringRef = useMemo(
    () => new URLSearchParams(initialQuery).get("offering") ?? undefined,
    [initialQuery],
  );
  const sessionRef = useRef<string | null>(null);
  const leftKeyRef = useRef<string[]>([]); // answer key used to advance FROM visited[i]
  const lastToggledRef = useRef<string | undefined>(undefined);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }, []);

  const current = visited[pos] ?? null;
  const step = current?.step ?? null;
  const draft = current?.draft ?? EMPTY_DRAFT;
  const node = step?.node ?? null;

  const setDraft = useCallback(
    (d: Draft) => {
      setVisited((v) => v.map((entry, i) => (i === pos ? { ...entry, draft: d } : entry)));
    },
    [pos],
  );

  const loadFirst = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/purple/instrument/resolve${initialQuery}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as InstrumentStep;
      sessionRef.current = data.session_id;
      leftKeyRef.current = [];
      setVisited([{ step: data, draft: seedDraft(data.node) }]);
      setPos(0);
    } catch {
      setError("Could not start the intake. Check your API configuration.");
    } finally {
      setBusy(false);
    }
  }, [initialQuery]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  // Best-effort abandon beacon if the patient leaves mid-flow. This must fire ONLY on
  // real unmount — a [step]-dependency here would fire the cleanup on every advance and
  // abandon the live session. So we read the latest status from a ref and use empty deps.
  const statusRef = useRef<string | undefined>(undefined);
  statusRef.current = step?.status;
  useEffect(() => {
    return () => {
      const sid = sessionRef.current;
      if (sid && statusRef.current === "active" && typeof navigator !== "undefined") {
        navigator.sendBeacon?.(
          "/api/purple/instrument/abandon",
          new Blob([JSON.stringify({ session_id: sid })], { type: "application/json" }),
        );
      }
    };
  }, []);

  const callNext = useCallback(async (answer?: AnswerValue): Promise<InstrumentStep | null> => {
    const sid = sessionRef.current;
    if (!sid) return null;
    const res = await fetch("/api/purple/instrument/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, answer }),
    });
    return (await res.json()) as InstrumentStep;
  }, []);

  const advanceServer = useCallback(
    async (answer: AnswerValue | undefined, answerKey: string) => {
      setBusy(true);
      setError(null);
      try {
        let data = await callNext(answer);
        // Silent degraded resolution (WI-043 Δ1): a 422 exclusivity rejection with no
        // client-side flag ⇒ most-recent wins, ONE auto-resubmit, NEVER an error nag.
        if (
          data &&
          data.status === "active" &&
          data.issues?.some((i) => i.code === EXCLUSIVE_ISSUE)
        ) {
          const collapsed = resolveExclusive422(lastToggledRef.current);
          data = await callNext({ codes: collapsed });
        }
        if (!data) return;
        // Drop any exclusivity issue from view — it is never surfaced as copy.
        const visibleIssues = (data.issues ?? []).filter((i) => i.code !== EXCLUSIVE_ISSUE);
        const shownStep: InstrumentStep =
          visibleIssues.length === data.issues?.length ? data : { ...data, issues: visibleIssues };
        setVisited((v) => {
          const next = v.slice(0, pos + 1);
          // A rejection re-serves the SAME node with issues — keep the typed
          // draft so the visitor can correct it instead of retyping.
          const rejected =
            visibleIssues.length > 0 &&
            !!shownStep.node?.node_id &&
            shownStep.node.node_id === v[pos]?.step.node?.node_id;
          next.push({
            step: shownStep,
            draft: rejected ? v[pos].draft : seedDraft(shownStep.node),
          });
          return next;
        });
        leftKeyRef.current[pos] = answerKey;
        setPos((p) => p + 1);
      } catch {
        setError("Could not submit your answer. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [callNext, pos],
  );

  const advance = useCallback(
    (answer?: AnswerValue) => {
      const answerKey = JSON.stringify(answer ?? null);
      // Replay a cached forward step when the answer is unchanged (Back→Next with no edit),
      // so the forward-only server contract is never double-advanced.
      if (pos < visited.length - 1 && leftKeyRef.current[pos] === answerKey) {
        setPos((p) => p + 1);
        return;
      }
      void advanceServer(answer, answerKey);
    },
    [advanceServer, pos, visited.length],
  );

  const back = useCallback(() => {
    setError(null);
    setPos((p) => (p > 0 ? p - 1 : p));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="pl-stage">
        <div className="pl-card" style={{ cursor: "default" }}>
          <span>{error}</span>
        </div>
        <div className="pl-footer">
          <button type="button" className="pl-continue" onClick={loadFirst}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!step) return <div className="pl-stage">Starting…</div>;

  const complete = step.status === "complete";
  const abandoned = step.status === "abandoned";
  const pct = complete ? 100 : Math.round((node?.progress ?? 0) * 100);
  const canBack = pos > 0 && !complete && !abandoned;

  return (
    <>
      <div className="pl-chrome">
        <div className="pl-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="pl-nav">
          <button
            type="button"
            className="pl-back"
            onClick={back}
            disabled={!canBack}
            aria-label="Previous question"
          >
            ← Back
          </button>
          <a className="pl-help" href="/contact">
            Contact us
          </a>
        </div>
      </div>

      <main className="pl-stage">
        <div className="pl-node" key={`${step.session_id}-${pos}`} aria-live="polite">
          {complete ? (
            <CompleteView step={step} offering={offeringRef} />
          ) : abandoned ? (
            <>
              <div className="pl-node-anim">
                <h1 className="pl-headline">This session was marked abandoned.</h1>
              </div>
              <div className="pl-footer">
                <button type="button" className="pl-continue" onClick={loadFirst}>
                  Start over
                </button>
              </div>
            </>
          ) : node ? (
            <NodeView
              node={node}
              issues={step.issues}
              draft={draft}
              setDraft={setDraft}
              busy={busy}
              reduced={reducedRef}
              lastToggled={lastToggledRef}
              onAdvance={advance}
            />
          ) : (
            <h1 className="pl-headline">Loading…</h1>
          )}
        </div>
      </main>
    </>
  );
}

function NodeView({
  node,
  issues,
  draft,
  setDraft,
  busy,
  reduced,
  lastToggled,
  onAdvance,
}: {
  node: RenderedNode;
  issues?: ControlIssue[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  busy: boolean;
  reduced: React.RefObject<boolean>;
  lastToggled: React.RefObject<string | undefined>;
  onAdvance: (a?: AnswerValue) => void;
}) {
  const [locked, setLocked] = useState(false);
  const options = useMemo(() => optionsOf(node), [node]);
  // Live edge control vocabulary (see member-portal intake-walk.tsx): the gateway emits
  // `single_select_cards` / `multi_select_cards` / `search_select`, not the mock's bare
  // `single_select` / `multi_select`. Treat the card variants as their select kind.
  const isSingle = node.control === "single_select" || node.control === "single_select_cards";
  const isMulti =
    node.control === "multi_select" ||
    node.control === "multi_select_cards" ||
    node.control === "search_select";
  const isDisplay = node.kind === "display" || !node.control;

  // single-select: tap → highlight → confirm dwell → auto-advance (input locked).
  function pickSingle(code: string) {
    if (locked) return;
    setDraft({ ...draft, codes: [code] });
    setLocked(true);
    const dwell = reduced.current ? 0 : 340; // 220ms dwell + 120ms grace
    window.setTimeout(() => onAdvance({ codes: [code] }), dwell);
  }

  function toggle(code: string) {
    lastToggled.current = code;
    setDraft({ ...draft, codes: toggleMulti(draft.codes, node, code) });
  }

  const footerEnabled = isMulti
    ? isContinueEnabled(node, draft.codes.length)
    : controlHasValue(node, draft);

  return (
    <>
      {/* Animated content wrapper — the fixed .pl-footer stays OUTSIDE it (see
          .pl-node-anim in globals.css for why). */}
      <div className="pl-node-anim">
        <h1 className="pl-headline">{headlineOf(node)}</h1>

        {issues?.length
          ? issues.map((issue) => (
              <p key={`${issue.code}:${issue.message}`} className="pl-issue" role="alert">
                {issue.message || "Please review your answer."}
              </p>
            ))
          : null}

        {isSingle || isMulti ? (
          <div
            className="pl-options"
            role={isMulti ? "group" : "radiogroup"}
            aria-label={headlineOf(node)}
          >
            {options.map((opt, i) => {
              const checked = draft.codes.includes(opt.code);
              return (
                <button
                  type="button"
                  key={opt.code}
                  className="pl-card"
                  data-code={opt.code}
                  role={isMulti ? "checkbox" : "radio"}
                  aria-checked={checked}
                  disabled={locked}
                  onClick={() => (isMulti ? toggle(opt.code) : pickSingle(opt.code))}
                >
                  <span>
                    {opt.label ?? opt.code}
                    {opt.sub ? <span className="pl-sub">{opt.sub}</span> : null}
                  </span>
                  {isMulti ? (
                    <span className="pl-check" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <title>selected</title>
                        <path d="M2.5 8.5l3.5 3.5 7-8" />
                      </svg>
                    </span>
                  ) : (
                    <span className="pl-kbd" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : isDisplay ? (
          <p className="pl-why">{node.copy}</p>
        ) : (
          <div className="pl-options">
            <FormControl node={node} draft={draft} setDraft={setDraft} />
          </div>
        )}

        {node.prefill === "confirm" ? (
          <p className="pl-why" style={{ fontSize: 13 }}>
            Prefilled from your link — confirm or edit before continuing.
          </p>
        ) : null}
      </div>

      {/* Number-key select for card questions (hidden chip on touch, per CSS). */}
      {isSingle || isMulti ? (
        <KeyboardSelect
          count={options.length}
          onSelect={(i) => (isMulti ? toggle(options[i].code) : pickSingle(options[i].code))}
          canContinue={isMulti && footerEnabled}
          onContinue={() => onAdvance({ codes: draft.codes })}
        />
      ) : null}

      {/* Sticky Continue — shown for everything EXCEPT single-select (which auto-advances). */}
      {!isSingle ? (
        <div className="pl-footer">
          <button
            type="button"
            className="pl-continue"
            disabled={busy || !footerEnabled}
            onClick={() => onAdvance(isDisplay ? undefined : buildAnswer(node, draft))}
          >
            {isDisplay ? "Continue" : "Next"}
          </button>
        </div>
      ) : null}
    </>
  );
}

/** Attaches number-key selection + Enter-to-continue while a card question is mounted. */
function KeyboardSelect({
  count,
  onSelect,
  canContinue,
  onContinue,
}: {
  count: number;
  onSelect: (index: number) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = numberKeyIndex(e.key, count);
      if (idx >= 0) {
        e.preventDefault();
        onSelect(idx);
      } else if (e.key === "Enter" && canContinue) {
        e.preventDefault();
        onContinue();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onSelect, canContinue, onContinue]);
  return null;
}

function headlineOf(node: RenderedNode): string {
  return node.copy ?? node.node_id;
}

function controlHasValue(node: RenderedNode, draft: Draft): boolean {
  if (!node.required) return true;
  switch (node.control) {
    case "number_pair":
      return draft.pairLo.trim() !== "" && draft.pairHi.trim() !== "";
    case "text":
    case "long_text":
    case "phone":
      return draft.value.trim() !== "";
    case "number":
    case "scale":
      return Number.isFinite(Number(draft.value)) && draft.value.trim() !== "";
    case "date": {
      // Gate on a REAL calendar date; birth facts must also be in the past.
      const iso = dateDisplayToIso(draft.value);
      if (!iso) return false;
      return node.fact?.includes("birth") ? iso <= new Date().toISOString().slice(0, 10) : true;
    }
    case "email":
      return /.+@.+\..+/.test(draft.value.trim());
    case "address":
      return !!draft.addressSuggestionId;
    case "file":
      return !!draft.uploadRef;
    default:
      return true;
  }
}

function buildAnswer(node: RenderedNode, draft: Draft): AnswerValue | undefined {
  switch (node.control) {
    case "single_select":
    case "single_select_cards":
    case "multi_select":
    case "multi_select_cards":
    case "search_select":
      return { codes: draft.codes };
    case "number_pair": {
      const lo = Number(draft.pairLo);
      const hi = Number(draft.pairHi);
      if (Number.isNaN(lo) || Number.isNaN(hi)) return {};
      return { pair: [lo, hi] };
    }
    case "text":
    case "long_text":
    case "phone":
      return { value: draft.value };
    case "number":
    case "scale":
      return { value: Number(draft.value) };
    case "date":
      // The wire format stays ISO (what <input type="date"> submitted before).
      return { value: dateDisplayToIso(draft.value) ?? draft.value };
    case "email":
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
      return undefined;
  }
}

function FormControl({
  node,
  draft,
  setDraft,
}: {
  node: RenderedNode;
  issues?: ControlIssue[];
  draft: Draft;
  setDraft: (d: Draft) => void;
}) {
  switch (node.control) {
    case "number_pair":
      return (
        <div style={{ display: "flex", gap: 12 }}>
          <input
            className="pl-field"
            type="number"
            placeholder="Low"
            value={draft.pairLo}
            onChange={(e) => setDraft({ ...draft, pairLo: e.target.value })}
          />
          <input
            className="pl-field"
            type="number"
            placeholder="High"
            value={draft.pairHi}
            onChange={(e) => setDraft({ ...draft, pairHi: e.target.value })}
          />
        </div>
      );
    case "text":
    case "long_text":
      return (
        <textarea
          className="pl-field"
          rows={3}
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
      );
    case "number":
    case "scale":
    case "phone":
      return (
        <input
          className="pl-field"
          type={node.control === "phone" ? "tel" : "number"}
          inputMode={node.control === "phone" ? "tel" : "decimal"}
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
      );
    case "date":
      return <DateControl node={node} draft={draft} setDraft={setDraft} />;
    case "email":
      return (
        <input
          className="pl-field"
          type="email"
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
      );
    case "address":
      return <AddressControl draft={draft} setDraft={setDraft} />;
    case "file":
      return <FileControl draft={draft} setDraft={setDraft} media={node.media} />;
    default:
      return null;
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
        className="pl-field"
        type="text"
        placeholder="Start typing an address…"
        value={draft.addressLabel ?? q}
        onChange={(e) => {
          setQ(e.target.value);
          setDraft({ ...draft, addressLabel: undefined, addressSuggestionId: undefined });
        }}
      />
      {suggestions.length ? (
        <ul className="pl-suggest">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
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
        className="pl-field"
        type="file"
        accept={media?.accept?.join(",")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setDraft({ ...draft, uploadRef: `upl_sample_${f.name.replace(/\W+/g, "_")}` });
        }}
      />
      {draft.uploadRef ? (
        <div className="pl-why" style={{ fontSize: 13 }}>
          Staged upload reference: {draft.uploadRef} (placeholder)
        </div>
      ) : null}
    </div>
  );
}

function CompleteView({ step, offering }: { step: InstrumentStep; offering?: string }) {
  const checkoutHref = `/checkout?journey_id=${encodeURIComponent(step.journey_id)}${
    offering ? `&offering=${encodeURIComponent(offering)}` : ""
  }`;
  return (
    <>
      <h1 className="pl-headline">Intake complete (placeholder)</h1>
      <p className="pl-why">
        The server marked this session complete. Session <code>{step.session_id}</code>, enrollment{" "}
        <code>{step.journey_id}</code>.
      </p>
      <div className="pl-footer">
        <a className="pl-continue" href={checkoutHref}>
          Continue to checkout →
        </a>
      </div>
      <p className="pl-disclaimer">
        You can check enrollment status any time on the{" "}
        <a href={`/status?journey_id=${encodeURIComponent(step.journey_id)}`}>status page</a>.
        {step.handoff
          ? " Entry hand-off present (redirect/promo/test are validated server-side; never patient data)."
          : ""}
      </p>
    </>
  );
}

/**
 * Masked MM/DD/YYYY date entry. Typed, numeric keypad on mobile — never the
 * native picker (a calendar is hostile for dates decades in the past, and the
 * native popup is unstyled browser chrome). The wire format stays ISO.
 */
function DateControl({
  node,
  draft,
  setDraft,
}: {
  node: RenderedNode;
  draft: Draft;
  setDraft: (d: Draft) => void;
}) {
  const display = /^\d{4}-\d{2}-\d{2}$/.test(draft.value)
    ? isoToDateDisplay(draft.value)
    : draft.value;
  return (
    <input
      className="pl-field"
      type="text"
      inputMode="numeric"
      autoComplete={node.fact?.includes("birth") ? "bday" : "off"}
      placeholder="MM/DD/YYYY"
      maxLength={10}
      value={display}
      onChange={(e) => setDraft({ ...draft, value: formatDateDisplay(e.target.value) })}
    />
  );
}

/** Progressive MM/DD/YYYY mask over digit input. */
function formatDateDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function isoToDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

/** MM/DD/YYYY → ISO, or null unless it is a REAL calendar date (1900+). */
function dateDisplayToIso(display: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const year = Number(yyyy);
  const month = Number(mm);
  const day = Number(dd);
  if (year < 1900) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}
