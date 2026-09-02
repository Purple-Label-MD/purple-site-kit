/**
 * Pattern components from the teardown library (Scope 3) — THEMES, not assets.
 * These reproduce convergent grammar observed across the estate (3-step ritual,
 * trust triad, two-SKU ladder, objection-ordered FAQ, testimonials with
 * results-vary discipline, clinician-bio slots) as original, brand-driven,
 * placeholder-safe components. Nothing legacy is copied in.
 */

import { PlaceholderNote, SectionHeading } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand/types";
import { entryLink } from "@/lib/purple/entry-links";

/** The 3-step ritual strip — makes any page a self-contained funnel. */
export function ThreeStepRitual({ brand }: { brand: BrandConfig }) {
  return (
    <section className="section" aria-label="How it works">
      <div className="container">
        <SectionHeading eyebrow="How it works" title="Three steps" />
        <ol className="grid grid--3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {brand.condition.threeStep.map((s, i) => (
            <li key={s.title} className="card">
              <div className="eyebrow">Step {i + 1}</div>
              <strong>{s.title}</strong>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Compact trust-triad strip, repeatable per page. */
export function TrustTriad({ brand }: { brand: BrandConfig }) {
  return (
    <section aria-label="Trust" style={{ background: "var(--c-accent)" }}>
      <div
        className="container"
        style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "16px 20px" }}
      >
        {brand.trustTriad.map((b) => (
          <div key={b.label} style={{ flex: "1 1 200px" }}>
            <strong>{b.label}</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              {b.note}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Two-SKU good/better ladder + optional commitment grid. NEUTRAL role labels only. */
export function SkuLadder({ brand }: { brand: BrandConfig }) {
  return (
    <section className="section" aria-label="Options">
      <div className="container">
        <SectionHeading
          eyebrow="Options"
          title={brand.copy.sku_ladder_title ?? "Two placeholder options"}
        />
        {!brand.contentReviewed ? (
          <PlaceholderNote>
            pricing + product copy are slots — never ship real medication or price content
            unreviewed
          </PlaceholderNote>
        ) : null}
        <div className="grid grid--2" style={{ marginTop: 12 }}>
          {brand.skus.map((sku) => (
            <div key={sku.id} className="card">
              <div className="eyebrow">{sku.roleLabel}</div>
              <h3 style={{ margin: "4px 0" }}>{sku.name}</h3>
              <p className="muted" style={{ margin: "0 0 8px" }}>
                {brand.copy.sku_molecule_label ?? "Placeholder molecule:"} {sku.placeholderMolecule}
              </p>
              <p style={{ margin: "0 0 8px" }}>{sku.benefit}</p>
              <div style={{ fontWeight: 700 }}>{sku.priceSlot}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {sku.doseNote}
              </div>
              <div style={{ marginTop: 14 }}>
                <a className="btn" href={entryLink({ offering: sku.offeringRef })}>
                  {brand.copy.cta_primary}
                </a>
              </div>
            </div>
          ))}
        </div>
        {brand.commitmentTiers?.length ? (
          <div style={{ marginTop: 24 }}>
            <div className="eyebrow">Optional commitment grid (placeholder)</div>
            <div className="grid grid--3" style={{ marginTop: 8 }}>
              {brand.commitmentTiers.map((t) => (
                <div key={t.id} className="card">
                  <strong>{t.label}</strong>
                  <div style={{ fontWeight: 700 }}>{t.priceSlot}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {t.cadenceNote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Objection-ordered FAQ battery — doubles as a safety/education surface. */
export function FaqBattery({ brand }: { brand: BrandConfig }) {
  return (
    <section className="section" aria-label="FAQ">
      <div className="container">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        {brand.faq.map((f) => (
          <details key={f.q} className="card" style={{ marginBottom: 10 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{f.q}</summary>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Testimonials WITH results-vary discipline (the disclaimer is non-optional). */
export function Testimonials({ brand }: { brand: BrandConfig }) {
  // No genuine testimonials → no section. Never render fabricated social proof.
  if (brand.testimonials.length === 0) return null;
  return (
    <section className="section" aria-label="What members say">
      <div className="container">
        <SectionHeading eyebrow="Placeholder proof" title="What members say" />
        {!brand.contentReviewed ? (
          <PlaceholderNote>use only genuine, permissioned testimonials</PlaceholderNote>
        ) : null}
        <div className="grid grid--2" style={{ marginTop: 12 }}>
          {brand.testimonials.map((t, i) => (
            <blockquote key={`${t.attribution}-${i}`} className="card" style={{ margin: 0 }}>
              <p style={{ marginTop: 0 }}>&ldquo;{t.quote}&rdquo;</p>
              <footer className="muted" style={{ fontSize: 13 }}>
                — {t.attribution}
                {t.castingNote ? ` · ${t.castingNote}` : ""}
              </footer>
            </blockquote>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Individual results vary and are not guaranteed. Testimonials are illustrative
          placeholders.
        </p>
      </div>
    </section>
  );
}

/** Clinician-bio SLOTS — the estate-wide leapfrog, first-class (Scope 3). */
export function ClinicianBios({ brand }: { brand: BrandConfig }) {
  // No verifiable roster yet → no section. Never render placeholder identities live.
  if (brand.clinicians.length === 0) return null;
  return (
    <section className="section" aria-label="Our clinicians">
      <div className="container">
        <SectionHeading eyebrow="Care team" title="Meet the clinicians" />
        {!brand.contentReviewed ? (
          <PlaceholderNote>
            real, named, verifiable clinician identity is the leapfrog — fill these slots
          </PlaceholderNote>
        ) : null}
        <div className="grid grid--2" style={{ marginTop: 12 }}>
          {brand.clinicians.map((c, i) => (
            <div
              key={`${c.namePlaceholder}-${i}`}
              className="card"
              style={{ display: "flex", gap: 14 }}
            >
              <div
                aria-hidden
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: "2px dashed var(--c-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "var(--c-muted)",
                  textAlign: "center",
                  flex: "0 0 auto",
                }}
              >
                {c.photoSlot}
              </div>
              <div>
                <strong>{c.namePlaceholder}</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  {c.credentialSlot}
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 14 }}>{c.bioSlot}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
