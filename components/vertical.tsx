/**
 * VERTICAL overlay components (Scope 4) — composed onto a brand only when it
 * carries a `vertical` config. Demonstrates: identity carried at the brand layer,
 * a negative-experience module, peer-mirror casting metadata, and audience-specific
 * medical-content slots (the credibility piece both real verticals omitted).
 * Rendered from config alone — the second demo brand turns these on with data.
 */

import { PlaceholderNote, SectionHeading } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand/types";

export function VerticalModules({ brand }: { brand: BrandConfig }) {
  const v = brand.vertical;
  if (!v) return null;
  return (
    <>
      <section className="section" aria-label="What we're not">
        <div className="container">
          <SectionHeading eyebrow="Positioning" title={v.negativeExperience.heading} />
          <PlaceholderNote>
            negative-experience / stigma-inversion module — as prominent as benefits
          </PlaceholderNote>
          <p style={{ maxWidth: 640 }}>{v.negativeExperience.body}</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Ambient identity: {v.identityTagline}
          </p>
        </div>
      </section>

      <section className="section" aria-label="Audience-specific content">
        <div className="container">
          <SectionHeading eyebrow="For your situation" title="Audience medical-content slots" />
          <PlaceholderNote>
            clinician- and counsel-reviewed audience content goes here
          </PlaceholderNote>
          <div className="grid grid--2" style={{ marginTop: 12 }}>
            {v.audienceMedicalContent.map((m) => (
              <div key={m.heading} className="card">
                <strong>{m.heading}</strong>
                <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
                  {m.body}
                </p>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Peer-mirror casting: {v.peerMirrorCasting}
          </p>
        </div>
      </section>
    </>
  );
}
