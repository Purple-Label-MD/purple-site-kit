import { LabGate } from "@/components/growth/LabGate";
import { GrowthGenericShell } from "@/components/growth/StoreChrome";
import { SectionHeading } from "@/components/ui";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const STEPS = [
  { title: "Choose a panel", body: "Pick an individual panel or a package for your goals." },
  { title: "Collect your sample", body: "Placeholder collection step — describe your method." },
  {
    title: "Clinician-reviewed results",
    body: "Results are reviewed and returned; timelines are estimates.",
  },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "How lab testing works",
    description:
      "The lab-testing ritual: choose a panel, collect a sample, get clinician-reviewed results. Placeholder scaffolding; fulfillment wakes with the labs lane.",
  });
}

export default function LabsHowItWorks() {
  const brand = getActiveBrand();
  if (!brand.growth) notFound();
  return (
    <GrowthGenericShell brand={brand}>
      <section className="section">
        <div className="container">
          <div className="eyebrow">Labs</div>
          <h1 style={{ fontSize: 34, margin: "8px 0 12px" }}>How it works</h1>
          <LabGate />
          <SectionHeading eyebrow="The ritual" title="Three steps" />
          <ol className="grid grid--3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {STEPS.map((s, i) => (
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
    </GrowthGenericShell>
  );
}
