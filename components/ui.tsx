/** Small shared UI primitives used across pattern components. */

/** A visible marker that a string is replaceable scaffolding (placeholder-copy law). */
export function PlaceholderNote({ children }: { children?: React.ReactNode }) {
  return (
    <span className="placeholder-note">PLACEHOLDER · {children ?? "replace before launch"}</span>
  );
}

/** REQUIRES-COUNSEL-REVIEW banner — stamped on every legal slot (Scope 5). */
export function CounselBanner({ topic }: { topic: string }) {
  return (
    <div className="counsel-banner" role="alert">
      ⚠ REQUIRES COUNSEL REVIEW — {topic}. This is unreviewed placeholder scaffolding, not legal
      text. Do not publish until qualified counsel has drafted and approved it.
    </div>
  );
}

/** Certification seal SLOT — placement only. NEVER a shipped seal image. */
export function SealSlot({ note }: { note: string }) {
  return (
    <div className="seal-slot" title={note}>
      Seal slot — placement only
    </div>
  );
}

export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h2 style={{ margin: "4px 0 0" }}>{title}</h2>
    </div>
  );
}
